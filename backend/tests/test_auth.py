"""
Tests for auth endpoints: register, login, profile, change password.
"""


def test_register_success(client):
    r = client.post("/api/auth/register", json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "Test@123",
    })
    assert r.status_code == 200
    data = r.json()
    assert "token" in data
    assert data["user"]["username"] == "testuser"
    assert data["user"]["email"] == "test@example.com"
    assert data["user"]["is_admin"] is False


def test_register_duplicate_email(client):
    client.post("/api/auth/register", json={
        "username": "user1",
        "email": "dup@test.com",
        "password": "Pass@123",
    })
    r = client.post("/api/auth/register", json={
        "username": "user2",
        "email": "dup@test.com",
        "password": "Pass@456",
    })
    assert r.status_code == 400
    assert "Email already registered" in r.json()["detail"]


def test_register_duplicate_username(client):
    client.post("/api/auth/register", json={
        "username": "samename",
        "email": "a@test.com",
        "password": "Pass@123",
    })
    r = client.post("/api/auth/register", json={
        "username": "samename",
        "email": "b@test.com",
        "password": "Pass@456",
    })
    assert r.status_code == 400
    assert "Username already taken" in r.json()["detail"]


def test_login_success(client):
    r = client.post("/api/auth/login", json={
        "email": "admin@atsbuilder.com",
        "password": "Admin@123",
    })
    assert r.status_code == 200
    data = r.json()
    assert "token" in data
    assert data["user"]["is_admin"] is True


def test_login_wrong_password(client):
    r = client.post("/api/auth/login", json={
        "email": "admin@atsbuilder.com",
        "password": "wrongpassword",
    })
    assert r.status_code == 401


def test_login_nonexistent_user(client):
    r = client.post("/api/auth/login", json={
        "email": "nobody@test.com",
        "password": "whatever",
    })
    assert r.status_code == 401


def _auth_header(client, email="admin@atsbuilder.com", password="Admin@123"):
    r = client.post("/api/auth/login", json={"email": email, "password": password})
    token = r.json()["token"]
    return {"Authorization": f"Bearer {token}"}


def test_get_profile(client):
    headers = _auth_header(client)
    r = client.get("/api/auth/me", headers=headers)
    assert r.status_code == 200
    assert r.json()["email"] == "admin@atsbuilder.com"
    assert "resume_count" in r.json()


def test_get_profile_no_auth(client):
    r = client.get("/api/auth/me")
    assert r.status_code in (401, 403)


def test_update_profile(client):
    # Register a user first
    reg = client.post("/api/auth/register", json={
        "username": "editme",
        "email": "edit@test.com",
        "password": "Pass@123",
    })
    token = reg.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    r = client.put("/api/auth/profile", json={"username": "newname"}, headers=headers)
    assert r.status_code == 200
    assert r.json()["user"]["username"] == "newname"


def test_change_password(client):
    reg = client.post("/api/auth/register", json={
        "username": "pwduser",
        "email": "pwd@test.com",
        "password": "OldPass1",
    })
    token = reg.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    r = client.put("/api/auth/change-password", json={
        "current_password": "OldPass1",
        "new_password": "NewPass2",
    }, headers=headers)
    assert r.status_code == 200

    # Old password should fail
    r2 = client.post("/api/auth/login", json={
        "email": "pwd@test.com",
        "password": "OldPass1",
    })
    assert r2.status_code == 401

    # New password should work
    r3 = client.post("/api/auth/login", json={
        "email": "pwd@test.com",
        "password": "NewPass2",
    })
    assert r3.status_code == 200


def test_change_password_wrong_current(client):
    headers = _auth_header(client)
    r = client.put("/api/auth/change-password", json={
        "current_password": "wrongold",
        "new_password": "NewPass1",
    }, headers=headers)
    assert r.status_code == 400
