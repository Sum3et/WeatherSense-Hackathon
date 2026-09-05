"""
WeatherSense — Social data routes.
Endpoints for fetching and ingesting social/public weather data.
"""
import logging
from fastapi import APIRouter, Query, Depends

from backend.services import reddit_service, meta_service, public_web_service, firebase_service
from backend.routes.admin import require_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/social", tags=["Social"])


@router.get("/status")
async def get_social_status():
    """Return status of all social data sources."""
    return {
        "reddit": reddit_service.get_status(),
        "meta": meta_service.get_status(),
        "public_web": public_web_service.get_status(),
    }


@router.get("/reddit")
async def get_reddit_posts(
    subreddit: str = Query("india"),
    limit: int = Query(20, ge=1, le=100),
    claims: dict = Depends(require_admin),
):
    """Fetch weather posts from Reddit (admin only)."""
    posts = await reddit_service.fetch_weather_posts(subreddit=subreddit, limit=limit)
    return {"source": "reddit", "posts": posts, "count": len(posts)}


@router.get("/news")
async def get_public_news(
    limit: int = Query(20, ge=1, le=50),
    claims: dict = Depends(require_admin),
):
    """Fetch weather news from public RSS feeds (admin only)."""
    articles = await public_web_service.fetch_rss_weather_news(limit_per_feed=limit // 3)
    return {"source": "public_web", "articles": articles, "count": len(articles)}


@router.post("/ingest")
async def ingest_social_reports(claims: dict = Depends(require_admin)):
    """
    Trigger ingestion of social/public weather reports into Firestore.
    This runs a manual fetch cycle and stores results as social_reports.
    """
    if not firebase_service.is_connected():
        return {"success": False, "message": "Database unavailable."}

    ingested = 0

    # Reddit
    reddit_posts = await reddit_service.fetch_all_india_weather(limit_per_sub=5)
    for post in reddit_posts:
        try:
            await firebase_service.save_social_report(post)
            ingested += 1
        except Exception:
            pass

    # Public web
    news = await public_web_service.fetch_rss_weather_news(limit_per_feed=5)
    for article in news:
        try:
            await firebase_service.save_social_report(article)
            ingested += 1
        except Exception:
            pass

    return {"success": True, "ingested": ingested}


@router.get("/reports")
async def get_social_reports(
    limit: int = Query(20, ge=1, le=100),
    claims: dict = Depends(require_admin),
):
    """Get stored social reports from Firestore."""
    if not firebase_service.is_connected():
        return {"reports": [], "count": 0}
    reports = await firebase_service.get_social_reports(limit=limit)
    return {"reports": reports, "count": len(reports)}
