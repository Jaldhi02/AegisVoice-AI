"""
Training package for AI Voice Fraud Detection & Prevention System.
Contains pipelines to train the voice clone detector and conversational scam detector.
"""

from .train_voice_model import VoiceModelTrainer
from .train_scam_model import ScamModelTrainer

__all__ = ["VoiceModelTrainer", "ScamModelTrainer"]
