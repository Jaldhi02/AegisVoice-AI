from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.dependencies import get_db, get_current_user
from app.schemas.analysis import (
    VoiceAnalysisResponse,
    ScamAnalysisRequest,
    ScamAnalysisResponse,
    FullAnalysisResponse
)
from app.services.analysis_service import AnalysisService

router = APIRouter(prefix="/analysis", tags=["Analysis"])

@router.post("/voice", response_model=VoiceAnalysisResponse, status_code=status.HTTP_200_OK)
async def analyze_voice_endpoint(
    audio: UploadFile = File(..., description="Audio file for acoustic clone detection"),
    current_user: dict = Depends(get_current_user),
):
    """Analyzes raw audio for AI synthetic/deepfake speech characteristics."""
    return await AnalysisService.analyze_voice_only(file=audio)

@router.post("/scam", response_model=ScamAnalysisResponse, status_code=status.HTTP_200_OK)
async def analyze_scam_endpoint(
    req: ScamAnalysisRequest, current_user: dict = Depends(get_current_user)
):
    """Analyzes conversation transcript for social engineering, urgency, and OTP scam cues."""
    return await AnalysisService.analyze_scam_only(text=req.text)

@router.post("/full", response_model=FullAnalysisResponse, status_code=status.HTTP_200_OK)
async def full_analysis_endpoint(
    audio: Optional[UploadFile] = File(None, description="Audio file for full end-to-end analysis"),
    call_id: Optional[str] = Form(None, description="Existing call ID to run analysis upon"),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Executes end-to-end multi-modal voice fraud detection pipeline:
    1. Voice cloning analysis
    2. Transcription
    3. NLP scam detection
    4. Composite risk scoring
    5. Automatic alert dispatch if High Risk
    """
    user_id = str(current_user["id"])
    return await AnalysisService.run_full_analysis(
        db=db,
        file=audio,
        call_id=call_id,
        user_id=user_id
    )
