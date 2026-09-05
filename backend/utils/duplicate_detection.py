"""
WeatherSense — Duplicate detection utilities.

Uses TF-IDF cosine similarity and fuzzy string matching to detect
duplicate or near-duplicate weather reports.
"""
import logging
import math
from typing import List, Dict, Any, Tuple
import difflib

logger = logging.getLogger(__name__)

def _token_sort_ratio(s1: str, s2: str) -> float:
    """Calculate token sort ratio using standard library difflib."""
    t1 = " ".join(sorted(s1.lower().split()))
    t2 = " ".join(sorted(s2.lower().split()))
    if not t1 and not t2:
        return 100.0
    if not t1 or not t2:
        return 0.0
    return difflib.SequenceMatcher(None, t1, t2).ratio() * 100.0

# Simple in-memory vector store for recent reports (for quick duplicate check)
_recent_texts: List[Tuple[str, str]] = []  # (report_id, text)
MAX_RECENT = 500


def add_to_index(report_id: str, text: str) -> None:
    """Add a report text to the duplicate detection index."""
    global _recent_texts
    _recent_texts.append((report_id, text.lower()))
    if len(_recent_texts) > MAX_RECENT:
        _recent_texts = _recent_texts[-MAX_RECENT:]


def check_duplicate(
    new_text: str,
    existing_reports: List[Dict[str, Any]],
    similarity_threshold: float = 85.0,
) -> Tuple[float, List[str]]:
    """
    Check if a new report text is a near-duplicate of existing reports.

    Returns:
        (duplicate_score, [list of similar report ids])
        duplicate_score: 0 = definitely duplicate, 100 = definitely unique
    """
    if not existing_reports:
        return 100.0, []

    new_text_lower = new_text.lower().strip()
    if len(new_text_lower) < 10:
        return 50.0, []

    max_similarity = 0.0
    similar_ids = []

    for report in existing_reports:
        existing_text = report.get("description", "").lower().strip()
        if not existing_text:
            continue

        # Fuzzy token sort ratio (handles word re-ordering)
        sim = _token_sort_ratio(new_text_lower, existing_text)

        if sim > max_similarity:
            max_similarity = sim

        if sim >= similarity_threshold:
            report_id = report.get("id", "")
            if report_id:
                similar_ids.append(report_id)

    # Convert similarity to uniqueness score (higher = more unique = better)
    if max_similarity >= similarity_threshold:
        duplicate_score = max(0.0, 100.0 - max_similarity)
    else:
        # Good score if under threshold
        duplicate_score = min(100.0, 100.0 - max_similarity * 0.3)

    return round(duplicate_score, 1), similar_ids


def check_text_spam_indicators(text: str) -> Tuple[bool, List[str]]:
    """
    Check for obvious spam/fake indicators in report text.
    Returns (is_suspicious, [list of indicators found]).
    """
    text_lower = text.lower()
    indicators = []

    spam_patterns = [
        ("repeated characters", _has_repeated_chars(text)),
        ("all caps", text.isupper() and len(text) > 10),
        ("too short", len(text.strip()) < 15),
        ("promotional language", any(w in text_lower for w in ["buy", "sale", "discount", "offer", "free delivery"])),
        ("url spam", text_lower.count("http") > 2),
    ]

    for name, triggered in spam_patterns:
        if triggered:
            indicators.append(name)

    return len(indicators) > 0, indicators


def _has_repeated_chars(text: str, threshold: int = 5) -> bool:
    """Check if text has a character repeated more than threshold times consecutively."""
    count = 1
    for i in range(1, len(text)):
        if text[i] == text[i - 1]:
            count += 1
            if count >= threshold:
                return True
        else:
            count = 1
    return False
