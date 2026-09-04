# Testing & Deployment Guide

## 1. Automated Testing Suite

The repository includes a comprehensive `pytest` integration test suite located in `backend/tests/`.

### 1.1 Running Tests

Activate the Python virtual environment and run Pytest:

```bash
cd ai-voice-fraud-detector

# Activate virtual environment
source venv/bin/activate

# Run all backend tests with verbose output
pytest backend/tests/ -v
```

### 1.2 Test Modules Breakdown

| Test File | Covered Functionality | Test Cases |
|-----------|----------------------|------------|
| `backend/tests/test_auth.py` | Health checks, User Registration, Login flow, JWT token generation, Incorrect credentials failure handling | 3 tests |
| `backend/tests/test_calls.py` | Audio file upload (`.wav`, `.mp3`, `.m4a`), file extension validation, max size validation (25MB limit), call record retrieval | 2 tests |
| `backend/tests/test_analysis.py` | Voice clone analysis, scam NLP analysis, combined full pipeline analysis, risk level score calculation | 2 tests |
| `backend/tests/test_alerts.py` | Manual alert creation, automatic HIGH-risk alert generation trigger, alert listing, alert status updates (`UNREAD` → `RESOLVED`) | 1 test |
| `backend/tests/test_reports.py` | Forensic report generation from analyzed call records | 1 test |

---

## 2. Local Development Server

Start the FastAPI application with auto-reload:

```bash
cd ai-voice-fraud-detector
source venv/bin/activate

# Run entry point script
python backend/run.py
```

- **Server URL**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **ReDoc UI**: `http://localhost:8000/redoc`

---

## 3. Environment Configuration (`.env`)

Copy `.env.example` to `.env` in the repository root or `backend/`:

```ini
# MongoDB Connection (Local or Atlas)
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=voice_fraud_db

# Security & JWT Configuration
JWT_SECRET=super-secret-key-change-this-in-production-min-32-chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Server Settings
HOST=0.0.0.0
PORT=8000
FRONTEND_URL=http://localhost:5173

# Audio Upload Settings
MAX_FILE_SIZE_MB=25
```

---

## 4. Production Deployment

### 4.1 Production WSGI/ASGI Setup
Deploy using `uvicorn` with multiple worker processes or `gunicorn`:

```bash
gunicorn -w 4 -k uvicorn.workers.UvicornWorker backend.app.main:app --bind 0.0.0.0:8000
```

### 4.2 Database (MongoDB Atlas)
Set `MONGODB_URI` to your Atlas Connection String:

```ini
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority
```

### 4.3 Containerization (Docker)
Example `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "backend/run.py"]
```
