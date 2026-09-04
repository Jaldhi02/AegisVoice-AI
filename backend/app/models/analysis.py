"""Persisted AI analysis document shape."""

from typing import TypedDict


class AnalysisDocument(TypedDict):
    call_id: str
    voice_status: str
    voice_confidence: float
    transcript: str
    scam_detected: bool
    scam_confidence: float
    risk_score: int
    risk_level: str
    reasons: list[str]
