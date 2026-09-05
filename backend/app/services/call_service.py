import os
import wave
import struct
import math
from datetime import datetime, timezone
from typing import Optional
from fastapi import HTTPException, status, UploadFile
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.utils.file_handler import save_upload_file
from app.schemas.call import CallUploadResponse, CallDetailResponse, CallListResponse, CallSummaryItem
from app.schemas.analysis import FullAnalysisResponse

def _ensure_sample_audio_file(file_path: str, duration_sec: int = 30):
    try:
        if not file_path:
            return
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        sample_rate = 16000
        expected_size = 44 + sample_rate * duration_sec * 2
        if os.path.exists(file_path) and abs(os.path.getsize(file_path) - expected_size) < 4000:
            return
        num_samples = sample_rate * duration_sec
        with wave.open(file_path, 'wb') as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(sample_rate)
            data = bytearray()
            for i in range(num_samples):
                t = i / sample_rate
                val = 0.25 * math.sin(2.0 * math.pi * 440.0 * t) + 0.15 * math.sin(2.0 * math.pi * 880.0 * t)
                sample = int(32767.0 * val)
                data.extend(struct.pack('<h', max(-32768, min(32767, sample))))
            wav_file.writeframes(data)
    except Exception as e:
        print(f"Warning: Failed to generate sample audio file {file_path}: {e}")

# Module-level in-memory fallback (used when MongoDB is unavailable)
_calls: dict[str, dict] = {}

_UNKNOWN = "unknown.wav"
_NOW = lambda: datetime.now(timezone.utc)


def _call_summary(item: dict) -> CallSummaryItem:
    analysis = item.get("analysis") or {}
    return CallSummaryItem(
        id=str(item.get("_id", "")),
        filename=item.get("filename", _UNKNOWN),
        caller_number=item.get("caller_number"),
        risk_level=analysis.get("risk_level", "UNKNOWN"),
        risk_score=analysis.get("risk_score", 0),
        status=item.get("status", "UPLOADED"),
        created_at=item.get("created_at", _NOW()),
    )


def _find_call(call_id: str) -> Optional[dict]:
    """Lookup from in-memory store."""
    return _calls.get(call_id)


class CallService:
    @staticmethod
    async def upload_call(
        db: Optional[AsyncIOMotorDatabase],
        file: UploadFile,
        user_id: Optional[str] = None,
        caller_number: Optional[str] = None,
        receiver_number: Optional[str] = None,
    ) -> CallUploadResponse:
        """Validates, saves audio file and creates a call record."""
        file_path, unique_name, file_size = await save_upload_file(file)
        now = _NOW()
        doc = {
            "filename": file.filename or unique_name,
            "stored_filename": unique_name,
            "file_path": file_path,
            "file_size": file_size,
            "duration_seconds": 0.0,
            "caller_number": caller_number,
            "receiver_number": receiver_number,
            "user_id": user_id,
            "status": "UPLOADED",
            "created_at": now,
            "updated_at": now,
            "analysis": None,
        }

        call_id = str(ObjectId())
        if db is not None:
            try:
                res = await db["calls"].insert_one(doc)
                call_id = str(res.inserted_id)
            except Exception:
                _calls[call_id] = {**doc, "_id": call_id}
        else:
            _calls[call_id] = {**doc, "_id": call_id}

        # Optional async analysis kick-off can run in background
        return CallUploadResponse(
            call_id=call_id,
            filename=file.filename or unique_name,
            file_size=file_size,
            duration_seconds=0.0,
            status="UPLOADED",
            created_at=now,
            audio_url=f"/api/calls/{call_id}/audio",
        )

    @staticmethod
    async def get_call_record(
        db: Optional[AsyncIOMotorDatabase], call_id: str, user_id: Optional[str] = None
    ) -> dict:
        """Helper to get raw call document."""
        call = None
        if db is not None:
            try:
                call = await db["calls"].find_one({"_id": ObjectId(call_id)})
            except Exception:
                pass
        call = call or _find_call(call_id)
        if not call:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Call '{call_id}' not found")
        if user_id and call.get("user_id") != user_id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Call '{call_id}' not found")
        return call

    @staticmethod
    async def get_call_by_id(
        db: Optional[AsyncIOMotorDatabase], call_id: str, user_id: Optional[str] = None
    ) -> CallDetailResponse:
        """Fetches a call record with its analysis from DB or in-memory store."""
        call = await CallService.get_call_record(db, call_id, user_id)

        analysis_obj = FullAnalysisResponse(**call["analysis"]) if call.get("analysis") else None
        cid = str(call.get("_id", call_id))
        return CallDetailResponse(
            id=cid,
            filename=call.get("filename", _UNKNOWN),
            caller_number=call.get("caller_number"),
            receiver_number=call.get("receiver_number"),
            file_size=call.get("file_size", 0),
            duration_seconds=call.get("duration_seconds", 0.0),
            status=call.get("status", "UPLOADED"),
            created_at=call.get("created_at", _NOW()),
            audio_url=f"/api/calls/{cid}/audio",
            analysis=analysis_obj,
        )

    @staticmethod
    async def _seed_sample_calls_if_empty(db: Optional[AsyncIOMotorDatabase], user_id: Optional[str]):
        if not user_id:
            return
        count = 0
        if db is not None:
            try:
                count = await db["calls"].count_documents({"user_id": user_id})
            except Exception:
                pass
        if count == 0:
            count = sum(1 for c in _calls.values() if c.get("user_id") == user_id)
        if count > 0:
            return

        now = datetime.now(timezone.utc)
        samples = [
            {
                "filename": "ceo_deepfake_transfer.wav",
                "stored_filename": "ceo_deepfake_transfer.wav",
                "file_path": "uploads/audio/ceo_deepfake_transfer.wav",
                "file_size": 1024000,
                "duration_seconds": 68.0,
                "caller_number": "+91 98765 43210 (Spoofed Executive Line)",
                "receiver_number": "+91 98100 11223",
                "user_id": user_id,
                "status": "ANALYZED",
                "created_at": now,
                "updated_at": now,
                "analysis": {
                    "call_id": "",
                    "voice_status": "AI_GENERATED",
                    "voice_confidence": 0.98,
                    "transcript": "Rajesh, this is Vikram. I'm in an urgent closed-door board meeting in Delhi with our investors. We need an immediate IMPS transfer of ₹2,50,000 to escrow account 4892. Read back the OTP sent to your phone right now to authorize.",
                    "scam_detected": True,
                    "scam_confidence": 0.95,
                    "risk_score": 95,
                    "risk_level": "HIGH",
                    "reasons": [
                        "Synthetic or AI-generated voice clone detected with high acoustic confidence.",
                        "Conversational scam intent detected: Executive Voice Clone & Financial Extortion.",
                        "Suspicious trigger keywords identified: IMPS transfer, escrow account, read back OTP.",
                        "Dual threat detected: AI voice clone combined with active social engineering scam."
                    ]
                }
            },
            {
                "filename": "cbi_digital_arrest.wav",
                "stored_filename": "cbi_digital_arrest.wav",
                "file_path": "uploads/audio/cbi_digital_arrest.wav",
                "file_size": 840000,
                "duration_seconds": 114.0,
                "caller_number": "+91 94123 88901 (Crime Branch Delhi Spoof)",
                "receiver_number": "+91 98100 11223",
                "user_id": user_id,
                "status": "ANALYZED",
                "created_at": now,
                "updated_at": now,
                "analysis": {
                    "call_id": "",
                    "voice_status": "AI_GENERATED",
                    "voice_confidence": 0.92,
                    "transcript": "This is Inspector Sharma from Crime Branch New Delhi. A parcel containing contraband linked to your Aadhaar card was intercepted at Customs. You are placed under Digital Arrest. Verify your identity by reading back the 6-digit OTP dispatched to your mobile or police will arrest you within 30 minutes.",
                    "scam_detected": True,
                    "scam_confidence": 0.91,
                    "risk_score": 89,
                    "risk_level": "HIGH",
                    "reasons": [
                        "Synthetic or AI-generated voice clone detected with high acoustic confidence.",
                        "Conversational scam intent detected: Law Enforcement Impersonation & Digital Arrest.",
                        "Suspicious trigger keywords identified: Aadhaar card, Digital Arrest, 6-digit OTP, arrest warrant.",
                        "Dual threat detected: AI voice clone combined with active social engineering scam."
                    ]
                }
            },
            {
                "filename": "sbi_fraud_alert.wav",
                "stored_filename": "sbi_fraud_alert.wav",
                "file_path": "uploads/audio/sbi_fraud_alert.wav",
                "file_size": 650000,
                "duration_seconds": 82.0,
                "caller_number": "+91 1800 123 4567 (Spoofed SBI Fraud Desk)",
                "receiver_number": "+91 98100 11223",
                "user_id": user_id,
                "status": "ANALYZED",
                "created_at": now,
                "updated_at": now,
                "analysis": {
                    "call_id": "",
                    "voice_status": "REAL",
                    "voice_confidence": 0.89,
                    "transcript": "Security alert from SBI Fraud Prevention Desk. Suspicious debit of ₹14,500 detected on your account. To reverse these fraudulent charges, speak your 6-digit UPI PIN and read the text OTP code sent to your handset immediately.",
                    "scam_detected": True,
                    "scam_confidence": 0.93,
                    "risk_score": 82,
                    "risk_level": "HIGH",
                    "reasons": [
                        "Conversational scam intent detected: Bank Impersonation & Social Engineering.",
                        "Suspicious trigger keywords identified: SBI Fraud Prevention, UPI PIN, text OTP code.",
                        "Credential harvesting pattern detected."
                    ]
                }
            }
        ]

        from app.services.alert_service import AlertService
        for s in samples:
            cid = str(ObjectId())
            s["_id"] = cid
            s["analysis"]["call_id"] = cid
            if s.get("file_path"):
                _ensure_sample_audio_file(s["file_path"], duration_sec=int(s.get("duration_seconds", 30)))
            if db is not None:
                try:
                    await db["calls"].insert_one(s)
                except Exception:
                    _calls[cid] = s
            else:
                _calls[cid] = s

            await AlertService.create_alert(
                db=db,
                call_id=cid,
                risk_level="HIGH",
                risk_score=s["analysis"]["risk_score"],
                message=f"High-risk call from {s['caller_number']}: {s['analysis']['reasons'][0]}",
                user_id=user_id,
            )

    @staticmethod
    async def list_calls(
        db: Optional[AsyncIOMotorDatabase],
        user_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> CallListResponse:
        """Returns paginated call summaries."""
        await CallService._seed_sample_calls_if_empty(db, user_id)
        if db is not None:
            try:
                query = {"user_id": user_id} if user_id else {}
                total = await db["calls"].count_documents(query)
                cursor = db["calls"].find(query).sort("created_at", -1).skip(skip).limit(limit)
                items = [_call_summary(item) async for item in cursor]
                return CallListResponse(total=total, calls=items)
            except Exception:
                pass

        # In-memory fallback
        all_items = [c for c in _calls.values() if not user_id or c.get("user_id") == user_id]
        return CallListResponse(
            total=len(all_items),
            calls=[_call_summary(c) for c in all_items[skip: skip + limit]],
        )

    @staticmethod
    async def delete_call(
        db: Optional[AsyncIOMotorDatabase], call_id: str, user_id: Optional[str] = None
    ) -> dict:
        """Deletes call record, associated alerts, and audio file."""
        call = None
        if db is not None:
            try:
                call = await db["calls"].find_one({"_id": ObjectId(call_id)})
            except Exception:
                pass
        call = call or _find_call(call_id)

        if not call:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Call '{call_id}' not found")
        if user_id and call.get("user_id") != user_id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Call '{call_id}' not found")

        # Remove audio file
        fp = call.get("file_path")
        if fp and os.path.exists(fp):
            try:
                os.remove(fp)
            except OSError:
                pass

        if db is not None:
            try:
                await db["calls"].delete_one({"_id": ObjectId(call_id)})
                await db["alerts"].delete_many({"call_id": call_id})
            except Exception:
                pass
        _calls.pop(call_id, None)

        return {"message": "Call record and associated files deleted successfully"}
