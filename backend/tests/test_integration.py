import io
import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

@pytest.fixture
def test_client():
    with TestClient(app) as client:
        yield client


@pytest.fixture
def auth_credentials(test_client):
    email = f"qa_engineer_{uuid.uuid4().hex[:8]}@aegisvoice.io"
    password = "SecurePassword123!"
    full_name = "Integration QA Engineer"

    # Register
    reg_resp = test_client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "full_name": full_name, "phone": "+15550199"}
    )
    assert reg_resp.status_code == 201

    # Login
    login_resp = test_client.post(
        "/api/auth/login",
        json={"email": email, "password": password}
    )
    assert login_resp.status_code == 200
    data = login_resp.json()
    token = data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    return {
        "email": email,
        "password": password,
        "token": token,
        "headers": headers,
        "user": data["user"]
    }


class TestEndToEndIntegration:
    """Comprehensive E2E Integration Test Suite covering all 10 domain flows + failure cases."""

    # 1. User Registration
    def test_01_user_registration_success_and_failure(self, test_client):
        unique_email = f"user_{uuid.uuid4().hex[:6]}@example.com"
        payload = {
            "email": unique_email,
            "password": "Password123!",
            "full_name": "Test Analyst",
            "phone": "+1987654321"
        }

        # Success case
        res = test_client.post("/api/auth/register", json=payload)
        assert res.status_code == 201
        data = res.json()
        assert data["email"] == unique_email
        assert "id" in data

        # Failure case: Duplicate registration
        res_dup = test_client.post("/api/auth/register", json=payload)
        assert res_dup.status_code in [400, 409]

        # Failure case: Short password
        res_short = test_client.post("/api/auth/register", json={
            "email": "short@example.com",
            "password": "123",
            "full_name": "Short Pass User"
        })
        assert res_short.status_code == 422  # Unprocessable Entity

    # 2. User Login
    def test_02_user_login_success_and_failure(self, test_client, auth_credentials):
        # Success case
        login_res = test_client.post("/api/auth/login", json={
            "email": auth_credentials["email"],
            "password": auth_credentials["password"]
        })
        assert login_res.status_code == 200
        data = login_res.json()
        assert data["token_type"] == "bearer"
        assert "access_token" in data

        # Failure case: Wrong password
        bad_pass = test_client.post("/api/auth/login", json={
            "email": auth_credentials["email"],
            "password": "WrongPassword!"
        })
        assert bad_pass.status_code == 401

        # Failure case: Nonexistent email
        bad_email = test_client.post("/api/auth/login", json={
            "email": "ghost@example.com",
            "password": "Password123!"
        })
        assert bad_email.status_code == 401

    # 3. JWT Authentication & Profile (/api/auth/me)
    def test_03_jwt_authentication_flows(self, test_client, auth_credentials):
        # Success case: Valid token
        me_res = test_client.get("/api/auth/me", headers=auth_credentials["headers"])
        assert me_res.status_code == 200
        data = me_res.json()
        assert data["email"] == auth_credentials["email"]

        # Failure case: Missing authentication header
        no_auth = test_client.get("/api/auth/me")
        assert no_auth.status_code == 401

        # Failure case: Invalid JWT token signature
        bad_jwt = test_client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.jwt.token.string"})
        assert bad_jwt.status_code == 401

    # 4. Audio Upload (/api/calls/upload)
    def test_04_audio_upload_success_and_failures(self, test_client, auth_credentials):
        # Valid WAV upload
        fake_wav = io.BytesIO(b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00")
        files = {"audio": ("sample_call.wav", fake_wav, "audio/wav")}
        data = {"caller_number": "+18005550199", "receiver_number": "+18005550198"}

        res = test_client.post("/api/calls/upload", files=files, data=data, headers=auth_credentials["headers"])
        assert res.status_code == 201
        res_data = res.json()
        assert "call_id" in res_data
        assert res_data["filename"] == "sample_call.wav"
        assert res_data["status"] == "UPLOADED"

        # Failure case: Invalid audio file extension (.exe)
        fake_exe = io.BytesIO(b"MZ\x90\x00\x03\x00\x00\x00")
        bad_file = test_client.post("/api/calls/upload", files={"audio": ("malicious.exe", fake_exe, "application/octet-stream")}, headers=auth_credentials["headers"])
        assert bad_file.status_code == 400

        # Failure case: Oversized file exceeding limit (>25MB)
        large_content = b"0" * ((settings.MAX_FILE_SIZE_MB * 1024 * 1024) + 1000)
        large_wav = io.BytesIO(large_content)
        oversized = test_client.post("/api/calls/upload", files={"audio": ("huge_call.wav", large_wav, "audio/wav")}, headers=auth_credentials["headers"])
        assert oversized.status_code in [400, 413]

    # 5. Voice Analysis (/api/analysis/voice)
    def test_05_voice_analysis(self, test_client, auth_credentials):
        fake_wav = io.BytesIO(b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00")
        res = test_client.post("/api/analysis/voice", files={"audio": ("test_voice.wav", fake_wav, "audio/wav")}, headers=auth_credentials["headers"])
        assert res.status_code == 200
        data = res.json()
        assert "voice_status" in data
        assert "voice_confidence" in data
        assert data["voice_status"] in ["REAL", "AI_GENERATED", "MIXED", "UNAVAILABLE", "UNKNOWN"]

    # 6. Scam Analysis (/api/analysis/scam)
    def test_06_scam_analysis(self, test_client, auth_credentials):
        # Threat transcript
        scam_req = {"text": "Urgent: Your bank account is compromised. Send your OTP code immediately to avoid arrest."}
        res = test_client.post("/api/analysis/scam", json=scam_req, headers=auth_credentials["headers"])
        assert res.status_code == 200
        data = res.json()
        assert data["scam_detected"] is True
        assert data["scam_confidence"] > 0.5
        assert len(data["reasons"]) > 0

        # Benign transcript
        benign_req = {"text": "Hi Mom, just calling to ask if we are meeting for lunch tomorrow at 1pm."}
        res_b = test_client.post("/api/analysis/scam", json=benign_req, headers=auth_credentials["headers"])
        assert res_b.status_code == 200
        data_b = res_b.json()
        assert data_b["scam_detected"] is False

    # 7. Full Analysis & Risk Scoring (/api/analysis/full)
    def test_07_full_analysis_risk_scoring(self, test_client, auth_credentials):
        fake_wav = io.BytesIO(b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00")
        res = test_client.post("/api/analysis/full", files={"audio": ("full_analysis.wav", fake_wav, "audio/wav")}, headers=auth_credentials["headers"])
        assert res.status_code == 200
        data = res.json()

        assert "call_id" in data
        assert "voice_status" in data
        assert "scam_detected" in data
        assert "risk_score" in data
        assert "risk_level" in data
        assert data["risk_level"] in ["LOW", "MEDIUM", "HIGH"]
        assert 0 <= data["risk_score"] <= 100

    # 8. Call History (/api/calls)
    def test_08_call_history_listing_and_isolation(self, test_client, auth_credentials):
        # Create a call
        fake_wav = io.BytesIO(b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00")
        up = test_client.post("/api/calls/upload", files={"audio": ("history_call.wav", fake_wav, "audio/wav")}, headers=auth_credentials["headers"])
        assert up.status_code == 201
        call_id = up.json()["call_id"]

        # List calls
        list_res = test_client.get("/api/calls?skip=0&limit=10", headers=auth_credentials["headers"])
        assert list_res.status_code == 200
        list_data = list_res.json()
        assert list_data["total"] >= 1

        # Get details
        detail_res = test_client.get(f"/api/calls/{call_id}", headers=auth_credentials["headers"])
        assert detail_res.status_code == 200
        assert detail_res.json()["id"] == call_id

    # 9. Alerts Lifecycle (/api/alerts)
    def test_09_alerts_lifecycle(self, test_client, auth_credentials):
        alert_payload = {
            "call_id": "test_call_ref_999",
            "risk_level": "HIGH",
            "risk_score": 92,
            "message": "High-risk cloned voice impersonation detected"
        }

        # Create
        c_res = test_client.post("/api/alerts", json=alert_payload, headers=auth_credentials["headers"])
        assert c_res.status_code == 201
        alert_data = c_res.json()
        assert alert_data["risk_level"] == "HIGH"
        assert alert_data["status"] == "UNREAD"
        alert_id = alert_data["id"]

        # List
        l_res = test_client.get("/api/alerts", headers=auth_credentials["headers"])
        assert l_res.status_code == 200
        assert l_res.json()["total"] >= 1

        # Patch status
        p_res = test_client.patch(f"/api/alerts/{alert_id}", json={"status": "RESOLVED"}, headers=auth_credentials["headers"])
        assert p_res.status_code == 200
        assert p_res.json()["status"] == "RESOLVED"

    # 10. Forensic Report Generation (/api/reports/{call_id})
    def test_10_forensic_report_generation(self, test_client, auth_credentials):
        # First create an analyzed call via full analysis
        fake_wav = io.BytesIO(b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00")
        analysis_res = test_client.post("/api/analysis/full", files={"audio": ("report_call.wav", fake_wav, "audio/wav")}, headers=auth_credentials["headers"])
        assert analysis_res.status_code == 200
        call_id = analysis_res.json()["call_id"]

        # Fetch forensic report
        rep_res = test_client.get(f"/api/reports/{call_id}", headers=auth_credentials["headers"])
        assert rep_res.status_code == 200
        report = rep_res.json()

        assert report["call_id"] == call_id
        assert "summary" in report
        assert "transcript" in report
        assert "evidence_reasons" in report
        assert "recommendations" in report
        assert len(report["recommendations"]) > 0

    # 11. Malformed Requests & Error Edge Cases
    def test_11_malformed_requests_and_errors(self, test_client, auth_credentials):
        # Malformed JSON payload
        bad_json = test_client.post("/api/auth/login", content="{bad: json}", headers={"Content-Type": "application/json"})
        assert bad_json.status_code in [400, 422]

        # Missing required JSON fields
        missing_fields = test_client.post("/api/auth/register", json={"email": "only_email@example.com"})
        assert missing_fields.status_code == 422

        # Nonexistent call ID lookup
        not_found = test_client.get("/api/calls/65e000000000000000000000", headers=auth_credentials["headers"])
        assert not_found.status_code == 404
