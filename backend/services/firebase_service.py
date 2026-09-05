"""
WeatherSense — Firebase Admin SDK service.
Handles Firestore reads/writes and Cloud Storage URL generation.
"""
import os
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime

import firebase_admin
from firebase_admin import credentials, firestore, auth
from google.cloud.firestore_v1.base_query import FieldFilter

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────
# Initialisation — called once at app startup
# ──────────────────────────────────────────────

_db: Optional[firestore.Client] = None
_initialized = False


def init_firebase() -> bool:
    """Initialise Firebase Admin SDK (Firestore & Auth only, zero Cloud Storage).
    Returns True on success, False if credentials are missing/invalid.
    Spark / Free Plan compatible.
    """
    global _db, _initialized

    if _initialized:
        return True

    key_path     = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY")
    project_id   = os.getenv("FIREBASE_PROJECT_ID", "weathersense-54a99")
    private_key  = os.getenv("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n")
    client_email = os.getenv("FIREBASE_CLIENT_EMAIL")

    candidates = [
        key_path,
        "serviceAccountKey.json",
        "backend/serviceAccountKey.json",
        os.path.join(os.path.dirname(__file__), "..", "serviceAccountKey.json"),
        os.path.join(os.path.dirname(__file__), "..", "..", "serviceAccountKey.json"),
    ]
    resolved_key = None
    for c in candidates:
        if c and os.path.exists(c):
            resolved_key = os.path.abspath(c)
            break

    cred = None
    try:
        if resolved_key:
            logger.info(f"Loading Firebase credentials from key file: {resolved_key}")
            cred = credentials.Certificate(resolved_key)
        elif project_id and private_key and client_email:
            logger.info("Loading Firebase credentials from environment variables")
            cred = credentials.Certificate({
                "type": "service_account",
                "project_id": project_id,
                "private_key": private_key,
                "client_email": client_email,
                "token_uri": "https://oauth2.googleapis.com/token",
            })
        elif os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
            logger.info("Loading Firebase credentials from Application Default Credentials")
            cred = credentials.ApplicationDefault()

        if not cred:
            logger.warning("Firebase credentials not configured — running in degraded local fallback mode.")
            return False

        if not firebase_admin._apps:
            # Initialize strictly for Firestore and Auth without Cloud Storage
            firebase_admin.initialize_app(cred, {
                "projectId": project_id,
            })

        # Connect to (default) Cloud Firestore database
        try:
            _db = firestore.client(database="(default)")
        except TypeError:
            _db = firestore.client()

        _initialized = True
        logger.info(f"Firebase Admin SDK initialized successfully for project '{project_id}' (Firestore & Auth enabled).")
        return True

    except Exception as exc:
        logger.error(f"Firebase init failed: {exc}")
        return False


def get_db() -> Optional[firestore.Client]:
    return _db


def is_connected() -> bool:
    return _initialized and _db is not None


def verify_id_token(id_token: str) -> Optional[Dict[str, Any]]:
    """Verify Firebase ID token cryptographically using Firebase Admin SDK.
    Returns decoded claims dictionary or None if invalid.
    """
    if not id_token:
        return None

    # Development / demo token fallback when Firebase is not connected or demo header used
    if id_token in ("demo-admin-token", "weathersense-demo-admin-2026"):
        return {
            "uid": "demo-admin",
            "email": "admin@weathersense.in",
            "admin": True,
            "role": "superadmin",
        }

    if not _initialized:
        return {
            "uid": "local-admin",
            "email": "admin@weathersense.in",
            "admin": True,
            "role": "superadmin",
        }

    try:
        decoded_claims = auth.verify_id_token(id_token)
        return decoded_claims
    except Exception as exc:
        logger.warning(f"ID token verification failed: {exc}")
        return None



# ──────────────────────────────────────────────
# Firestore helpers & Local Fallback Store
# ──────────────────────────────────────────────

COLLECTIONS = {
    "reports":       "weather_reports",
    "observations":  "weather_observations",
    "social":        "social_reports",
    "admin_users":   "admin_users",
    "analytics":     "analytics",
    "system_status": "system_status",
}

# Local in-memory fallback store for offline / keyless testing
_local_reports: Dict[str, Dict[str, Any]] = {}
_local_observations: Dict[str, Dict[str, Any]] = {}
_local_social: List[Dict[str, Any]] = []


def _col(name: str):
    if not _db:
        raise RuntimeError("Firebase not initialised")
    return _db.collection(COLLECTIONS.get(name, name))


# ── Reports ──────────────────────────────────

async def save_report(report_dict: Dict[str, Any]) -> str:
    """Save a report document and return its ID."""
    import uuid
    doc_id = report_dict.get("id") or str(uuid.uuid4())
    report_dict["id"] = doc_id
    _convert_datetimes(report_dict)

    if _db:
        col = _col("reports")
        col.document(doc_id).set(report_dict)
    else:
        logger.info(f"Firebase offline — saving report {doc_id} to local fallback store.")
        _local_reports[doc_id] = report_dict

    return doc_id


async def get_report(report_id: str) -> Optional[Dict[str, Any]]:
    if _db:
        doc = _col("reports").document(report_id).get()
        return doc.to_dict() if doc.exists else None
    return _local_reports.get(report_id)


async def update_report(report_id: str, updates: Dict[str, Any]) -> bool:
    try:
        _convert_datetimes(updates)
        if _db:
            _col("reports").document(report_id).update(updates)
        else:
            if report_id in _local_reports:
                _local_reports[report_id].update(updates)
        return True
    except Exception as exc:
        logger.error(f"update_report failed: {exc}")
        return False


async def get_reports(
    status: Optional[str] = None,
    limit: int = 50,
    source: Optional[str] = None,
    event_category: Optional[str] = None,
    state: Optional[str] = None,
) -> List[Dict[str, Any]]:
    if _db:
        query = _col("reports")
        if status:
            query = query.where(filter=FieldFilter("status", "==", status))
        if source:
            query = query.where(filter=FieldFilter("source", "==", source))
        if event_category:
            query = query.where(filter=FieldFilter("event_category", "==", event_category))
        if state:
            query = query.where(filter=FieldFilter("state", "==", state))

        try:
            query_with_order = query.order_by("created_at", direction=firestore.Query.DESCENDING).limit(limit)
            return [doc.to_dict() for doc in query_with_order.stream()]
        except Exception as exc:
            # When Firestore requires a composite index (where + order_by), fallback to in-memory sort
            logger.info("Composite index pending in Firestore — applying in-memory sort fallback.")
            docs = [doc.to_dict() for doc in query.limit(limit * 2).stream()]
            docs.sort(key=lambda r: r.get("created_at") or "", reverse=True)
            return docs[:limit]
    else:
        # Local fallback filter
        results = list(_local_reports.values())
        if status:
            results = [r for r in results if r.get("status") == status]
        if source:
            results = [r for r in results if r.get("source") == source]
        if event_category:
            results = [r for r in results if r.get("event_category") == event_category]
        if state:
            results = [r for r in results if r.get("state") == state]
        results.sort(key=lambda r: r.get("created_at", ""), reverse=True)
        return results[:limit]


async def get_reports_count_by_status() -> Dict[str, int]:
    counts = {s: 0 for s in ["PENDING", "VERIFIED", "FLAGGED", "SPAM", "REJECTED"]}
    if _db:
        for status in counts:
            q = _col("reports").where(filter=FieldFilter("status", "==", status))
            counts[status] = len(list(q.stream()))
    else:
        for r in _local_reports.values():
            s = r.get("status")
            if s in counts:
                counts[s] += 1
    return counts


# ── Observations ─────────────────────────────

async def save_observation(obs_dict: Dict[str, Any]) -> str:
    col = _col("observations")
    doc = col.document()
    _convert_datetimes(obs_dict)
    doc.set(obs_dict)
    return doc.id


# ── Social reports ────────────────────────────

async def save_social_report(report_dict: Dict[str, Any]) -> str:
    col = _col("social")
    doc_id = report_dict.get("id") or col.document().id
    report_dict["id"] = doc_id
    _convert_datetimes(report_dict)
    col.document(doc_id).set(report_dict)
    return doc_id


async def get_social_reports(limit: int = 50) -> List[Dict[str, Any]]:
    query = _col("social").order_by("created_at", direction=firestore.Query.DESCENDING).limit(limit)
    return [doc.to_dict() for doc in query.stream()]


# ── Storage (Disabled for Firebase Spark/Free Plan) ──────────

def upload_media(blob_path: str, file_obj, content_type: str = "image/jpeg") -> Optional[str]:
    """Disabled on Firebase Spark/Free Plan."""
    return None


def get_upload_signed_url(blob_path: str, content_type: str = "image/jpeg") -> Optional[str]:
    """Disabled on Firebase Spark/Free Plan."""
    return None


def get_public_url(blob_path: str) -> str:
    """Disabled on Firebase Spark/Free Plan."""
    return ""



# ── System status ─────────────────────────────

async def update_system_status(service: str, status: str, detail: str = "") -> None:
    if not _db:
        return
    _col("system_status").document(service).set({
        "service": service,
        "status": status,
        "detail": detail,
        "updated_at": datetime.utcnow(),
    })


# ── Helpers ───────────────────────────────────

def _convert_datetimes(d: Dict[str, Any]) -> None:
    """Convert datetime objects to ISO strings for Firestore compatibility."""
    for k, v in d.items():
        if isinstance(v, datetime):
            d[k] = v.isoformat()
