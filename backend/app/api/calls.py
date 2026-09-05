from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.dependencies import get_db, get_current_user, get_optional_current_user
from app.schemas.call import CallUploadResponse, CallDetailResponse, CallListResponse
from app.services.call_service import CallService

router = APIRouter(prefix="/calls", tags=["Calls"])

@router.post("/upload", response_model=CallUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_call(
    audio: UploadFile = File(..., description="Audio file (.wav, .mp3, .m4a)"),
    caller_number: Optional[str] = Form(None),
    receiver_number: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Uploads an audio file for recording and prepares it for fraud analysis."""
    user_id = str(current_user["id"])
    return await CallService.upload_call(
        db=db,
        file=audio,
        user_id=user_id,
        caller_number=caller_number,
        receiver_number=receiver_number
    )

@router.get("", response_model=CallListResponse, status_code=status.HTTP_200_OK)
async def list_calls(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Lists recent calls with summary metrics and pagination."""
    user_id = str(current_user["id"])
    return await CallService.list_calls(db=db, user_id=user_id, skip=skip, limit=limit)

@router.get("/{id}", response_model=CallDetailResponse, status_code=status.HTTP_200_OK)
async def get_call_details(
    id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Retrieves full metadata and fraud analysis report for a specific call."""
    return await CallService.get_call_by_id(db=db, call_id=id, user_id=str(current_user["id"]))

@router.get("/{id}/audio", status_code=status.HTTP_200_OK)
async def get_call_audio(
    id: str,
    current_user: Optional[dict] = Depends(get_optional_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Serves the actual recorded audio file for playback."""
    import os
    from fastapi import HTTPException
    from fastapi.responses import FileResponse
    from app.services.call_service import _ensure_sample_audio_file

    # Allow audio playback by fetching call record without user_id restriction
    try:
        call = await CallService.get_call_record(db=db, call_id=id, user_id=None)
    except HTTPException:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Audio record '{id}' not found")

    file_path = call.get("file_path") or f"uploads/audio/{id}.wav"
    
    # Resolve relative paths against working directory or root
    if not os.path.isabs(file_path):
        if not os.path.exists(file_path):
            alt_path = os.path.abspath(file_path)
            if os.path.exists(alt_path):
                file_path = alt_path

    # Ensure file exists and is audible (regenerate if missing or <= 44 bytes empty header)
    if not os.path.exists(file_path) or os.path.getsize(file_path) <= 44:
        dur_sec = int(call.get("duration_seconds") or 30)
        _ensure_sample_audio_file(file_path, duration_sec=dur_sec)

    filename = call.get("filename", "")
    ext = os.path.splitext(filename or file_path)[1].lower()
    media_types = {
        ".wav": "audio/wav",
        ".mp3": "audio/mpeg",
        ".flac": "audio/flac",
        ".m4a": "audio/mp4",
        ".ogg": "audio/ogg",
        ".webm": "audio/webm",
        ".aac": "audio/aac",
    }
    media_type = media_types.get(ext, "audio/wav")
    return FileResponse(file_path, media_type=media_type, filename=filename or os.path.basename(file_path))

@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def delete_call(
    id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Deletes a call record and associated file."""
    return await CallService.delete_call(db=db, call_id=id, user_id=str(current_user["id"]))
