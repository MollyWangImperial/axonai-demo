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
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


DB_PATH = Path(os.getenv("AXONAI_REHAB_DB_PATH", Path(__file__).resolve().parent / "axonai_rehab_runtime" / "axonai_rehab.sqlite3"))
DATABASE_URL = os.getenv("AXONAI_DATABASE_URL") or os.getenv("DATABASE_URL")

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
        for statement in SCHEMA_STATEMENTS:
            conn.execute(statement)


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


def create_user(role: str, identifier: str, password: str) -> dict[str, Any]:
    init_db()
    normalized = normalize_identifier(identifier)
    password_hash, password_salt = hash_password(password)
    user_id = str(uuid.uuid4())
    timestamp = now_iso()
    ph = placeholder()
    try:
        with connect() as conn:
            conn.execute(
                f"""
                INSERT INTO users (id, role, identifier, password_hash, password_salt, created_at, updated_at)
                VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph})
                """,
                (user_id, role, normalized, password_hash, password_salt, timestamp, timestamp),
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


def database_status() -> dict[str, str]:
    if is_postgres():
        return {"provider": "postgres", "target": "DATABASE_URL"}
    return {"provider": "sqlite", "target": str(DB_PATH)}
