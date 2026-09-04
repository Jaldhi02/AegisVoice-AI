"""
voice_detector.py
Real-time acoustic inference for cloned, vocoded, and deepfake voice detection.
"""

import os
import sys
import pickle
from typing import Dict, Any, List, Optional, Union

# Ensure ai directory is in sys.path
AI_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if AI_DIR not in sys.path:
    sys.path.insert(0, AI_DIR)

from preprocessing.audio_preprocessing import AudioPreprocessor
from preprocessing.feature_extraction import AudioFeatureExtractor
# Import class definition needed for pickle deserialization
from training.train_voice_model import CalibratedVoiceCloneModel, VoiceModelTrainer


class _RobustVoiceUnpickler(pickle.Unpickler):
    def find_class(self, module, name):
        if name == "CalibratedVoiceCloneModel":
            return CalibratedVoiceCloneModel
        return super().find_class(module, name)


class VoiceDetector:
    """
    Inference engine for detecting synthetic and cloned voices from audio recordings.
    """

    def __init__(self, model_path: Optional[str] = None):
        if model_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            model_path = os.path.join(base_dir, "models", "voice_clone_model.pkl")

        self.model_path = model_path
        self.preprocessor = AudioPreprocessor()
        self.feature_extractor = AudioFeatureExtractor()
        self.model: Optional[CalibratedVoiceCloneModel] = None
        self._load_model()

    def _load_model(self):
        """Loads the serialized model artifact or automatically trains if absent."""
        if os.path.exists(self.model_path):
            try:
                with open(self.model_path, "rb") as f:
                    self.model = _RobustVoiceUnpickler(f).load()
                return
            except Exception as e:
                print(f"[!] Warning: Failed to load {self.model_path} ({e}). Retraining...")

        # Auto-train if model artifact missing
        trainer = VoiceModelTrainer()
        trainer.train_and_save()
        with open(self.model_path, "rb") as f:
            self.model = _RobustVoiceUnpickler(f).load()

    def predict(self, audio_file_path: str) -> Dict[str, Any]:
        """
        Analyzes an audio file and returns clone prediction and acoustic telemetry.
        """
        if not os.path.exists(audio_file_path):
            raise FileNotFoundError(f"Audio file not found: {audio_file_path}")

        samples, sr = self.preprocessor.preprocess_pipeline(audio_file_path, max_duration_sec=15.0)
        duration_sec = round(len(samples) / sr, 2)

        feat_vector = self.feature_extractor.extract_feature_vector(samples)
        raw_prob = self.model.predict_proba(feat_vector)
        is_clone = bool(raw_prob >= self.model.threshold)

        # Confidence metric: distance from decision threshold
        confidence = round(abs(raw_prob - self.model.threshold) * 2.0, 4)
        anomalies = self.model.explain(feat_vector)

        return {
            "is_voice_clone": is_clone,
            "clone_probability": round(raw_prob, 4),
            "confidence": min(1.0, confidence),
            "audio_duration_sec": duration_sec,
            "sample_rate_hz": sr,
            "acoustic_anomalies": anomalies,
            "decision_verdict": "SYNTHETIC_CLONED_VOICE" if is_clone else "GENUINE_NATURAL_VOICE"
        }


_GLOBAL_VOICE_DETECTOR: Optional[VoiceDetector] = None


def get_voice_detector() -> VoiceDetector:
    """Lazy loader to prevent training or heavy I/O during module import."""
    global _GLOBAL_VOICE_DETECTOR
    if _GLOBAL_VOICE_DETECTOR is None:
        _GLOBAL_VOICE_DETECTOR = VoiceDetector()
    return _GLOBAL_VOICE_DETECTOR


def analyze_voice(audio_path):
    """
    Standard integration contract interface for acoustic voice analysis.
    Signature: analyze_voice(audio_path)
    """
    if not audio_path or not os.path.exists(audio_path):
        return {
            "voice_status": "UNKNOWN",
            "voice_confidence": 0.0,
            "is_voice_clone": False,
            "clone_probability": 0.0,
            "confidence": 0.0,
            "audio_duration_sec": 0.0,
            "sample_rate_hz": 16000,
            "acoustic_anomalies": [],
            "decision_verdict": "UNKNOWN_INPUT"
        }

    detector = get_voice_detector()
    raw = detector.predict(audio_path)
    is_clone = raw.get("is_voice_clone", False)
    clone_prob = raw.get("clone_probability", 0.0)

    voice_status = "AI_GENERATED" if is_clone else "REAL"
    voice_confidence = float(round(clone_prob if is_clone else (1.0 - clone_prob), 4))

    return {
        "voice_status": voice_status,
        "voice_confidence": voice_confidence,
        **raw
    }


def main():
    detector = VoiceDetector()
    sample_path = os.path.join(AI_DIR, "data", "sample", "cloned_sample_1.wav")
    print(f"Testing VoiceDetector on sample: {sample_path}")
    res = detector.predict(sample_path)
    import json
    print(json.dumps(res, indent=2))


if __name__ == "__main__":
    main()

