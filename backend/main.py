"""FastAPI app entry point."""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv
from pathlib import Path
import os

# Load env vars from .env file (resolve path relative to this file)
_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=_env_path)

from routers import resume_router, pdf_router  # noqa: E402
from routers import auth_router, saved_router  # noqa: E402
from routers import admin_router, upload_router  # noqa: E402
from routers import cover_letter_router  # noqa: E402
from routers import interview_router  # noqa: E402
from database import init_db, close_db  # noqa: E402
from rate_limiter import limiter  # noqa: E402


app = FastAPI(
    title="ATS Resume Builder API",
    description="AI-powered resume builder with ATS scoring, suggestions, and PDF export.",
    version="1.0.0",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


async def _seed_admin():
    """Create the default admin account if it doesn't exist."""
    from database import get_sync_db
    from services.auth_service import hash_password

    db = get_sync_db()
    admin_email = "admin@atsbuilder.com"
    if not db.users.find_one({"email": admin_email}):
        db.users.insert_one({
            "username": "admin",
            "email": admin_email,
            "hashed_password": hash_password("Admin@123"),
            "is_admin": True,
            "created_at": __import__("datetime").datetime.utcnow(),
        })
        print(" Default admin account created: admin@atsbuilder.com / Admin@123")
    else:
        # Ensure existing admin has is_admin flag
        db.users.update_one(
            {"email": admin_email},
            {"$set": {"is_admin": True}},
        )


@app.on_event("startup")
async def startup_db():
    await init_db()
    await _seed_admin()


@app.on_event("shutdown")
async def shutdown_db():
    await close_db()


_raw = os.getenv("CORS_ORIGINS", "http://localhost:5173")
origins = [o.strip().rstrip("/") for o in _raw.split(",") if o.strip()]
print(f" CORS origins: {origins}")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(resume_router.router, prefix="/api/resume", tags=["Resume"])
app.include_router(pdf_router.router, prefix="/api/pdf", tags=["PDF"])
app.include_router(auth_router.router, prefix="/api/auth", tags=["Auth"])
app.include_router(saved_router.router, prefix="/api/saved", tags=["Saved Resumes"])
app.include_router(admin_router.router, prefix="/api/admin", tags=["Admin"])
app.include_router(upload_router.router, prefix="/api/upload", tags=["Upload & Analyze"])
app.include_router(cover_letter_router.router, prefix="/api/cover-letter", tags=["Cover Letter"])
app.include_router(interview_router.router, prefix="/api/interview", tags=["Interview Prep"])


@app.get("/")
async def root():
    """Health-check / welcome endpoint."""
    return {"message": "ATS Resume Builder API is running.", "version": "1.0.0"}
