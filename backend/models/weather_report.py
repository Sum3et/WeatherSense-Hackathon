"""
WeatherSense — Pydantic models for weather reports and citizen submissions.
"""
from __future__ import annotations
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
import uuid


# ──────────────────────────────────────────────
# Enums
# ──────────────────────────────────────────────

class ReportStatus(str, Enum):
    PENDING  = "PENDING"
    VERIFIED = "VERIFIED"
    FLAGGED  = "FLAGGED"
    SPAM     = "SPAM"
    REJECTED = "REJECTED"


class DataSource(str, Enum):
    CITIZEN    = "citizen"
    IMD        = "imd"
    OPEN_METEO = "open_meteo"
    REDDIT     = "reddit"
    META       = "meta"
    PUBLIC_WEB = "public_web"
    SIMULATION = "simulation"


class EventCategory(str, Enum):
    HEAVY_RAIN  = "Heavy Rain"
    FLOOD       = "Flood"
    WATERLOGGING = "Waterlogging"
    THUNDERSTORM = "Thunderstorm"
    LIGHTNING   = "Lightning"
    CYCLONE     = "Cyclone"
    STRONG_WIND = "Strong Wind"
    HEATWAVE    = "Heatwave"
    FOG         = "Fog"
    HAILSTORM   = "Hailstorm"
    LANDSLIDE   = "Landslide"
    DUST_STORM  = "Dust Storm"
    COLD_WAVE   = "Cold Wave"
    OTHER       = "Other"


# ──────────────────────────────────────────────
# Core WeatherReport — unified data model
# ──────────────────────────────────────────────

class WeatherReport(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source: DataSource = DataSource.CITIZEN
    source_id: Optional[str] = None

    event_category: Optional[EventCategory] = None
    description: str = ""

    latitude: float
    longitude: float
    location_name: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None

    timestamp: datetime = Field(default_factory=datetime.utcnow)
    media_url: Optional[str] = None
    media_type: Optional[str] = None   # "image" | "video"

    status: ReportStatus = ReportStatus.PENDING

    # AI & scoring fields
    confidence_score: float = 0.0          # 0–100 combined
    ai_category: Optional[str] = None
    ai_category_confidence: float = 0.0    # 0–100
    ai_keywords: Optional[List[str]] = None
    ai_reasoning: Optional[str] = None

    # Component scores
    duplicate_score: float = 0.0
    metadata_score: float = 0.0
    location_consistency_score: float = 0.0
    weather_consistency_score: float = 0.0
    cross_report_score: float = 0.0
    source_reliability_score: float = 0.0

    # Admin fields
    created_at: datetime = Field(default_factory=datetime.utcnow)
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None
    admin_notes: Optional[str] = None

    class Config:
        use_enum_values = True


# ──────────────────────────────────────────────
# Citizen report submission payload
# ──────────────────────────────────────────────

class CitizenReportCreate(BaseModel):
    event_category: EventCategory
    description: str = Field(..., min_length=10, max_length=2000)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    location_name: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    timestamp: Optional[datetime] = None


# ──────────────────────────────────────────────
# Admin update payload
# ──────────────────────────────────────────────

class AdminReportUpdate(BaseModel):
    status: Optional[ReportStatus] = None
    event_category: Optional[EventCategory] = None
    admin_notes: Optional[str] = None
    confidence_score: Optional[float] = None


# ──────────────────────────────────────────────
# Social / public report
# ──────────────────────────────────────────────

class SocialReport(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source: DataSource
    source_id: Optional[str] = None
    text: str
    url: Optional[str] = None
    author_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    timestamp: Optional[datetime] = None
    predicted_category: Optional[str] = None
    confidence_score: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        use_enum_values = True


# ──────────────────────────────────────────────
# AI Analysis result
# ──────────────────────────────────────────────

class AIAnalysisResult(BaseModel):
    predicted_category: str
    category_confidence: float   # 0–100
    keywords: List[str]
    reasoning_summary: str


# ──────────────────────────────────────────────
# Confidence scoring breakdown
# ──────────────────────────────────────────────

class ConfidenceBreakdown(BaseModel):
    overall: float              # 0–100
    duplicate_score: float
    metadata_score: float
    location_consistency_score: float
    weather_consistency_score: float
    cross_report_score: float
    source_reliability_score: float
    ai_category_confidence: float
    interpretation: str         # "High" / "Moderate" / "Low" / "Suspicious"
