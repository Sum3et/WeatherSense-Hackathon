"""
WeatherSense — FastAPI Application Entry Point
National Weather Big Data Analytics Platform (SIH 2026)
"""
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")),
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────
# App lifespan (startup / shutdown)
# ──────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run startup tasks before accepting requests."""
    logger.info("WeatherSense backend starting...")

    # Initialize Firebase
    from backend.services.firebase_service import init_firebase
    firebase_ok = init_firebase()
    logger.info(f"Firebase: {'CONNECTED' if firebase_ok else 'NOT CONFIGURED'}")

    # Pre-warm AI service
    from backend.services.ai_service import get_status as ai_status
    logger.info(f"AI Service: {ai_status()['status']}")

    logger.info("WeatherSense backend ready.")
    yield

    logger.info("WeatherSense backend shutting down.")


# ──────────────────────────────────────────────
# FastAPI app
# ──────────────────────────────────────────────

app = FastAPI(
    title="WeatherSense API",
    description=(
        "National Weather Big Data Analytics Platform for India. "
        "SIH 2026 — Ministry of Earth Sciences."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────
# Mount routers
# ──────────────────────────────────────────────

from backend.routes.weather   import router as weather_router
from backend.routes.reports   import router as reports_router
from backend.routes.admin     import router as admin_router
from backend.routes.analytics import router as analytics_router
from backend.routes.social    import router as social_router

app.include_router(weather_router,   prefix="/api/v1")
app.include_router(reports_router,   prefix="/api/v1")
app.include_router(admin_router,     prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")
app.include_router(social_router,    prefix="/api/v1")


# ──────────────────────────────────────────────
# Health & root endpoints
# ──────────────────────────────────────────────

# ──────────────────────────────────────────────
# Static files & SPA Frontend serving
# ──────────────────────────────────────────────
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

DIST_DIR = Path(__file__).resolve().parent.parent / "frontend" / "dist"

if DIST_DIR.exists() and (DIST_DIR / "index.html").exists():
    logger.info(f"Mounting frontend dist from {DIST_DIR}")
    assets_path = DIST_DIR / "assets"
    if assets_path.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_path)), name="assets")

    @app.get("/{full_path:path}", tags=["Frontend"])
    async def serve_spa(full_path: str):
        # Allow docs, api, and openapi to route to their handlers
        if full_path in ("docs", "redoc", "openapi.json") or full_path.startswith("api/"):
            return JSONResponse(status_code=404, content={"detail": "Not found"})
        
        target_file = DIST_DIR / full_path
        if full_path and target_file.is_file():
            return FileResponse(target_file)
        return FileResponse(DIST_DIR / "index.html")
else:
    @app.get("/", tags=["Health"])
    async def root():
        return {
            "service": "WeatherSense API",
            "version": "1.0.0",
            "status": "running",
            "docs": "/docs",
            "note": "Frontend running on http://localhost:5173"
        }


@app.get("/health", tags=["Health"])
async def health():
    from backend.services.firebase_service import is_connected
    from backend.services.imd_service import get_status as imd_status
    from backend.services.ai_service import get_status as ai_status_fn
    from backend.services.reddit_service import get_status as reddit_status
    from backend.services.meta_service import get_status as meta_status

    return {
        "status": "healthy",
        "services": {
            "firebase": "CONNECTED" if is_connected() else "NOT_CONFIGURED",
            "open_meteo": "CONNECTED",
            "imd": imd_status()["status"],
            "ai": ai_status_fn()["status"],
            "reddit": reddit_status()["status"],
            "meta": meta_status()["status"],
        }
    }


# ──────────────────────────────────────────────
# Global exception handler
# ──────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled error on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again."},
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level=os.getenv("LOG_LEVEL", "info").lower(),
    )
