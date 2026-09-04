#!/usr/bin/env python3
"""
test_ai_pipeline.py
End-to-end verification and integration test suite for the
AI Voice Fraud Detection & Prevention System.
"""

import os
import sys
import unittest
import json

AI_DIR = os.path.dirname(os.path.abspath(__file__))
if AI_DIR not in sys.path:
    sys.path.insert(0, AI_DIR)

from preprocessing.audio_preprocessing import AudioPreprocessor
from preprocessing.feature_extraction import AudioFeatureExtractor
from preprocessing.text_preprocessing import TextPreprocessor
from inference.voice_detector import VoiceDetector, analyze_voice
from inference.scam_detector import ScamDetector, analyze_scam
from inference.risk_engine import RiskEngine, calculate_risk


class TestAIVoiceFraudPipeline(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.preprocessor = AudioPreprocessor()
        cls.extractor = AudioFeatureExtractor()
        cls.text_prep = TextPreprocessor()
        cls.voice_detector = VoiceDetector()
        cls.scam_detector = ScamDetector()
        cls.risk_engine = RiskEngine(cls.voice_detector, cls.scam_detector)

        cls.cloned_wav = os.path.join(AI_DIR, "data", "sample", "cloned_sample_1.wav")
        cls.genuine_wav = os.path.join(AI_DIR, "data", "sample", "genuine_sample_1.wav")

    def test_01_audio_preprocessing(self):
        """Verify audio loading, normalization, and pre-emphasis."""
        self.assertTrue(os.path.exists(self.genuine_wav), "Genuine sample WAV missing")
        samples, sr = self.preprocessor.preprocess_pipeline(self.genuine_wav)
        self.assertEqual(sr, 16000, "Sample rate must be 16kHz")
        self.assertGreater(len(samples), 0, "Preprocessed samples must not be empty")
        max_amp = max(abs(s) for s in samples)
        self.assertLessEqual(max_amp, 2.0, "Pre-emphasized amplitude should be bounded")

    def test_02_feature_extraction(self):
        """Verify 40-dimensional acoustic feature extraction."""
        samples, sr = self.preprocessor.preprocess_pipeline(self.genuine_wav)
        feats = self.extractor.extract_features(samples)
        self.assertEqual(len(feats), 40, "Feature extractor must output exactly 40 features")
        self.assertIn("spectral_centroid_mean", feats)
        self.assertIn("high_freq_ratio", feats)
        self.assertIn("jitter_local", feats)
        self.assertIn("shimmer_local", feats)
        self.assertIn("mfcc_1_mean", feats)

        vec = self.extractor.extract_feature_vector(samples)
        self.assertEqual(len(vec), 40, "Feature vector must match feature count")

    def test_03_text_heuristics(self):
        """Verify heuristic keyword and intent extraction."""
        scam_text = "URGENT WARNING: Police warrant issued. Pay fine with gift card or face immediate arrest."
        h = self.text_prep.extract_heuristic_features(scam_text)
        self.assertGreater(h["urgency_score"], 0.0, "Urgency score should trigger on warrant/arrest")
        self.assertGreater(h["coercion_index"], 0.3, "Coercion index must reflect high pressure")
        self.assertIn("arrest", h["detected_keywords"])

    def test_04_voice_detector_inference(self):
        """Verify VoiceDetector discriminates between cloned and genuine samples."""
        clone_res = self.voice_detector.predict(self.cloned_wav)
        self.assertTrue(clone_res["is_voice_clone"], "Synthetic voice must be classified as cloned")
        self.assertGreaterEqual(clone_res["clone_probability"], 0.7, "Clone probability should be >= 0.7")
        self.assertEqual(clone_res["decision_verdict"], "SYNTHETIC_CLONED_VOICE")

        genuine_res = self.voice_detector.predict(self.genuine_wav)
        self.assertFalse(genuine_res["is_voice_clone"], "Natural voice must be classified as genuine")
        self.assertLessEqual(genuine_res["clone_probability"], 0.3, "Clone probability should be <= 0.3")
        self.assertEqual(genuine_res["decision_verdict"], "GENUINE_NATURAL_VOICE")

    def test_05_scam_detector_inference(self):
        """Verify ScamDetector discriminates between scam and benign conversations."""
        scam_text = "Bank Security Alert: Provide the one-time passcode OTP immediately to avoid account suspension."
        scam_res = self.scam_detector.predict(scam_text)
        self.assertTrue(scam_res["is_scam"], "Scam transcript must be detected")
        self.assertGreaterEqual(scam_res["scam_probability"], 0.8)
        self.assertEqual(scam_res["primary_category"], "CREDENTIAL_OTP_HARVESTING")

        legit_text = "Hello, I am calling to confirm your appointment for tomorrow at 2 PM."
        legit_res = self.scam_detector.predict(legit_text)
        self.assertFalse(legit_res["is_scam"], "Benign appointment text must not be flagged")
        self.assertLessEqual(legit_res["scam_probability"], 0.2)

    def test_06_risk_engine_fusion(self):
        """Verify multi-modal risk scoring and threat tier assignment."""
        # Critical test: Cloned Voice + Scam Script
        scam_text = "URGENT from Police: Arrest warrant issued. Pay fine immediately."
        res_crit = self.risk_engine.evaluate(audio_file_path=self.cloned_wav, text_transcript=scam_text)
        self.assertEqual(res_crit["risk_tier"], "CRITICAL", "Dual high-risk modalities must yield CRITICAL tier")
        self.assertGreaterEqual(res_crit["composite_risk_score"], 80.0)
        self.assertEqual(res_crit["recommended_action"], "TERMINATE_CALL_IMMEDIATELY")

        # Low test: Genuine Voice + Benign Script
        legit_text = "Hi Alex, hope you have a great weekend."
        res_low = self.risk_engine.evaluate(audio_file_path=self.genuine_wav, text_transcript=legit_text)
        self.assertEqual(res_low["risk_tier"], "LOW", "Benign voice and text must yield LOW tier")
        self.assertLess(res_low["composite_risk_score"], 35.0)
        self.assertEqual(res_low["recommended_action"], "ALLOW_CONVERSATION")

    def test_07_metadata_schema(self):
        """Verify model_metadata.json existence and schema completeness."""
        meta_path = os.path.join(AI_DIR, "models", "model_metadata.json")
        self.assertTrue(os.path.exists(meta_path), "model_metadata.json must exist")
        with open(meta_path, "r") as f:
            metadata = json.load(f)
        self.assertIn("voice_clone_model", metadata)
        self.assertIn("scam_detection_model", metadata)
        self.assertEqual(metadata["voice_clone_model"]["feature_count"], 40)
        self.assertGreater(metadata["scam_detection_model"]["vocabulary_size"], 50)

    def test_08_contract_interfaces(self):
        """Verify callable interfaces analyze_voice, analyze_scam, and calculate_risk."""
        # 1. Test analyze_voice
        voice_res = analyze_voice(self.cloned_wav)
        self.assertIn("voice_status", voice_res)
        self.assertIn("voice_confidence", voice_res)
        self.assertEqual(voice_res["voice_status"], "AI_GENERATED")
        self.assertIsInstance(voice_res["voice_confidence"], float)

        # 2. Test analyze_scam
        scam_res = analyze_scam("Urgent: Chase Bank fraud alert. Verify your OTP passcode now.")
        self.assertIn("scam_detected", scam_res)
        self.assertIn("scam_confidence", scam_res)
        self.assertTrue(scam_res["scam_detected"])
        self.assertIsInstance(scam_res["scam_confidence"], float)

        # 3. Test calculate_risk with exact contract fields
        risk_output = calculate_risk(voice_res, scam_res)
        required_keys = {
            "voice_status",
            "voice_confidence",
            "scam_detected",
            "scam_confidence",
            "risk_score",
            "risk_level",
            "reasons"
        }
        self.assertEqual(set(risk_output.keys()), required_keys)
        self.assertIn(risk_output["voice_status"], ("REAL", "AI_GENERATED", "UNKNOWN"))
        self.assertIn(risk_output["risk_level"], ("LOW", "MEDIUM", "HIGH"))
        self.assertIsInstance(risk_output["risk_score"], int)
        self.assertIsInstance(risk_output["reasons"], list)

    def test_09_real_datasets_inference(self):
        """Verify inference on samples from actual Kaggle and text datasets."""
        kaggle_real = os.path.join(AI_DIR, "data", "raw", "archive", "KAGGLE", "AUDIO", "REAL", "margot-original.wav")
        kaggle_fake = os.path.join(AI_DIR, "data", "raw", "archive", "KAGGLE", "AUDIO", "FAKE", "Obama-to-Biden.wav")
        scam_file = os.path.join(AI_DIR, "data", "raw", "archive (1)", "English_Scam.txt")
        nonscam_file = os.path.join(AI_DIR, "data", "raw", "archive (1)", "English_NonScam.txt")

        if os.path.exists(kaggle_real) and os.path.exists(kaggle_fake):
            # Test Real audio from Kaggle
            res_real = analyze_voice(kaggle_real)
            self.assertEqual(res_real["voice_status"], "REAL")
            self.assertFalse(res_real["is_voice_clone"])

            # Test Fake audio from Kaggle
            res_fake = analyze_voice(kaggle_fake)
            self.assertEqual(res_fake["voice_status"], "AI_GENERATED")
            self.assertTrue(res_fake["is_voice_clone"])

        if os.path.exists(scam_file) and os.path.exists(nonscam_file):
            import re
            with open(scam_file, "r", encoding="utf-8", errors="ignore") as f:
                scam_lines = [re.sub(r'^\d+\.\s*', '', l.strip()) for l in f if l.strip()]
            with open(nonscam_file, "r", encoding="utf-8", errors="ignore") as f:
                nonscam_lines = [re.sub(r'^\d+\.\s*', '', l.strip()) for l in f if l.strip()]

            # Test actual scam text
            scam_sample = scam_lines[0]
            scam_out = analyze_scam(scam_sample)
            self.assertTrue(scam_out["scam_detected"])

            # Test actual non-scam text
            nonscam_sample = nonscam_lines[0]
            nonscam_out = analyze_scam(nonscam_sample)
            self.assertFalse(nonscam_out["scam_detected"])

            # Test complete pipeline on real attack (Fake voice + Scam text)
            if os.path.exists(kaggle_fake):
                attack_risk = calculate_risk(res_fake, scam_out)
                self.assertEqual(attack_risk["risk_level"], "HIGH")
                self.assertGreaterEqual(attack_risk["risk_score"], 60)

            # Test complete pipeline on benign call (Real voice + Non-scam text)
            if os.path.exists(kaggle_real):
                benign_risk = calculate_risk(res_real, nonscam_out)
                self.assertEqual(benign_risk["risk_level"], "LOW")
                self.assertLess(benign_risk["risk_score"], 35)


if __name__ == "__main__":
    unittest.main(verbosity=2)
