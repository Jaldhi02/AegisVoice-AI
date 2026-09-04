"""
risk_engine.py
Unified Multi-Modal Risk Scoring Engine for AI Voice Fraud Detection.
Aggregates acoustic voice clone probability, conversational scam intent,
and heuristic behavioral triggers into an actionable 0-100 composite risk score
with standardized threat tiers and real-time mitigation recommendations.
"""

import os
import sys
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional

# Ensure ai directory is in sys.path
AI_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if AI_DIR not in sys.path:
    sys.path.insert(0, AI_DIR)

from inference.voice_detector import VoiceDetector
from inference.scam_detector import ScamDetector


class RiskEngine:
    """
    Unified decision engine fusing acoustic deepfake detection and conversational NLP.
    """

    # Risk Tier Boundaries
    CRITICAL_THRESHOLD = 80.0
    HIGH_THRESHOLD = 60.0
    MEDIUM_THRESHOLD = 35.0

    def __init__(self, voice_detector: Optional[VoiceDetector] = None, scam_detector: Optional[ScamDetector] = None):
        self.voice_detector = voice_detector or VoiceDetector()
        self.scam_detector = scam_detector or ScamDetector()

    def evaluate(
        self,
        audio_file_path: Optional[str] = None,
        text_transcript: Optional[str] = None,
        voice_weight: float = 0.55,
        content_weight: float = 0.45
    ) -> Dict[str, Any]:
        """
        Computes composite multi-modal fraud risk score (0-100).
        """
        incident_id = f"vfraud-{uuid.uuid4().hex[:10]}"
        timestamp = datetime.now(timezone.utc).isoformat()

        voice_res: Optional[Dict[str, Any]] = None
        content_res: Optional[Dict[str, Any]] = None

        p_voice = 0.0
        p_scam = 0.0
        active_modalities = []

        # 1. Voice clone analysis
        if audio_file_path:
            voice_res = self.voice_detector.predict(audio_file_path)
            p_voice = voice_res["clone_probability"]
            active_modalities.append("ACOUSTIC_VOICE_CLONE")

        # 2. Text intent analysis
        if text_transcript:
            content_res = self.scam_detector.predict(text_transcript)
            p_scam = content_res["scam_probability"]
            active_modalities.append("CONVERSATIONAL_SCAM_INTENT")

        # 3. Fuse probabilities into composite score
        if audio_file_path and text_transcript:
            base_score = (voice_weight * p_voice + content_weight * p_scam) * 100.0
            # Synergistic escalation: If both modalities show high threat, escalate aggressively
            synergy_boost = 20.0 * (p_voice * p_scam)
            risk_score = min(100.0, base_score + synergy_boost)
        elif audio_file_path:
            risk_score = p_voice * 100.0
        elif text_transcript:
            risk_score = p_scam * 100.0
        else:
            risk_score = 0.0

        risk_score = round(risk_score, 2)

        # 4. Determine risk tier & recommendation
        if risk_score >= self.CRITICAL_THRESHOLD:
            risk_tier = "CRITICAL"
            recommended_action = "TERMINATE_CALL_IMMEDIATELY"
            alert_message = (
                "CRITICAL FRAUD ALERT: High probability of synthesized/cloned voice paired with active "
                "scam/social engineering coercion. Hang up immediately and freeze sensitive credentials."
            )
        elif risk_score >= self.HIGH_THRESHOLD:
            risk_tier = "HIGH"
            recommended_action = "ALERT_USER_AND_CHALLENGE"
            alert_message = (
                "HIGH RISK WARNING: Deceptive intent or synthetic acoustic markers detected. "
                "Do not share OTPs, passcodes, or authorize payments under any circumstances."
            )
        elif risk_score >= self.MEDIUM_THRESHOLD:
            risk_tier = "MEDIUM"
            recommended_action = "MONITOR_AND_PROMPT_VERIFICATION"
            alert_message = (
                "SUSPICIOUS ACTIVITY: Unverified caller cues or abnormal speech cadence observed. "
                "Verify caller identity through an official external channel."
            )
        else:
            risk_tier = "LOW"
            recommended_action = "ALLOW_CONVERSATION"
            alert_message = "Normal conversational patterns and natural voice acoustic characteristics detected."

        return {
            "incident_id": incident_id,
            "timestamp": timestamp,
            "composite_risk_score": risk_score,
            "risk_tier": risk_tier,
            "recommended_action": recommended_action,
            "alert_message": alert_message,
            "active_modalities": active_modalities,
            "voice_analysis": voice_res,
            "content_analysis": content_res
        }


def calculate_risk(voice_result, scam_result):
    """
    Standard integration contract interface calculating composite risk.
    Signature: calculate_risk(voice_result, scam_result)

    Required contract output fields:
    {
      "voice_status": "REAL | AI_GENERATED | UNKNOWN",
      "voice_confidence": 0.0,
      "scam_detected": true,
      "scam_confidence": 0.0,
      "risk_score": 0,
      "risk_level": "LOW | MEDIUM | HIGH",
      "reasons": []
    }
    """
    # 1. Parse voice_result
    if isinstance(voice_result, dict):
        voice_status = voice_result.get("voice_status")
        if not voice_status:
            if voice_result.get("is_voice_clone") is True:
                voice_status = "AI_GENERATED"
            elif voice_result.get("is_voice_clone") is False:
                voice_status = "REAL"
            else:
                voice_status = "UNKNOWN"

        if "voice_confidence" in voice_result:
            voice_confidence = float(round(float(voice_result["voice_confidence"]), 4))
        elif "confidence" in voice_result:
            voice_confidence = float(round(float(voice_result["confidence"]), 4))
        elif "clone_probability" in voice_result:
            p = float(voice_result["clone_probability"])
            voice_confidence = float(round(p if voice_status == "AI_GENERATED" else (1.0 - p), 4))
        else:
            voice_confidence = 0.0

        p_voice = float(voice_result.get("clone_probability", 1.0 if voice_status == "AI_GENERATED" else 0.0))
        is_clone = (voice_status == "AI_GENERATED")
    else:
        voice_status = "UNKNOWN"
        voice_confidence = 0.0
        p_voice = 0.0
        is_clone = False

    # 2. Parse scam_result
    if isinstance(scam_result, dict):
        if "scam_detected" in scam_result:
            scam_detected = bool(scam_result["scam_detected"])
        elif "is_scam" in scam_result:
            scam_detected = bool(scam_result["is_scam"])
        else:
            scam_detected = False

        if "scam_confidence" in scam_result:
            scam_confidence = float(round(float(scam_result["scam_confidence"]), 4))
        elif "confidence" in scam_result:
            scam_confidence = float(round(float(scam_result["confidence"]), 4))
        elif "scam_probability" in scam_result:
            p = float(scam_result["scam_probability"])
            scam_confidence = float(round(p if scam_detected else (1.0 - p), 4))
        else:
            scam_confidence = 0.0

        p_scam = float(scam_result.get("scam_probability", 1.0 if scam_detected else 0.0))
        has_scam = True
    else:
        scam_detected = False
        scam_confidence = 0.0
        p_scam = 0.0
        has_scam = False

    # 3. Calculate risk score (0 - 100)
    has_voice = (voice_status != "UNKNOWN")
    if has_voice and has_scam:
        base_score = (0.55 * p_voice + 0.45 * p_scam) * 100.0
        synergy_boost = 20.0 * (p_voice * p_scam)
        raw_score = min(100.0, base_score + synergy_boost)
    elif has_voice:
        raw_score = p_voice * 100.0
    elif has_scam:
        raw_score = p_scam * 100.0
    else:
        raw_score = 0.0

    risk_score = int(round(raw_score))
    risk_score = max(0, min(100, risk_score))

    # 4. Map risk level ("LOW | MEDIUM | HIGH")
    if risk_score >= 60:
        risk_level = "HIGH"
    elif risk_score >= 35:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    # 5. Compile explanation reasons
    reasons = []
    if is_clone:
        reasons.append("Synthetic or AI-generated voice clone detected with high acoustic confidence.")
        if isinstance(voice_result, dict):
            for anom in voice_result.get("acoustic_anomalies", [])[:2]:
                feat = anom.get("feature")
                if feat:
                    reasons.append(f"Acoustic anomaly detected in {feat}.")
    elif voice_status == "REAL":
        reasons.append("Acoustic analysis matches natural human speech characteristics.")

    if scam_detected:
        cat = scam_result.get("primary_category") if isinstance(scam_result, dict) else None
        if cat and cat not in ("LEGITIMATE_CONVERSATION", "EMPTY_INPUT"):
            reasons.append(f"Conversational scam intent detected: {cat.replace('_', ' ').title()}.")
        else:
            reasons.append("Conversational scam and social engineering pattern detected.")

        if isinstance(scam_result, dict):
            triggers = scam_result.get("detected_triggers", [])
            if triggers:
                reasons.append(f"Suspicious trigger keywords identified: {', '.join(triggers[:4])}.")
    elif has_scam and not scam_detected:
        reasons.append("No conversational fraud or social engineering coercion patterns detected.")

    if is_clone and scam_detected:
        reasons.append("Dual threat detected: AI voice clone combined with active social engineering scam.")

    if not reasons:
        reasons.append("Normal conversational interaction with no detected fraud signals.")

    return {
        "voice_status": voice_status,
        "voice_confidence": voice_confidence,
        "scam_detected": scam_detected,
        "scam_confidence": scam_confidence,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "reasons": reasons
    }


def main():
    engine = RiskEngine()
    import json

    cloned_audio = os.path.join(AI_DIR, "data", "sample", "cloned_sample_1.wav")
    scam_text = "Urgent: This is Bank Security. Your debit card was charged $800. Provide your 6-digit OTP passcode immediately."

    genuine_audio = os.path.join(AI_DIR, "data", "sample", "genuine_sample_1.wav")
    legit_text = "Hi Mike, let's meet at 12:30 for lunch at the cafe."

    print("=== Multi-Modal Test 1: Cloned Voice + Scam Script ===")
    res1 = engine.evaluate(audio_file_path=cloned_audio, text_transcript=scam_text)
    print(json.dumps(res1, indent=2))

    print("\n=== Multi-Modal Test 2: Genuine Voice + Legitimate Conversation ===")
    res2 = engine.evaluate(audio_file_path=genuine_audio, text_transcript=legit_text)
    print(json.dumps(res2, indent=2))


if __name__ == "__main__":
    main()

