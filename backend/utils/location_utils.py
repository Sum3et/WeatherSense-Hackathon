"""
WeatherSense — Location utilities.
India geography helpers, state/city lookup, bounding box queries.
"""
import math
from typing import Optional, Tuple, List, Dict, Any

# India bounding box
INDIA_BBOX = {
    "min_lat": 6.4,
    "max_lat": 37.6,
    "min_lon": 68.1,
    "max_lon": 97.4,
}

# India states with approximate centroids
INDIA_STATES = {
    "Andhra Pradesh":     (15.9129, 79.7400),
    "Arunachal Pradesh":  (28.2180, 94.7278),
    "Assam":              (26.2006, 92.9376),
    "Bihar":              (25.0961, 85.3131),
    "Chhattisgarh":       (21.2787, 81.8661),
    "Goa":                (15.2993, 74.1240),
    "Gujarat":            (22.2587, 71.1924),
    "Haryana":            (29.0588, 76.0856),
    "Himachal Pradesh":   (31.1048, 77.1734),
    "Jharkhand":          (23.6102, 85.2799),
    "Karnataka":          (15.3173, 75.7139),
    "Kerala":             (10.8505, 76.2711),
    "Madhya Pradesh":     (22.9734, 78.6569),
    "Maharashtra":        (19.7515, 75.7139),
    "Manipur":            (24.6637, 93.9063),
    "Meghalaya":          (25.4670, 91.3662),
    "Mizoram":            (23.1645, 92.9376),
    "Nagaland":           (26.1584, 94.5624),
    "Odisha":             (20.9517, 85.0985),
    "Punjab":             (31.1471, 75.3412),
    "Rajasthan":          (27.0238, 74.2179),
    "Sikkim":             (27.5330, 88.5122),
    "Tamil Nadu":         (11.1271, 78.6569),
    "Telangana":          (18.1124, 79.0193),
    "Tripura":            (23.9408, 91.9882),
    "Uttar Pradesh":      (26.8467, 80.9462),
    "Uttarakhand":        (30.0668, 79.0193),
    "West Bengal":        (22.9868, 87.8550),
    "Delhi":              (28.7041, 77.1025),
    "Jammu & Kashmir":    (33.7782, 76.5762),
    "Ladakh":             (34.1526, 77.5771),
}


def is_in_india(lat: float, lon: float) -> bool:
    b = INDIA_BBOX
    return b["min_lat"] <= lat <= b["max_lat"] and b["min_lon"] <= lon <= b["max_lon"]


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


def bbox_for_radius(lat: float, lon: float, radius_km: float) -> Dict[str, float]:
    """Return a lat/lon bounding box for a given radius."""
    lat_delta = radius_km / 111.0
    lon_delta = radius_km / (111.0 * math.cos(math.radians(lat)))
    return {
        "min_lat": lat - lat_delta,
        "max_lat": lat + lat_delta,
        "min_lon": lon - lon_delta,
        "max_lon": lon + lon_delta,
    }


def get_state_centroid(state_name: str) -> Optional[Tuple[float, float]]:
    return INDIA_STATES.get(state_name)


def find_state_from_coords(lat: float, lon: float) -> Optional[str]:
    """Find the nearest state centroid to given coordinates."""
    nearest_state = None
    min_dist = float("inf")
    for state, (s_lat, s_lon) in INDIA_STATES.items():
        dist = haversine_km(lat, lon, s_lat, s_lon)
        if dist < min_dist:
            min_dist = dist
            nearest_state = state
    return nearest_state if min_dist < 300 else None


def filter_reports_by_radius(
    reports: List[Dict[str, Any]],
    center_lat: float,
    center_lon: float,
    radius_km: float,
) -> List[Dict[str, Any]]:
    """Filter a list of reports to those within radius_km of center point."""
    result = []
    for r in reports:
        r_lat = r.get("latitude")
        r_lon = r.get("longitude")
        if r_lat is not None and r_lon is not None:
            if haversine_km(center_lat, center_lon, r_lat, r_lon) <= radius_km:
                result.append(r)
    return result
