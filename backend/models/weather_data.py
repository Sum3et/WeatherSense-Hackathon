"""
WeatherSense — Pydantic models for weather observations and forecasts.
"""
from __future__ import annotations
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime


class WeatherObservation(BaseModel):
    source: str                         # "open_meteo" | "imd"
    city: Optional[str] = None
    state: Optional[str] = None
    latitude: float
    longitude: float

    temperature: Optional[float] = None        # °C
    feels_like: Optional[float] = None         # °C
    humidity: Optional[float] = None           # %
    wind_speed: Optional[float] = None         # km/h
    wind_direction: Optional[float] = None     # degrees
    precipitation: Optional[float] = None      # mm
    rainfall: Optional[float] = None           # mm/h
    weather_condition: Optional[str] = None
    weather_code: Optional[int] = None
    pressure: Optional[float] = None           # hPa
    cloud_cover: Optional[float] = None        # %
    uv_index: Optional[float] = None
    visibility: Optional[float] = None         # km

    timestamp: datetime = datetime.utcnow()


class ForecastEntry(BaseModel):
    timestamp: datetime
    temperature_max: Optional[float] = None
    temperature_min: Optional[float] = None
    precipitation_sum: Optional[float] = None
    weather_code: Optional[int] = None
    weather_condition: Optional[str] = None
    wind_speed_max: Optional[float] = None
    uv_index_max: Optional[float] = None


class WeatherForecast(BaseModel):
    city: str
    latitude: float
    longitude: float
    source: str = "open_meteo"
    daily: List[ForecastEntry] = []
    hourly: Optional[List[Dict[str, Any]]] = []
    fetched_at: datetime = datetime.utcnow()


class CityWeather(BaseModel):
    city: str
    state: str
    latitude: float
    longitude: float
    current: Optional[WeatherObservation] = None
    forecast: Optional[WeatherForecast] = None


class WeatherConditionMap:
    """Maps WMO weather interpretation codes to human-readable conditions."""
    CODES = {
        0: "Clear Sky",
        1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
        45: "Fog", 48: "Depositing Rime Fog",
        51: "Light Drizzle", 53: "Moderate Drizzle", 55: "Dense Drizzle",
        61: "Slight Rain", 63: "Moderate Rain", 65: "Heavy Rain",
        71: "Slight Snow", 73: "Moderate Snow", 75: "Heavy Snow",
        77: "Snow Grains",
        80: "Slight Showers", 81: "Moderate Showers", 82: "Violent Showers",
        85: "Slight Snow Showers", 86: "Heavy Snow Showers",
        95: "Thunderstorm", 96: "Thunderstorm with Hail",
        99: "Thunderstorm with Heavy Hail",
    }

    @classmethod
    def get(cls, code: int) -> str:
        return cls.CODES.get(code, f"Code {code}")
