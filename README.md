# AI Voice Fraud Detection & Prevention System

> **A real-time AI-powered system designed to detect voice cloning, deepfake audio, and conversational scam indicators during voice calls.**

---

## 📌 Project Overview

The **AI Voice Fraud Detection & Prevention System** addresses the rising threat of voice clone scams and synthetic audio impersonation. The system ingests audio call recordings, runs dual-pass AI inference (Deepfake Voice Detection + Natural Language Scam Keyword/Urgency Detection), generates unified risk assessments, and automatically triggers high-risk fraud alerts.

---

## 👥 Team Roles & Responsibilities

- **Hitesh** — Backend, REST API Framework, Security Architecture, Database Resilience
- **Om** — AI/ML Engine (Voice Clone Detection & Scam NLP Models)
- **Prathna** — Frontend Interface (React.js + Vite + Tailwind CSS - Premium Light Theme)
- **Aditya & Jaldhi** — Integration, API Contracting, Deployment & Quality Assurance
- **Yug** — System Documentation & Technical Writing

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.9+
- Node.js 18+ & npm
- Pip & Virtual Environment (`venv`)

### 2. Backend & AI Environment Setup

```bash
# Install backend dependencies
pip install -r backend/requirements.txt

# Run the FastAPI Dev Server
python backend/run.py
```

- **Server URL**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc OpenAPI Docs**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

- **Frontend URL**: [http://localhost:5173](http://localhost:5173)

---

## 🧪 Running Integration Tests

Run the full `pytest` suite covering Auth, Calls, Analysis, Alerts, Forensic Reports, and End-to-End Integration:

```bash
# Run backend integration tests
pytest backend/tests/ -v

# Run AI pipeline test suite
python ai/test_ai_pipeline.py
```

### Verified Test Results
```text
======================= 22 passed in 0.68s =======================
backend/tests/test_auth.py ......................... [PASSED]
backend/tests/test_calls.py ........................ [PASSED]
backend/tests/test_analysis.py ..................... [PASSED]
backend/tests/test_alerts.py ....................... [PASSED]
backend/tests/test_reports.py ...................... [PASSED]
backend/tests/test_integration.py .................. [PASSED]

======================= 9 passed in 2.14s =======================
ai/test_ai_pipeline.py ............................. [PASSED]
```

---

## 🏗️ Production Build & Deployment

- **Frontend (Vercel)**: Configured via `frontend/vercel.json` for SPA rewrites. Run `npm run build` inside `frontend/` (0 build errors).
- **Backend (Render / Railway)**: Configured via `backend/Procfile` and `backend/render.yaml`.
- **Database (MongoDB Atlas)**: In-memory fallback active locally; connect MongoDB Atlas by supplying `MONGODB_URL` in backend `.env`.

---

## 📖 Comprehensive Documentation

Detailed documentation guides are available in the [`docs/`](./docs/) directory and [`integration/`](./integration/):

- 📐 [**System Architecture Guide**](./docs/ARCHITECTURE.md) — System design, component breakdown, database fallback resilience, and sequence diagrams.
- 📡 [**REST API Reference Manual**](./docs/API_REFERENCE.md) — Complete endpoint reference with request/response payloads and error codes.
- 🤖 [**AI Model Integration Guide**](./docs/AI_INTEGRATION_GUIDE.md) — Step-by-step developer guide for hooking PyTorch / ML models into `ai/inference/`.
- 🧪 [**Testing & Deployment Guide**](./docs/TESTING_AND_DEPLOYMENT.md) — Test suites, environment specs, Vercel & Render deployment setup.
- 🤝 [**Shared API Contract**](./integration/api-contract.md) — Frontend & ML team integration specification.
