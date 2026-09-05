"""
WeatherSense — Public web / RSS feed ingestion service.

Fetches weather-related news from public RSS feeds of Indian news sources.
No credentials required — uses publicly accessible feeds.
"""
import logging
import httpx
import feedparser
from typing import List, Dict, Any
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# Public RSS feeds — Indian weather/disaster news (no authentication needed)
PUBLIC_RSS_FEEDS = [
    {
        "name": "NDMA India",
        "url": "https://ndma.gov.in/rss.xml",
        "source": "ndma",
    },
    {
        "name": "India Today Weather",
        "url": "https://www.indiatoday.in/rssfeeds/1206576.rss",
        "source": "india_today",
    },
    {
        "name": "NDTV India Weather",
        "url": "https://feeds.feedburner.com/ndtvnews-latest",
        "source": "ndtv",
    },
]

WEATHER_KEYWORDS = [
    "rain", "flood", "cyclone", "storm", "heatwave", "temperature",
    "weather", "thunder", "lightning", "fog", "hailstorm", "landslide",
    "disaster", "alert", "warning", "rainfall",
]


def get_status() -> Dict[str, Any]:
    return {
        "status": "CONNECTED",
        "message": f"Monitoring {len(PUBLIC_RSS_FEEDS)} public RSS feeds.",
        "feeds": [f["name"] for f in PUBLIC_RSS_FEEDS],
    }


async def fetch_rss_weather_news(limit_per_feed: int = 10) -> List[Dict[str, Any]]:
    """
    Fetch weather-related articles from public RSS feeds.
    Skips feeds that are unavailable without crashing.
    """
    results = []

    for feed_info in PUBLIC_RSS_FEEDS:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    feed_info["url"],
                    headers={"User-Agent": "WeatherSense/1.0 RSS Reader"},
                    follow_redirects=True,
                )
                if resp.status_code != 200:
                    continue

            feed = feedparser.parse(resp.text)

            count = 0
            for entry in feed.entries:
                if count >= limit_per_feed:
                    break

                title = entry.get("title", "")
                summary = entry.get("summary", "")
                text = f"{title} {summary}".lower()

                # Only include weather-relevant items
                if not any(kw in text for kw in WEATHER_KEYWORDS):
                    continue

                pub_date = None
                if hasattr(entry, "published_parsed") and entry.published_parsed:
                    try:
                        import time
                        pub_date = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc).isoformat()
                    except Exception:
                        pass

                results.append({
                    "source": "public_web",
                    "source_id": entry.get("id", entry.get("link", "")),
                    "text": f"{title}\n{summary[:400]}".strip(),
                    "url": entry.get("link", ""),
                    "feed_name": feed_info["name"],
                    "timestamp": pub_date or datetime.now(timezone.utc).isoformat(),
                })
                count += 1

        except Exception as exc:
            logger.warning(f"RSS feed {feed_info['name']} fetch failed: {exc}")
            continue

    return results
