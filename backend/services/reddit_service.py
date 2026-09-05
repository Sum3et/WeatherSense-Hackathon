"""
WeatherSense — Reddit public data ingestion service.

Uses PRAW to fetch weather-related posts from Indian subreddits.
Gracefully skips if credentials are not configured.
"""
import os
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

_reddit = None
_configured = False
_last_error = ""

INDIA_SUBREDDITS = [
    "india", "mumbai", "delhi", "bangalore", "chennai",
    "kolkata", "hyderabad", "pune", "indianweather",
    "indiaflood", "keralaflood",
]

WEATHER_KEYWORDS = [
    "rain", "flood", "cyclone", "storm", "heatwave", "thunder",
    "lightning", "fog", "hailstorm", "landslide", "weather",
    "barish", "aandhi", "toofan",
]


def _init_reddit():
    global _reddit, _configured, _last_error

    client_id     = os.getenv("REDDIT_CLIENT_ID", "")
    client_secret = os.getenv("REDDIT_CLIENT_SECRET", "")
    user_agent    = os.getenv("REDDIT_USER_AGENT", "WeatherSense/1.0")

    if not client_id or not client_secret:
        logger.info("Reddit credentials not configured.")
        return

    try:
        import praw
        _reddit = praw.Reddit(
            client_id=client_id,
            client_secret=client_secret,
            user_agent=user_agent,
            read_only=True,
        )
        _configured = True
        logger.info("Reddit PRAW client initialised.")
    except Exception as exc:
        _last_error = str(exc)
        logger.warning(f"Reddit init failed: {exc}")


def is_configured() -> bool:
    return _configured


def get_status() -> Dict[str, Any]:
    if not os.getenv("REDDIT_CLIENT_ID"):
        return {"status": "NOT_CONFIGURED", "message": "REDDIT_CLIENT_ID not set."}
    if _configured:
        return {"status": "CONNECTED", "message": "Reddit PRAW client ready."}
    return {"status": "ERROR", "message": _last_error or "Failed to initialise."}


async def fetch_weather_posts(
    subreddit: str = "india",
    limit: int = 25,
    time_filter: str = "day",
) -> List[Dict[str, Any]]:
    """
    Fetch recent weather-related posts from a subreddit.
    Returns empty list if not configured.
    """
    global _last_error

    if not _reddit:
        _init_reddit()

    if not _configured or not _reddit:
        return []

    try:
        results = []
        sub = _reddit.subreddit(subreddit)

        for post in sub.search("weather OR rain OR flood OR storm OR cyclone", time_filter=time_filter, limit=limit):
            # Filter for weather keywords
            text = f"{post.title} {post.selftext}".lower()
            if not any(kw in text for kw in WEATHER_KEYWORDS):
                continue

            results.append({
                "source": "reddit",
                "source_id": post.id,
                "text": f"{post.title}\n\n{post.selftext[:500]}".strip(),
                "url": f"https://reddit.com{post.permalink}",
                "author_name": str(post.author) if post.author else "[deleted]",
                "subreddit": subreddit,
                "timestamp": datetime.fromtimestamp(post.created_utc, tz=timezone.utc).isoformat(),
                "upvotes": post.score,
                "num_comments": post.num_comments,
            })

        return results

    except Exception as exc:
        _last_error = str(exc)
        logger.error(f"Reddit fetch failed: {exc}")
        return []


async def fetch_all_india_weather(limit_per_sub: int = 10) -> List[Dict[str, Any]]:
    """Fetch weather posts from multiple India-relevant subreddits."""
    all_posts = []
    for sub in INDIA_SUBREDDITS[:5]:  # Limit to top 5 to avoid rate limits
        posts = await fetch_weather_posts(subreddit=sub, limit=limit_per_sub)
        all_posts.extend(posts)
    return all_posts
