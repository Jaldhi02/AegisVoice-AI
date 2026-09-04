# Integration API Contract — Single Source of Truth

**Project**: AI Voice Fraud Detection & Prevention System  
**Version**: 1.0.0  
**Status**: Fixed & Agreed  

This document serves as the exact integration agreement between:
- **Prathna (Frontend)**
- **Om (AI/ML Engine)**
- **Hitesh (Backend/API/Database)**
- **Aditya & Jaldhi (Integration & QA)**

---

## 1. Authentication Endpoints

### 1.1 `POST /api/auth/register`
- **Request Body** (`application/json`):
  ```json
  {
    "email": "user@example.com",
    "password": "strongpassword123",
    "full_name": "John Doe",
    "phone": "+1234567890"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "id": "65e01f2...",
    "email": "user@example.com",
    "full_name": "John Doe",
    "phone": "+1234567890",
    "created_at": "2026-09-03T18:00:00Z"
  }
  ```

### 1.2 `POST /api/auth/login`
- **Request Body** (`application/json`):
  ```json
  {
    "email": "user@example.com",
    "password": "strongpassword123"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user": {
      "id": "65e01f2...",
      "email": "user@example.com",
      "full_name": "John Doe",
      "phone": "+1234567890"
    }
  }
  ```

### 1.3 `GET /api/auth/me`
- **Headers**: `Authorization: Bearer <access_token>`
- **Response** (`200 OK`):
  ```json
  {
    "id": "65e01f2...",
    "email": "user@example.com",
    "full_name": "John Doe",
    "phone": "+1234567890",
    "created_at": "2026-09-03T18:00:00Z"
  }
  ```

---

## 2. Calls Management Endpoints

### 2.1 `POST /api/calls/upload`
- **Headers**: `Authorization: Bearer <access_token>`
- **Request**: `multipart/form-data`
  - `audio`: binary file (`.wav`, `.mp3`, `.m4a`, max 25MB)
  - `caller_number` (optional, string)
  - `receiver_number` (optional, string)
- **Response** (`201 Created`):
  ```json
  {
    "call_id": "65e01a8...",
    "filename": "sample_call_01.wav",
    "file_size": 1048576,
    "duration_seconds": 32.5,
    "status": "UPLOADED",
    "created_at": "2026-09-03T18:05:00Z"
  }
  ```

### 2.2 `GET /api/calls`
- **Headers**: `Authorization: Bearer <access_token>`
- **Query Params**: `skip=0`, `limit=20`
- **Response** (`200 OK`):
  ```json
  {
    "total": 1,
    "calls": [
      {
        "id": "65e01a8...",
        "filename": "sample_call_01.wav",
        "caller_number": "+1234567890",
        "risk_level": "HIGH",
        "risk_score": 92,
        "created_at": "2026-09-03T18:05:00Z"
      }
    ]
  }
  ```

### 2.3 `GET /api/calls/{id}`
- **Headers**: `Authorization: Bearer <access_token>`
- **Response** (`200 OK`):
  ```json
  {
    "id": "65e01a8...",
    "filename": "sample_call_01.wav",
    "caller_number": "+1234567890",
    "receiver_number": "+1987654321",
    "file_size": 1048576,
    "duration_seconds": 32.5,
    "status": "ANALYZED",
    "created_at": "2026-09-03T18:05:00Z",
    "analysis": {
      "voice_status": "AI_GENERATED",
      "voice_confidence": 0.94,
      "transcript": "Please send me the OTP...",
      "scam_detected": true,
      "scam_confidence": 0.91,
      "risk_score": 92,
      "risk_level": "HIGH",
      "reasons": [
        "AI-generated voice detected",
        "OTP request detected"
      ]
    }
  }
  ```

### 2.4 `DELETE /api/calls/{id}`
- **Headers**: `Authorization: Bearer <access_token>`
- **Response** (`200 OK`):
  ```json
  {
    "message": "Call record and associated files deleted successfully"
  }
  ```

---

## 3. Analysis Endpoints

### 3.1 `POST /api/analysis/voice`
- **Request**: `multipart/form-data` with `audio` file OR `{"call_id": "string"}`
- **Response** (`200 OK`):
  ```json
  {
    "voice_status": "AI_GENERATED",
    "voice_confidence": 0.94,
    "reasons": [
      "Synthetic acoustic artifacts detected in upper frequencies"
    ]
  }
  ```

### 3.2 `POST /api/analysis/scam`
- **Request Body** (`application/json`):
  ```json
  {
    "text": "Your bank account has been compromised. Please share your OTP immediately."
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "scam_detected": true,
    "scam_confidence": 0.91,
    "reasons": [
      "Urgency trigger detected",
      "OTP request detected"
    ]
  }
  ```

### 3.3 `POST /api/analysis/full` (Canonical Pipeline Endpoint)
- **Request**: `multipart/form-data`
  - `audio`: audio file
  - `call_id`: (optional)
- **Response** (`200 OK`):
  ```json
  {
    "call_id": "12345",
    "voice_status": "AI_GENERATED",
    "voice_confidence": 0.94,
    "transcript": "Please send me the OTP...",
    "scam_detected": true,
    "scam_confidence": 0.91,
    "risk_score": 92,
    "risk_level": "HIGH",
    "reasons": [
      "AI-generated voice detected",
      "OTP request detected"
    ]
  }
  ```

---

## 4. Alerts Endpoints

### 4.1 `GET /api/alerts`
- **Headers**: `Authorization: Bearer <access_token>`
- **Response** (`200 OK`):
  ```json
  {
    "total": 1,
    "alerts": [
      {
        "id": "65e022b...",
        "call_id": "65e01a8...",
        "risk_level": "HIGH",
        "risk_score": 92,
        "message": "High-risk fraudulent call detected with AI-generated voice",
        "status": "UNREAD",
        "created_at": "2026-09-03T18:05:01Z"
      }
    ]
  }
  ```

### 4.2 `POST /api/alerts`
- **Request Body** (`application/json`):
  ```json
  {
    "call_id": "65e01a8...",
    "risk_level": "HIGH",
    "risk_score": 92,
    "message": "Manual fraud report"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "id": "65e022b...",
    "call_id": "65e01a8...",
    "risk_level": "HIGH",
    "risk_score": 92,
    "message": "Manual fraud report",
    "status": "UNREAD",
    "created_at": "2026-09-03T18:05:01Z"
  }
  ```

### 4.3 `PATCH /api/alerts/{id}`
- **Request Body** (`application/json`):
  ```json
  {
    "status": "RESOLVED"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "id": "65e022b...",
    "status": "RESOLVED",
    "updated_at": "2026-09-03T18:10:00Z"
  }
  ```

---

## 5. Reports Endpoints

### 5.1 `GET /api/reports/{call_id}`
- **Headers**: `Authorization: Bearer <access_token>`
- **Response** (`200 OK`):
  ```json
  {
    "report_id": "rep_65e01a8...",
    "call_id": "65e01a8...",
    "generated_at": "2026-09-03T18:05:02Z",
    "summary": {
      "risk_level": "HIGH",
      "risk_score": 92,
      "voice_status": "AI_GENERATED",
      "voice_confidence": 0.94,
      "scam_detected": true,
      "scam_confidence": 0.91
    },
    "transcript": "Please send me the OTP...",
    "evidence_reasons": [
      "AI-generated voice detected",
      "OTP request detected"
    ],
    "recommendations": [
      "Block caller number immediately",
      "Do not share OTP or sensitive credentials",
      "File report to cybercrime authority"
    ]
  }
  ```
