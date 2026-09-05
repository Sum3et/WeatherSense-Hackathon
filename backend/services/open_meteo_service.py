"""
WeatherSense — Open-Meteo API service.
Provides current weather, 7-day forecast, and historical data for Indian cities.
Responses are cached in-memory to reduce unnecessary API calls.
"""
import asyncio
import logging
import httpx
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
from cachetools import TTLCache

from backend.models.weather_data import (
    WeatherObservation, WeatherForecast, ForecastEntry,
    CityWeather, WeatherConditionMap
)

logger = logging.getLogger(__name__)

# Cache: max 200 entries, TTL = 10 minutes
_cache: TTLCache = TTLCache(maxsize=200, ttl=600)

BASE_URL = "https://api.open-meteo.com/v1"

# Current weather variables to fetch
CURRENT_VARS = [
    "temperature_2m", "apparent_temperature", "relative_humidity_2m",
    "wind_speed_10m", "wind_direction_10m", "precipitation",
    "rain", "weather_code", "surface_pressure", "cloud_cover",
    "uv_index", "visibility",
]

# Daily forecast variables
DAILY_VARS = [
    "temperature_2m_max", "temperature_2m_min",
    "precipitation_sum", "weather_code",
    "wind_speed_10m_max", "uv_index_max",
]

# 75 National Weather Stations across all 28 States & 8 Union Territories
MAJOR_INDIAN_CITIES: List[Dict[str, Any]] = [
    # --- NORTH ---
    {"city": "Delhi", "state": "Delhi", "region": "North", "lat": 28.6139, "lon": 77.2090},
    {"city": "Srinagar", "state": "Jammu & Kashmir", "region": "North", "lat": 34.0837, "lon": 74.7973},
    {"city": "Jammu", "state": "Jammu & Kashmir", "region": "North", "lat": 32.7266, "lon": 74.8570},
    {"city": "Leh", "state": "Ladakh", "region": "North", "lat": 34.1526, "lon": 77.5771},
    {"city": "Kargil", "state": "Ladakh", "region": "North", "lat": 34.5539, "lon": 76.1349},
    {"city": "Shimla", "state": "Himachal Pradesh", "region": "North", "lat": 31.1048, "lon": 77.1734},
    {"city": "Dharamshala", "state": "Himachal Pradesh", "region": "North", "lat": 32.2190, "lon": 76.3234},
    {"city": "Dehradun", "state": "Uttarakhand", "region": "North", "lat": 30.3165, "lon": 78.0322},
    {"city": "Nainital", "state": "Uttarakhand", "region": "North", "lat": 29.3919, "lon": 79.4542},
    {"city": "Chandigarh", "state": "Chandigarh", "region": "North", "lat": 30.7333, "lon": 76.7794},
    {"city": "Amritsar", "state": "Punjab", "region": "North", "lat": 31.6340, "lon": 74.8723},
    {"city": "Ludhiana", "state": "Punjab", "region": "North", "lat": 30.9010, "lon": 75.8573},
    {"city": "Jaipur", "state": "Rajasthan", "region": "North", "lat": 26.9124, "lon": 75.7873},
    {"city": "Jodhpur", "state": "Rajasthan", "region": "North", "lat": 26.2389, "lon": 73.0243},
    {"city": "Udaipur", "state": "Rajasthan", "region": "North", "lat": 24.5854, "lon": 73.7125},
    {"city": "Lucknow", "state": "Uttar Pradesh", "region": "North", "lat": 26.8467, "lon": 80.9462},
    {"city": "Varanasi", "state": "Uttar Pradesh", "region": "North", "lat": 25.3176, "lon": 82.9739},
    {"city": "Agra", "state": "Uttar Pradesh", "region": "North", "lat": 27.1767, "lon": 78.0081},
    {"city": "Prayagraj", "state": "Uttar Pradesh", "region": "North", "lat": 25.4358, "lon": 81.8463},

    # --- WEST & CENTRAL ---
    {"city": "Mumbai", "state": "Maharashtra", "region": "West", "lat": 19.0760, "lon": 72.8777},
    {"city": "Pune", "state": "Maharashtra", "region": "West", "lat": 18.5204, "lon": 73.8567},
    {"city": "Nagpur", "state": "Maharashtra", "region": "Central", "lat": 21.1458, "lon": 79.0882},
    {"city": "Nashik", "state": "Maharashtra", "region": "West", "lat": 19.9975, "lon": 73.7898},
    {"city": "Chhatrapati Sambhajinagar", "state": "Maharashtra", "region": "West", "lat": 19.8762, "lon": 75.3433},
    {"city": "Ahmedabad", "state": "Gujarat", "region": "West", "lat": 23.0225, "lon": 72.5714},
    {"city": "Surat", "state": "Gujarat", "region": "West", "lat": 21.1702, "lon": 72.8311},
    {"city": "Vadodara", "state": "Gujarat", "region": "West", "lat": 22.3072, "lon": 73.1812},
    {"city": "Rajkot", "state": "Gujarat", "region": "West", "lat": 22.3039, "lon": 70.8022},
    {"city": "Bhopal", "state": "Madhya Pradesh", "region": "Central", "lat": 23.2599, "lon": 77.4126},
    {"city": "Indore", "state": "Madhya Pradesh", "region": "Central", "lat": 22.7196, "lon": 75.8577},
    {"city": "Gwalior", "state": "Madhya Pradesh", "region": "Central", "lat": 26.2183, "lon": 78.1828},
    {"city": "Jabalpur", "state": "Madhya Pradesh", "region": "Central", "lat": 23.1815, "lon": 79.9864},
    {"city": "Raipur", "state": "Chhattisgarh", "region": "Central", "lat": 21.2514, "lon": 81.6296},
    {"city": "Bilaspur", "state": "Chhattisgarh", "region": "Central", "lat": 22.0797, "lon": 82.1409},
    {"city": "Panaji", "state": "Goa", "region": "West", "lat": 15.4909, "lon": 73.8278},

    # --- SOUTH ---
    {"city": "Bengaluru", "state": "Karnataka", "region": "South", "lat": 12.9716, "lon": 77.5946},
    {"city": "Mysuru", "state": "Karnataka", "region": "South", "lat": 12.2958, "lon": 76.6394},
    {"city": "Mangaluru", "state": "Karnataka", "region": "South", "lat": 12.9141, "lon": 74.8560},
    {"city": "Chennai", "state": "Tamil Nadu", "region": "South", "lat": 13.0827, "lon": 80.2707},
    {"city": "Coimbatore", "state": "Tamil Nadu", "region": "South", "lat": 11.0168, "lon": 76.9558},
    {"city": "Madurai", "state": "Tamil Nadu", "region": "South", "lat": 9.9252, "lon": 78.1198},
    {"city": "Tiruchirappalli", "state": "Tamil Nadu", "region": "South", "lat": 10.7905, "lon": 78.7047},
    {"city": "Hyderabad", "state": "Telangana", "region": "South", "lat": 17.3850, "lon": 78.4867},
    {"city": "Warangal", "state": "Telangana", "region": "South", "lat": 17.9689, "lon": 79.5941},
    {"city": "Visakhapatnam", "state": "Andhra Pradesh", "region": "South", "lat": 17.6868, "lon": 83.2185},
    {"city": "Vijayawada", "state": "Andhra Pradesh", "region": "South", "lat": 16.5062, "lon": 80.6480},
    {"city": "Tirupati", "state": "Andhra Pradesh", "region": "South", "lat": 13.6288, "lon": 79.4192},
    {"city": "Kochi", "state": "Kerala", "region": "South", "lat": 9.9312, "lon": 76.2673},
    {"city": "Thiruvananthapuram", "state": "Kerala", "region": "South", "lat": 8.5241, "lon": 76.9366},
    {"city": "Kozhikode", "state": "Kerala", "region": "South", "lat": 11.2588, "lon": 75.7804},

    # --- EAST ---
    {"city": "Kolkata", "state": "West Bengal", "region": "East", "lat": 22.5726, "lon": 88.3639},
    {"city": "Siliguri", "state": "West Bengal", "region": "East", "lat": 26.7271, "lon": 88.3953},
    {"city": "Asansol", "state": "West Bengal", "region": "East", "lat": 23.6739, "lon": 86.9524},
    {"city": "Patna", "state": "Bihar", "region": "East", "lat": 25.5941, "lon": 85.1376},
    {"city": "Gaya", "state": "Bihar", "region": "East", "lat": 24.7914, "lon": 85.0002},
    {"city": "Muzaffarpur", "state": "Bihar", "region": "East", "lat": 26.1209, "lon": 85.3647},
    {"city": "Bhubaneswar", "state": "Odisha", "region": "East", "lat": 20.2961, "lon": 85.8245},
    {"city": "Cuttack", "state": "Odisha", "region": "East", "lat": 20.4625, "lon": 85.8830},
    {"city": "Rourkela", "state": "Odisha", "region": "East", "lat": 22.2604, "lon": 84.8536},
    {"city": "Ranchi", "state": "Jharkhand", "region": "East", "lat": 23.3441, "lon": 85.3096},
    {"city": "Jamshedpur", "state": "Jharkhand", "region": "East", "lat": 22.8046, "lon": 86.2029},

    # --- NORTHEAST ---
    {"city": "Guwahati", "state": "Assam", "region": "Northeast", "lat": 26.1445, "lon": 91.7362},
    {"city": "Dibrugarh", "state": "Assam", "region": "Northeast", "lat": 27.4728, "lon": 94.9120},
    {"city": "Silchar", "state": "Assam", "region": "Northeast", "lat": 24.8170, "lon": 92.7926},
    {"city": "Shillong", "state": "Meghalaya", "region": "Northeast", "lat": 25.5788, "lon": 91.8933},
    {"city": "Cherrapunji", "state": "Meghalaya", "region": "Northeast", "lat": 25.2986, "lon": 91.5822},
    {"city": "Imphal", "state": "Manipur", "region": "Northeast", "lat": 24.8170, "lon": 93.9368},
    {"city": "Aizawl", "state": "Mizoram", "region": "Northeast", "lat": 23.7271, "lon": 92.7176},
    {"city": "Agartala", "state": "Tripura", "region": "Northeast", "lat": 23.8315, "lon": 91.2868},
    {"city": "Kohima", "state": "Nagaland", "region": "Northeast", "lat": 25.6751, "lon": 94.1086},
    {"city": "Itanagar", "state": "Arunachal Pradesh", "region": "Northeast", "lat": 27.0844, "lon": 93.6053},
    {"city": "Gangtok", "state": "Sikkim", "region": "Northeast", "lat": 27.3389, "lon": 88.6065},

    # --- ISLANDS & UTs ---
    {"city": "Port Blair", "state": "Andaman & Nicobar Islands", "region": "Islands", "lat": 11.6234, "lon": 92.7265},
    {"city": "Kavaratti", "state": "Lakshadweep", "region": "Islands", "lat": 10.5667, "lon": 72.6417},
    {"city": "Puducherry", "state": "Puducherry", "region": "South", "lat": 11.9416, "lon": 79.8083},
]


async def get_current_weather(lat: float, lon: float, city: str = "", state: str = "") -> Optional[WeatherObservation]:
    """Fetch current weather for given coordinates."""
    cache_key = f"current_{lat:.3f}_{lon:.3f}"
    if cache_key in _cache:
        return _cache[cache_key]

    params = {
        "latitude": lat,
        "longitude": lon,
        "current": ",".join(CURRENT_VARS),
        "timezone": "Asia/Kolkata",
    }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(f"{BASE_URL}/forecast", params=params)
            resp.raise_for_status()
            data = resp.json()

        cur = data.get("current", {})

        obs = WeatherObservation(
            source="open_meteo",
            city=city,
            state=state,
            latitude=lat,
            longitude=lon,
            temperature=cur.get("temperature_2m"),
            feels_like=cur.get("apparent_temperature"),
            humidity=cur.get("relative_humidity_2m"),
            wind_speed=cur.get("wind_speed_10m"),
            wind_direction=cur.get("wind_direction_10m"),
            precipitation=cur.get("precipitation"),
            rainfall=cur.get("rain"),
            weather_code=cur.get("weather_code"),
            weather_condition=WeatherConditionMap.get(cur.get("weather_code", 0)),
            pressure=cur.get("surface_pressure"),
            cloud_cover=cur.get("cloud_cover"),
            uv_index=cur.get("uv_index"),
            visibility=cur.get("visibility"),
            timestamp=datetime.now(timezone.utc),
        )

        _cache[cache_key] = obs
        return obs

    except Exception as exc:
        logger.error(f"Open-Meteo current weather fetch failed for ({lat},{lon}): {exc}")
        return None


async def get_forecast(lat: float, lon: float, city: str = "", days: int = 7) -> Optional[WeatherForecast]:
    """Fetch daily forecast for given coordinates."""
    cache_key = f"forecast_{lat:.3f}_{lon:.3f}_{days}"
    if cache_key in _cache:
        return _cache[cache_key]

    params = {
        "latitude": lat,
        "longitude": lon,
        "daily": ",".join(DAILY_VARS),
        "hourly": "temperature_2m,apparent_temperature,precipitation,precipitation_probability,relative_humidity_2m,wind_speed_10m,surface_pressure,uv_index",
        "timezone": "Asia/Kolkata",
        "forecast_days": days,
    }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(f"{BASE_URL}/forecast", params=params)
            resp.raise_for_status()
            data = resp.json()

        daily = data.get("daily", {})
        times = daily.get("time", [])

        entries = []
        for i, t in enumerate(times):
            code = daily.get("weather_code", [None] * len(times))[i]
            entries.append(ForecastEntry(
                timestamp=datetime.fromisoformat(t),
                temperature_max=daily.get("temperature_2m_max", [None] * len(times))[i],
                temperature_min=daily.get("temperature_2m_min", [None] * len(times))[i],
                precipitation_sum=daily.get("precipitation_sum", [None] * len(times))[i],
                weather_code=code,
                weather_condition=WeatherConditionMap.get(code or 0) if code is not None else None,
                wind_speed_max=daily.get("wind_speed_10m_max", [None] * len(times))[i],
                uv_index_max=daily.get("uv_index_max", [None] * len(times))[i],
            ))

        # Parse next 48 hours for high-precision live graphs
        hourly_raw = data.get("hourly", {})
        hourly_times = hourly_raw.get("time", [])[:48]
        hourly_entries = []
        for j, ht in enumerate(hourly_times):
            hourly_entries.append({
                "time": ht,
                "temperature": hourly_raw.get("temperature_2m", [None] * len(hourly_times))[j],
                "feels_like": hourly_raw.get("apparent_temperature", [None] * len(hourly_times))[j],
                "precipitation": hourly_raw.get("precipitation", [None] * len(hourly_times))[j],
                "precipitation_probability": hourly_raw.get("precipitation_probability", [None] * len(hourly_times))[j],
                "humidity": hourly_raw.get("relative_humidity_2m", [None] * len(hourly_times))[j],
                "wind_speed": hourly_raw.get("wind_speed_10m", [None] * len(hourly_times))[j],
                "pressure": hourly_raw.get("surface_pressure", [None] * len(hourly_times))[j],
                "uv_index": hourly_raw.get("uv_index", [None] * len(hourly_times))[j],
            })

        forecast = WeatherForecast(
            city=city,
            latitude=lat,
            longitude=lon,
            daily=entries,
            hourly=hourly_entries,
        )

        _cache[cache_key] = forecast
        return forecast

    except Exception as exc:
        logger.error(f"Open-Meteo forecast fetch failed for ({lat},{lon}): {exc}")
        return None


async def get_historical_weather(
    lat: float, lon: float, city: str = "",
    start_date: str = "", end_date: str = ""
) -> Optional[Dict[str, Any]]:
    """Fetch historical weather (ERA5 reanalysis)."""
    if not start_date:
        start_date = (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d")
    if not end_date:
        end_date = (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d")

    cache_key = f"hist_{lat:.3f}_{lon:.3f}_{start_date}_{end_date}"
    if cache_key in _cache:
        return _cache[cache_key]

    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_date,
        "end_date": end_date,
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum",
        "timezone": "Asia/Kolkata",
    }

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get("https://archive-api.open-meteo.com/v1/archive", params=params)
            resp.raise_for_status()
            data = resp.json()

        _cache[cache_key] = data
        return data

    except Exception as exc:
        logger.error(f"Open-Meteo historical fetch failed: {exc}")
        return None


async def get_all_cities_weather() -> List[Dict[str, Any]]:
    """Fetch current weather for all 75 Indian cities using concurrent batched requests."""
    cache_key = "all_cities"
    if cache_key in _cache:
        return _cache[cache_key]

    chunk_size = 40
    chunks = [MAJOR_INDIAN_CITIES[i:i + chunk_size] for i in range(0, len(MAJOR_INDIAN_CITIES), chunk_size)]

    async def fetch_chunk(client: httpx.AsyncClient, chunk: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        params = {
            "latitude": ",".join(str(c["lat"]) for c in chunk),
            "longitude": ",".join(str(c["lon"]) for c in chunk),
            "current": ",".join(CURRENT_VARS),
            "timezone": "Asia/Kolkata",
        }
        resp = await client.get(f"{BASE_URL}/forecast", params=params)
        resp.raise_for_status()
        raw_items = resp.json()
        if not isinstance(raw_items, list):
            raw_items = [raw_items]

        chunk_results = []
        for city_info, item in zip(chunk, raw_items):
            cur = item.get("current", {})
            w_code = cur.get("weather_code")
            chunk_results.append({
                "city": city_info["city"],
                "state": city_info["state"],
                "region": city_info.get("region", "Other"),
                "latitude": city_info["lat"],
                "longitude": city_info["lon"],
                "temperature": cur.get("temperature_2m"),
                "feels_like": cur.get("apparent_temperature"),
                "humidity": cur.get("relative_humidity_2m"),
                "wind_speed": cur.get("wind_speed_10m"),
                "wind_direction": cur.get("wind_direction_10m"),
                "precipitation": cur.get("precipitation"),
                "rainfall": cur.get("rain"),
                "weather_code": w_code,
                "weather_condition": WeatherConditionMap.get(w_code) if w_code is not None else "Clear Sky",
                "pressure": cur.get("surface_pressure"),
                "cloud_cover": cur.get("cloud_cover"),
                "uv_index": cur.get("uv_index"),
                "visibility": cur.get("visibility"),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
        return chunk_results

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            tasks = [fetch_chunk(client, chunk) for chunk in chunks]
            gathered = await asyncio.gather(*tasks, return_exceptions=True)
            results = []
            for g in gathered:
                if isinstance(g, list):
                    results.extend(g)
                else:
                    logger.error(f"Error fetching city weather chunk: {g}")

            if results:
                _cache[cache_key] = results
                return results
    except Exception as exc:
        logger.error(f"Batch fetch failed: {exc}")

    # Fallback to single fetches if batch fails
    results = []
    for city_info in MAJOR_INDIAN_CITIES:
        obs = await get_current_weather(
            city_info["lat"], city_info["lon"],
            city_info["city"], city_info["state"]
        )
        if obs:
            results.append({
                "city": city_info["city"],
                "state": city_info["state"],
                "region": city_info.get("region", "Other"),
                "latitude": city_info["lat"],
                "longitude": city_info["lon"],
                **obs.dict(exclude={"source", "city", "state", "latitude", "longitude"}),
            })

    _cache[cache_key] = results
    return results


def clear_cache() -> None:
    _cache.clear()
