from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.dependencies import get_db, get_current_user
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

@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def delete_call(
    id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Deletes a call record and associated file."""
    return await CallService.delete_call(db=db, call_id=id, user_id=str(current_user["id"]))
