from fastapi.testclient import TestClient

def test_alerts_lifecycle(client: TestClient, auth_headers):
    alert_payload = {
        "call_id": "test_call_123",
        "risk_level": "HIGH",
        "risk_score": 95,
        "message": "Critical voice spoof detected"
    }

    # 1. Create Alert
    create_res = client.post("/api/alerts", json=alert_payload, headers=auth_headers)
    assert create_res.status_code == 201
    alert_data = create_res.json()
    assert alert_data["risk_level"] == "HIGH"
    assert alert_data["status"] == "UNREAD"
    alert_id = alert_data["id"]

    # 2. List Alerts
    list_res = client.get("/api/alerts", headers=auth_headers)
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert list_data["total"] >= 1

    # 3. Update Alert
    patch_res = client.patch(f"/api/alerts/{alert_id}", json={"status": "RESOLVED"}, headers=auth_headers)
    assert patch_res.status_code == 200
    updated_data = patch_res.json()
    assert updated_data["status"] == "RESOLVED"
