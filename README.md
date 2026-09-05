# WeatherSense 🌦️
### National Weather Big Data Analytics Platform
**SIH 2026 — Problem Statement SIH26069**  
**Theme:** Disaster Management | **Organization:** Ministry of Earth Sciences (MoES)

---

## Overview

WeatherSense is a full-stack, production-style weather intelligence platform for India that combines:

- **Official IMD data** (configurable, graceful stub when unavailable)
- **Real-time forecasts** via Open-Meteo (free, open API)
- **Citizen weather reports** with GPS location and photo evidence
- **Social media signals** from Reddit and public news feeds
- **AI-powered report classification** via Google Gemini
- **Multi-factor confidence scoring** and spam detection
- **Admin verification workflow** for report moderation

---

## Architecture

```
weathersense/
├── backend/                  # Python FastAPI
│   ├── main.py               # App entry point, CORS, routers
│   ├── models/               # Pydantic schemas
│   │   ├── weather_report.py
│   │   └── weather_data.py
│   ├── services/             # Business logic
│   │   ├── firebase_service.py    # Firestore + Storage + Auth
│   │   ├── open_meteo_service.py  # Real-time weather
│   │   ├── imd_service.py         # IMD integration (configurable)
│   │   ├── ai_service.py          # Gemini classification
│   │   ├── verification_service.py# Confidence scoring
│   │   ├── geolocation_service.py # Reverse geocoding
│   │   ├── reddit_service.py      # Reddit ingestion
│   │   ├── meta_service.py        # Meta Graph API stub
│   │   └── public_web_service.py  # RSS news feeds
│   ├── routes/               # FastAPI routers
│   │   ├── weather.py        # /api/v1/weather/*
│   │   ├── reports.py        # /api/v1/reports/*
│   │   ├── admin.py          # /api/v1/admin/* (auth required)
│   │   ├── analytics.py      # /api/v1/analytics/*
│   │   └── social.py         # /api/v1/social/*
│   ├── utils/
│   │   ├── duplicate_detection.py
│   │   └── location_utils.py
│   ├── scripts/
│   │   └── simulate_reports.py    # Demo data generator
│   └── requirements.txt
│
├── frontend/                 # React + Vite + Tailwind
│   ├── src/
│   │   ├── pages/            # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── Weather.jsx
│   │   │   ├── Report.jsx    # Multi-step citizen report form
│   │   │   ├── Reports.jsx   # Public verified reports
│   │   │   ├── About.jsx
│   │   │   ├── AdminLogin.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminReports.jsx  # Review/verify/spam workflow
│   │   │   ├── AdminMap.jsx      # Full-screen live map
│   │   │   ├── AdminAnalytics.jsx
│   │   │   └── AdminSettings.jsx
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── WeatherMap.jsx    # Leaflet map with clustering
│   │   │   ├── WeatherCard.jsx
│   │   │   ├── ReportCard.jsx
│   │   │   ├── StatCard.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   └── ConfidenceBadge.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js        # Firebase Auth hook
│   │   │   ├── useReports.js     # Real-time Firestore listener
│   │   │   └── useWeather.js     # Weather data with caching
│   │   ├── services/
│   │   │   ├── firebase.js       # Firebase Web SDK
│   │   │   └── api.js            # Axios client for FastAPI
│   │   └── utils/
│   │       └── constants.js
│   └── package.json
│
├── .env.example              # Backend environment template
└── README.md
```

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- A Firebase project (Firestore + Storage + Auth enabled)
- Google AI Studio API key (for Gemini classification)

---

### 1. Clone and set up environment

```bash
# Navigate to the project
cd weathersense

# Copy and fill backend env
cp .env.example .env
# Edit .env — at minimum set FIREBASE_PROJECT_ID, FIREBASE_SERVICE_ACCOUNT_KEY, GEMINI_API_KEY

# Copy frontend env
cp frontend/.env.example frontend/.env
# Edit frontend/.env — fill in all VITE_FIREBASE_* values
```

---

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com) → Create project
2. Enable **Firestore Database** (start in production mode)
3. Enable **Firebase Storage**
4. Enable **Firebase Authentication** → Email/Password
5. Create an admin user: Authentication → Add User
6. Download **Service Account JSON**: Project Settings → Service Accounts → Generate new private key
7. Place the JSON file at the path specified by `FIREBASE_SERVICE_ACCOUNT_KEY` in your `.env`
8. Copy your web app config to `frontend/.env` (Project Settings → General → Your apps)

**Firestore Security Rules** (paste in Firestore → Rules):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public can read verified reports
    match /weather_reports/{reportId} {
      allow read: if resource.data.status == 'VERIFIED';
      allow write: if request.auth != null;
    }
    // Admin-only collections
    match /social_reports/{id} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Storage Rules**:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /reports/{reportId}/{file} {
      allow read: if true;
      allow write: if request.resource.size < 50 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*|video/.*');
    }
  }
}
```

---

### 3. Run the Backend

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Run development server
python -m backend.main
# OR
uvicorn backend.main:app --reload --port 8000
```

Backend runs at: **http://localhost:8000**  
API docs at: **http://localhost:8000/docs**

---

### 4. Run the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (with API proxy to :8000)
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

### 5. Simulate Demo Data

```bash
# Generate 50 realistic reports across India
python -m backend.scripts.simulate_reports --count 50 --delay 1.0

# Options:
#   --count N    Number of reports to generate
#   --delay S    Seconds between batches (default: 1.5)
#   --batch N    Reports per batch (default: 2)
```

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | System health check |
| GET | `/api/v1/weather/current` | No | Current weather for coordinates |
| GET | `/api/v1/weather/forecast` | No | 7-day forecast |
| GET | `/api/v1/weather/cities` | No | Weather for all major cities |
| GET | `/api/v1/weather/imd/status` | No | IMD integration status |
| POST | `/api/v1/reports/submit` | No | Submit citizen report |
| GET | `/api/v1/reports/public` | No | Get verified public reports |
| GET | `/api/v1/admin/reports` | Admin | All reports with filters |
| PATCH | `/api/v1/admin/reports/{id}` | Admin | Update report |
| POST | `/api/v1/admin/reports/{id}/verify` | Admin | Quick verify |
| POST | `/api/v1/admin/reports/{id}/spam` | Admin | Mark as spam |
| GET | `/api/v1/admin/dashboard/summary` | Admin | KPI summary |
| GET | `/api/v1/analytics/summary` | Admin | Analytics data |
| GET | `/api/v1/analytics/reports-over-time` | Admin | Time series |
| POST | `/api/v1/social/ingest` | Admin | Trigger social ingestion |

---

## Key Features

### AI Classification Pipeline
Every submitted report goes through:
1. **Gemini AI** classifies the event category
2. **Keyword fallback** if AI is unavailable (rate-limited)
3. **Multi-factor confidence scoring** (0–100):
   - Metadata completeness
   - Location consistency vs. real weather
   - Cross-report corroboration
   - Source reliability
   - Duplicate detection
4. Admin receives a pre-analyzed report for quick verification

### Graceful Degradation
The system continues working even without:
- Firebase (uses in-memory stubs)
- Gemini API (keyword-based fallback)
- IMD credentials (Open-Meteo used instead)
- Reddit/Meta API (social stubs return empty)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Map | Leaflet + OpenStreetMap + MarkerCluster |
| Charts | Recharts |
| Backend | Python FastAPI |
| Database | Google Firebase Firestore |
| Storage | Firebase Cloud Storage |
| Auth | Firebase Authentication |
| AI | Google Gemini (`gemini-1.5-flash`) |
| Weather | Open-Meteo (free, open API) |
| Geocoding | Nominatim (OpenStreetMap) |

---

## SIH 2026 Context

- **Problem ID:** SIH26069
- **Theme:** Disaster Management
- **Organization:** Ministry of Earth Sciences (MoES)
- **Category:** Software
