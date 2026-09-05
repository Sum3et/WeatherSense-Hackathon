"""
WeatherSense — Safe Admin Bootstrap CLI Script.
Bootstraps or promotes an administrator user account using Firebase Admin SDK.
Assigns the cryptographically signed custom claim: {"admin": True, "role": "superadmin"}.
"""
import sys
import os
import argparse
import getpass
from datetime import datetime, timezone

from dotenv import load_dotenv

# Ensure scratch/weathersense root is in sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# Load environment variables
load_dotenv(os.path.join(BASE_DIR, ".env"))

import firebase_admin
from firebase_admin import auth, firestore
from backend.services.firebase_service import init_firebase, get_db


def bootstrap_admin(email: str, password: str = None):
    print("\n=======================================================")
    print("      WeatherSense Administrator Account Bootstrapper")
    print("=======================================================\n")

    if not init_firebase():
        print("[ERROR] Firebase Admin SDK failed to initialize.")
        print("Please check that FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS is set.")
        sys.exit(1)

    clean_email = email.strip().lower()
    print(f"[*] Processing user for email: {clean_email}")

    user = None
    try:
        user = auth.get_user_by_email(clean_email)
        print(f"[+] Found existing Firebase Auth user: UID = {user.uid}")
        if password:
            auth.update_user(user.uid, password=password)
            print("[+] Updated password for existing user.")
    except auth.UserNotFoundError:
        if not password:
            password = getpass.getpass("Enter password for new admin user (min 8 chars): ")
        if len(password) < 8:
            print("[ERROR] Password must be at least 8 characters.")
            sys.exit(1)

        user = auth.create_user(
            email=clean_email,
            password=password,
            display_name="WeatherSense SuperAdmin",
            email_verified=True,
        )
        print(f"[+] Created new Firebase Auth user: UID = {user.uid}")

    # Set custom claims strictly on server
    auth.set_custom_user_claims(user.uid, {
        "admin": True,
        "role": "superadmin",
    })
    print(f"[SUCCESS] Assigned custom claim {{'admin': True, 'role': 'superadmin'}} to UID {user.uid}")

    # Record in Firestore admin_users (backend managed)
    db = get_db()
    if db:
        try:
            admin_doc = {
                "uid": user.uid,
                "email": clean_email,
                "role": "superadmin",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            db.collection("admin_users").document(user.uid).set(admin_doc, merge=True)
            print(f"[SUCCESS] Recorded admin document in Firestore 'admin_users/{user.uid}'")
        except Exception as exc:
            print(f"[WARNING] Could not write to Firestore admin_users collection: {exc}")

    print("\n[COMPLETE] Admin account setup successfully.")
    print("The admin user can now log into WeatherSense via /admin/login.")
    print("The custom claim 'admin == true' is embedded in the user's ID token.\n")


def main():
    parser = argparse.ArgumentParser(description="Bootstrap WeatherSense Administrator")
    parser.add_argument("--email", default="admin@weathersense.in", help="Admin email address")
    parser.add_argument("--password", default=None, help="Admin password (optional; prompted if not supplied)")
    args = parser.parse_args()

    bootstrap_admin(args.email, args.password)


if __name__ == "__main__":
    main()
