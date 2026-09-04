# REST API Reference — AI Voice Fraud Detection Backend

**Base URL**: `http://localhost:8000`  
**API Prefix**: `/api`  
**Swagger UI**: `http://localhost:8000/docs`  
**OpenAPI Specification**: `http://localhost:8000/openapi.json`

---

## Authorization

All endpoints except `POST /api/auth/register`, `POST /api/auth/login`, and health checks require an HTTP Bearer authorization header:

```http
Authorization: Bearer <your_jwt_access_token>
```

---

## Table of Contents
1. [Authentication (`/api/auth`)](#1-authentication-apiauth)
2. [Calls Management (`/api/calls`)](#2-calls-management-apicalls)
3. [AI Analysis (`/api/analysis`)](#3-ai-analysis-apianalysis)
4. [Alerts (`/api/alerts`)](#4-alerts-apialerts)
5. [Reports (`/api/reports`)](#5-reports-apireports)

---

## 1. Authentication (`/api/auth`)

### 1.1 Register User
- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Auth Required**: No
- **Content-Type**: `application/json`

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!",
  "full_name": "John Doe",
  "phone": "+1234567890"
}
```

#### Response (`201 Created`)
```json
{
  "id": "65e01f2a9b3c4d5e6f7a8b9c",
  "email": "user@example.com",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "created_at": "2026-09-04T09:00:00Z"
}
```

#### Error Responses
- `400 Bad Request`: Email already registered.

---

### 1.2 User Login
- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Auth Required**: No
- **Content-Type**: `application/json`

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!"
}
```

#### Response (`200 OK`)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "65e01f2a9b3c4d5e6f7a8b9c",
    "email": "user@example.com",
    "full_name": "John Doe",
    "phone": "+1234567890"
  }
}
```

#### Error Responses
- `401 Unauthorized`: Invalid email or password.

---

### 1.3 Get Current User Profile
- **Method**: `GET`
- **Path**: `/api/auth/me`
- **Auth Required**: Yes (`Bearer <token>`)

#### Response (`200 OK`)
```json
{
  "id": "65e01f2a9b3c4d5e6f7a8b9c",
  "email": "user@example.com",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "created_at": "2026-09-04T09:00:00Z"
}
```

---

## 2. Calls Management (`/api/calls`)

### 2.1 Upload Audio Call
- **Method**: `POST`
- **Path**: `/api/calls/upload`
- **Auth Required**: Yes (`Bearer <token>`)
- **Content-Type**: `multipart/form-data`

#### Form Parameters
- `audio` (file, required): `.wav`, `.mp3`, `.m4a`, `.ogg`, or `.flac` file (Max size: 25MB).
- `caller_number` (string, optional): E.g. `+1234567890`.
- `receiver_number` (string, optional): E.g. `+1987654321`.

#### Response (`201 Created`)
```json
{
  "call_id": "65e01a8b9c3d4e5f6a7b8c9d",
  "filename": "suspicious_call.wav",
  "file_size": 1048576,
  "duration_seconds": 32.5,
  "status": "UPLOADED",
  "created_at": "2026-09-04T09:05:00Z"
}
```

---

### 2.2 List User Calls
- **Method**: `GET`
- **Path**: `/api/calls`
- **Auth Required**: Yes (`Bearer <token>`)
- **Query Parameters**:
  - `skip` (int, default: 0): Pagination offset.
  - `limit` (int, default: 20): Maximum records returned.

#### Response (`200 OK`)
```json
{
  "total": 1,
  "calls": [
    {
      "id": "65e01a8b9c3d4e5f6a7b8c9d",
      "filename": "suspicious_call.wav",
      "caller_number": "+1234567890",
      "risk_level": "HIGH",
      "risk_score": 92,
      "created_at": "2026-09-04T09:05:00Z"
    }
  ]
}
```

---

### 2.3 Get Call Details & Analysis
- **Method**: `GET`
- **Path**: `/api/calls/{call_id}`
- **Auth Required**: Yes (`Bearer <token>`)

#### Response (`200 OK`)
```json
{
  "id": "65e01a8b9c3d4e5f6a7b8c9d",
  "filename": "suspicious_call.wav",
  "caller_number": "+1234567890",
  "receiver_number": "+1987654321",
  "file_size": 1048576,
  "duration_seconds": 32.5,
  "status": "ANALYZED",
  "created_at": "2026-09-04T09:05:00Z",
  "analysis": {
    "voice_status": "AI_GENERATED",
    "voice_confidence": 0.94,
    "transcript": "Your account has been locked. Provide your OTP immediately.",
    "scam_detected": true,
    "scam_confidence": 0.91,
    "risk_score": 92,
    "risk_level": "HIGH",
    "reasons": [
      "Synthetic acoustic spectral artifacts detected",
      "High urgency trigger detected in conversation",
      "OTP or credential request detected"
    ]
  }
}
```

---

### 2.4 Delete Call Record
- **Method**: `DELETE`
- **Path**: `/api/calls/{call_id}`
- **Auth Required**: Yes (`Bearer <token>`)

#### Response (`200 OK`)
```json
{
  "message": "Call record and associated files deleted successfully"
}
```

---

## 3. AI Analysis (`/api/analysis`)

### 3.1 Voice Deepfake Detection Only
- **Method**: `POST`
- **Path**: `/api/analysis/voice`
- **Auth Required**: No
- **Content-Type**: `multipart/form-data`

#### Form Parameters
- `audio` (file, optional): Audio binary stream.
- `call_id` (string, optional): ID of previously uploaded call.

#### Response (`200 OK`)
```json
{
  "voice_status": "AI_GENERATED",
  "voice_confidence": 0.94,
  "reasons": [
    "Synthetic spectral artifacts detected in voice profile"
  ]
}
```

---

### 3.2 Scam NLP Text Analysis Only
- **Method**: `POST`
- **Path**: `/api/analysis/scam`
- **Auth Required**: No
- **Content-Type**: `application/json`

#### Request Body
```json
{
  "text": "This is security support. Send your password and OTP immediately to avoid account suspension."
}
```

#### Response (`200 OK`)
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

---

### 3.3 Full Pipeline Analysis (Canonical Endpoint)
- **Method**: `POST`
- **Path**: `/api/analysis/full`
- **Auth Required**: Optional (`Bearer <token>`)
- **Content-Type**: `multipart/form-data`

#### Form Parameters
- `audio` (file, required): Audio recording file.
- `call_id` (string, optional): Call identifier.

#### Response (`200 OK`)
```json
{
  "call_id": "65e01a8b9c3d4e5f6a7b8c9d",
  "voice_status": "AI_GENERATED",
  "voice_confidence": 0.94,
  "transcript": "Urgent message: please provide the 6-digit OTP code sent to your mobile phone.",
  "scam_detected": true,
  "scam_confidence": 0.91,
  "risk_score": 92,
  "risk_level": "HIGH",
  "reasons": [
    "AI-generated synthetic voice detected",
    "High urgency language detected",
    "Financial/OTP credential extraction attempt"
  ]
}
```

---

## 4. Alerts (`/api/alerts`)

### 4.1 List Alerts
- **Method**: `GET`
- **Path**: `/api/alerts`
- **Auth Required**: Yes (`Bearer <token>`)

#### Response (`200 OK`)
```json
{
  "total": 1,
  "alerts": [
    {
      "id": "65e022b1a2b3c4d5e6f7a8b9",
      "call_id": "65e01a8b9c3d4e5f6a7b8c9d",
      "risk_level": "HIGH",
      "risk_score": 92,
      "message": "High-risk fraudulent call detected with AI-generated voice",
      "status": "UNREAD",
      "created_at": "2026-09-04T09:05:01Z"
    }
  ]
}
```

---

### 4.2 Create Alert Manually
- **Method**: `POST`
- **Path**: `/api/alerts`
- **Auth Required**: Yes (`Bearer <token>`)

#### Request Body
```json
{
  "call_id": "65e01a8b9c3d4e5f6a7b8c9d",
  "risk_level": "HIGH",
  "risk_score": 92,
  "message": "Manual fraud alert raised by operator"
}
```

#### Response (`201 Created`)
```json
{
  "id": "65e022b1a2b3c4d5e6f7a8b9",
  "call_id": "65e01a8b9c3d4e5f6a7b8c9d",
  "risk_level": "HIGH",
  "risk_score": 92,
  "message": "Manual fraud alert raised by operator",
  "status": "UNREAD",
  "created_at": "2026-09-04T09:05:01Z"
}
```

---

### 4.3 Update Alert Status
- **Method**: `PATCH`
- **Path**: `/api/alerts/{alert_id}`
- **Auth Required**: Yes (`Bearer <token>`)

#### Request Body
```json
{
  "status": "RESOLVED"
}
```

#### Response (`200 OK`)
```json
{
  "id": "65e022b1a2b3c4d5e6f7a8b9",
  "status": "RESOLVED",
  "updated_at": "2026-09-04T09:10:00Z"
}
```

---

## 5. Reports (`/api/reports`)

### 5.1 Generate Forensic Report
- **Method**: `GET`
- **Path**: `/api/reports/{call_id}`
- **Auth Required**: Yes (`Bearer <token>`)

#### Response (`200 OK`)
```json
{
  "report_id": "rep_65e01a8b9c3d4e5f6a7b8c9d",
  "call_id": "65e01a8b9c3d4e5f6a7b8c9d",
  "generated_at": "2026-09-04T09:05:02Z",
  "summary": {
    "risk_level": "HIGH",
    "risk_score": 92,
    "voice_status": "AI_GENERATED",
    "voice_confidence": 0.94,
    "scam_detected": true,
    "scam_confidence": 0.91
  },
  "transcript": "Urgent message: please provide the 6-digit OTP code sent to your mobile phone.",
  "evidence_reasons": [
    "AI-generated synthetic voice detected",
    "High urgency language detected",
    "Financial/OTP credential extraction attempt"
  ],
  "recommendations": [
    "Immediately block caller phone number",
    "Do not share OTPs, PINs, or passwords",
    "Report phone number to cybercrime security portal"
  ]
}
```
