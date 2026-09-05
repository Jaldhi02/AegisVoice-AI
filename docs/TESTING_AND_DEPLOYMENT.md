# AegisVoice AI - Integration, Testing & Deployment Guide

## 1. Quality Assurance & Integration Testing Suite

The repository contains an end-to-end integration and unit test suite verified across 22 backend integration endpoints and 9 AI pipeline inference modules.

### 1.1 Running Tests

```bash
# 1. Run all backend & end-to-end integration tests
pytest backend/tests/ -v

# 2. Run AI pipeline & model inference tests
python ai/test_ai_pipeline.py
```

### 1.2 Test Execution Results

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

### 1.3 Test Coverage Matrix

| Test Suite | Functionality Covered | Status |
|---|---|---|
| `test_auth.py` | Registration, login, invalid credentials, public vs protected endpoints | **PASSED** |
| `test_calls.py` | Audio file upload, extensions (`.wav`, `.mp3`, `.m4a`), call history isolation | **PASSED** |
| `test_analysis.py` | Voice clone detection, scam NLP intent, multi-modal risk scoring | **PASSED** |
| `test_alerts.py` | Manual alert creation, auto-HIGH risk alert generation, status transitions | **PASSED** |
| `test_reports.py` | PDF/JSON forensic report generation | **PASSED** |
| `test_integration.py` | End-to-end 10-flow user journey & edge cases (invalid audio, >25MB file, missing JWT) | **PASSED** |
| `test_ai_pipeline.py` | Audio pre-processing, 40-dim feature vector extraction, NLP heuristics, ML inference | **PASSED** |

---

## 2. Frontend Production Build Verification

The React frontend has been verified with Vite for production deployment.

```bash
cd frontend
npm install
npm run build
```

**Build Output Verification**:
- Output Directory: `frontend/dist/`
- Transformed Modules: 1,672
- Errors: **0**
- Visual Design: Premium **Light Theme** (`#f8fafc` background, crisp `#ffffff` cards, slate typography, `#0284c7` cyan accents) running seamlessly on `localhost`.

---

## 3. Production Deployment Strategy

### 3.1 Frontend Deployment (Vercel)
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **SPA Rewrites Configuration**: Configured in `frontend/vercel.json`
- **Environment Variables**:
  - `VITE_API_URL`: URL of deployed FastAPI backend (e.g., `https://aegisvoice-api.onrender.com`)

### 3.2 Backend Deployment (Render / Railway)
- **Environment**: Python 3.11+
- **Build Command**: `pip install -r backend/requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Configuration Files**: `backend/Procfile` and `backend/render.yaml` provided.
- **Environment Variables**:
  - `MONGODB_URL`: MongoDB Atlas connection string (`mongodb+srv://...`)
  - `DB_NAME`: `aegisvoice`
  - `JWT_SECRET`: 64-character random secret key
  - `CORS_ORIGINS`: Allowed origins (e.g., `https://aegisvoice.vercel.app,http://localhost:5173`)
  - `MAX_UPLOAD_SIZE_MB`: `25`

### 3.3 Database Deployment (MongoDB Atlas)
1. Create a MongoDB Atlas cluster (M0 free tier or higher).
2. Create a Database User with read/write privileges to `aegisvoice`.
3. Configure Network Access to allow Render/Railway IP addresses (or `0.0.0.0/0` with secure credentials).
4. Copy the connection string to `MONGODB_URL` in the backend environment settings.
