from typing import List, Optional
from pydantic import BaseModel, Field

class VoiceAnalysisResponse(BaseModel):
    voice_status: str = Field(..., description="REAL | AI_GENERATED | MIXED | UNAVAILABLE")
    voice_confidence: float = Field(..., ge=0.0, le=1.0)
    synthetic_probability: Optional[float] = None
    human_probability: Optional[float] = None
    mixed_probability: Optional[float] = None
    clone_similarity: Optional[float] = None
    pitch_consistency: Optional[float] = None
    spectral_artifacts: Optional[float] = None
    reasons: List[str] = []
    details: Optional[dict] = None

class ScamAnalysisRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Transcript / text to analyze")

class ScamAnalysisResponse(BaseModel):
    scam_detected: bool
    scam_confidence: float = Field(..., ge=0.0, le=1.0)
    reasons: List[str] = []

class FullAnalysisResponse(BaseModel):
    call_id: str
    voice_status: str = Field(..., description="REAL | AI_GENERATED | MIXED | UNAVAILABLE")
    voice_confidence: float = Field(..., ge=0.0, le=1.0)
    transcript: str = ""
    scam_detected: bool
    scam_confidence: float = Field(..., ge=0.0, le=1.0)
    risk_score: int = Field(..., ge=0, le=100)
    risk_level: str = Field(..., description="LOW | MEDIUM | HIGH")
    reasons: List[str] = []
    voice_analysis: Optional[dict] = None
    scam_analysis: Optional[dict] = None

