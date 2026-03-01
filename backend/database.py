
import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "ats_resume_builder")


_async_client: AsyncIOMotorClient | None = None
_async_db = None


_sync_client: MongoClient | None = None
_sync_db = None


def get_async_db():
    """Return the async Motor database instance."""
    global _async_client, _async_db
    if _async_client is None:
        _async_client = AsyncIOMotorClient(MONGO_URI)
        _async_db = _async_client[MONGO_DB_NAME]
    return _async_db


def get_sync_db():
    """Return the sync PyMongo database instance."""
    global _sync_client, _sync_db
    if _sync_client is None:
        _sync_client = MongoClient(MONGO_URI)
        _sync_db = _sync_client[MONGO_DB_NAME]
    return _sync_db


async def init_db():
    """Create indexes for users, saved_resumes, and resume_uploads collections."""
    db = get_async_db()
    # Users indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("username", unique=True)
    # Saved resumes indexes
    await db.saved_resumes.create_index("user_id")
    await db.saved_resumes.create_index([("user_id", 1), ("updated_at", -1)])
    # Resume uploads indexes
    await db.resume_uploads.create_index("user_id")
    await db.resume_uploads.create_index([("user_id", 1), ("uploaded_at", -1)])


async def close_db():
    """Close MongoDB connections on shutdown."""
    global _async_client, _sync_client
    if _async_client:
        _async_client.close()
        _async_client = None
    if _sync_client:
        _sync_client.close()
        _sync_client = None
