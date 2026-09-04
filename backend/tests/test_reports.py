import io
from fastapi.testclient import TestClient

def test_report_generation(client: TestClient, auth_headers):
    # 1. Run full analysis to generate an analyzed call
    fake_wav = io.BytesIO(b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00")
    files = {"audio": ("sample_report_call.wav", fake_wav, "audio/wav")}

    analysis_res = client.post("/api/analysis/full", files=files, headers=auth_headers)
    assert analysis_res.status_code == 200
    call_id = analysis_res.json()["call_id"]

    # 2. Query report
    report_res = client.get(f"/api/reports/{call_id}", headers=auth_headers)
    assert report_res.status_code == 200
    report_data = report_res.json()

    assert report_data["call_id"] == call_id
    assert "summary" in report_data
    assert "evidence_reasons" in report_data
    assert "recommendations" in report_data
    assert len(report_data["recommendations"]) > 0
