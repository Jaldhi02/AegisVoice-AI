from fastapi.testclient import TestClient

def test_root_and_health(client: TestClient):
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"

def test_register_and_login_flow(client: TestClient):
    test_user = {
        "email": "hitesh_test@example.com",
        "password": "strongPassword123!",
        "full_name": "Hitesh Lead",
        "phone": "+919876543210"
    }

    # 1. Register
    reg_res = client.post("/api/auth/register", json=test_user)
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert reg_data["email"] == test_user["email"]
    assert "id" in reg_data

    # 2. Login
    login_payload = {
        "email": test_user["email"],
        "password": test_user["password"]
    }
    login_res = client.post("/api/auth/login", json=login_payload)
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert "access_token" in login_data
    assert login_data["token_type"] == "bearer"

    token = login_data["access_token"]

    # 3. Get /api/auth/me
    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["email"] == test_user["email"]

def test_invalid_login(client: TestClient):
    bad_login = {
        "email": "nonexistent@example.com",
        "password": "wrongpassword"
    }
    res = client.post("/api/auth/login", json=bad_login)
    assert res.status_code == 401


def test_private_endpoints_require_a_bearer_token(client: TestClient):
    assert client.get("/api/calls").status_code == 401
    assert client.get("/api/alerts").status_code == 401
    assert client.post("/api/analysis/scam", json={"text": "hello"}).status_code == 401
