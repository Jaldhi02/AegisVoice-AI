"""
scam_detector.py
NLP inference engine for detecting conversational fraud, social engineering,
and scam intent from spoken call transcripts.
"""

import os
import sys
import pickle
from typing import Dict, Any, List, Optional

# Ensure ai directory is in sys.path
AI_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if AI_DIR not in sys.path:
    sys.path.insert(0, AI_DIR)

from preprocessing.text_preprocessing import TextPreprocessor
from training.train_scam_model import CalibratedScamIntentModel, ScamModelTrainer


class _RobustScamUnpickler(pickle.Unpickler):
    def find_class(self, module, name):
        if name == "CalibratedScamIntentModel":
            return CalibratedScamIntentModel
        return super().find_class(module, name)


class ScamDetector:
    """
    Inference engine for conversational scam detection and intent classification.
    """

    def __init__(self, model_path: Optional[str] = None):
        if model_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            model_path = os.path.join(base_dir, "models", "scam_detection_model.pkl")

        self.model_path = model_path
        self.preprocessor = TextPreprocessor()
        self.model: Optional[CalibratedScamIntentModel] = None
        self._load_model()

    def _load_model(self):
        """Loads serialized scam detection model artifact or auto-trains if absent."""
        if os.path.exists(self.model_path):
            try:
                with open(self.model_path, "rb") as f:
                    self.model = _RobustScamUnpickler(f).load()
                return
            except Exception as e:
                print(f"[!] Warning: Failed to load {self.model_path} ({e}). Retraining...")

        # Auto-train if missing
        trainer = ScamModelTrainer()
        trainer.train_and_save()
        with open(self.model_path, "rb") as f:
            self.model = _RobustScamUnpickler(f).load()

    def _determine_category(self, heuristics: Dict[str, Any]) -> str:
        """Determines primary fraud attack vector from heuristic breakdown."""
        u = heuristics.get("urgency_score", 0.0)
        c = heuristics.get("credential_score", 0.0)
        f = heuristics.get("financial_score", 0.0)
        a = heuristics.get("authority_score", 0.0)

        if c >= 0.4:
            return "CREDENTIAL_OTP_HARVESTING"
        if a >= 0.3 and u >= 0.3:
            return "AUTHORITY_IMPERSONATION_THREAT"
        if f >= 0.35 and u >= 0.3:
            return "URGENT_FINANCIAL_COERCION"
        if f >= 0.35:
            return "LOTTERY_PRIZE_ADVANCE_FEE"
        if u >= 0.35:
            return "SOCIAL_ENGINEERING_URGENCY"
        return "GENERAL_INQUIRY"

    def predict(self, transcript_text: str) -> Dict[str, Any]:
        """
        Analyzes call transcript text and returns scam classification,
        probability, and detected trigger breakdown.
        """
        if not transcript_text or not transcript_text.strip():
            return {
                "is_scam": False,
                "scam_probability": 0.0,
                "confidence": 1.0,
                "primary_category": "EMPTY_INPUT",
                "risk_heuristics": {},
                "detected_triggers": [],
                "decision_verdict": "LEGITIMATE_CONVERSATION"
            }

        heuristics = self.preprocessor.extract_heuristic_features(transcript_text)
        prob = self.model.predict_proba(transcript_text, heuristics)
        is_scam = bool(prob >= self.model.threshold)

        category = self._determine_category(heuristics) if is_scam else "LEGITIMATE_CONVERSATION"
        confidence = round(abs(prob - self.model.threshold) * 2.0, 4)

        return {
            "is_scam": is_scam,
            "scam_probability": round(prob, 4),
            "confidence": min(1.0, confidence),
            "primary_category": category,
            "risk_heuristics": {
                "urgency_score": heuristics["urgency_score"],
                "credential_harvesting_score": heuristics["credential_score"],
                "financial_coercion_score": heuristics["financial_score"],
                "authority_impersonation_score": heuristics["authority_score"],
                "coercion_index": heuristics["coercion_index"]
            },
            "detected_triggers": heuristics["detected_keywords"],
            "word_count": heuristics["word_count"],
            "decision_verdict": "SCAM_FRAUD_INTENT" if is_scam else "LEGITIMATE_CONVERSATION"
        }


_GLOBAL_SCAM_DETECTOR: Optional[ScamDetector] = None


def get_scam_detector() -> ScamDetector:
    """Lazy loader to prevent training or heavy I/O during module import."""
    global _GLOBAL_SCAM_DETECTOR
    if _GLOBAL_SCAM_DETECTOR is None:
        _GLOBAL_SCAM_DETECTOR = ScamDetector()
    return _GLOBAL_SCAM_DETECTOR


def analyze_scam(text):
    """
    Standard integration contract interface for conversational scam analysis.
    Signature: analyze_scam(text)
    """
    if not text or not str(text).strip():
        return {
            "scam_detected": False,
            "scam_confidence": 0.0,
            "is_scam": False,
            "scam_probability": 0.0,
            "confidence": 1.0,
            "primary_category": "EMPTY_INPUT",
            "risk_heuristics": {},
            "detected_triggers": [],
            "decision_verdict": "LEGITIMATE_CONVERSATION"
        }

    detector = get_scam_detector()
    raw = detector.predict(str(text))
    is_scam = raw.get("is_scam", False)
    scam_prob = raw.get("scam_probability", 0.0)

    scam_detected = bool(is_scam)
    scam_confidence = float(round(scam_prob if is_scam else (1.0 - scam_prob), 4))

    reasons = []
    if scam_detected:
        cat = raw.get("primary_category")
        if cat and cat not in ("LEGITIMATE_CONVERSATION", "EMPTY_INPUT"):
            reasons.append(f"Scam intent detected ({cat.replace('_', ' ').title()})")
        else:
            reasons.append("Conversational scam pattern detected")
        triggers = raw.get("detected_triggers", [])
        if triggers:
            reasons.append(f"Suspicious trigger keywords: {', '.join(triggers[:4])}")
    else:
        reasons.append("No conversational fraud detected")

    return {
        "scam_detected": scam_detected,
        "scam_confidence": scam_confidence,
        "reasons": reasons,
        **raw
    }


def main():
    detector = ScamDetector()
    test_scam = "URGENT WARNING from Bank Fraud Division: Your account is suspended. Read back your 6-digit OTP code now."
    test_legit = "Hi Mike, let's meet at 12:30 for lunch at the cafe."

    print("--- Testing Scam Call ---")
    import json
    print(json.dumps(detector.predict(test_scam), indent=2))

    print("\n--- Testing Genuine Call ---")
    print(json.dumps(detector.predict(test_legit), indent=2))


if __name__ == "__main__":
    main()

