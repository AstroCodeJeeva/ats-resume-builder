"""
Pytest configuration — provides a FastAPI TestClient fixture that talks to MongoDB test database.
"""

import os
import sys
import pytest

# Ensure the backend directory is on sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Override MongoDB database name BEFORE any app code is imported
os.environ["MONGO_DB_NAME"] = "ats_resume_builder_test"

from fastapi.testclient import TestClient  # noqa: E402
from database import get_sync_db  # noqa: E402
from main import app  # noqa: E402


@pytest.fixture(scope="session")
def client():
    """Yield a TestClient wired to the FastAPI app."""
    with TestClient(app) as c:
        yield c


@pytest.fixture(autouse=True)
def _clean_test_db():
    """Wipe the test database before each test so tests are isolated."""
    db = get_sync_db()
    for col in db.list_collection_names():
        db[col].delete_many({})
    # Re-seed default admin
    from services.auth_service import hash_password
    from datetime import datetime, timezone
    db.users.insert_one({
        "username": "admin",
        "email": "admin@atsbuilder.com",
        "hashed_password": hash_password("Admin@123"),
        "is_admin": True,
        "created_at": datetime.now(timezone.utc),
    })
    # Ensure indexes exist
    db.users.create_index("email", unique=True)
    db.users.create_index("username", unique=True)
    yield
