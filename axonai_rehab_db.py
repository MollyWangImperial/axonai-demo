# -*- coding: utf-8 -*-
"""Persistence for the AxonAI rehab prototype.

Local development defaults to SQLite. Production can use Supabase/Postgres by
setting DATABASE_URL or AXONAI_DATABASE_URL.
"""

from __future__ import annotations

import hashlib
import json
import os
import secrets
import sqlite3
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


DB_PATH = Path(os.getenv("AXONAI_REHAB_DB_PATH", Path(__file__).resolve().parent / "axonai_rehab_runtime" / "axonai_rehab.sqlite3"))
DATABASE_URL = os.getenv("AXONAI_DATABASE_URL") or os.getenv("DATABASE_URL")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

SCHEMA_STATEMENTS = [
    """
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        role TEXT NOT NULL CHECK (role IN ('patient', 'therapist')),
        identifier TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        last_login_at TEXT,
        UNIQUE(role, identifier)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS patient_profiles (
        user_id TEXT PRIMARY KEY,
        profile_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS therapist_profiles (
        user_id TEXT PRIMARY KEY,
        profile_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS upper_limb_analyses (
        id TEXT PRIMARY KEY,
        patient_user_id TEXT,
        patient_profile_json TEXT NOT NULL,
        recorded_videos_json TEXT NOT NULL,
        result_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(patient_user_id) REFERENCES users(id) ON DELETE SET NULL
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS package_analyses (
        id TEXT PRIMARY KEY,
        package_key TEXT NOT NULL,
        patient_user_id TEXT,
        patient_profile_json TEXT NOT NULL,
        recorded_videos_json TEXT NOT NULL,
        result_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(patient_user_id) REFERENCES users(id) ON DELETE SET NULL
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS uploaded_videos (
        id TEXT PRIMARY KEY,
        owner_user_id TEXT,
        package_key TEXT NOT NULL,
        action_id TEXT NOT NULL,
        bucket_id TEXT NOT NULL,
        object_path TEXT NOT NULL,
        mime_type TEXT,
        size_bytes INTEGER,
        quality_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(bucket_id, object_path)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS care_matches (
        id TEXT PRIMARY KEY,
        patient_user_id TEXT,
        therapist_user_id TEXT,
        analysis_id TEXT,
        matched_person_json TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(patient_user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY(therapist_user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY(analysis_id) REFERENCES upper_limb_analyses(id) ON DELETE SET NULL
    )
    """,
]

POSTGRES_COMPAT_STATEMENTS = [
    """
    CREATE TABLE IF NOT EXISTS public.users (
        id TEXT PRIMARY KEY,
        role TEXT NOT NULL CHECK (role IN ('patient', 'therapist')),
        identifier TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        last_login_at TEXT,
        UNIQUE(role, identifier)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS public.upper_limb_analyses (
        id TEXT PRIMARY KEY,
        patient_user_id TEXT,
        patient_profile_json TEXT NOT NULL,
        recorded_videos_json TEXT NOT NULL,
        result_json TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    """,
]

REQUIRED_POSTGRES_TABLES = [
    "profiles",
    "patient_profiles",
    "therapist_profiles",
    "uploaded_videos",
    "package_analyses",
    "exercise_plans",
    "care_matches",
    "clinician_reviews",
]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def is_postgres() -> bool:
    return bool(DATABASE_URL)


def placeholder() -> str:
    return "%s" if is_postgres() else "?"


def connect():
    if is_postgres():
        try:
            import psycopg
            from psycopg.rows import dict_row
        except ImportError as exc:
            raise RuntimeError("psycopg[binary] is required when DATABASE_URL is configured") from exc
        return psycopg.connect(DATABASE_URL, row_factory=dict_row)

    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    with connect() as conn:
        statements = POSTGRES_COMPAT_STATEMENTS if is_postgres() else SCHEMA_STATEMENTS
        for statement in statements:
            conn.execute(statement)
        if is_postgres():
            missing = []
            for table in REQUIRED_POSTGRES_TABLES:
                row = conn.execute("SELECT to_regclass(%s) AS table_name", (f"public.{table}",)).fetchone()
                if not row or not row["table_name"]:
                    missing.append(table)
            if missing:
                raise RuntimeError(
                    "Supabase schema is missing required tables. Run supabase/axonai_rehab_schema.sql. "
                    f"Missing: {', '.join(missing)}"
                )


def normalize_identifier(identifier: str) -> str:
    normalized = identifier.strip().lower()
    if not normalized:
        raise ValueError("identifier is required")
    return normalized


def hash_password(password: str, salt: str | None = None) -> tuple[str, str]:
    if len(password) < 4:
        raise ValueError("password must be at least 4 characters")
    password_salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), password_salt.encode("utf-8"), 120_000)
    return digest.hex(), password_salt


def _create_supabase_auth_user(role: str, identifier: str, password: str) -> str:
    """Create the canonical Supabase Auth user needed by public.profiles FKs."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for account creation on Supabase.")

    metadata = {"role": role, "axonai_identifier": identifier}
    if "@" in identifier:
        payload = {
            "email": identifier,
            "password": password,
            "email_confirm": True,
            "user_metadata": metadata,
        }
    else:
        safe_identifier = "".join(ch if ch.isalnum() else "-" for ch in identifier).strip("-") or "phone-user"
        payload = {
            "email": f"{safe_identifier}.{uuid.uuid4().hex[:10]}@axonai.local",
            "password": password,
            "email_confirm": True,
            "user_metadata": metadata,
        }

    request = urllib.request.Request(
        f"{SUPABASE_URL.rstrip('/')}/auth/v1/admin/users",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            body = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        error_body = exc.read().decode("utf-8", errors="replace")
        if exc.code == 422 and "already" in error_body.lower():
            raise ValueError("account already exists for this email in Supabase Auth") from exc
        raise RuntimeError(f"Supabase Auth user creation failed: HTTP {exc.code} {error_body}") from exc

    user_id = body.get("id")
    if not user_id:
        raise RuntimeError("Supabase Auth user creation did not return a user id.")
    return str(user_id)


def _uuid_or_none(value: str | None) -> str | None:
    if not value:
        return None
    try:
        return str(uuid.UUID(str(value)))
    except (TypeError, ValueError):
        return None


def _profile_columns(role: str, profile: dict[str, Any]) -> dict[str, Any]:
    if role == "patient":
        return {
            "full_name": profile.get("fullName") or profile.get("full_name"),
            "age_range": profile.get("ageRange") or profile.get("age_range"),
            "gender": profile.get("gender"),
            "language": profile.get("language"),
            "location": profile.get("location"),
            "stroke_type": profile.get("strokeType") or profile.get("stroke_type"),
            "onset_time": profile.get("onsetTime") or profile.get("onset_time"),
            "affected_side": profile.get("affectedSide") or profile.get("affected_side"),
            "dominant_hand": profile.get("dominantHand") or profile.get("dominant_hand"),
            "mobility_level": profile.get("mobilityLevel") or profile.get("mobility_level"),
            "upper_limb_ability": profile.get("upperLimbAbility") or profile.get("upper_limb_ability"),
            "safety_flags": profile.get("safetyFlags") or profile.get("safety_flags") or [],
            "main_goal": profile.get("mainGoal") or profile.get("main_goal"),
            "support_mode": profile.get("supportMode") or profile.get("support_mode"),
        }
    return {
        "full_name": profile.get("fullName") or profile.get("full_name"),
        "title": profile.get("title"),
        "profession": profile.get("profession"),
        "location": profile.get("location"),
        "languages": profile.get("languages"),
        "years_experience": profile.get("yearsExperience") or profile.get("years_experience"),
        "stroke_experience": profile.get("strokeExperience") or profile.get("stroke_experience"),
        "specialties": profile.get("specialties") or [],
        "assessments": profile.get("assessments") or [],
        "support_mode": profile.get("supportMode") or profile.get("support_mode"),
        "availability": profile.get("availability"),
    }


def create_user(role: str, identifier: str, password: str) -> dict[str, Any]:
    init_db()
    normalized = normalize_identifier(identifier)
    password_hash, password_salt = hash_password(password)
    timestamp = now_iso()
    ph = placeholder()
    with connect() as conn:
        existing = conn.execute(f"SELECT id FROM users WHERE role = {ph} AND identifier = {ph}", (role, normalized)).fetchone()
        if existing is not None:
            raise ValueError("account already exists for this role and identifier")

    user_id = _create_supabase_auth_user(role, normalized, password) if is_postgres() else str(uuid.uuid4())
    try:
        with connect() as conn:
            conn.execute(
                f"""
                INSERT INTO users (id, role, identifier, password_hash, password_salt, created_at, updated_at)
                VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph})
                """,
                (user_id, role, normalized, password_hash, password_salt, timestamp, timestamp),
            )
            if is_postgres():
                conn.execute(
                    """
                    INSERT INTO public.profiles (user_id, role, display_name, email, phone, created_at, updated_at)
                    VALUES (%s, %s::public.axonai_user_role, %s, %s, %s, now(), now())
                    ON CONFLICT(user_id) DO UPDATE SET
                        role = excluded.role,
                        email = excluded.email,
                        phone = excluded.phone,
                        updated_at = now()
                    """,
                    (
                        user_id,
                        role,
                        normalized,
                        normalized if "@" in normalized else None,
                        normalized if "@" not in normalized else None,
                    ),
                )
    except Exception as exc:
        if "unique" not in str(exc).lower() and "duplicate" not in str(exc).lower():
            raise
        raise ValueError("account already exists for this role and identifier") from exc
    return {"userId": user_id, "role": role, "identifier": normalized}


def login_user(role: str, identifier: str, password: str) -> dict[str, Any]:
    init_db()
    normalized = normalize_identifier(identifier)
    ph = placeholder()
    with connect() as conn:
        row = conn.execute(f"SELECT * FROM users WHERE role = {ph} AND identifier = {ph}", (role, normalized)).fetchone()
        if row is None:
            raise ValueError("account not found")
        password_hash, _ = hash_password(password, row["password_salt"])
        if not secrets.compare_digest(password_hash, row["password_hash"]):
            raise ValueError("password is incorrect")
        conn.execute(f"UPDATE users SET last_login_at = {ph}, updated_at = {ph} WHERE id = {ph}", (now_iso(), now_iso(), row["id"]))
        profile = get_profile(row["id"], role)
        return {"userId": row["id"], "role": role, "identifier": normalized, "profile": profile}


def save_profile(user_id: str, role: str, profile: dict[str, Any]) -> dict[str, Any]:
    init_db()
    table = "patient_profiles" if role == "patient" else "therapist_profiles"
    timestamp = now_iso()
    payload = json.dumps(profile, ensure_ascii=False)
    ph = placeholder()
    with connect() as conn:
        user = conn.execute(f"SELECT id FROM users WHERE id = {ph} AND role = {ph}", (user_id, role)).fetchone()
        if user is None:
            raise ValueError("user not found for profile role")
        if is_postgres():
            conn.execute(
                """
                INSERT INTO public.profiles (user_id, role, display_name, created_at, updated_at)
                VALUES (%s, %s::public.axonai_user_role, %s, now(), now())
                ON CONFLICT(user_id) DO UPDATE SET
                    role = excluded.role,
                    display_name = coalesce(excluded.display_name, public.profiles.display_name),
                    updated_at = now()
                """,
                (user_id, role, profile.get("fullName") or profile.get("full_name") or user_id),
            )
            values = _profile_columns(role, profile)
            if role == "patient":
                conn.execute(
                    """
                    INSERT INTO public.patient_profiles (
                        user_id, full_name, age_range, gender, language, location, stroke_type,
                        onset_time, affected_side, dominant_hand, mobility_level, upper_limb_ability,
                        safety_flags, main_goal, support_mode, profile_json, created_at, updated_at
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, now(), now())
                    ON CONFLICT(user_id) DO UPDATE SET
                        full_name = excluded.full_name,
                        age_range = excluded.age_range,
                        gender = excluded.gender,
                        language = excluded.language,
                        location = excluded.location,
                        stroke_type = excluded.stroke_type,
                        onset_time = excluded.onset_time,
                        affected_side = excluded.affected_side,
                        dominant_hand = excluded.dominant_hand,
                        mobility_level = excluded.mobility_level,
                        upper_limb_ability = excluded.upper_limb_ability,
                        safety_flags = excluded.safety_flags,
                        main_goal = excluded.main_goal,
                        support_mode = excluded.support_mode,
                        profile_json = excluded.profile_json,
                        updated_at = now()
                    """,
                    (
                        user_id,
                        values["full_name"],
                        values["age_range"],
                        values["gender"],
                        values["language"],
                        values["location"],
                        values["stroke_type"],
                        values["onset_time"],
                        values["affected_side"],
                        values["dominant_hand"],
                        values["mobility_level"],
                        values["upper_limb_ability"],
                        values["safety_flags"],
                        values["main_goal"],
                        values["support_mode"],
                        payload,
                    ),
                )
            else:
                conn.execute(
                    """
                    INSERT INTO public.therapist_profiles (
                        user_id, full_name, title, profession, location, languages, years_experience,
                        stroke_experience, specialties, assessments, support_mode, availability,
                        profile_json, created_at, updated_at
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, now(), now())
                    ON CONFLICT(user_id) DO UPDATE SET
                        full_name = excluded.full_name,
                        title = excluded.title,
                        profession = excluded.profession,
                        location = excluded.location,
                        languages = excluded.languages,
                        years_experience = excluded.years_experience,
                        stroke_experience = excluded.stroke_experience,
                        specialties = excluded.specialties,
                        assessments = excluded.assessments,
                        support_mode = excluded.support_mode,
                        availability = excluded.availability,
                        profile_json = excluded.profile_json,
                        updated_at = now()
                    """,
                    (
                        user_id,
                        values["full_name"],
                        values["title"],
                        values["profession"],
                        values["location"],
                        values["languages"],
                        values["years_experience"],
                        values["stroke_experience"],
                        values["specialties"],
                        values["assessments"],
                        values["support_mode"],
                        values["availability"],
                        payload,
                    ),
                )
            return {"userId": user_id, "role": role, "profile": profile}
        conn.execute(
            f"""
            INSERT INTO {table} (user_id, profile_json, created_at, updated_at)
            VALUES ({ph}, {ph}, {ph}, {ph})
            ON CONFLICT(user_id) DO UPDATE SET
                profile_json = excluded.profile_json,
                updated_at = excluded.updated_at
            """,
            (user_id, payload, timestamp, timestamp),
        )
        conn.execute(f"UPDATE users SET updated_at = {ph} WHERE id = {ph}", (timestamp, user_id))
    return {"userId": user_id, "role": role, "profile": profile}


def get_profile(user_id: str, role: str) -> dict[str, Any] | None:
    init_db()
    table = "patient_profiles" if role == "patient" else "therapist_profiles"
    ph = placeholder()
    with connect() as conn:
        row = conn.execute(f"SELECT profile_json FROM {table} WHERE user_id = {ph}", (user_id,)).fetchone()
    return json.loads(row["profile_json"]) if row else None


def save_analysis(patient_user_id: str | None, patient_profile: dict[str, Any], recorded_videos: dict[str, Any], result: dict[str, Any]) -> dict[str, Any]:
    init_db()
    analysis_id = str(uuid.uuid4())
    timestamp = now_iso()
    ph = placeholder()
    if is_postgres():
        with connect() as conn:
            conn.execute(
                """
                INSERT INTO public.package_analyses
                    (id, package_key, patient_user_id, recorded_videos_json, result_json, algorithm_version, status, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, now())
                """,
                (
                    analysis_id,
                    "upper",
                    _uuid_or_none(patient_user_id),
                    json.dumps(recorded_videos, ensure_ascii=False),
                    json.dumps(result, ensure_ascii=False),
                    result.get("algorithmVersion"),
                    "generated",
                ),
            )
        return {"analysisId": analysis_id, "createdAt": timestamp}
    with connect() as conn:
        conn.execute(
            f"""
            INSERT INTO upper_limb_analyses
                (id, patient_user_id, patient_profile_json, recorded_videos_json, result_json, created_at)
            VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph})
            """,
            (
                analysis_id,
                patient_user_id or None,
                json.dumps(patient_profile, ensure_ascii=False),
                json.dumps(recorded_videos, ensure_ascii=False),
                json.dumps(result, ensure_ascii=False),
                timestamp,
            ),
        )
    return {"analysisId": analysis_id, "createdAt": timestamp}


def save_package_analysis(
    package_key: str,
    patient_user_id: str | None,
    patient_profile: dict[str, Any],
    recorded_videos: dict[str, Any],
    result: dict[str, Any],
) -> dict[str, Any]:
    init_db()
    analysis_id = str(uuid.uuid4())
    timestamp = now_iso()
    ph = placeholder()
    if is_postgres():
        with connect() as conn:
            conn.execute(
                """
                INSERT INTO public.package_analyses
                    (id, package_key, patient_user_id, recorded_videos_json, result_json, algorithm_version, status, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, now())
                """,
                (
                    analysis_id,
                    package_key,
                    _uuid_or_none(patient_user_id),
                    json.dumps(recorded_videos, ensure_ascii=False),
                    json.dumps(result, ensure_ascii=False),
                    result.get("algorithmVersion"),
                    "generated",
                ),
            )
        return {"analysisId": analysis_id, "packageKey": package_key, "createdAt": timestamp}
    with connect() as conn:
        conn.execute(
            f"""
            INSERT INTO package_analyses
                (id, package_key, patient_user_id, patient_profile_json, recorded_videos_json, result_json, created_at)
            VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph})
            """,
            (
                analysis_id,
                package_key,
                patient_user_id or None,
                json.dumps(patient_profile, ensure_ascii=False),
                json.dumps(recorded_videos, ensure_ascii=False),
                json.dumps(result, ensure_ascii=False),
                timestamp,
            ),
        )
    return {"analysisId": analysis_id, "packageKey": package_key, "createdAt": timestamp}


def save_uploaded_video_record(
    owner_user_id: str | None,
    package_key: str,
    action_id: str,
    storage: dict[str, Any],
    size_bytes: int | None = None,
    quality: dict[str, Any] | None = None,
) -> dict[str, Any]:
    init_db()
    video_id = str(uuid.uuid4())
    timestamp = now_iso()
    bucket = storage.get("bucket")
    object_key = storage.get("objectKey")
    if not bucket or not object_key:
        raise ValueError("storage bucket and objectKey are required")

    if is_postgres():
        with connect() as conn:
            conn.execute(
                """
                INSERT INTO public.uploaded_videos
                    (id, owner_user_id, package_key, action_id, bucket_id, object_path, mime_type, size_bytes, quality_json, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, now())
                ON CONFLICT(bucket_id, object_path) DO UPDATE SET
                    quality_json = excluded.quality_json
                """,
                (
                    video_id,
                    _uuid_or_none(owner_user_id),
                    package_key,
                    action_id,
                    bucket,
                    object_key,
                    storage.get("contentType"),
                    size_bytes,
                    json.dumps(quality or {}, ensure_ascii=False),
                ),
            )
        return {"videoId": video_id, "createdAt": timestamp}

    ph = placeholder()
    with connect() as conn:
        conn.execute(
            f"""
            INSERT INTO uploaded_videos
                (id, owner_user_id, package_key, action_id, bucket_id, object_path, mime_type, size_bytes, quality_json, created_at)
            VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph})
            ON CONFLICT(bucket_id, object_path) DO UPDATE SET
                quality_json = excluded.quality_json
            """,
            (
                video_id,
                owner_user_id,
                package_key,
                action_id,
                bucket,
                object_key,
                storage.get("contentType"),
                size_bytes,
                json.dumps(quality or {}, ensure_ascii=False),
                timestamp,
            ),
        )
    return {"videoId": video_id, "createdAt": timestamp}


def save_exercise_plan(
    patient_user_id: str | None,
    analysis_id: str | None,
    package_key: str,
    plan: dict[str, Any],
    status: str = "pending_therapist_review",
) -> dict[str, Any]:
    init_db()
    plan_id = str(uuid.uuid4())
    timestamp = now_iso()
    if is_postgres():
        with connect() as conn:
            conn.execute(
                """
                INSERT INTO public.exercise_plans
                    (id, patient_user_id, analysis_id, package_key, plan_json, status, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, now(), now())
                """,
                (
                    plan_id,
                    _uuid_or_none(patient_user_id),
                    _uuid_or_none(analysis_id),
                    package_key,
                    json.dumps(plan, ensure_ascii=False),
                    status,
                ),
            )
        return {"planId": plan_id, "status": status, "createdAt": timestamp}

    ph = placeholder()
    with connect() as conn:
        conn.execute(
            f"""
            CREATE TABLE IF NOT EXISTS exercise_plans (
                id TEXT PRIMARY KEY,
                patient_user_id TEXT,
                analysis_id TEXT,
                package_key TEXT NOT NULL,
                plan_json TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            f"""
            INSERT INTO exercise_plans
                (id, patient_user_id, analysis_id, package_key, plan_json, status, created_at, updated_at)
            VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph})
            """,
            (
                plan_id,
                patient_user_id,
                analysis_id,
                package_key,
                json.dumps(plan, ensure_ascii=False),
                status,
                timestamp,
                timestamp,
            ),
        )
    return {"planId": plan_id, "status": status, "createdAt": timestamp}


def save_match(
    patient_user_id: str | None,
    therapist_user_id: str | None,
    analysis_id: str | None,
    matched_person: dict[str, Any],
    status: str = "waiting_for_therapist",
) -> dict[str, Any]:
    init_db()
    match_id = str(uuid.uuid4())
    timestamp = now_iso()
    ph = placeholder()
    if is_postgres():
        with connect() as conn:
            conn.execute(
                """
                INSERT INTO public.care_matches
                    (id, patient_user_id, therapist_user_id, analysis_id, matched_person_json, status, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s::public.axonai_match_status, now(), now())
                """,
                (
                    match_id,
                    _uuid_or_none(patient_user_id),
                    _uuid_or_none(therapist_user_id),
                    _uuid_or_none(analysis_id),
                    json.dumps(matched_person, ensure_ascii=False),
                    status,
                ),
            )
        return {"matchId": match_id, "status": status, "createdAt": timestamp}
    with connect() as conn:
        conn.execute(
            f"""
            INSERT INTO care_matches
                (id, patient_user_id, therapist_user_id, analysis_id, matched_person_json, status, created_at, updated_at)
            VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph})
            """,
            (
                match_id,
                patient_user_id or None,
                therapist_user_id or None,
                analysis_id or None,
                json.dumps(matched_person, ensure_ascii=False),
                status,
                timestamp,
                timestamp,
            ),
        )
    return {"matchId": match_id, "status": status, "createdAt": timestamp}


def list_therapists() -> list[dict[str, Any]]:
    init_db()
    if is_postgres():
        with connect() as conn:
            rows = conn.execute(
                """
                SELECT profiles.user_id AS id, profiles.email, profiles.phone, therapist_profiles.profile_json
                FROM public.therapist_profiles
                JOIN public.profiles ON profiles.user_id = therapist_profiles.user_id
                ORDER BY therapist_profiles.updated_at DESC
                """
            ).fetchall()
        return [
            {
                "userId": str(row["id"]),
                "identifier": row["email"] or row["phone"] or str(row["id"]),
                "profile": row["profile_json"] if isinstance(row["profile_json"], dict) else json.loads(row["profile_json"]),
            }
            for row in rows
        ]
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT users.id, users.identifier, therapist_profiles.profile_json
            FROM users
            JOIN therapist_profiles ON therapist_profiles.user_id = users.id
            WHERE users.role = 'therapist'
            ORDER BY users.updated_at DESC
            """
        ).fetchall()
    return [{"userId": row["id"], "identifier": row["identifier"], "profile": json.loads(row["profile_json"])} for row in rows]


def database_status() -> dict[str, Any]:
    if is_postgres():
        with connect() as conn:
            row = conn.execute(
                """
                SELECT
                    current_database() AS database,
                    current_schema() AS schema,
                    to_regclass('public.package_analyses') AS package_analyses_table
                """
            ).fetchone()
        return {
            "provider": "postgres",
            "target": "DATABASE_URL",
            "database": row["database"],
            "schema": row["schema"],
            "packageAnalysesTable": str(row["package_analyses_table"]),
        }
    return {"provider": "sqlite", "target": str(DB_PATH)}
