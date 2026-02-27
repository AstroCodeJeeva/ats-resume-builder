"""
Tests for PDF generation and preview endpoints.
"""

SAMPLE_PDF_PAYLOAD = {
    "resume": {
        "personal_info": {
            "name": "Jane Smith",
            "email": "jane@test.com",
            "phone": "555-0200",
            "location": "San Francisco",
            "linkedin": "linkedin.com/in/jane",
            "github": "github.com/jane",
        },
        "work_experience": [
            {
                "company": "Acme Corp",
                "role": "Software Engineer",
                "duration": "2020 – 2023",
                "bullets": ["Built REST APIs", "Led a team of 5"],
            }
        ],
        "skills": ["Python", "React", "Docker"],
        "education": [
            {"degree": "B.Sc. Computer Science", "institution": "MIT", "year": "2020"}
        ],
        "projects": [
            {
                "title": "TaskApp",
                "description": "A task manager with real-time sync.",
                "technologies": ["React", "Node.js"],
            }
        ],
        "certifications": [],
        "target_role": "Full Stack Developer",
    },
    "professional_summary": "Experienced full stack developer with 3+ years of expertise.",
    "template": "classic",
}


def test_generate_pdf(client):
    r = client.post("/api/pdf/generate", json=SAMPLE_PDF_PAYLOAD)
    assert r.status_code == 200
    assert r.headers["content-type"] == "application/pdf"
    assert len(r.content) > 500  # Should be a real PDF


def test_preview_html(client):
    r = client.post("/api/pdf/preview", json=SAMPLE_PDF_PAYLOAD)
    assert r.status_code == 200
    assert "Jane Smith" in r.text
    assert "jane@test.com" in r.text


def test_ats_check(client):
    r = client.post("/api/pdf/ats-check", json=SAMPLE_PDF_PAYLOAD)
    assert r.status_code == 200
    data = r.json()
    assert "score" in data
    assert "checks" in data
    assert isinstance(data["checks"], list)
    assert data["score"] >= 0


def test_all_templates(client):
    """Ensure each template renders without error."""
    for tpl in ("classic", "modern", "fresher", "technical"):
        payload = {**SAMPLE_PDF_PAYLOAD, "template": tpl}
        r = client.post("/api/pdf/preview", json=payload)
        assert r.status_code == 200, f"Template '{tpl}' failed with {r.status_code}"
        assert "Jane Smith" in r.text, f"Template '{tpl}' missing name"


def test_pdf_filename(client):
    r = client.post("/api/pdf/generate", json=SAMPLE_PDF_PAYLOAD)
    assert "Jane_Smith_Resume.pdf" in r.headers.get("content-disposition", "")
