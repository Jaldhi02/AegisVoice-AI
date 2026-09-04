"""
Inference package for AI Voice Fraud Detection & Prevention System.
Provides VoiceDetector, ScamDetector, and unified RiskEngine for real-time fraud scoring.
"""

from .voice_detector import VoiceDetector, analyze_voice
from .scam_detector import ScamDetector, analyze_scam
from .risk_engine import RiskEngine, calculate_risk

__all__ = [
    "VoiceDetector",
    "ScamDetector",
    "RiskEngine",
    "analyze_voice",
    "analyze_scam",
    "calculate_risk"
]
