"""
Tests for the admin endpoints.
"""


def _admin_header(client):
    r = client.post("/api/auth/login", json={
        "email": "admin@atsbuilder.com",
        "password": "Admin@123",
    })
    return {"Authorization": f"Bearer {r.json()['token']}"}


def _register(client, username, email):
    return client.post("/api/auth/register", json={
        "username": username,
        "email": email,
        "password": "Pass@123",
    })


def test_admin_stats(client):
    headers = _admin_header(client)
    r = client.get("/api/admin/stats", headers=headers)
    assert r.status_code == 200
    data = r.json()
    assert "total_users" in data
    assert "total_resumes" in data


def test_admin_list_users(client):
    r1 = _register(client, "userone", "u1@test.com")
    assert r1.status_code == 200, f"Register u1 failed: {r1.json()}"
    r2 = _register(client, "usertwo", "u2@test.com")
    assert r2.status_code == 200, f"Register u2 failed: {r2.json()}"

    headers = _admin_header(client)
    r = client.get("/api/admin/users", headers=headers)
    assert r.status_code == 200
    emails = [u["email"] for u in r.json()]
    assert len(emails) >= 3, f"Expected >=3 users, got: {emails}"


def test_non_admin_cannot_access(client):
    reg = _register(client, "normie", "normie@test.com")
    headers = {"Authorization": f"Bearer {reg.json()['token']}"}
    r = client.get("/api/admin/stats", headers=headers)
    assert r.status_code == 403


def test_admin_delete_user(client):
    reg = _register(client, "todelete", "del@test.com")
    user_id = reg.json()["user"]["id"]

    headers = _admin_header(client)
    r = client.delete(f"/api/admin/users/{user_id}", headers=headers)
    assert r.status_code == 200

    # User should no longer be able to log in
    r2 = client.post("/api/auth/login", json={
        "email": "del@test.com",
        "password": "Pass@123",
    })
    assert r2.status_code == 401


def test_admin_toggle_admin(client):
    reg = _register(client, "promoteme", "promo@test.com")
    user_id = reg.json()["user"]["id"]

    headers = _admin_header(client)
    r = client.put(f"/api/admin/users/{user_id}", json={"is_admin": True}, headers=headers)
    assert r.status_code == 200

    # Now that user should be admin
    token = client.post("/api/auth/login", json={
        "email": "promo@test.com",
        "password": "Pass@123",
    }).json()["token"]
    r2 = client.get("/api/admin/stats", headers={"Authorization": f"Bearer {token}"})
    assert r2.status_code == 200
