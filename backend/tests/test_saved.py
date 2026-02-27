"""
Tests for saved resume endpoints: save, list, get, update, delete.
"""


def _register_and_get_header(client, username="testuser", email="test@test.com"):
    r = client.post("/api/auth/register", json={
        "username": username,
        "email": email,
        "password": "Pass@123",
    })
    return {"Authorization": f"Bearer {r.json()['token']}"}


SAMPLE_RESUME_DATA = {
    "personal_info": {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "555-0100",
        "location": "NYC",
        "linkedin": "",
        "github": "",
    },
    "work_experience": [],
    "skills": ["Python", "FastAPI"],
    "education": [],
    "projects": [],
    "certifications": [],
    "target_role": "Backend Developer",
}


def test_save_resume(client):
    headers = _register_and_get_header(client)
    r = client.post("/api/saved/save", json={
        "title": "My Resume",
        "resume_data": SAMPLE_RESUME_DATA,
        "ats_score": 85,
        "template": "modern",
    }, headers=headers)
    assert r.status_code == 200
    assert "id" in r.json()
    assert r.json()["title"] == "My Resume"


def test_list_resumes(client):
    headers = _register_and_get_header(client)
    # Save two
    client.post("/api/saved/save", json={
        "title": "Resume A", "resume_data": SAMPLE_RESUME_DATA,
    }, headers=headers)
    client.post("/api/saved/save", json={
        "title": "Resume B", "resume_data": SAMPLE_RESUME_DATA,
    }, headers=headers)

    r = client.get("/api/saved/list", headers=headers)
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_get_resume(client):
    headers = _register_and_get_header(client)
    save = client.post("/api/saved/save", json={
        "title": "Detail Test",
        "resume_data": SAMPLE_RESUME_DATA,
        "professional_summary": "A great developer.",
    }, headers=headers)
    rid = save.json()["id"]

    r = client.get(f"/api/saved/{rid}", headers=headers)
    assert r.status_code == 200
    assert r.json()["title"] == "Detail Test"
    assert r.json()["professional_summary"] == "A great developer."
    assert "resume_data" in r.json()


def test_update_resume(client):
    headers = _register_and_get_header(client)
    save = client.post("/api/saved/save", json={
        "title": "Old Title", "resume_data": SAMPLE_RESUME_DATA,
    }, headers=headers)
    rid = save.json()["id"]

    r = client.put(f"/api/saved/{rid}", json={
        "title": "Updated Title",
        "resume_data": SAMPLE_RESUME_DATA,
    }, headers=headers)
    assert r.status_code == 200
    assert r.json()["title"] == "Updated Title"


def test_delete_resume(client):
    headers = _register_and_get_header(client)
    save = client.post("/api/saved/save", json={
        "title": "To Delete", "resume_data": SAMPLE_RESUME_DATA,
    }, headers=headers)
    rid = save.json()["id"]

    r = client.delete(f"/api/saved/{rid}", headers=headers)
    assert r.status_code == 200

    # Should be gone
    r2 = client.get(f"/api/saved/{rid}", headers=headers)
    assert r2.status_code == 404


def test_cannot_access_other_users_resume(client):
    h1 = _register_and_get_header(client, "user1", "u1@test.com")
    h2 = _register_and_get_header(client, "user2", "u2@test.com")

    save = client.post("/api/saved/save", json={
        "title": "User1 Resume", "resume_data": SAMPLE_RESUME_DATA,
    }, headers=h1)
    rid = save.json()["id"]

    # User2 should not see User1's resume
    r = client.get(f"/api/saved/{rid}", headers=h2)
    assert r.status_code == 404


def test_list_empty(client):
    headers = _register_and_get_header(client)
    r = client.get("/api/saved/list", headers=headers)
    assert r.status_code == 200
    assert r.json() == []
