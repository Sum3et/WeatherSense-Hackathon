"""
WeatherSense — AI classification service using Google Gemini.

Uses gemini-3.7-flash to classify weather event descriptions into standard categories.
Falls back to keyword-based rule classifier if Gemini API is unavailable.
"""
import os
import json
import logging
import re
from typing import Optional, List
from datetime import datetime

from backend.models.weather_report import AIAnalysisResult

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────
# Gemini client (lazy init)
# ──────────────────────────────────────────────

_gemini_client = None
_gemini_available = False


def _init_gemini():
    global _gemini_client, _gemini_available
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        logger.warning("GEMINI_API_KEY not set — using keyword fallback classifier.")
        return

    try:
        from google import genai
        _gemini_client = genai.Client(api_key=api_key)
        _gemini_available = True
        logger.info("Gemini AI client initialised.")
    except Exception as exc:
        logger.warning(f"Gemini init failed: {exc} — using keyword fallback.")


def is_available() -> bool:
    return _gemini_available


def get_status() -> dict:
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        return {"status": "NOT_CONFIGURED", "message": "GEMINI_API_KEY not set."}
    if _gemini_available:
        return {"status": "CONNECTED", "message": "Gemini gemini-3.7-flash ready."}
    return {"status": "ERROR", "message": "API key set but client failed to initialise."}


# ──────────────────────────────────────────────
# Classification prompt
# ──────────────────────────────────────────────

CATEGORIES = [
    "Heavy Rain", "Flood", "Waterlogging", "Thunderstorm", "Lightning",
    "Cyclone", "Strong Wind", "Heatwave", "Fog", "Hailstorm",
    "Landslide", "Dust Storm", "Cold Wave", "Other",
]

SYSTEM_PROMPT = """You are a weather event classifier for India's national weather intelligence platform.

Your task: Classify a weather report text into exactly one category and provide a confidence score.

Available categories:
{categories}

Respond ONLY with valid JSON in this exact format:
{{
  "predicted_category": "<category from the list>",
  "category_confidence": <integer 0-100>,
  "keywords": ["<keyword1>", "<keyword2>", "<keyword3>"],
  "reasoning_summary": "<one sentence, max 120 chars, factual>"
}}

Rules:
- reasoning_summary must be factual and concise. NO chain-of-thought. NO "I think".
- If confidence < 30, use "Other".
- keywords: 2–5 relevant words from the text.
- category_confidence: 0–100 integer.
""".format(categories="\n".join(f"- {c}" for c in CATEGORIES))


async def classify_report(description: str, category_hint: Optional[str] = None) -> AIAnalysisResult:
    """
    Classify a weather report description.
    Uses Gemini if available, falls back to keyword matching.
    """
    if not _gemini_client:
        _init_gemini()

    if _gemini_available and _gemini_client:
        return await _classify_with_gemini(description, category_hint)
    else:
        return _classify_with_keywords(description, category_hint)


async def _classify_with_gemini(description: str, category_hint: Optional[str]) -> AIAnalysisResult:
    try:
        hint_text = f"\nThe user self-reported the category as: {category_hint}" if category_hint else ""
        prompt = f"{SYSTEM_PROMPT}\n\nReport text:\n\"{description}\"{hint_text}"

        response = _gemini_client.models.generate_content(
            model="gemini-3.7-flash",
            contents=prompt,
        )

        raw = response.text.strip()
        # Extract JSON from potential markdown code blocks
        json_match = re.search(r"\{.*\}", raw, re.DOTALL)
        if not json_match:
            raise ValueError("No JSON found in Gemini response")

        parsed = json.loads(json_match.group())

        return AIAnalysisResult(
            predicted_category=parsed.get("predicted_category", "Other"),
            category_confidence=float(parsed.get("category_confidence", 50)),
            keywords=parsed.get("keywords", []),
            reasoning_summary=parsed.get("reasoning_summary", ""),
        )

    except Exception as exc:
        logger.error(f"Gemini classification failed: {exc} — falling back to keywords")
        return _classify_with_keywords(description, category_hint)


# ──────────────────────────────────────────────
# Keyword-based fallback classifier
# ──────────────────────────────────────────────

KEYWORD_MAP = {
    "Heavy Rain":   ["heavy rain", "torrential", "downpour", "rained heavily", "bhari barish", "heavy rainfall"],
    "Flood":        ["flood", "flooding", "submerged", "inundated", "water level", "baadh"],
    "Waterlogging": ["waterlogging", "waterlogged", "water accumulation", "knee deep", "ankle deep", "stagnant water"],
    "Thunderstorm": ["thunderstorm", "thunder", "lightning storm", "badal", "bijli aur baarish"],
    "Lightning":    ["lightning", "struck by lightning", "thunder strike", "bijli"],
    "Cyclone":      ["cyclone", "hurricane", "typhoon", "toofan", "storm surge"],
    "Strong Wind":  ["strong wind", "gusty", "gale", "wind speed", "tez hawa", "aaandhi"],
    "Heatwave":     ["heatwave", "heat wave", "extreme heat", "scorching", "garmi", "lu"],
    "Fog":          ["fog", "foggy", "visibility", "dense fog", "kohra", "smog"],
    "Hailstorm":    ["hail", "hailstorm", "hailstone", "ola", "hailing"],
    "Landslide":    ["landslide", "mudslide", "rockfall", "bhooswakhal", "slope failure"],
    "Dust Storm":   ["dust storm", "sandstorm", "aandhi", "dust", "sand"],
    "Cold Wave":    ["cold wave", "cold snap", "freezing", "shiit lahar", "severe cold"],
}


def _classify_with_keywords(description: str, category_hint: Optional[str]) -> AIAnalysisResult:
    text = description.lower()
    scores: dict = {cat: 0 for cat in CATEGORIES}
    matched_kws: List[str] = []

    for category, keywords in KEYWORD_MAP.items():
        for kw in keywords:
            if kw in text:
                scores[category] += 1
                matched_kws.append(kw)

    # Bonus for matching user's own category hint
    if category_hint and category_hint in scores:
        scores[category_hint] += 2

    best_cat = max(scores, key=lambda c: scores[c])
    best_score = scores[best_cat]

    if best_score == 0:
        best_cat = "Other"
        confidence = 30.0
        reasoning = "No specific weather keywords detected. Marked as Other for manual review."
    else:
        confidence = min(50.0 + best_score * 12.0, 90.0)
        reasoning = f"Description contains keywords associated with {best_cat.lower()}."

    return AIAnalysisResult(
        predicted_category=best_cat,
        category_confidence=confidence,
        keywords=list(set(matched_kws))[:5],
        reasoning_summary=reasoning,
    )
