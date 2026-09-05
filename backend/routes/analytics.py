"""
WeatherSense — Analytics routes.
Provides chart data, distribution stats, and trend data for the analytics dashboard.
"""
import logging
from collections import Counter
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Query, Depends, Header, HTTPException

from backend.services import firebase_service, open_meteo_service
from backend.routes.admin import require_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analytics", tags=["Analytics"])


async def _get_all_reports(limit: int = 500) -> List[Dict[str, Any]]:
    """Helper to get all reports for analytics (not filtered by status)."""
    if not firebase_service.is_connected():
        return []
    all_reports = []
    for status in ["PENDING", "VERIFIED", "FLAGGED", "SPAM", "REJECTED"]:
        reports = await firebase_service.get_reports(status=status, limit=limit // 5)
        all_reports.extend(reports)
    return all_reports


@router.get("/summary")
async def get_analytics_summary(claims: dict = Depends(require_admin)):
    """High-level analytics summary for the admin dashboard."""
    reports = await _get_all_reports()

    total = len(reports)
    status_dist = Counter(r.get("status", "UNKNOWN") for r in reports)
    category_dist = Counter(r.get("event_category", "Other") for r in reports)
    source_dist = Counter(r.get("source", "unknown") for r in reports)

    state_dist = Counter()
    for r in reports:
        st = r.get("state", "")
        if st:
            state_dist[st] += 1

    # Confidence distribution
    conf_buckets = {"0-39": 0, "40-59": 0, "60-79": 0, "80-100": 0}
    for r in reports:
        c = r.get("confidence_score", 0)
        if c < 40:
            conf_buckets["0-39"] += 1
        elif c < 60:
            conf_buckets["40-59"] += 1
        elif c < 80:
            conf_buckets["60-79"] += 1
        else:
            conf_buckets["80-100"] += 1

    return {
        "total_reports": total,
        "status_distribution": dict(status_dist),
        "category_distribution": dict(category_dist.most_common(14)),
        "source_distribution": dict(source_dist),
        "state_distribution": dict(state_dist.most_common(20)),
        "confidence_distribution": conf_buckets,
    }


@router.get("/reports-over-time")
async def get_reports_over_time(
    days: int = Query(7, ge=1, le=30),
    claims: dict = Depends(require_admin),
):
    """Reports submitted per day over the past N days."""
    reports = await _get_all_reports()
    now = datetime.now(timezone.utc)

    daily: Dict[str, int] = {}
    for i in range(days):
        day = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        daily[day] = 0

    for r in reports:
        created = r.get("created_at", "")
        if created:
            try:
                dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
                day_str = dt.strftime("%Y-%m-%d")
                if day_str in daily:
                    daily[day_str] += 1
            except Exception:
                pass

    sorted_daily = sorted(daily.items())
    return {
        "data": [{"date": d, "count": c} for d, c in sorted_daily]
    }


@router.get("/city-weather")
async def get_city_weather_comparison():
    """Current weather comparison for major Indian cities (open endpoint)."""
    cities = await open_meteo_service.get_all_cities_weather()
    return {
        "cities": [
            {
                "city": c["city"],
                "state": c.get("state", ""),
                "temperature": c.get("temperature"),
                "humidity": c.get("humidity"),
                "wind_speed": c.get("wind_speed"),
                "weather_condition": c.get("weather_condition"),
                "precipitation": c.get("precipitation"),
            }
            for c in cities
        ]
    }


@router.get("/top-locations")
async def get_top_locations(
    limit: int = Query(10, ge=1, le=50),
    claims: dict = Depends(require_admin),
):
    """Top affected locations by report count."""
    reports = await _get_all_reports()
    location_counts = Counter()

    for r in reports:
        city = r.get("city", "")
        state = r.get("state", "")
        if city:
            location_counts[f"{city}, {state}"] += 1
        elif state:
            location_counts[state] += 1

    return {
        "top_locations": [
            {"location": loc, "count": cnt}
            for loc, cnt in location_counts.most_common(limit)
        ]
    }


@router.get("/confidence-scores")
async def get_confidence_distribution(claims: dict = Depends(require_admin)):
    """Distribution of confidence scores across all reports."""
    reports = await _get_all_reports()

    scores = [r.get("confidence_score", 0) for r in reports]

    # Histogram in 10-point buckets
    buckets = {f"{i*10}-{i*10+9}": 0 for i in range(10)}
    buckets["90-100"] = 0

    for s in scores:
        bucket_idx = min(int(s // 10), 9)
        if bucket_idx == 9:
            buckets["90-100"] += 1
        else:
            bucket_key = f"{bucket_idx*10}-{bucket_idx*10+9}"
            buckets[bucket_key] = buckets.get(bucket_key, 0) + 1

    return {
        "histogram": [{"range": k, "count": v} for k, v in buckets.items()],
        "average": round(sum(scores) / len(scores), 1) if scores else 0,
        "total": len(scores),
    }
