"""
train_scam_model.py
Trains the Conversational Scam Intent Detection Model.
Combines TF-IDF linguistic tokens with structured heuristic coercion signals
(urgency, credential harvesting, atypical financial requests, authority impersonation),
fits a calibrated discriminative classifier, evaluates performance metrics,
and saves the model artifact to ai/models/scam_detection_model.pkl and updates ai/models/model_metadata.json.
"""

import os
import sys
import json
import pickle
import math
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple

# Ensure ai directory is in sys.path
AI_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if AI_DIR not in sys.path:
    sys.path.insert(0, AI_DIR)

sys.modules["training.train_scam_model"] = sys.modules[__name__]

from preprocessing.text_preprocessing import TextPreprocessor


class CalibratedScamIntentModel:
    """
    Serializable NLP scam detection model combining TF-IDF vectorization
    and rule-based heuristic features with calibrated logistic probabilities.
    """
    __module__ = "training.train_scam_model"

    def __init__(self, vocabulary: Dict[str, int], idf_weights: Dict[str, float]):
        self.vocabulary = vocabulary
        self.idf_weights = idf_weights
        self.vocab_weights = [0.0] * len(vocabulary)
        self.heuristic_weights = {
            "urgency_score": 3.2,
            "credential_score": 4.5,
            "financial_score": 3.5,
            "authority_score": 2.8,
            "coercion_index": 4.0
        }
        self.bias = -2.5
        self.threshold = 0.50

    def fit(self, texts: List[str], heuristics: List[Dict[str, Any]], labels: List[int]):
        """
        Fits token weights using log-odds ratio and frequency calibration.
        """
        n_samples = len(labels)
        pos_indices = [i for i, y in enumerate(labels) if y == 1]
        neg_indices = [i for i, y in enumerate(labels) if y == 0]

        n_pos = len(pos_indices)
        n_neg = len(neg_indices)

        preprocessor = TextPreprocessor()

        # Count token occurrences per class
        pos_token_counts = [0] * len(self.vocabulary)
        neg_token_counts = [0] * len(self.vocabulary)

        for i in pos_indices:
            tokens = set(preprocessor.tokenize(texts[i], remove_stopwords=True))
            for t in tokens:
                if t in self.vocabulary:
                    pos_token_counts[self.vocabulary[t]] += 1

        for i in neg_indices:
            tokens = set(preprocessor.tokenize(texts[i], remove_stopwords=True))
            for t in tokens:
                if t in self.vocabulary:
                    neg_token_counts[self.vocabulary[t]] += 1

        # Calculate log-odds weights with Laplace smoothing
        for word, idx in self.vocabulary.items():
            p_w_pos = (pos_token_counts[idx] + 1.0) / (n_pos + 2.0)
            p_w_neg = (neg_token_counts[idx] + 1.0) / (n_neg + 2.0)
            log_odds = math.log(p_w_pos / p_w_neg)
            idf = self.idf_weights.get(word, 1.0)
            self.vocab_weights[idx] = log_odds * idf

    def predict_proba(self, text: str, heuristic_feats: Dict[str, Any]) -> float:
        """
        Calculates scam probability [0.0, 1.0] from text and heuristic features.
        """
        preprocessor = TextPreprocessor()
        tfidf_vec = preprocessor.compute_tfidf_vector(text, self.vocabulary, self.idf_weights)

        # NLP token score
        token_score = sum(tfidf_vec[i] * self.vocab_weights[i] for i in range(len(tfidf_vec)))

        # Heuristic score
        heuristic_score = sum(
            heuristic_feats.get(k, 0.0) * self.heuristic_weights.get(k, 0.0)
            for k in self.heuristic_weights
        )

        logit = self.bias + 2.0 * token_score + heuristic_score
        logit = max(-15.0, min(15.0, logit))
        prob_scam = 1.0 / (1.0 + math.exp(-logit))
        return prob_scam

    def predict(self, text: str, heuristic_feats: Dict[str, Any]) -> int:
        """Returns 1 for scam, 0 for genuine."""
        return 1 if self.predict_proba(text, heuristic_feats) >= self.threshold else 0


class ScamModelTrainer:
    """Orchestrates dataset ingestion, TF-IDF construction, model training, and export."""

    def __init__(self, data_file: str = "data/sample/sample_transcripts.json", models_dir: str = "models"):
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.data_path = os.path.join(self.base_dir, data_file)
        self.models_dir = os.path.join(self.base_dir, models_dir)
        self.preprocessor = TextPreprocessor()

    def load_dataset(self) -> Tuple[List[str], List[Dict[str, Any]], List[int], Dict[str, Any]]:
        """
        Loads and extracts heuristic features for training transcripts.
        Prefers real raw dataset in data/raw/archive (1)/ if available,
        otherwise falls back to data/sample/sample_transcripts.json.
        """
        import re

        raw_scam = os.path.join(self.base_dir, "data", "raw", "archive (1)", "English_Scam.txt")
        raw_nonscam = os.path.join(self.base_dir, "data", "raw", "archive (1)", "English_NonScam.txt")

        if os.path.exists(raw_scam) and os.path.exists(raw_nonscam):
            print(f"[+] Loading real scam dataset from: {raw_scam} and {raw_nonscam}...")
            with open(raw_scam, "r", encoding="utf-8", errors="ignore") as f:
                scam_lines = [re.sub(r'^\d+\.\s*', '', line.strip()) for line in f if line.strip()]
            with open(raw_nonscam, "r", encoding="utf-8", errors="ignore") as f:
                nonscam_lines = [re.sub(r'^\d+\.\s*', '', line.strip()) for line in f if line.strip()]

            texts = scam_lines + nonscam_lines
            labels = [1] * len(scam_lines) + [0] * len(nonscam_lines)
            dataset_info = {
                "source": "ai/data/raw/archive (1)/ (English_Scam.txt & English_NonScam.txt)",
                "total_samples": len(texts),
                "scam_samples": len(scam_lines),
                "non_scam_samples": len(nonscam_lines)
            }
        elif os.path.exists(self.data_path):
            print(f"[*] Loading sample transcript dataset from: {self.data_path}...")
            with open(self.data_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            texts = [item["text"] for item in data]
            labels = [item["is_scam"] for item in data]
            dataset_info = {
                "source": self.data_path,
                "total_samples": len(texts),
                "scam_samples": sum(1 for y in labels if y == 1),
                "non_scam_samples": sum(1 for y in labels if y == 0)
            }
        else:
            raise FileNotFoundError("Neither raw archive (1) dataset nor sample transcripts found.")

        print(f"[+] Extracting heuristic features for {len(texts)} transcripts...")
        heuristics = [self.preprocessor.extract_heuristic_features(t) for t in texts]
        return texts, heuristics, labels, dataset_info

    def build_vocabulary(self, texts: List[str], min_doc_freq: int = 2) -> Tuple[Dict[str, int], Dict[str, float]]:
        """Extracts unique tokens and IDF weights across training texts only."""
        doc_freqs: Dict[str, int] = {}
        n_docs = len(texts)

        for text in texts:
            unique_tokens = set(self.preprocessor.tokenize(text, remove_stopwords=True))
            for t in unique_tokens:
                doc_freqs[t] = doc_freqs.get(t, 0) + 1

        vocabulary = {}
        idf_weights = {}
        idx = 0
        for token, df in sorted(doc_freqs.items()):
            if df >= min_doc_freq and len(token) > 2:
                vocabulary[token] = idx
                # Smooth IDF
                idf_weights[token] = math.log((n_docs + 1.0) / (df + 1.0)) + 1.0
                idx += 1

        return vocabulary, idf_weights

    def train_and_save(self) -> Dict[str, Any]:
        """Trains scam detection classifier and exports serialized model with holdout evaluation."""
        import random

        os.makedirs(self.models_dir, exist_ok=True)
        texts, heuristics, labels, dataset_info = self.load_dataset()

        # Reproducible 80/20 train/test split
        rng = random.Random(42)
        pos_indices = [i for i, y in enumerate(labels) if y == 1]
        neg_indices = [i for i, y in enumerate(labels) if y == 0]
        rng.shuffle(pos_indices)
        rng.shuffle(neg_indices)

        n_train_pos = int(len(pos_indices) * 0.8)
        n_train_neg = int(len(neg_indices) * 0.8)

        train_indices = pos_indices[:n_train_pos] + neg_indices[:n_train_neg]
        test_indices = pos_indices[n_train_pos:] + neg_indices[n_train_neg:]
        rng.shuffle(train_indices)
        rng.shuffle(test_indices)

        train_texts = [texts[i] for i in train_indices]
        train_heuristics = [heuristics[i] for i in train_indices]
        train_labels = [labels[i] for i in train_indices]

        test_texts = [texts[i] for i in test_indices]
        test_heuristics = [heuristics[i] for i in test_indices]
        test_labels = [labels[i] for i in test_indices]

        print(f"[+] Train split: {len(train_texts)} samples ({train_labels.count(1)} scam, {train_labels.count(0)} non-scam)")
        print(f"[+] Test split:  {len(test_texts)} samples ({test_labels.count(1)} scam, {test_labels.count(0)} non-scam)")

        # Fit vocabulary on TRAIN texts only to prevent data leakage
        min_df = 2 if len(train_texts) >= 50 else 1
        vocabulary, idf_weights = self.build_vocabulary(train_texts, min_doc_freq=min_df)
        print(f"[+] Built vocabulary with {len(vocabulary)} terms from training split.")

        model = CalibratedScamIntentModel(vocabulary, idf_weights)
        model.fit(train_texts, train_heuristics, train_labels)

        # Train set evaluation
        train_preds = [model.predict(train_texts[i], train_heuristics[i]) for i in range(len(train_texts))]
        train_correct = sum(1 for p, y in zip(train_preds, train_labels) if p == y)
        train_acc = train_correct / len(train_labels)

        # Holdout test set evaluation
        test_preds = [model.predict(test_texts[i], test_heuristics[i]) for i in range(len(test_texts))]
        test_correct = sum(1 for p, y in zip(test_preds, test_labels) if p == y)
        test_acc = test_correct / len(test_labels)

        tp = sum(1 for p, y in zip(test_preds, test_labels) if p == 1 and y == 1)
        fp = sum(1 for p, y in zip(test_preds, test_labels) if p == 1 and y == 0)
        fn = sum(1 for p, y in zip(test_preds, test_labels) if p == 0 and y == 1)
        tn = sum(1 for p, y in zip(test_preds, test_labels) if p == 0 and y == 0)

        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = 2 * prec * rec / (prec + rec) if (prec + rec) > 0 else 0.0

        print(f"[+] Scam Model Train Accuracy: {train_acc * 100:.2f}%")
        print(f"[+] Scam Model Test Accuracy:  {test_acc * 100:.2f}% ({test_correct}/{len(test_labels)})")
        print(f"[+] Precision: {prec:.4f}, Recall: {rec:.4f}, F1: {f1:.4f}")
        print(f"[+] Confusion Matrix: TP={tp}, FP={fp}, TN={tn}, FN={fn}")

        # Save model pickle
        model_path = os.path.join(self.models_dir, "scam_detection_model.pkl")
        with open(model_path, "wb") as f:
            pickle.dump(model, f)
        print(f"[+] Serialized model artifact saved to: {model_path}")

        # Update metadata
        metadata_path = os.path.join(self.models_dir, "model_metadata.json")
        metadata = {}
        if os.path.exists(metadata_path):
            try:
                with open(metadata_path, "r") as f:
                    metadata = json.load(f)
            except Exception:
                metadata = {}

        metadata["scam_detection_model"] = {
            "model_type": "CalibratedScamIntentModel (TF-IDF + Linguistic Heuristic Classifier)",
            "version": "2.0.0",
            "training_timestamp": datetime.now(timezone.utc).isoformat(),
            "dataset": dataset_info["source"],
            "total_samples": dataset_info["total_samples"],
            "scam_samples": dataset_info["scam_samples"],
            "non_scam_samples": dataset_info["non_scam_samples"],
            "train_samples_count": len(train_texts),
            "test_samples_count": len(test_texts),
            "train_test_split": "80/20 stratified holdout (random_seed=42)",
            "vocabulary_size": len(vocabulary),
            "train_accuracy": round(train_acc, 4),
            "test_accuracy": round(test_acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "confusion_matrix": {"tp": tp, "fp": fp, "tn": tn, "fn": fn},
            "decision_threshold": model.threshold,
            "heuristic_categories": [
                "urgency",
                "credential_harvesting",
                "financial_coercion",
                "authority_impersonation"
            ],
            "artifact_file": "scam_detection_model.pkl"
        }

        with open(metadata_path, "w") as f:
            json.dump(metadata, f, indent=2)
        print(f"[+] Updated metadata in: {metadata_path}")

        return metadata["scam_detection_model"]


def main():
    trainer = ScamModelTrainer()
    metrics = trainer.train_and_save()
    print("\n--- Scam Model Training Summary ---")
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
