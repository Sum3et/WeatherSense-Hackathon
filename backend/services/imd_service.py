"""
WeatherSense — IMD (India Meteorological Department) API connector.

If IMD credentials are not configured, all methods return None gracefully.
The application continues with Open-Meteo and citizen data.

To activate:
  Set IMD_API_BASE_URL, IMD_API_KEY in environment variables.
  Set IMD_IP_WHITELISTED=true if your server IP is whitelisted by IMD.
"""
import os
import logging
import httpx
from typing import Optional, Dict, Any, List
from cachetools import TTLCache

logger = logging.getLogger(__name__)

_cache: TTLCache = TTLCache(maxsize=100, ttl=900)  # 15 min cache

# Status flags
_configured = False
_last_error = ""


def _get_config() -> tuple[str, str, bool]:
    base_url = os.getenv("IMD_API_BASE_URL", "").rstrip("/")
    api_key  = os.getenv("IMD_API_KEY", "")
    whitelisted = os.getenv("IMD_IP_WHITELISTED", "false").lower() == "true"
    return base_url, api_key, whitelisted


def is_configured() -> bool:
    base_url, api_key, _ = _get_config()
    return bool(base_url and api_key)


def get_status() -> Dict[str, Any]:
    base_url, api_key, whitelisted = _get_config()
    if not base_url or not api_key:
        return {
            "status": "NOT_CONFIGURED",
            "message": "IMD API credentials not set in environment variables.",
            "configured": False,
        }
    return {
        "status": "CONFIGURED",
        "message": "IMD credentials are set. Connectivity depends on IP whitelist.",
        "configured": True,
        "ip_whitelisted": whitelisted,
        "last_error": _last_error,
    }


async def get_current_observations(state: Optional[str] = None) -> Optional[List[Dict[str, Any]]]:
    """
    Fetch current weather observations from IMD.
    Returns None if not configured or request fails.
    """
    global _last_error

    if not is_configured():
        return None

    base_url, api_key, _ = _get_config()
    cache_key = f"imd_obs_{state or 'all'}"

    if cache_key in _cache:
        return _cache[cache_key]

    try:
        headers = {"Authorization": f"Bearer {api_key}"}
        params = {}
        if state:
            params["state"] = state

        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get(f"{base_url}/observations/current", headers=headers, params=params)
            resp.raise_for_status()
            data = resp.json()

        _cache[cache_key] = data
        _last_error = ""
        return data

    except httpx.ConnectError:
        _last_error = "Connection refused — server may not be reachable from this IP."
        logger.warning(f"IMD connect error: {_last_error}")
        return None
    except httpx.HTTPStatusError as exc:
        _last_error = f"HTTP {exc.response.status_code}"
        logger.warning(f"IMD HTTP error: {_last_error}")
        return None
    except Exception as exc:
        _last_error = str(exc)
        logger.error(f"IMD unexpected error: {exc}")
        return None


async def get_district_forecast(district: str, state: str) -> Optional[Dict[str, Any]]:
    """Fetch district-level forecast from IMD."""
    global _last_error

    if not is_configured():
        return None

    base_url, api_key, _ = _get_config()
    cache_key = f"imd_forecast_{district}_{state}"

    if cache_key in _cache:
        return _cache[cache_key]

    try:
        headers = {"Authorization": f"Bearer {api_key}"}
        params = {"district": district, "state": state}

        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get(f"{base_url}/forecast/district", headers=headers, params=params)
            resp.raise_for_status()
            data = resp.json()

        _cache[cache_key] = data
        return data

    except Exception as exc:
        _last_error = str(exc)
        logger.warning(f"IMD district forecast error: {exc}")
        return None


async def get_warnings(state: Optional[str] = None) -> Optional[List[Dict[str, Any]]]:
    """Fetch active weather warnings/nowcasts from IMD."""
    global _last_error

    if not is_configured():
        return None

    base_url, api_key, _ = _get_config()
    cache_key = f"imd_warnings_{state or 'all'}"

    if cache_key in _cache:
        return _cache[cache_key]

    try:
        headers = {"Authorization": f"Bearer {api_key}"}
        params = {}
        if state:
            params["state"] = state

        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get(f"{base_url}/warnings", headers=headers, params=params)
            resp.raise_for_status()
            data = resp.json()

        _cache[cache_key] = data
        return data

    except Exception as exc:
        _last_error = str(exc)
        logger.warning(f"IMD warnings error: {exc}")
        return None
