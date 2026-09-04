from datetime import datetime, timezone
from typing import List
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status
# pyrefly: ignore [missing-import]
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.core.dependencies import get_db, get_current_user
from app.services.call_service import CallService

router = APIRouter(prefix="/reports", tags=["Reports"])

class ReportSummary(BaseModel):
    risk_level: str
    risk_score: int
    voice_status: str
    voice_confidence: float
    scam_detected: bool
    scam_confidence: float

class FraudReportResponse(BaseModel):
    report_id: str
    call_id: str
    generated_at: datetime
    summary: ReportSummary
    transcript: str
    evidence_reasons: List[str]
    recommendations: List[str]

@router.get("/{call_id}", response_model=FraudReportResponse, status_code=status.HTTP_200_OK)
async def get_fraud_report(
    call_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Generates a structured forensic evidence report for an analyzed call."""
    call = await CallService.get_call_by_id(
        db=db, call_id=call_id, user_id=str(current_user["id"])
    )
    
    if not call.analysis:
        # If call is not yet analyzed, run or return unanalyzed state
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Call has not been analyzed yet. Please run /api/analysis/full first."
        )

    analysis = call.analysis
    recommendations = []
    if analysis.risk_level == "HIGH":
        recommendations = [
            "Block caller number immediately across enterprise/personal directory",
            "Do not disclose one-time passwords (OTP), banking credentials, or personal identifiers",
            "Report audio sample and metadata to Cybercrime Reporting Portal (1930 in India / local authority)",
            "Notify financial institutions associated with mentioned accounts"
        ]
    elif analysis.risk_level == "MEDIUM":
        recommendations = [
            "Verify identity of caller through independent verified callback channel",
            "Exercise extreme caution before fulfilling requests for funds or info",
            "Mark caller as unverified"
        ]
    else:
        recommendations = [
            "Standard call safety practices apply",
            "No active AI cloning or social engineering indicators detected"
        ]

    return FraudReportResponse(
        report_id=f"rep_{call.id}",
        call_id=call.id,
        generated_at=datetime.now(timezone.utc),
        summary=ReportSummary(
            risk_level=analysis.risk_level,
            risk_score=analysis.risk_score,
            voice_status=analysis.voice_status,
            voice_confidence=analysis.voice_confidence,
            scam_detected=analysis.scam_detected,
            scam_confidence=analysis.scam_confidence
        ),
        transcript=analysis.transcript,
        evidence_reasons=analysis.reasons,
        recommendations=recommendations
    )
