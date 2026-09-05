"""
WeatherSense — Security & Flow Automated Verification Test Suite (Firebase Spark Free Plan).
Tests:
1. Citizen anonymous report submission via FastAPI (zero media required).
2. Initial PENDING status isolation from public endpoints.
3. Media upload graceful handling (disabled on Spark free plan).
4. Unauthenticated admin call rejected (401).
5. Non-admin user gets 403 Forbidden on admin endpoints.
6. Admin with custom claim 'admin: true' can verify reports.
7. Once VERIFIED, report immediately appears in public feed.
8. Single report public endpoint allows reading VERIFIED report.
"""
import sys
import os
import io
import asyncio
from fastapi.testclient import TestClient

# Ensure root directory is in sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.main import app
from backend.services import firebase_service
from backend.models.weather_report import EventCategory

# Setup in-memory mock for firebase_service if running without cloud credentials
in_memory_reports = {}

if not firebase_service.is_connected():
    print("[INFO] Setting up in-memory Firestore mock for offline test verification.")
    firebase_service.is_connected = lambda: True

    async def mock_save_report(report_dict):
        doc_id = report_dict.get("id") or "test-report-id"
        report_dict["id"] = doc_id
        in_memory_reports[doc_id] = report_dict
        return doc_id

    async def mock_get_report(report_id):
        return in_memory_reports.get(report_id)

    async def mock_update_report(report_id, updates):
        if report_id in in_memory_reports:
            in_memory_reports[report_id].update(updates)
            return True
        return False

    async def mock_get_reports(status=None, limit=50, **kwargs):
        results = list(in_memory_reports.values())
        if status:
            results = [r for r in results if r.get("status") == status]
        return results[:limit]

    firebase_service.save_report = mock_save_report
    firebase_service.get_report = mock_get_report
    firebase_service.update_report = mock_update_report
    firebase_service.get_reports = mock_get_reports

client = TestClient(app)

def run_tests():
    print("\n=======================================================")
    print(" WeatherSense Spark (Free Plan) Verification Suite")
    print("=======================================================\n")
    passed = 0
    total = 0

    def check(name: str, condition: bool, detail: str = ""):
        nonlocal passed, total
        total += 1
        if condition:
            passed += 1
            print(f" [PASS] {name}")
        else:
            print(f" [FAIL] {name}: {detail}")

    # ── Test 1: Anonymous Citizen Report Submission (No Media Required) ──
    report_payload = {
        "event_category": EventCategory.HEAVY_RAIN.value,
        "description": "Heavy monsoon downpour causing waterlogging in Connaught Place.",
        "latitude": 28.6315,
        "longitude": 77.2167,
        "city": "New Delhi",
        "state": "Delhi",
        "location_name": "Connaught Place, New Delhi",
    }
    resp = client.post("/api/v1/reports/submit", json=report_payload)
    check(
        "Citizen Report Submission (201 Created)",
        resp.status_code == 201 and resp.json().get("success") is True,
        f"Status: {resp.status_code}, Body: {resp.text}"
    )
    report_id = resp.json().get("report_id")
    check(
        "Report initial status is quarantined as PENDING",
        resp.json().get("status") == "PENDING",
        f"Status returned: {resp.json().get('status')}"
    )

    # ── Test 2: PENDING Report Hidden From Public Feed ──
    public_resp = client.get("/api/v1/reports/public")
    check(
        "Public Reports API (200 OK)",
        public_resp.status_code == 200,
        f"Status: {public_resp.status_code}"
    )
    public_reports = public_resp.json().get("reports", [])
    found_pending = any(r.get("id") == report_id for r in public_reports)
    check(
        "PENDING report is NOT visible to public users",
        not found_pending,
        f"Pending report {report_id} was improperly exposed to public"
    )

    # ── Test 3: Media Upload Graceful Notification on Spark Plan ──
    fake_img = io.BytesIO(b"\xff\xd8\xff\xe0" + b"\x00" * 20)
    media_resp = client.post(
        f"/api/v1/reports/{report_id}/media-upload",
        files={"file": ("photo.jpg", fake_img, "image/jpeg")}
    )
    check(
        "Media upload gracefully notifies disabled status on free tier (200 OK)",
        media_resp.status_code == 200 and media_resp.json().get("success") is False,
        f"Status: {media_resp.status_code}, Body: {media_resp.text}"
    )

    # ── Test 4: Admin Authorization Check ──
    # A. No authorization header
    unauth_resp = client.post(f"/api/v1/admin/reports/{report_id}/verify")
    check(
        "Unauthenticated admin call rejected (401 Unauthorized)",
        unauth_resp.status_code == 401,
        f"Status: {unauth_resp.status_code}"
    )

    # B. Normal user token (lacking 'admin: true' claim)
    original_verify = firebase_service.verify_id_token
    firebase_service.verify_id_token = lambda tok: {
        "uid": "normal-citizen-uid",
        "email": "citizen@gmail.com",
        "admin": False,  # NO admin custom claim!
    }
    non_admin_resp = client.post(
        f"/api/v1/admin/reports/{report_id}/verify",
        headers={"Authorization": "Bearer normal-user-token"}
    )
    check(
        "Normal authenticated user receives 403 Forbidden",
        non_admin_resp.status_code == 403,
        f"Status: {non_admin_resp.status_code}, Detail: {non_admin_resp.text}"
    )

    # C. Admin user token (with 'admin: true' claim)
    firebase_service.verify_id_token = lambda tok: {
        "uid": "superadmin-uid",
        "email": "admin@weathersense.in",
        "admin": True,  # Has admin custom claim!
        "role": "superadmin",
    }
    admin_resp = client.post(
        f"/api/v1/admin/reports/{report_id}/verify",
        headers={"Authorization": "Bearer real-admin-token"}
    )
    check(
        "Admin with custom claim 'admin: true' successfully verifies report (200 OK)",
        admin_resp.status_code == 200 and admin_resp.json().get("status") == "VERIFIED",
        f"Status: {admin_resp.status_code}, Body: {admin_resp.text}"
    )

    # Restore verify function
    firebase_service.verify_id_token = original_verify

    # ── Test 5: Real-time Public Exposure of VERIFIED Report ──
    public_resp_after = client.get("/api/v1/reports/public")
    public_reports_after = public_resp_after.json().get("reports", [])
    found_verified = any(r.get("id") == report_id and r.get("status") == "VERIFIED" for r in public_reports_after)
    check(
        "Verified report immediately appears in public feed",
        found_verified,
        f"Report {report_id} did not appear in public verified feed"
    )

    # ── Test 6: Single Report Public Endpoint Security ──
    single_pub = client.get(f"/api/v1/reports/{report_id}")
    check(
        "Public endpoint allows reading single VERIFIED report",
        single_pub.status_code == 200 and single_pub.json().get("status") == "VERIFIED",
        f"Status: {single_pub.status_code}"
    )

    print("\n-------------------------------------------------------")
    print(f" Verification Summary: {passed}/{total} tests passed ({passed/total*100:.0f}%)")
    print("-------------------------------------------------------\n")
    return passed == total

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
