"""
WeatherSense — Weather data routes.
Provides current weather, forecast, historical, and city comparison endpoints.
"""
import logging
from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException

from backend.services import open_meteo_service, imd_service
from backend.utils.location_utils import INDIA_STATES

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/weather", tags=["Weather"])


@router.get("/current")
async def get_current_weather(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude"),
    city: str = Query("", description="City name (optional, for labels)"),
    state: str = Query("", description="State name (optional)"),
):
    """Fetch current weather for given coordinates using Open-Meteo."""
    obs = await open_meteo_service.get_current_weather(lat, lon, city, state)
    if not obs:
        raise HTTPException(status_code=503, detail="Weather data unavailable.")
    return {"source": "open_meteo", "data": obs.dict()}


@router.get("/forecast")
async def get_forecast(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    city: str = Query(""),
    days: int = Query(7, ge=1, le=16),
):
    """Fetch daily weather forecast."""
    forecast = await open_meteo_service.get_forecast(lat, lon, city, days)
    if not forecast:
        raise HTTPException(status_code=503, detail="Forecast data unavailable.")
    return {"source": "open_meteo", "data": forecast.dict()}


@router.get("/historical")
async def get_historical(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    city: str = Query(""),
    start_date: str = Query("", description="YYYY-MM-DD"),
    end_date: str = Query("", description="YYYY-MM-DD"),
):
    """Fetch historical weather data (ERA5 reanalysis)."""
    data = await open_meteo_service.get_historical_weather(lat, lon, city, start_date, end_date)
    if not data:
        raise HTTPException(status_code=503, detail="Historical data unavailable.")
    return {"source": "open_meteo", "data": data}


@router.get("/cities")
async def get_all_cities():
    """Fetch current weather for all major Indian cities."""
    cities = await open_meteo_service.get_all_cities_weather()
    return {"cities": cities, "count": len(cities)}


@router.get("/imd/status")
async def get_imd_status():
    """Return IMD API connection status."""
    return imd_service.get_status()


@router.get("/imd/observations")
async def get_imd_observations(state: Optional[str] = Query(None)):
    """Fetch IMD weather observations. Returns empty if not configured."""
    status = imd_service.get_status()
    if not status["configured"]:
        return {
            "status": "NOT_CONFIGURED",
            "message": "IMD API not configured. Using Open-Meteo as primary data source.",
            "data": []
        }
    data = await imd_service.get_current_observations(state)
    return {"source": "imd", "data": data or [], "status": "ok"}


@router.get("/imd/warnings")
async def get_imd_warnings(state: Optional[str] = Query(None)):
    """Fetch active IMD weather warnings."""
    if not imd_service.is_configured():
        return {"status": "NOT_CONFIGURED", "data": []}
    data = await imd_service.get_warnings(state)
    return {"source": "imd", "data": data or []}


@router.get("/states")
async def get_india_states():
    """Return list of Indian states with centroids."""
    return {
        "states": [
            {"name": name, "lat": lat, "lon": lon}
            for name, (lat, lon) in INDIA_STATES.items()
        ]
    }
