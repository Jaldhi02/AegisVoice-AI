import io
from fastapi.testclient import TestClient

def test_call_upload_and_retrieval(client: TestClient, auth_headers):
    # Create fake wav file
    fake_wav = io.BytesIO(b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00")
    files = {"audio": ("sample_test_call.wav", fake_wav, "audio/wav")}
    data = {"caller_number": "+1234567890", "receiver_number": "+1987654321"}

    # Upload
    upload_res = client.post("/api/calls/upload", files=files, data=data, headers=auth_headers)
    assert upload_res.status_code == 201
    call_info = upload_res.json()
    assert "call_id" in call_info
    call_id = call_info["call_id"]

    # Retrieve
    get_res = client.get(f"/api/calls/{call_id}", headers=auth_headers)
    assert get_res.status_code == 200
    details = get_res.json()
    assert details["id"] == call_id
    assert details["caller_number"] == "+1234567890"

    # List
    list_res = client.get("/api/calls", headers=auth_headers)
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert list_data["total"] >= 1

    # Delete
    del_res = client.delete(f"/api/calls/{call_id}", headers=auth_headers)
    assert del_res.status_code == 200

def test_invalid_file_extension(client: TestClient, auth_headers):
    fake_exe = io.BytesIO(b"MZ\x90\x00\x03\x00\x00\x00")
    files = {"audio": ("malicious.exe", fake_exe, "application/octet-stream")}
    res = client.post("/api/calls/upload", files=files, headers=auth_headers)
    assert res.status_code == 400


def test_user_cannot_read_another_users_call(client: TestClient, auth_headers):
    fake_wav = io.BytesIO(b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00")
    upload = client.post(
        "/api/calls/upload",
        files={"audio": ("private.wav", fake_wav, "audio/wav")},
        headers=auth_headers,
    )
    assert upload.status_code == 201
    other_register = client.post(
        "/api/auth/register",
        json={"email": "other-user@example.com", "password": "strongPassword123!", "full_name": "Other User"},
    )
    assert other_register.status_code == 201
    other_login = client.post(
        "/api/auth/login", json={"email": "other-user@example.com", "password": "strongPassword123!"}
    )
    other_headers = {"Authorization": f"Bearer {other_login.json()['access_token']}"}
    response = client.get(f"/api/calls/{upload.json()['call_id']}", headers=other_headers)
    assert response.status_code == 404
