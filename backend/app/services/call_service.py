import os
from datetime import datetime, timezone
from typing import Optional
from fastapi import HTTPException, status, UploadFile
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.utils.file_handler import save_upload_file
from app.schemas.call import CallUploadResponse, CallDetailResponse, CallListResponse, CallSummaryItem
from app.schemas.analysis import FullAnalysisResponse

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

        return CallUploadResponse(
            call_id=call_id,
            filename=file.filename or unique_name,
            file_size=file_size,
            duration_seconds=0.0,
            status="UPLOADED",
            created_at=now,
        )

    @staticmethod
    async def get_call_by_id(
        db: Optional[AsyncIOMotorDatabase], call_id: str, user_id: Optional[str] = None
    ) -> CallDetailResponse:
        """Fetches a call record with its analysis from DB or in-memory store."""
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
            # Do not disclose whether another user's record exists.
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Call '{call_id}' not found")

        analysis_obj = FullAnalysisResponse(**call["analysis"]) if call.get("analysis") else None
        return CallDetailResponse(
            id=str(call.get("_id", call_id)),
            filename=call.get("filename", _UNKNOWN),
            caller_number=call.get("caller_number"),
            receiver_number=call.get("receiver_number"),
            file_size=call.get("file_size", 0),
            duration_seconds=call.get("duration_seconds", 0.0),
            status=call.get("status", "UPLOADED"),
            created_at=call.get("created_at", _NOW()),
            analysis=analysis_obj,
        )

    @staticmethod
    async def list_calls(
        db: Optional[AsyncIOMotorDatabase],
        user_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> CallListResponse:
        """Returns paginated call summaries."""
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
