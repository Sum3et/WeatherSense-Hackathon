"""
WeatherSense — Multi-factor confidence scoring and verification service.

Combines AI confidence, location consistency, weather data cross-check,
duplicate detection, and cross-report agreement into a single 0–100 score.
"""
import logging
import math
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta, timezone

from backend.models.weather_report import ConfidenceBreakdown
from backend.services import open_meteo_service

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────
# Score interpretation
# ──────────────────────────────────────────────

def interpret_score(score: float) -> str:
    if score >= 80:
        return "High"
    elif score >= 60:
        return "Moderate"
    elif score >= 40:
        return "Low"
    else:
        return "Suspicious"


# ──────────────────────────────────────────────
# Source reliability baseline scores
# ──────────────────────────────────────────────

SOURCE_RELIABILITY = {
    "imd":        95.0,
    "open_meteo": 85.0,
    "citizen":    50.0,
    "reddit":     40.0,
    "meta":       35.0,
    "public_web": 45.0,
    "simulation": 30.0,
}


def get_source_reliability(source: str) -> float:
    return SOURCE_RELIABILITY.get(source, 40.0)


# ──────────────────────────────────────────────
# Location consistency
# ──────────────────────────────────────────────

def _is_in_india(lat: float, lon: float) -> bool:
    """Rough bounding box for India."""
    return 6.4 <= lat <= 37.6 and 68.1 <= lon <= 97.4


def score_location_consistency(lat: float, lon: float, city: Optional[str], state: Optional[str]) -> float:
    """
    Score based on whether reported location is consistent with India geography.
    """
    if not _is_in_india(lat, lon):
        return 0.0

    score = 60.0

    # If city/state provided and non-empty, modest bump
    if city and len(city) > 2:
        score += 20.0
    if state and len(state) > 2:
        score += 20.0

    return min(score, 100.0)


# ──────────────────────────────────────────────
# Weather data consistency
# ──────────────────────────────────────────────

# Which WMO codes support which event categories
WEATHER_CODE_SUPPORT = {
    "Heavy Rain":    [61, 63, 65, 80, 81, 82],
    "Thunderstorm":  [95, 96, 99],
    "Flood":         [61, 63, 65, 80, 81, 82],
    "Waterlogging":  [61, 63, 65, 80, 81, 82],
    "Fog":           [45, 48],
    "Hailstorm":     [96, 99],
    "Strong Wind":   [],    # wind speed check instead
    "Heatwave":      [],    # temperature check
    "Cold Wave":     [],    # temperature check
    "Cyclone":       [95, 96, 99],
    "Lightning":     [95, 96, 99],
    "Landslide":     [63, 65, 81, 82],
    "Dust Storm":    [],
    "Snowfall":      [71, 73, 75, 77, 85, 86],
}

HEATWAVE_TEMP_THRESHOLD = 40.0   # °C
COLD_WAVE_TEMP_THRESHOLD = 10.0  # °C
STRONG_WIND_THRESHOLD    = 40.0  # km/h


async def score_weather_consistency(
    lat: float, lon: float,
    event_category: str,
    report_timestamp: Optional[datetime] = None
) -> float:
    """
    Fetch Open-Meteo data near the report time/location and check consistency.
    Returns 0–100.
    """
    try:
        obs = await open_meteo_service.get_current_weather(lat, lon)
        if not obs:
            return 50.0  # Can't verify, neutral

        score = 50.0  # Start neutral

        supported_codes = WEATHER_CODE_SUPPORT.get(event_category, [])

        # Code match
        if obs.weather_code and supported_codes:
            if obs.weather_code in supported_codes:
                score += 40.0
            else:
                score -= 15.0

        # Category-specific checks
        if event_category == "Heatwave":
            if obs.temperature and obs.temperature >= HEATWAVE_TEMP_THRESHOLD:
                score += 40.0
            elif obs.temperature and obs.temperature < 30:
                score -= 20.0

        elif event_category == "Cold Wave":
            if obs.temperature and obs.temperature <= COLD_WAVE_TEMP_THRESHOLD:
                score += 40.0
            elif obs.temperature and obs.temperature > 20:
                score -= 20.0

        elif event_category == "Strong Wind":
            if obs.wind_speed and obs.wind_speed >= STRONG_WIND_THRESHOLD:
                score += 40.0

        elif event_category in ("Heavy Rain", "Flood", "Waterlogging"):
            if obs.precipitation and obs.precipitation > 0:
                score += 20.0
            if obs.precipitation and obs.precipitation > 5:
                score += 20.0

        elif event_category == "Fog":
            if obs.visibility and obs.visibility < 1.0:
                score += 40.0
            elif obs.cloud_cover and obs.cloud_cover > 80:
                score += 15.0

        return max(0.0, min(score, 100.0))

    except Exception as exc:
        logger.error(f"Weather consistency score failed: {exc}")
        return 50.0


# ──────────────────────────────────────────────
# Cross-report score (nearby reports)
# ──────────────────────────────────────────────

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.asin(math.sqrt(a))


def score_cross_report(
    lat: float, lon: float,
    event_category: str,
    existing_reports: List[Dict[str, Any]],
    radius_km: float = 25.0,
    time_window_hours: float = 6.0,
) -> float:
    """
    Check how many nearby verified/pending reports have the same category.
    More agreement → higher score.
    """
    if not existing_reports:
        return 50.0

    now = datetime.now(timezone.utc)
    nearby_same = 0
    nearby_total = 0

    for r in existing_reports:
        r_lat = r.get("latitude")
        r_lon = r.get("longitude")
        if r_lat is None or r_lon is None:
            continue

        dist = haversine_km(lat, lon, r_lat, r_lon)
        if dist > radius_km:
            continue

        # Time window check
        r_created = r.get("created_at")
        if r_created:
            try:
                if isinstance(r_created, str):
                    r_dt = datetime.fromisoformat(r_created.replace("Z", "+00:00"))
                else:
                    r_dt = r_created
                if abs((now - r_dt).total_seconds()) > time_window_hours * 3600:
                    continue
            except Exception:
                pass

        nearby_total += 1
        if r.get("event_category") == event_category:
            nearby_same += 1

    if nearby_total == 0:
        return 50.0

    agreement_ratio = nearby_same / nearby_total
    # Scale: 0 agreement → 30, full agreement → 95
    score = 30.0 + agreement_ratio * 65.0
    # Bonus for multiple agreeing reports
    if nearby_same >= 3:
        score = min(score + 10.0, 100.0)

    return score


# ──────────────────────────────────────────────
# Metadata score
# ──────────────────────────────────────────────

def score_metadata(report: Dict[str, Any]) -> float:
    """
    Score based on completeness and validity of report metadata.
    """
    score = 40.0

    # Description quality
    desc = report.get("description", "")
    if len(desc) >= 30:
        score += 15.0
    if len(desc) >= 100:
        score += 10.0

    # Has media
    if report.get("media_url"):
        score += 20.0

    # Location completeness
    if report.get("city"):
        score += 10.0
    if report.get("state"):
        score += 5.0

    return min(score, 100.0)


# ──────────────────────────────────────────────
# Main composite scorer
# ──────────────────────────────────────────────

async def calculate_confidence(
    report: Dict[str, Any],
    nearby_reports: Optional[List[Dict[str, Any]]] = None,
    ai_confidence: float = 0.0,
) -> ConfidenceBreakdown:
    """
    Calculate a 0–100 composite confidence score for a weather report.
    """
    lat = report.get("latitude", 0.0)
    lon = report.get("longitude", 0.0)
    source = report.get("source", "citizen")
    category = report.get("event_category", "Other")
    description = report.get("description", "")

    # Duplicate score (placeholder — full impl in duplicate_detection.py)
    duplicate_score = 80.0  # Assume not duplicate unless detected otherwise

    # Metadata score
    meta_score = score_metadata(report)

    # Location consistency
    location_score = score_location_consistency(
        lat, lon, report.get("city"), report.get("state")
    )

    # Weather consistency
    weather_score = await score_weather_consistency(lat, lon, category)

    # Cross-report score
    cross_score = score_cross_report(
        lat, lon, category, nearby_reports or [], radius_km=25.0
    )

    # Source reliability
    source_score = get_source_reliability(source)

    # Weighted combination
    weights = {
        "duplicate":    0.15,
        "metadata":     0.10,
        "location":     0.15,
        "weather":      0.25,
        "cross_report": 0.15,
        "source":       0.10,
        "ai":           0.10,
    }

    overall = (
        weights["duplicate"]    * duplicate_score +
        weights["metadata"]     * meta_score +
        weights["location"]     * location_score +
        weights["weather"]      * weather_score +
        weights["cross_report"] * cross_score +
        weights["source"]       * source_score +
        weights["ai"]           * ai_confidence
    )

    overall = max(0.0, min(overall, 100.0))

    return ConfidenceBreakdown(
        overall=round(overall, 1),
        duplicate_score=round(duplicate_score, 1),
        metadata_score=round(meta_score, 1),
        location_consistency_score=round(location_score, 1),
        weather_consistency_score=round(weather_score, 1),
        cross_report_score=round(cross_score, 1),
        source_reliability_score=round(source_score, 1),
        ai_category_confidence=round(ai_confidence, 1),
        interpretation=interpret_score(overall),
    )
