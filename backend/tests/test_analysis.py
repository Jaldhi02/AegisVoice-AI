import io
from fastapi.testclient import TestClient

def test_scam_analysis(client: TestClient, auth_headers):
    payload = {
        "text": "Dear customer, your bank account is blocked. Share your OTP immediately to restore service."
    }
    res = client.post("/api/analysis/scam", json=payload, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["scam_detected"] is True
    assert data["scam_confidence"] > 0.8
    assert len(data["reasons"]) > 0

def test_full_analysis_workflow(client: TestClient, auth_headers):
    fake_wav = io.BytesIO(b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00")
    files = {"audio": ("sample_test_analysis.wav", fake_wav, "audio/wav")}

    res = client.post("/api/analysis/full", files=files, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    
    # Verify exact keys expected from contract (pages 7, 8, 14, 15)
    assert "call_id" in data
    assert "voice_status" in data
    assert "voice_confidence" in data
    assert "transcript" in data
    assert "scam_detected" in data
    assert "scam_confidence" in data
    assert "risk_score" in data
    assert "risk_level" in data
    assert "reasons" in data

    assert data["voice_status"] in ["REAL", "AI_GENERATED", "MIXED", "UNAVAILABLE", "UNKNOWN"]
    assert data["risk_level"] in ["LOW", "MEDIUM", "HIGH"]
    assert isinstance(data["risk_score"], int)
    assert isinstance(data["reasons"], list)
