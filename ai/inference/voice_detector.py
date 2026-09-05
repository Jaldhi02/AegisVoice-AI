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
        Analyzes an audio file using short 1.5s windowing, acoustic feature extraction,
        vocoder artifact detection, and multi-modal aggregation.
        """
        if not os.path.exists(audio_file_path):
            raise FileNotFoundError(f"Audio file not found: {audio_file_path}")

        samples, sr = self.preprocessor.preprocess_pipeline(audio_file_path, max_duration_sec=30.0)
        if not samples or len(samples) < 100:
            raise ValueError(f"Insufficient or empty audio data in {audio_file_path}")

        duration_sec = round(len(samples) / sr, 2)

        # 1. Windowing setup (1.5 sec windows with 50% overlap)
        win_size = int(1.5 * sr)
        hop_size = int(0.75 * sr)

        if len(samples) <= win_size:
            window_frames = [samples]
        else:
            window_frames = []
            for start in range(0, len(samples) - win_size + 1, hop_size):
                window_frames.append(samples[start:start + win_size])

        window_scores = []
        win_telemetry = []

        all_jitters = []
        all_f0_stds = []
        all_flatness = []
        all_high_freq = []
        all_centroids_std = []

        # 2. Window-level feature extraction & artifact analysis
        for win in window_frames:
            w_dict = self.feature_extractor.extract_features(win)
            w_vec = self.feature_extractor.extract_feature_vector(win)
            model_prob = float(self.model.predict_proba(w_vec)) if self.model else 0.5

            jitter = float(w_dict.get("jitter_local", 0.0))
            f0_std = float(w_dict.get("f0_std", 0.0))
            flatness = float(w_dict.get("spectral_flatness_mean", 0.0))
            high_freq = float(w_dict.get("high_freq_ratio", 0.0))
            centroid_std = float(w_dict.get("spectral_centroid_std", 0.0))

            all_jitters.append(jitter)
            all_f0_stds.append(f0_std)
            all_flatness.append(flatness)
            all_high_freq.append(high_freq)
            all_centroids_std.append(centroid_std)

            # Heuristic artifact score based on vocoder/neural voice indicators
            artifact_score = 0.0
            if f0_std < 4.0 or f0_std > 75.0:
                artifact_score += 0.25
            if flatness > 0.06 or high_freq > 0.12:
                artifact_score += 0.35
            if jitter < 0.004 or jitter > 0.07:
                artifact_score += 0.20
            if centroid_std < 100.0:
                artifact_score += 0.20

            artifact_score = min(1.0, artifact_score)

            # Combined window synthetic probability
            w_synth_prob = 0.65 * model_prob + 0.35 * artifact_score
            w_synth_prob = max(0.0, min(1.0, w_synth_prob))
            window_scores.append(w_synth_prob)

        # 3. Aggregation across windows
        avg_synth_prob = sum(window_scores) / len(window_scores) if window_scores else 0.5
        synthetic_windows = sum(1 for s in window_scores if s >= 0.55)
        human_windows = sum(1 for s in window_scores if s <= 0.45)

        total_windows = len(window_scores)
        is_mixed = bool(total_windows >= 3 and synthetic_windows >= 1 and human_windows >= 1 and (synthetic_windows / total_windows >= 0.15) and (human_windows / total_windows >= 0.15))

        synthetic_pct = round(avg_synth_prob * 100.0, 1)
        human_pct = round(100.0 - synthetic_pct, 1)
        mixed_pct = round((min(synthetic_windows, human_windows) * 2.0 / total_windows) * 100.0, 1) if is_mixed else 0.0

        is_clone = bool(avg_synth_prob >= self.model.threshold) if self.model else bool(avg_synth_prob >= 0.5)

        avg_jitter = sum(all_jitters) / len(all_jitters) if all_jitters else 0.0
        avg_f0_std = sum(all_f0_stds) / len(all_f0_stds) if all_f0_stds else 0.0
        avg_flatness = sum(all_flatness) / len(all_flatness) if all_flatness else 0.0
        avg_high_freq = sum(all_high_freq) / len(all_high_freq) if all_high_freq else 0.0

        pitch_consistency = round(max(0.0, min(1.0, 1.0 - (avg_f0_std / 60.0))), 4)
        pitch_jitter = round(max(0.0, min(1.0, avg_jitter * 18.0)), 4)
        spectral_artifacts = round(max(0.0, min(1.0, avg_flatness * 4.0 + avg_high_freq * 2.5)), 4)
        spectral_inconsistency = spectral_artifacts
        clone_similarity = round(avg_synth_prob, 4)

        full_vec = self.feature_extractor.extract_feature_vector(samples)
        anomalies = self.model.explain(full_vec) if self.model else []

        decision = "MIXED_SYNTHETIC_HUMAN" if is_mixed else ("SYNTHETIC_CLONED_VOICE" if is_clone else "GENUINE_NATURAL_VOICE")

        return {
            "is_voice_clone": is_clone,
            "is_mixed": is_mixed,
            "clone_probability": round(avg_synth_prob, 4),
            "synthetic_score": round(avg_synth_prob, 4),
            "synthetic_probability": synthetic_pct,
            "human_probability": human_pct,
            "mixed_probability": mixed_pct,
            "confidence": round(abs(avg_synth_prob - 0.50) * 2.0, 4),
            "pitch_consistency": pitch_consistency,
            "pitch_jitter": pitch_jitter,
            "spectral_artifacts": spectral_artifacts,
            "spectral_inconsistency": spectral_inconsistency,
            "clone_similarity": clone_similarity,
            "audio_duration_sec": duration_sec,
            "sample_rate_hz": sr,
            "windows_count": total_windows,
            "synthetic_windows_count": synthetic_windows,
            "human_windows_count": human_windows,
            "acoustic_anomalies": anomalies,
            "decision_verdict": decision
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
    target_path = audio_path
    if target_path and not os.path.exists(target_path):
        # Try resolving relative path against root and backend directories
        candidates = [
            os.path.abspath(target_path),
            os.path.join(AI_DIR, "..", target_path),
            os.path.join(AI_DIR, "..", "backend", target_path),
        ]
        for c in candidates:
            if os.path.exists(c):
                target_path = c
                break

    if not target_path or not os.path.exists(target_path):
        return {
            "voice_status": "UNAVAILABLE",
            "voice_confidence": 0.0,
            "is_voice_clone": False,
            "is_mixed": False,
            "clone_probability": None,
            "synthetic_score": None,
            "synthetic_probability": None,
            "human_probability": None,
            "mixed_probability": None,
            "pitch_consistency": None,
            "pitch_jitter": None,
            "spectral_artifacts": None,
            "spectral_inconsistency": None,
            "clone_similarity": None,
            "confidence": 0.0,
            "audio_duration_sec": 0.0,
            "sample_rate_hz": 16000,
            "acoustic_anomalies": [],
            "decision_verdict": "UNAVAILABLE_INPUT",
            "reasons": ["Audio file unavailable or unreadable"]
        }

    try:
        detector = get_voice_detector()
        raw = detector.predict(target_path)
        is_clone = raw.get("is_voice_clone", False)
        is_mixed = raw.get("is_mixed", False)
        clone_prob = raw.get("clone_probability", 0.0)

        if is_mixed:
            voice_status = "MIXED"
            voice_confidence = float(round(raw.get("confidence", 0.5), 4))
        elif is_clone:
            voice_status = "AI_GENERATED"
            voice_confidence = float(round(clone_prob, 4))
        else:
            voice_status = "REAL"
            voice_confidence = float(round(1.0 - clone_prob, 4))

        reasons = []
        if is_mixed:
            reasons.append("Audio contains both authentic human and synthetic/AI cloned segments")
        elif is_clone:
            reasons.append("Synthetic or AI-generated voice clone detected across audio stream")
            for anom in raw.get("acoustic_anomalies", [])[:2]:
                feat = anom.get("feature")
                if feat:
                    reasons.append(f"Acoustic anomaly in {feat}")
        else:
            reasons.append("Natural human voice acoustic resonance verified")

        return {
            "voice_status": voice_status,
            "voice_confidence": voice_confidence,
            "reasons": reasons,
            **raw
        }
    except Exception as e:
        print(f"[!] analyze_voice error for {audio_path}: {e}")
        return {
            "voice_status": "UNAVAILABLE",
            "voice_confidence": 0.0,
            "is_voice_clone": False,
            "is_mixed": False,
            "clone_probability": None,
            "synthetic_score": None,
            "synthetic_probability": None,
            "human_probability": None,
            "mixed_probability": None,
            "pitch_consistency": None,
            "pitch_jitter": None,
            "spectral_artifacts": None,
            "spectral_inconsistency": None,
            "clone_similarity": None,
            "confidence": 0.0,
            "audio_duration_sec": 0.0,
            "sample_rate_hz": 16000,
            "acoustic_anomalies": [],
            "decision_verdict": "ANALYSIS_UNAVAILABLE",
            "reasons": [f"Analysis process error: {str(e)}"]
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

