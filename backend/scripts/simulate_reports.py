"""
WeatherSense — Simulation Script for SIH Demo
=============================================
Generates realistic weather reports across India for live demonstration.

Usage:
    python -m backend.scripts.simulate_reports
    python -m backend.scripts.simulate_reports --count 50
    python -m backend.scripts.simulate_reports --count 30 --delay 2.0

All simulated reports have source="simulation" and will never be mistaken
for real citizen reports. They appear in the admin dashboard under the
SIMULATION source label.
"""
import argparse
import asyncio
import random
import sys
import uuid
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path

# Allow running as: python -m backend.scripts.simulate_reports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from dotenv import load_dotenv
load_dotenv()


# ──────────────────────────────────────────────
# Simulation data
# ──────────────────────────────────────────────

SIMULATION_CITIES = [
    {"city": "Mumbai",     "state": "Maharashtra", "lat": 19.0760, "lon": 72.8777},
    {"city": "Delhi",      "state": "Delhi",        "lat": 28.6139, "lon": 77.2090},
    {"city": "Chennai",    "state": "Tamil Nadu",   "lat": 13.0827, "lon": 80.2707},
    {"city": "Kolkata",    "state": "West Bengal",  "lat": 22.5726, "lon": 88.3639},
    {"city": "Bengaluru",  "state": "Karnataka",    "lat": 12.9716, "lon": 77.5946},
    {"city": "Hyderabad",  "state": "Telangana",    "lat": 17.3850, "lon": 78.4867},
    {"city": "Pune",       "state": "Maharashtra",  "lat": 18.5204, "lon": 73.8567},
    {"city": "Ahmedabad",  "state": "Gujarat",      "lat": 23.0225, "lon": 72.5714},
    {"city": "Jaipur",     "state": "Rajasthan",    "lat": 26.9124, "lon": 75.7873},
    {"city": "Lucknow",    "state": "Uttar Pradesh","lat": 26.8467, "lon": 80.9462},
    {"city": "Guwahati",   "state": "Assam",        "lat": 26.1445, "lon": 91.7362},
    {"city": "Bhopal",     "state": "Madhya Pradesh","lat": 23.2599,"lon": 77.4126},
    {"city": "Patna",      "state": "Bihar",        "lat": 25.5941, "lon": 85.1376},
    {"city": "Bhubaneswar","state": "Odisha",       "lat": 20.2961, "lon": 85.8245},
    {"city": "Kochi",      "state": "Kerala",       "lat": 9.9312,  "lon": 76.2673},
]

EVENTS = [
    {
        "category": "Heavy Rain",
        "descriptions": [
            "Heavy rainfall since morning causing waterlogging in low-lying areas.",
            "Continuous heavy rain for past 3 hours, roads flooded.",
            "Torrential downpour has disrupted traffic near railway station.",
            "Extremely heavy rain, drainage overwhelmed, knee-deep water in streets.",
        ],
        "ai_category": "Heavy Rain",
        "base_confidence": (70, 95),
    },
    {
        "category": "Flood",
        "descriptions": [
            "Severe flooding in riverside areas, evacuation underway.",
            "River overflowing, nearby colonies submerged, NDRF teams deployed.",
            "Flash flood warning issued, multiple roads blocked.",
        ],
        "ai_category": "Flood",
        "base_confidence": (75, 92),
    },
    {
        "category": "Waterlogging",
        "descriptions": [
            "Severe waterlogging near underpass, traffic jam stretching 2 km.",
            "Ankle-deep water on main road, vehicles stranded.",
            "Waterlogging in residential society, electricity cut for safety.",
        ],
        "ai_category": "Waterlogging",
        "base_confidence": (65, 88),
    },
    {
        "category": "Thunderstorm",
        "descriptions": [
            "Severe thunderstorm with gusty winds uprooting trees.",
            "Thunderstorm accompanied by hail causing damage to vehicles.",
            "Powerful thunderstorm, sky blackened, lightning strikes reported.",
        ],
        "ai_category": "Thunderstorm",
        "base_confidence": (72, 93),
    },
    {
        "category": "Heatwave",
        "descriptions": [
            "Extreme heat, temperature touching 45°C, people advised to stay indoors.",
            "Severe heatwave conditions, heat stroke cases being reported at hospital.",
            "Scorching heat today, roads empty, schools closed due to heat advisory.",
        ],
        "ai_category": "Heatwave",
        "base_confidence": (68, 90),
    },
    {
        "category": "Fog",
        "descriptions": [
            "Dense fog reducing visibility to near zero, flights delayed.",
            "Thick morning fog, multiple accidents on highway reported.",
            "Zero visibility conditions, trains running late due to fog.",
        ],
        "ai_category": "Fog",
        "base_confidence": (70, 89),
    },
    {
        "category": "Strong Wind",
        "descriptions": [
            "Strong gusty winds blowing, hoardings and trees falling.",
            "High-speed winds causing damage to temporary structures.",
            "Gale-force winds accompanied the storm, power lines down.",
        ],
        "ai_category": "Strong Wind",
        "base_confidence": (65, 87),
    },
    {
        "category": "Cyclone",
        "descriptions": [
            "Cyclone warning issued for coastal areas, fishermen advised not to venture.",
            "Cyclonic storm approaching, heavy rain and strong winds expected.",
        ],
        "ai_category": "Cyclone",
        "base_confidence": (80, 97),
    },
    {
        "category": "Landslide",
        "descriptions": [
            "Landslide blocking national highway, traffic diverted.",
            "Mudslide after heavy rains, houses damaged in hilly area.",
        ],
        "ai_category": "Landslide",
        "base_confidence": (75, 93),
    },
    {
        "category": "Cold Wave",
        "descriptions": [
            "Severe cold wave, temperature dropped to 3°C, shelters opened.",
            "Coldest night of the season, dense fog and freezing temperatures.",
        ],
        "ai_category": "Cold Wave",
        "base_confidence": (70, 90),
    },
]

STATUSES = ["PENDING", "PENDING", "PENDING", "VERIFIED", "FLAGGED", "SPAM"]


def _make_report(city_info: dict, event: dict) -> dict:
    now = datetime.now(timezone.utc)
    # Random time within last 6 hours
    ts = now - timedelta(minutes=random.randint(0, 360))

    report_id = str(uuid.uuid4())
    description = random.choice(event["descriptions"])
    conf_min, conf_max = event["base_confidence"]
    ai_confidence = round(random.uniform(conf_min, conf_max), 1)
    overall_confidence = round(random.uniform(max(conf_min - 10, 20), conf_max), 1)

    # Small lat/lon jitter for realism
    lat = city_info["lat"] + random.uniform(-0.05, 0.05)
    lon = city_info["lon"] + random.uniform(-0.05, 0.05)

    status = random.choices(
        ["PENDING", "VERIFIED", "FLAGGED", "SPAM"],
        weights=[50, 30, 10, 10],
    )[0]

    return {
        "id": report_id,
        "source": "simulation",
        "source_id": f"sim_{report_id[:8]}",
        "event_category": event["category"],
        "description": description,
        "latitude": round(lat, 6),
        "longitude": round(lon, 6),
        "location_name": f"{city_info['city']}, {city_info['state']}",
        "city": city_info["city"],
        "state": city_info["state"],
        "timestamp": ts.isoformat(),
        "media_url": None,
        "media_type": None,
        "status": status,
        "confidence_score": overall_confidence,
        "ai_category": event["ai_category"],
        "ai_category_confidence": ai_confidence,
        "ai_keywords": event["category"].lower().split(),
        "ai_reasoning": f"Description contains keywords associated with {event['category'].lower()}.",
        "duplicate_score": round(random.uniform(70, 100), 1),
        "metadata_score": round(random.uniform(50, 90), 1),
        "location_consistency_score": round(random.uniform(60, 100), 1),
        "weather_consistency_score": round(random.uniform(50, 95), 1),
        "cross_report_score": round(random.uniform(40, 90), 1),
        "source_reliability_score": 30.0,
        "confidence_interpretation": (
            "High" if overall_confidence >= 80 else
            "Moderate" if overall_confidence >= 60 else
            "Low" if overall_confidence >= 40 else "Suspicious"
        ),
        "created_at": ts.isoformat(),
        "reviewed_at": ts.isoformat() if status != "PENDING" else None,
        "reviewed_by": "simulation_script" if status != "PENDING" else None,
        "admin_notes": None,
    }


async def run_simulation(count: int = 50, delay: float = 1.5, batch_size: int = 2):
    """Generate and store simulated reports in Firestore."""
    from backend.services.firebase_service import init_firebase, save_report, is_connected

    print(f"\n{'='*60}")
    print(f"  WeatherSense Simulation Script")
    print(f"  Generating {count} reports across India")
    print(f"  Delay: {delay}s between batches of {batch_size}")
    print(f"{'='*60}\n")

    # Init Firebase
    firebase_ok = init_firebase()
    if not firebase_ok:
        print("[!] Firebase not configured - reports will be printed but not saved to cloud.")
        print("    Set FIREBASE_* env vars to persist directly to Firestore.\n")

    submitted = 0
    failed = 0

    while submitted < count:
        # Pick a random city and event
        city = random.choice(SIMULATION_CITIES)
        event = random.choice(EVENTS)

        batch_count = min(batch_size, count - submitted)
        batch = [_make_report(city, event) for _ in range(batch_count)]

        for report in batch:
            try:
                if is_connected():
                    await save_report(report)
                    print(f"  [+] [{submitted + 1:3d}/{count}] {report['status']:8s} | "
                          f"{report['event_category']:15s} | "
                          f"{report['city']:12s} | "
                          f"conf: {report['confidence_score']:5.1f}")
                else:
                    print(f"  [*] [{submitted + 1:3d}/{count}] {report['status']:8s} | "
                          f"{report['event_category']:15s} | "
                          f"{report['city']:12s} | "
                          f"conf: {report['confidence_score']:5.1f} (in-memory demo)")
                submitted += 1
            except Exception as exc:
                print(f"  [-] Failed: {exc}")
                failed += 1

        if submitted < count:
            await asyncio.sleep(delay)

    print(f"\n{'='*60}")
    print(f"  Simulation complete!")
    print(f"  Submitted: {submitted}  |  Failed: {failed}")
    print(f"{'='*60}\n")


def main():
    parser = argparse.ArgumentParser(
        description="WeatherSense Simulation Script — Generate demo weather reports for SIH presentation."
    )
    parser.add_argument("--count", type=int, default=50, help="Number of reports to generate (default: 50)")
    parser.add_argument("--delay", type=float, default=1.5, help="Delay in seconds between batches (default: 1.5)")
    parser.add_argument("--batch", type=int, default=2, help="Reports per batch (default: 2)")
    args = parser.parse_args()

    asyncio.run(run_simulation(count=args.count, delay=args.delay, batch_size=args.batch))


if __name__ == "__main__":
    main()
