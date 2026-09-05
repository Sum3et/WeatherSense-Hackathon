"""
WeatherSense — Citizen report submission and public report retrieval routes.
"""
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Form, File, UploadFile, Body
from fastapi.responses import JSONResponse

from backend.models.weather_report import CitizenReportCreate, ReportStatus
from backend.services import (
    firebase_service,
    ai_service,
    verification_service,
    geolocation_service,
)
from backend.utils.duplicate_detection import check_duplicate, check_text_spam_indicators

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reports", tags=["Reports"])


# ──────────────────────────────────────────────
# Submit citizen report (anonymous)
# ──────────────────────────────────────────────

@router.post("/submit")
async def submit_report(report_data: CitizenReportCreate):
    """
    Submit a citizen weather report.
    No authentication required — all submissions go to PENDING status.
    """
    if not firebase_service.is_connected():
        logger.warning("Firebase Firestore is running in local fallback mode. Saving submission locally.")

    report_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    # Auto-fill location name if not provided
    city = report_data.city
    state = report_data.state
    if not city or not state:
        geo = await geolocation_service.reverse_geocode(report_data.latitude, report_data.longitude)
        city = city or geo.get("city") or ""
        state = state or geo.get("state") or ""

    # Fetch nearby reports for cross-check
    try:
        nearby_raw = await firebase_service.get_reports(limit=50)
    except Exception:
        nearby_raw = []

    # Duplicate detection
    duplicate_score, similar_ids = check_duplicate(
        report_data.description, nearby_raw
    )

    # Spam indicator check
    is_suspicious, spam_indicators = check_text_spam_indicators(report_data.description)

    # AI classification
    ai_result = await ai_service.classify_report(
        report_data.description,
        category_hint=report_data.event_category.value if report_data.event_category else None,
    )

    # Build base report dict
    report_dict = {
        "id": report_id,
        "source": "citizen",
        "source_id": None,
        "event_category": report_data.event_category.value,
        "description": report_data.description,
        "latitude": report_data.latitude,
        "longitude": report_data.longitude,
        "location_name": report_data.location_name or f"{city}, {state}".strip(", "),
        "city": city,
        "state": state,
        "timestamp": (report_data.timestamp or now).isoformat(),
        "media_url": None,
        "media_type": None,
        "status": ReportStatus.PENDING.value,

        # AI fields
        "ai_category": ai_result.predicted_category,
        "ai_category_confidence": ai_result.category_confidence,
        "ai_keywords": ai_result.keywords,
        "ai_reasoning": ai_result.reasoning_summary,

        # Scoring
        "duplicate_score": duplicate_score,
        "metadata_score": 0.0,
        "location_consistency_score": 0.0,
        "weather_consistency_score": 0.0,
        "cross_report_score": 0.0,
        "source_reliability_score": 50.0,
        "confidence_score": 0.0,

        # Flags
        "spam_indicators": spam_indicators,
        "similar_report_ids": similar_ids,

        # Admin
        "created_at": now.isoformat(),
        "reviewed_at": None,
        "reviewed_by": None,
        "admin_notes": None,
    }

    # Full confidence calculation (async weather check)
    confidence = await verification_service.calculate_confidence(
        report_dict, nearby_raw, ai_result.category_confidence
    )

    report_dict.update({
        "confidence_score": confidence.overall,
        "metadata_score": confidence.metadata_score,
        "location_consistency_score": confidence.location_consistency_score,
        "weather_consistency_score": confidence.weather_consistency_score,
        "cross_report_score": confidence.cross_report_score,
        "source_reliability_score": confidence.source_reliability_score,
        "confidence_interpretation": confidence.interpretation,
    })

    # Save to Firestore
    saved_id = await firebase_service.save_report(report_dict)

    return JSONResponse(
        status_code=201,
        content={
            "success": True,
            "report_id": saved_id,
            "message": "Report submitted successfully. It will be reviewed by WeatherSense before appearing as verified information.",
            "status": "PENDING",
        }
    )


# ──────────────────────────────────────────────
# Get upload URL for media
# ──────────────────────────────────────────────

@router.post("/upload-url")
async def get_upload_url(
    report_id: str = Body(..., embed=True),
    filename: str = Body(..., embed=True),
    content_type: str = Body("image/jpeg", embed=True),
):
    """
    Generate a signed URL for direct media upload to Firebase Storage.
    Call this BEFORE submitting the report to get a media upload URL.
    """
    allowed_types = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime"]
    if content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Content type {content_type} not allowed.")

    blob_path = f"reports/{report_id}/{filename}"
    signed_url = firebase_service.get_upload_signed_url(blob_path, content_type)

    if not signed_url:
        raise HTTPException(status_code=503, detail="Storage service unavailable.")

    public_url = firebase_service.get_public_url(blob_path)
    media_type = "image" if content_type.startswith("image") else "video"

    return {
        "upload_url": signed_url,
        "public_url": public_url,
        "blob_path": blob_path,
        "media_type": media_type,
    }


# ──────────────────────────────────────────────
# Secure Backend Media Upload (Admin SDK)
# ──────────────────────────────────────────────

MAX_MEDIA_BYTES = 15 * 1024 * 1024  # 15 MB strict limit
ALLOWED_MEDIA_TYPES = {
    "image/jpeg": "image",
    "image/png":  "image",
    "image/webp": "image",
    "video/mp4":  "video",
    "video/quicktime": "video",
}

@router.post("/{report_id}/media-upload")
async def upload_report_media(
    report_id: str,
    file: UploadFile = File(...),
):
    """
    Media uploads are disabled on the Firebase Spark (free) plan.
    Returns graceful notification without breaking client workflow.
    """
    return {
        "success": False,
        "media_url": None,
        "message": "Media upload is currently disabled on the free tier.",
    }



# ──────────────────────────────────────────────
# Update media URL after upload
# ──────────────────────────────────────────────

@router.patch("/{report_id}/media")
async def update_report_media(
    report_id: str,
    media_url: str = Body(..., embed=True),
    media_type: str = Body("image", embed=True),
):
    """Update a report with its media URL after successful upload."""
    success = await firebase_service.update_report(
        report_id, {"media_url": media_url, "media_type": media_type}
    )
    if not success:
        raise HTTPException(status_code=404, detail="Report not found.")
    return {"success": True}



# ──────────────────────────────────────────────
# Public Stats (Aggregated without exposing raw unverified data)
# ──────────────────────────────────────────────

@router.get("/stats")
async def get_public_stats():
    """Return aggregated report counts for the public homepage safely."""
    if not firebase_service.is_connected():
        return {"total": 0, "verified": 0, "pending": 0, "flagged": 0}
    try:
        counts = await firebase_service.get_reports_count_by_status()
        return {
            "total": sum(counts.values()),
            "verified": counts.get("VERIFIED", 0),
            "pending": counts.get("PENDING", 0),
            "flagged": counts.get("FLAGGED", 0),
        }
    except Exception:
        return {"total": 0, "verified": 0, "pending": 0, "flagged": 0}


# ──────────────────────────────────────────────
# Get public verified reports
# ──────────────────────────────────────────────

@router.get("/public")

async def get_public_reports(
    limit: int = Query(20, ge=1, le=100),
    event_category: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
):
    """
    Return only VERIFIED reports for public display.
    Pending, flagged, spam reports are NOT shown.
    """
    reports = await firebase_service.get_reports(
        status="VERIFIED",
        limit=limit,
        event_category=event_category,
        state=state,
    )
    return {"reports": reports, "count": len(reports)}


@router.get("/{report_id}")
async def get_report(report_id: str):
    """Get a single report by ID (public — only verified)."""
    report = await firebase_service.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    if report.get("status") != "VERIFIED":
        raise HTTPException(status_code=403, detail="Report not publicly available.")
    return report
