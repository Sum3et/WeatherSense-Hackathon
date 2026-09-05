#!/usr/bin/env python3
"""
WeatherSense — Secure Admin Bootstrap Script (create_admin.py)

Assigns Firebase Custom Claim {"admin": true} to an existing Firebase Authentication user.
Runs strictly in the local backend environment using Firebase Admin SDK.
Zero public API endpoints. Zero exposed credentials.
"""
import sys
import os
import argparse
from datetime import datetime, timezone

# Ensure the project root directory is on the Python path
PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# Load environment variables from .env
from dotenv import load_dotenv
load_dotenv(os.path.join(PROJECT_ROOT, ".env"))

import firebase_admin
from firebase_admin import auth, firestore
from backend.services.firebase_service import init_firebase, get_db


def assign_admin_claim(identifier: str):
    """Find a Firebase Auth user by email or UID and grant custom claim {"admin": True}."""
    identifier = identifier.strip()
    if not identifier:
        print("[ERROR] Email address or Firebase UID is required.")
        sys.exit(1)

    print("\n=======================================================")
    print("        WeatherSense Administrator Bootstrapper")
    print("=======================================================\n")

    # 1. Initialize Firebase Admin SDK using existing service
    if not init_firebase():
        print("[ERROR] Firebase Admin SDK failed to initialize.")
        print("Please ensure your FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS is set.")
        print(f"Target Project ID: {os.getenv('FIREBASE_PROJECT_ID', 'weathersense-54a99')}")
        sys.exit(1)

    # 2. Find the user by email or UID
    user = None
    try:
        if "@" in identifier:
            print(f"[*] Looking up user by email: {identifier.lower()}...")
            user = auth.get_user_by_email(identifier.lower())
        else:
            print(f"[*] Looking up user by UID: {identifier}...")
            user = auth.get_user(identifier)
    except auth.UserNotFoundError:
        print(f"\n[ERROR] User '{identifier}' was not found in Firebase Authentication.")
        print("Please create the user first in Firebase Console -> Authentication -> Users,")
        print("or sign up through the application, then run this script again.\n")
        sys.exit(1)
    except Exception as exc:
        print(f"\n[ERROR] Error retrieving user: {exc}\n")
        sys.exit(1)

    # 3. Assign Custom Claims: {"admin": True}
    try:
        # Preserve any existing custom claims while adding admin=True
        existing_claims = user.custom_claims or {}
        updated_claims = {**existing_claims, "admin": True}

        auth.set_custom_user_claims(user.uid, updated_claims)

        # 4. Record/sync in Firestore admin_users collection (backend-managed)
        db = get_db()
        if db:
            try:
                db.collection("admin_users").document(user.uid).set({
                    "uid": user.uid,
                    "email": user.email,
                    "role": "admin",
                    "is_active": True,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }, merge=True)
            except Exception as db_exc:
                print(f"[WARNING] Could not update Firestore admin_users doc: {db_exc}")

        # 5. Print confirmation with UID and Email
        print("\n-------------------------------------------------------")
        print(" [SUCCESS] Admin custom claim granted successfully!")
        print("-------------------------------------------------------")
        print(f" User UID : {user.uid}")
        print(f" Email    : {user.email}")
        print(f" Claims   : {updated_claims}")
        print("-------------------------------------------------------")
        print("\nNext steps:")
        print("1. If the user is currently logged in, they should sign out and sign back in")
        print("   (or the frontend useAuth hook will auto-refresh the token with getIdToken(true)).")
        print("2. The user now has full authorization on all /api/v1/admin/* endpoints.\n")

    except Exception as exc:
        print(f"\n[ERROR] Failed to set custom claims: {exc}\n")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="One-time WeatherSense Admin Bootstrap Script",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""Examples:
  python create_admin.py --email admin@weathersense.in
  python create_admin.py --uid 4XvK8k39JdQ9...
  python create_admin.py admin@weathersense.in
"""
    )
    parser.add_argument("identifier_pos", nargs="?", default=None, help="User email address or Firebase UID (positional)")
    parser.add_argument("--email", "-e", default=None, help="User email address")
    parser.add_argument("--uid", "-u", default=None, help="User Firebase UID")

    args = parser.parse_args()

    target = args.email or args.uid or args.identifier_pos
    if not target:
        try:
            target = input("Enter admin user email address or Firebase UID: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nAborted.")
            sys.exit(0)

    assign_admin_claim(target)


if __name__ == "__main__":
    main()
