# AI Voice Fraud Detection & Prevention System

> **A real-time AI-powered system designed to detect voice cloning, deepfake audio, and conversational scam indicators during voice calls.**

---

## 📌 Project Overview

The **AI Voice Fraud Detection & Prevention System** addresses the rising threat of voice clone scams and synthetic audio impersonation. The system ingests audio call recordings, runs dual-pass AI inference (Deepfake Voice Detection + Natural Language Scam Keyword/Urgency Detection), generates unified risk assessments, and automatically triggers high-risk fraud alerts.

---

## 👥 Team Roles & Responsibilities

- **Hitesh** — Backend, REST API Framework, Security Architecture, Database Resilience
- **Om** — AI/ML Engine (Voice Clone Detection & Scam NLP Models)
- **Prathna** — Frontend Interface (React.js + Vite + Tailwind CSS)
- **Aditya & Jaldhi** — Integration, API Contracting & Quality Assurance
- **Yug** — System Documentation & Technical Writing

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.9+
- Pip & Virtual Environment (`venv`)

### 2. Environment Setup & Installation

```bash
cd ai-voice-fraud-detector

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt
```

### 3. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### 4. Run the FastAPI Dev Server

```bash
python backend/run.py
```

- **Server URL**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc OpenAPI Docs**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🧪 Running Integration Tests

Run the full `pytest` suite covering Auth, Calls, Analysis, Alerts, and Forensic Reports:

```bash
./venv/bin/pytest backend/tests/ -v
```

Output:
```
backend/tests/test_alerts.py::test_alerts_lifecycle         PASSED
backend/tests/test_analysis.py::test_scam_analysis          PASSED
backend/tests/test_analysis.py::test_full_analysis_workflow PASSED
backend/tests/test_auth.py::test_root_and_health            PASSED
backend/tests/test_auth.py::test_register_and_login_flow    PASSED
backend/tests/test_auth.py::test_invalid_login              PASSED
backend/tests/test_calls.py::test_call_upload_and_retrieval PASSED
backend/tests/test_calls.py::test_invalid_file_extension    PASSED
backend/tests/test_reports.py::test_report_generation       PASSED

================== 9 passed in 147.82s ====================
```

---

## 📖 Comprehensive Documentation

Detailed documentation guides are available in the [`docs/`](./docs/) directory and [`integration/`](./integration/):

- 📐 [**System Architecture Guide**](./docs/ARCHITECTURE.md) — System design, component breakdown, database fallback resilience, and sequence diagrams.
- 📡 [**REST API Reference Manual**](./docs/API_REFERENCE.md) — Complete endpoint reference with request/response payloads and error codes.
- 🤖 [**AI Model Integration Guide**](./docs/AI_INTEGRATION_GUIDE.md) — Step-by-step developer guide for hooking PyTorch / ML models into `ai/inference/`.
- 🧪 [**Testing & Deployment Guide**](./docs/TESTING_AND_DEPLOYMENT.md) — Test suites, environment specs, Docker & Gunicorn deployment setup.
- 🤝 [**Shared API Contract**](./integration/api-contract.md) — Frontend & ML team integration specification.

---

## 📁 Repository Structure

```
ai-voice-fraud-detector/
├── README.md                           ← Main project documentation
├── .env.example                        ← Environment configuration template
├── .gitignore
├── integration/
│   └── api-contract.md                 ← Shared team integration contract
├── docs/                               ← Comprehensive documentation
│   ├── ARCHITECTURE.md                 ← System architecture & diagrams
│   ├── API_REFERENCE.md                ← API reference manual
│   ├── AI_INTEGRATION_GUIDE.md         ← Guide for ML model integration
│   └── TESTING_AND_DEPLOYMENT.md       ← Test suite & deployment guide
├── ai/
│   └── inference/                      ← AI/ML Inference Bridge
│       ├── voice_detector.py           ← Synthetic voice clone detection
│       ├── scam_detector.py            ← Scam NLP transcript analysis
│       └── risk_engine.py              ← Unified composite risk scoring
└── backend/                            ← FastAPI Backend Application
    ├── run.py                          ← Application server entry point
    ├── requirements.txt
    ├── app/
    │   ├── main.py                     ← FastAPI initialization & CORS
    │   ├── core/                       ← Security, Config & Dependencies
    │   ├── database/                   ← Async Motor MongoDB + In-Memory Fallback
    │   ├── schemas/                    ← Pydantic Data Validation Schemas
    │   ├── services/                   ← Business Logic Layer
    │   └── api/                        ← API Endpoint Routers
    └── tests/                          ← 9 integration tests (Pytest)
```
