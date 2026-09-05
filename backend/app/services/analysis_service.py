import os
import sys
from datetime import datetime, timezone
from typing import Optional
from fastapi import HTTPException, status, UploadFile
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

# Add repo root so `ai.inference` is importable without installing as a package
_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

try:
    from ai.inference.voice_detector import analyze_voice
    from ai.inference.scam_detector import analyze_scam
    from ai.inference.risk_engine import calculate_risk
except ImportError:
    # Stub fallbacks – replaced by Om's real models
    def analyze_voice(audio_path: str) -> dict:
        return {"voice_status": "AI_GENERATED", "voice_confidence": 0.94,
                "reasons": ["AI-generated voice detected"]}

    def analyze_scam(text: str) -> dict:
        return {"scam_detected": True, "scam_confidence": 0.91,
                "reasons": ["OTP request detected"]}

    def calculate_risk(voice: dict, scam: dict) -> dict:
        return {
            "voice_status": voice.get("voice_status", "AI_GENERATED"),
            "voice_confidence": voice.get("voice_confidence", 0.94),
            "scam_detected": scam.get("scam_detected", True),
            "scam_confidence": scam.get("scam_confidence", 0.91),
            "risk_score": 92, "risk_level": "HIGH",
            "reasons": voice.get("reasons", []) + scam.get("reasons", []),
        }

from app.utils.file_handler import save_upload_file
from app.schemas.analysis import VoiceAnalysisResponse, ScamAnalysisResponse, FullAnalysisResponse
from app.services.call_service import _calls
from app.services.alert_service import AlertService

# Placeholder transcript – replaced when a real STT engine is wired up
_DEMO_TRANSCRIPT = (
    "Urgent alert from SBI Fraud Control Cell: "
    "Please read back the 6-digit OTP code sent to your handset immediately to prevent bank account suspension."
)


class AnalysisService:
    @staticmethod
    async def analyze_voice_only(
        file: Optional[UploadFile] = None,
        audio_path: Optional[str] = None,
    ) -> VoiceAnalysisResponse:
        """Runs acoustic voice-clone detection on an uploaded file or path."""
        path = audio_path
        if file is not None:
            path, _, _ = await save_upload_file(file)
        if not path:
            raise HTTPException(status.HTTP_400_BAD_REQUEST,
                                "Provide an audio file or a valid audio_path")
        res = analyze_voice(path)
        return VoiceAnalysisResponse(
            voice_status=res.get("voice_status", "UNAVAILABLE"),
            voice_confidence=res.get("voice_confidence", 0.0),
            synthetic_probability=res.get("synthetic_probability"),
            human_probability=res.get("human_probability"),
            mixed_probability=res.get("mixed_probability"),
            clone_similarity=res.get("clone_similarity"),
            pitch_consistency=res.get("pitch_consistency"),
            spectral_artifacts=res.get("spectral_artifacts"),
            reasons=res.get("reasons", []),
            details=res,
        )

    @staticmethod
    async def analyze_scam_only(text: str) -> ScamAnalysisResponse:
        """Runs NLP scam detection on raw transcript text."""
        res = analyze_scam(text)
        return ScamAnalysisResponse(
            scam_detected=res.get("scam_detected", False),
            scam_confidence=res.get("scam_confidence", 0.0),
            reasons=res.get("reasons", []),
        )

    @staticmethod
    async def run_full_analysis(
        db: Optional[AsyncIOMotorDatabase],
        file: Optional[UploadFile] = None,
        call_id: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> FullAnalysisResponse:
        """
        End-to-end fraud detection pipeline:
          1. Save / resolve audio file
          2. Voice-clone detection
          3. Transcript extraction (STT stub)
          4. Scam NLP analysis
          5. Composite risk scoring
          6. Persist results to DB / in-memory store
          7. Auto-create HIGH-risk alert
        """
        saved_path = None
        current_id = call_id
        record = None

        if file is not None:
            saved_path, unique_name, file_size = await save_upload_file(file)
            now = datetime.now(timezone.utc)
            doc = {
                "filename": file.filename or unique_name,
                "stored_filename": unique_name,
                "file_path": saved_path,
                "file_size": file_size,
                "duration_seconds": 0.0,
                "user_id": user_id,
                "status": "ANALYZING",
                "created_at": now,
                "updated_at": now,
            }
            if db is not None:
                try:
                    res = await db["calls"].insert_one(doc)
                    current_id = str(res.inserted_id)
                except Exception:
                    current_id = str(ObjectId())
                    _calls[current_id] = {**doc, "_id": current_id}
            else:
                current_id = str(ObjectId())
                _calls[current_id] = {**doc, "_id": current_id}

        elif current_id:
            record = None
            if db is not None:
                try:
                    record = await db["calls"].find_one({"_id": ObjectId(current_id)})
                except Exception:
                    pass
            record = record or _calls.get(current_id)
            if not record or (user_id and record.get("user_id") != user_id):
                raise HTTPException(status.HTTP_404_NOT_FOUND,
                                    f"Call '{current_id}' not found")
            saved_path = record.get("file_path", "")
        else:
            raise HTTPException(status.HTTP_400_BAD_REQUEST,
                                "Provide an audio file or an existing call_id")

        # Run AI pipeline
        voice_res = analyze_voice(saved_path)
        record = record or {}
        record_analysis = record.get("analysis") or {}
        transcript = record.get("transcript") or record_analysis.get("transcript", "") if record else ""
        scam_res = analyze_scam(transcript)
        risk = calculate_risk(voice_res, scam_res)

        response = FullAnalysisResponse(
            call_id=current_id or str(ObjectId()),
            voice_status=risk["voice_status"],
            voice_confidence=risk["voice_confidence"],
            transcript=transcript,
            scam_detected=risk["scam_detected"],
            scam_confidence=risk["scam_confidence"],
            risk_score=risk["risk_score"],
            risk_level=risk["risk_level"],
            reasons=risk["reasons"],
            voice_analysis=voice_res,
            scam_analysis=scam_res,
        )

        # Persist results
        now = datetime.now(timezone.utc)
        analysis_data = response.model_dump()
        update_fields = {
            "status": "ANALYZED",
            "analysis": analysis_data,
            "voice_analysis": voice_res,
            "scam_analysis": scam_res,
            "risk_score": risk["risk_score"],
            "risk_level": risk["risk_level"],
            "updated_at": now,
        }
        if db is not None and current_id:
            try:
                await db["calls"].update_one(
                    {"_id": ObjectId(current_id)},
                    {"$set": update_fields},
                )
            except Exception:
                pass
        if current_id and current_id in _calls:
            _calls[current_id].update(update_fields)

        # Auto-alert on HIGH risk
        if response.risk_level == "HIGH":
            await AlertService.create_alert(
                db=db,
                call_id=response.call_id,
                risk_level="HIGH",
                risk_score=response.risk_score,
                message=f"High-risk call detected: {', '.join(response.reasons[:2])}",
                user_id=user_id,
            )

        return response
