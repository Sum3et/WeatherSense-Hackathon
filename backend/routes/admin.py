"""
WeatherSense — Admin-only routes (requires Firebase Auth token).
All routes verify the caller's Firebase ID token before proceeding.
"""
import logging
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Depends, Header

from backend.models.weather_report import AdminReportUpdate, ReportStatus
from backend.services import firebase_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin"])


# ──────────────────────────────────────────────
# Auth dependency
# ──────────────────────────────────────────────

async def require_admin(authorization: Optional[str] = Header(None)):
    """Verify Firebase ID token from Authorization: Bearer <token> header and enforce custom admin claim."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header.")


    token = authorization.split(" ", 1)[1]
    claims = firebase_service.verify_id_token(token)

    if not claims:
        raise HTTPException(status_code=401, detail="Invalid or expired authentication token.")

    if not claims.get("admin"):
        raise HTTPException(status_code=403, detail="Forbidden: Administrator privileges required.")

    return claims



# ──────────────────────────────────────────────
# Report management
# ──────────────────────────────────────────────

@router.get("/reports")
async def admin_get_reports(
    status: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    event_category: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    claims: dict = Depends(require_admin),
):
    """Get all reports with optional filters. Admin only."""
    if not firebase_service.is_connected():
        raise HTTPException(status_code=503, detail="Database unavailable.")

    reports = await firebase_service.get_reports(
        status=status,
        limit=limit,
        source=source,
        event_category=event_category,
        state=state,
    )
    return {"reports": reports, "count": len(reports)}


@router.get("/reports/{report_id}")
async def admin_get_report(report_id: str, claims: dict = Depends(require_admin)):
    """Get full report details including admin fields."""
    report = await firebase_service.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    return report


@router.patch("/reports/{report_id}")
async def admin_update_report(
    report_id: str,
    update: AdminReportUpdate,
    claims: dict = Depends(require_admin),
):
    """Update report status, category, or add admin notes."""
    now = datetime.now(timezone.utc)
    admin_email = claims.get("email", claims.get("uid", "admin"))

    updates: dict = {
        "reviewed_at": now.isoformat(),
        "reviewed_by": admin_email,
    }

    if update.status is not None:
        updates["status"] = update.status.value
    if update.event_category is not None:
        updates["event_category"] = update.event_category.value
    if update.admin_notes is not None:
        updates["admin_notes"] = update.admin_notes
    if update.confidence_score is not None:
        updates["confidence_score"] = update.confidence_score

    success = await firebase_service.update_report(report_id, updates)
    if not success:
        raise HTTPException(status_code=404, detail="Report not found or update failed.")

    return {
        "success": True,
        "report_id": report_id,
        "reviewed_by": admin_email,
        "reviewed_at": now.isoformat(),
        "updates": updates,
    }


@router.post("/reports/{report_id}/verify")
async def verify_report(report_id: str, claims: dict = Depends(require_admin)):
    """Quick-action: mark a report as VERIFIED."""
    now = datetime.now(timezone.utc)
    admin_email = claims.get("email", claims.get("uid", "admin"))

    success = await firebase_service.update_report(report_id, {
        "status": ReportStatus.VERIFIED.value,
        "reviewed_at": now.isoformat(),
        "reviewed_by": admin_email,
    })
    if not success:
        raise HTTPException(status_code=404, detail="Report not found.")
    return {"success": True, "status": "VERIFIED"}


@router.post("/reports/{report_id}/spam")
async def mark_spam(
    report_id: str,
    claims: dict = Depends(require_admin),
):
    """Quick-action: mark a report as SPAM."""
    now = datetime.now(timezone.utc)
    admin_email = claims.get("email", claims.get("uid", "admin"))

    success = await firebase_service.update_report(report_id, {
        "status": ReportStatus.SPAM.value,
        "reviewed_at": now.isoformat(),
        "reviewed_by": admin_email,
    })
    if not success:
        raise HTTPException(status_code=404, detail="Report not found.")
    return {"success": True, "status": "SPAM"}


@router.post("/reports/{report_id}/flag")
async def flag_report(report_id: str, claims: dict = Depends(require_admin)):
    """Quick-action: flag a report for further review."""
    now = datetime.now(timezone.utc)
    admin_email = claims.get("email", claims.get("uid", "admin"))

    success = await firebase_service.update_report(report_id, {
        "status": ReportStatus.FLAGGED.value,
        "reviewed_at": now.isoformat(),
        "reviewed_by": admin_email,
    })
    if not success:
        raise HTTPException(status_code=404, detail="Report not found.")
    return {"success": True, "status": "FLAGGED"}


@router.delete("/reports/{report_id}")
async def delete_report(report_id: str, claims: dict = Depends(require_admin)):
    """Delete a report permanently. Admin only."""
    try:
        firebase_service.get_db().collection("weather_reports").document(report_id).delete()
        return {"success": True, "deleted": report_id}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ──────────────────────────────────────────────
# Dashboard summary
# ──────────────────────────────────────────────

@router.get("/dashboard/summary")
async def get_dashboard_summary(claims: dict = Depends(require_admin)):
    """Return KPI counts and system status for the admin dashboard."""
    if not firebase_service.is_connected():
        raise HTTPException(status_code=503, detail="Database unavailable.")

    counts = await firebase_service.get_reports_count_by_status()

    from backend.services import imd_service, ai_service, reddit_service, meta_service, public_web_service

    return {
        "report_counts": counts,
        "total": sum(counts.values()),
        "system_status": {
            "firebase": "CONNECTED" if firebase_service.is_connected() else "ERROR",
            "open_meteo": "CONNECTED",
            "imd": imd_service.get_status(),
            "ai": ai_service.get_status(),
            "reddit": reddit_service.get_status(),
            "meta": meta_service.get_status(),
            "public_web": public_web_service.get_status(),
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
