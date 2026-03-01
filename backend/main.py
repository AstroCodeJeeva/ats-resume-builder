"""FastAPI app entry point."""

from contextlib import asynccontextmanager
from datetime import datetime, timezone

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


def _seed_admin():
    """Create the default admin account if it doesn't exist."""
    from database import get_sync_db
    from services.auth_service import hash_password

    db = get_sync_db()
    admin_email = os.getenv("ADMIN_EMAIL", "admin@atsbuilder.com")
    admin_password = os.getenv("ADMIN_PASSWORD", "")

    if not admin_password:
        if os.getenv("FASTAPI_ENV", "development") == "production":
            raise RuntimeError(
                "ADMIN_PASSWORD must be set explicitly in production. "
                "Refusing to create admin with a default password."
            )
        admin_password = "Admin@123"  # Dev-only fallback

    if not db.users.find_one({"email": admin_email}):
        db.users.insert_one({
            "username": "admin",
            "email": admin_email,
            "hashed_password": hash_password(admin_password),
            "is_admin": True,
            "created_at": datetime.now(timezone.utc),
        })
        print(f" Default admin account created: {admin_email}")
    else:
        # Ensure existing admin has is_admin flag
        db.users.update_one(
            {"email": admin_email},
            {"$set": {"is_admin": True}},
        )


@asynccontextmanager
async def lifespan(app):
    """Startup / shutdown lifecycle manager."""
    await init_db()
    _seed_admin()
    yield
    await close_db()


app = FastAPI(
    title="ATS Resume Builder API",
    description="AI-powered resume builder with ATS scoring, suggestions, and PDF export.",
    version="1.0.0",
    lifespan=lifespan,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


_raw = os.getenv("CORS_ORIGINS", "http://localhost:5173")
origins = [o.strip().rstrip("/") for o in _raw.split(",") if o.strip()]
print(f" CORS origins: {origins}")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    """Attach standard security headers to every response."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if os.getenv("FASTAPI_ENV") == "production":
        response.headers["Strict-Transport-Security"] = (
            "max-age=63072000; includeSubDomains; preload"
        )
    return response


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
