"""
text_preprocessing.py
Text cleaning, tokenization, heuristic scam keyword extraction,
and intent feature engineering for conversational fraud detection.
"""

import re
import math
from typing import List, Dict, Any, Set, Tuple


class TextPreprocessor:
    """
    Cleans transcript text and extracts specialized NLP risk features
    and heuristic indicator scores for fraud classification.
    """

    URGENCY_KEYWORDS = {
        "immediate", "immediately", "urgent", "urgently", "warrant", "arrest",
        "suspended", "suspension", "police", "dispatch", "penalty", "emergency",
        "hurry", "right now", "within 24 hours", "law enforcement", "jail"
    }

    CREDENTIAL_KEYWORDS = {
        "otp", "passcode", "pin", "cvv", "verification code", "card number",
        "security code", "password", "debit card", "credit card", "expiration date",
        "social security number", "ssn"
    }

    FINANCIAL_KEYWORDS = {
        "gift card", "wire transfer", "wire", "bitcoin", "crypto", "cryptocurrency",
        "western union", "jackpot", "sweepstakes", "lottery", "bail money",
        "processing fee", "unauthorized transaction", "compromised", "fine"
    }

    AUTHORITY_KEYWORDS = {
        "federal tax", "irs", "tax enforcement", "police department",
        "bank fraud department", "social security administration",
        "microsoft support", "certified security", "fbi", "government account",
        "chase bank", "bank"
    }

    def __init__(self):
        # Common English stop words
        self.stop_words: Set[str] = {
            "a", "an", "the", "in", "on", "at", "to", "for", "of", "with",
            "is", "was", "are", "were", "be", "been", "have", "has", "had",
            "it", "its", "that", "this", "my", "your", "our", "their", "me", "you"
        }

    def clean_text(self, text: str) -> str:
        """Standardizes casing and strips noise/symbols while preserving word boundaries."""
        if not text:
            return ""
        text = text.lower()
        # Remove URLs
        text = re.sub(r"https?://\S+|www\.\S+", " ", text)
        # Normalize punctuation
        text = re.sub(r"[^\w\s]", " ", text)
        # Collapse whitespace
        text = re.sub(r"\s+", " ", text).strip()
        return text

    def tokenize(self, text: str, remove_stopwords: bool = False) -> List[str]:
        """Tokenizes cleaned text into word list."""
        cleaned = self.clean_text(text)
        tokens = cleaned.split()
        if remove_stopwords:
            tokens = [t for t in tokens if t not in self.stop_words]
        return tokens

    def extract_heuristic_features(self, text: str) -> Dict[str, Any]:
        """
        Scans text for scam triggers across urgency, credential harvesting,
        atypical financial channels, and authority impersonation.
        """
        text_lower = text.lower()
        tokens = self.tokenize(text_lower)
        token_set = set(tokens)

        # Match urgency
        matched_urgency = [kw for kw in self.URGENCY_KEYWORDS if kw in text_lower]
        # Match credentials
        matched_creds = [kw for kw in self.CREDENTIAL_KEYWORDS if kw in text_lower]
        # Match financial terms
        matched_financial = [kw for kw in self.FINANCIAL_KEYWORDS if kw in text_lower]
        # Match authority
        matched_authority = [kw for kw in self.AUTHORITY_KEYWORDS if kw in text_lower]

        total_words = max(len(tokens), 1)

        urgency_score = min(1.0, len(matched_urgency) * 0.35)
        credential_score = min(1.0, len(matched_creds) * 0.45)
        financial_score = min(1.0, len(matched_financial) * 0.35)
        authority_score = min(1.0, len(matched_authority) * 0.30)

        # Coercion index: compound heuristic score
        coercion_index = (
            0.35 * urgency_score +
            0.35 * credential_score +
            0.15 * financial_score +
            0.15 * authority_score
        )

        all_matched = matched_urgency + matched_creds + matched_financial + matched_authority

        return {
            "urgency_score": round(urgency_score, 4),
            "credential_score": round(credential_score, 4),
            "financial_score": round(financial_score, 4),
            "authority_score": round(authority_score, 4),
            "coercion_index": round(coercion_index, 4),
            "detected_keywords": list(set(all_matched)),
            "word_count": total_words
        }

    def compute_tfidf_vector(self, text: str, vocabulary: Dict[str, int], idf_weights: Dict[str, float]) -> List[float]:
        """
        Transforms text into a fixed-length TF-IDF vector using pre-trained vocabulary and IDF.
        """
        tokens = self.tokenize(text, remove_stopwords=True)
        counts: Dict[str, int] = {}
        for t in tokens:
            counts[t] = counts.get(t, 0) + 1

        vec = [0.0] * len(vocabulary)
        total_tokens = max(len(tokens), 1)

        for word, count in counts.items():
            if word in vocabulary:
                idx = vocabulary[word]
                tf = count / total_tokens
                idf = idf_weights.get(word, 1.0)
                vec[idx] = tf * idf

        # L2 normalize vector
        norm = math.sqrt(sum(v * v for v in vec))
        if norm > 1e-9:
            vec = [v / norm for v in vec]
        return vec
