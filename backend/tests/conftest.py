import pytest
import os
import sys
import uuid
from fastapi.testclient import TestClient

# Preserve production-strength bcrypt defaults while keeping the test suite fast.
os.environ["BCRYPT_ROUNDS"] = "4"
os.environ["ENVIRONMENT"] = "testing"

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app

@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def auth_headers(client):
    email = f"test-{uuid.uuid4().hex}@example.com"
    response = client.post(
        "/api/auth/register",
        json={"email": email, "password": "strongPassword123!", "full_name": "Test User"},
    )
    assert response.status_code == 201
    login = client.post("/api/auth/login", json={"email": email, "password": "strongPassword123!"})
    assert login.status_code == 200
    return {"Authorization": f"Bearer {login.json()['access_token']}"}
