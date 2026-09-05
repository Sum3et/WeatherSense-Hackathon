"""
WeatherSense — Meta / Facebook public data service.

Architecture stub — ready for activation when Meta API credentials are provided.
Meta's Graph API requires app review for public data access beyond basic use.
"""
import os
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)


def is_configured() -> bool:
    return bool(os.getenv("META_ACCESS_TOKEN", ""))


def get_status() -> Dict[str, Any]:
    if is_configured():
        return {
            "status": "CONFIGURED",
            "message": "META_ACCESS_TOKEN set. Full API access requires app review.",
        }
    return {
        "status": "NOT_CONFIGURED",
        "message": "META_ACCESS_TOKEN not set. Meta data ingestion disabled.",
    }


async def fetch_public_weather_posts(limit: int = 20) -> List[Dict[str, Any]]:
    """
    Placeholder for Meta Graph API integration.
    Returns empty list until credentials are configured and app is reviewed.
    """
    if not is_configured():
        return []

    # TODO: Implement Meta Graph API search for public weather posts in India
    # Requires: Page Public Content Access feature approval
    # Endpoint: /v18.0/search?type=post&q=weather+india&fields=...
    logger.info("Meta integration placeholder — not yet implemented.")
    return []
