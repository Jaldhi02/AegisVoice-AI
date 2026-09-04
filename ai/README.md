# AI Voice Fraud Detection & Prevention System

> **Subsystem**: `ai/`  
> **Target Problem**: Mitigating deepfake voice clones, impersonation fraud, and social engineering coercion in real-time voice communications.

---

## 1. System Architecture

```text
ai/
├── README.md                          # Technical architecture & developer documentation
├── requirements.txt                   # Dependency specifications
├── data/
│   ├── raw/                           # Ingested raw audio recordings and call logs (.gitkeep)
│   ├── processed/                     # Preprocessed feature vectors & cached matrices (.gitkeep)
│   └── sample/                        # Benchmark datasets & synthetic audio generators
│       ├── generate_sample_data.py    # Generates genuine and cloned .wav audio samples
│       └── sample_transcripts.json    # Labeled multi-category scam and legitimate transcripts
├── notebooks/
│   └── exploration.ipynb              # Exploratory analysis and feature inspection notebook
├── preprocessing/
│   ├── __init__.py
│   ├── audio_preprocessing.py         # Resampling, VAD silence trimming, normalization, pre-emphasis
│   ├── feature_extraction.py          # MFCCs, spectral moments, F0 pitch, jitter, and shimmer
│   └── text_preprocessing.py          # Text normalization, TF-IDF, and heuristic risk scoring
├── models/
│   ├── voice_clone_model.pkl          # Trained acoustic deepfake classifier
│   ├── scam_detection_model.pkl       # Trained conversational scam intent classifier
│   └── model_metadata.json            # Model versions, metrics, and feature schemas
├── training/
│   ├── __init__.py
│   ├── train_voice_model.py           # Training pipeline for acoustic voice clone model
│   └── train_scam_model.py            # Training pipeline for NLP scam intent model
└── inference/
    ├── __init__.py
    ├── voice_detector.py              # Real-time acoustic voice clone inference engine
    ├── scam_detector.py               # Real-time conversational scam inference engine
    └── risk_engine.py                 # Multi-modal risk fusion engine (0–100 score + alerts)
```

---

## 2. Core Detection Modalities

The system fuses two independent forensic signals:

### A. Acoustic Voice Clone Detection (`inference/voice_detector.py`)
Analyzes raw audio waveforms to detect synthetic vocoders, neural speech synthesis (TTS), and real-time voice conversion artifacts:
- **Mel-Frequency Cepstral Coefficients (MFCCs)**: 13 cepstral bands + 13 first-order delta derivatives capturing spectral envelope transitions.
- **Spectral Moments**: Spectral Centroid (brightness), Spectral Bandwidth, Spectral Rolloff (85% energy threshold), and Spectral Flatness.
- **Pitch Perturbations (Prosody Analysis)**:
  - Fundamental Frequency ($F_0$) mean and standard deviation.
  - **Jitter**: Cycle-to-cycle frequency perturbations.
  - **Shimmer**: Cycle-to-cycle amplitude perturbations.
  - Synthetic voices typically manifest either robotic flatness (near-zero $F_0$ variance) or unnaturally abrupt phase jumps.
- **High-Frequency Energy Ratio**: Detects high-frequency vocoder harmonic artifacts ($> 3000\text{ Hz}$).

### B. Conversational Scam Intent Detection (`inference/scam_detector.py`)
Analyzes spoken call transcripts or streaming ASR outputs using linguistic feature extraction and calibrated log-odds classification:
- **Urgency & Coercion**: Detects time pressure tactics (*"immediate", "warrant", "arrest", "within 24 hours", "police dispatch"*).
- **Credential & OTP Harvesting**: Detects requests for sensitive authorization tokens (*"OTP", "passcode", "PIN", "CVV", "verification code"*).
- **Atypical Financial Channels**: Detects non-retraceable payment demands (*"wire transfer", "gift card", "bitcoin", "western union", "bail money"*).
- **Authority Impersonation**: Detects institutional mimicry (*"Internal Revenue Service", "Bank Fraud Division", "Social Security Administration", "Federal Police"*).

### C. Unified Multi-Modal Risk Engine (`inference/risk_engine.py`)
Combines acoustic deepfake probability ($P_{\text{clone}}$) and conversational scam probability ($P_{\text{scam}}$):

$$\text{BaseScore} = (w_{\text{voice}} \cdot P_{\text{clone}} + w_{\text{scam}} \cdot P_{\text{scam}}) \times 100$$

$$\text{SynergyBoost} = 20.0 \times (P_{\text{clone}} \cdot P_{\text{scam}})$$

$$\text{CompositeRiskScore} = \min\left(100.0, \; \text{BaseScore} + \text{SynergyBoost}\right)$$

#### Threat Tiers & Recommended Actions
| Risk Score | Threat Tier | Action | User Notification |
| :--- | :--- | :--- | :--- |
| **80 – 100** | `CRITICAL` | `TERMINATE_CALL_IMMEDIATELY` | Critical alarm: Active deepfake social engineering attack. Hang up immediately. |
| **60 – 79** | `HIGH` | `ALERT_USER_AND_CHALLENGE` | High risk: Suspicious credentials requested or synthetic speech detected. |
| **35 – 59** | `MEDIUM` | `MONITOR_AND_PROMPT_VERIFICATION` | Caution: Unverified caller cues or abnormal speech cadence observed. |
| **0 – 34** | `LOW` | `ALLOW_CONVERSATION` | Normal conversational patterns and natural voice acoustic characteristics. |

---

## 3. Quick Start & Developer Guide

### Step 1: Environment Setup
Install dependencies from `ai/requirements.txt`:
```bash
pip install -r ai/requirements.txt
```

### Step 2: Generate Benchmark Audio Samples
```bash
python3 ai/data/sample/generate_sample_data.py
```

### Step 3: Train Models
To retrain the acoustic and NLP classifiers:
```bash
# Train acoustic voice clone classifier
python3 ai/training/train_voice_model.py

# Train conversational scam intent classifier
python3 ai/training/train_scam_model.py
```
Training generates:
- `ai/models/voice_clone_model.pkl`
- `ai/models/scam_detection_model.pkl`
- Updates `ai/models/model_metadata.json` with evaluation metrics.

### Step 4: Run Real-Time Multi-Modal Inference
```python
from ai.inference.risk_engine import RiskEngine

engine = RiskEngine()

result = engine.evaluate(
    audio_file_path="ai/data/sample/cloned_sample_1.wav",
    text_transcript="URGENT: This is Bank Security. Provide your one-time passcode OTP now to prevent account arrest."
)

print("Composite Risk Score:", result["composite_risk_score"])
print("Risk Tier:", result["risk_tier"])
print("Recommended Action:", result["recommended_action"])
print("Alert Message:", result["alert_message"])
```

Sample JSON Output:
```json
{
  "incident_id": "vfraud-56ff229b99",
  "composite_risk_score": 100.0,
  "risk_tier": "CRITICAL",
  "recommended_action": "TERMINATE_CALL_IMMEDIATELY",
  "alert_message": "CRITICAL FRAUD ALERT: High probability of synthesized/cloned voice paired with active scam/social engineering coercion...",
  "active_modalities": [
    "ACOUSTIC_VOICE_CLONE",
    "CONVERSATIONAL_SCAM_INTENT"
  ],
  "voice_analysis": {
    "is_voice_clone": true,
    "clone_probability": 1.0,
    "decision_verdict": "SYNTHETIC_CLONED_VOICE"
  },
  "content_analysis": {
    "is_scam": true,
    "scam_probability": 1.0,
    "primary_category": "CREDENTIAL_OTP_HARVESTING"
  }
}
```

---

## 4. Integration Guidelines for Backend & Ingestion Pipelines
- **Audio Stream Chunking**: The `AudioPreprocessor` accepts canonical 16kHz WAV streams or standard PCM buffers. For streaming call analysis, send chunks of 1.5s – 3.0s window size.
- **ASR / Transcription**: Stream transcripts directly to `RiskEngine.evaluate(text_transcript=...)` or `ScamDetector.predict(text=...)` as utterances are transcribed.
- **Webhooks & Telemetry**: Each risk evaluation contains an immutable `incident_id`, UTC timestamp, and granular breakdown of acoustic anomalies and detected keywords for compliance auditing.
