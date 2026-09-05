"""
WeatherSense — Geolocation service.
Reverse geocoding from lat/lon to city and state using Nominatim (OpenStreetMap).
"""
import logging
import httpx
from typing import Optional, Dict, Any
from cachetools import TTLCache

logger = logging.getLogger(__name__)

_cache: TTLCache = TTLCache(maxsize=500, ttl=3600)  # 1 hour cache

NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse"
HEADERS = {
    "User-Agent": "WeatherSense/1.0 (National Weather Intelligence Platform India)"
}


async def reverse_geocode(lat: float, lon: float) -> Dict[str, Optional[str]]:
    """
    Reverse geocode lat/lon to city and state.
    Returns dict with 'city', 'state', 'country', 'display_name'.
    """
    cache_key = f"{lat:.4f}_{lon:.4f}"
    if cache_key in _cache:
        return _cache[cache_key]

    try:
        params = {
            "lat": lat,
            "lon": lon,
            "format": "json",
            "addressdetails": 1,
        }

        async with httpx.AsyncClient(timeout=10, headers=HEADERS) as client:
            resp = await client.get(NOMINATIM_URL, params=params)
            resp.raise_for_status()
            data = resp.json()

        addr = data.get("address", {})

        city = (
            addr.get("city") or
            addr.get("town") or
            addr.get("village") or
            addr.get("county") or
            addr.get("district") or
            ""
        )

        state = addr.get("state", "")
        country = addr.get("country", "")
        display_name = data.get("display_name", "")

        result = {
            "city": city,
            "state": state,
            "country": country,
            "display_name": display_name,
        }

        _cache[cache_key] = result
        return result

    except Exception as exc:
        logger.error(f"Reverse geocode failed for ({lat},{lon}): {exc}")
        return {"city": None, "state": None, "country": None, "display_name": None}


def find_nearest_city(lat: float, lon: float) -> Optional[Dict[str, Any]]:
    """Find the nearest major Indian city from the static list."""
    from backend.services.open_meteo_service import MAJOR_INDIAN_CITIES
    import math

    if not MAJOR_INDIAN_CITIES:
        return None

    def haversine(lat1, lon1, lat2, lon2) -> float:
        R = 6371
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
        return R * 2 * math.asin(math.sqrt(a))

    nearest = min(
        MAJOR_INDIAN_CITIES,
        key=lambda c: haversine(lat, lon, c["lat"], c["lon"])
    )
    return nearest
