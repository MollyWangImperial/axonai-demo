# -*- coding: utf-8 -*-
"""Temporary and object-storage handling for uploaded rehab videos.

The analysis pipeline needs local files because OpenCV/MediaPipe/OpenSim read
from disk. In production, set the S3-compatible environment variables below so
the original upload is copied to object storage, then the local temp file is
deleted after analysis.

Supported env vars:
    AXONAI_OBJECT_STORAGE_BUCKET
    AXONAI_OBJECT_STORAGE_ENDPOINT_URL   # Supabase Storage S3 endpoint or AWS S3 endpoint
    AXONAI_OBJECT_STORAGE_REGION
    AXONAI_OBJECT_STORAGE_ACCESS_KEY_ID
    AXONAI_OBJECT_STORAGE_SECRET_ACCESS_KEY
    AXONAI_OBJECT_STORAGE_PUBLIC_BASE_URL
"""

from __future__ import annotations

import os
import shutil
import uuid
from pathlib import Path
from typing import Any
from urllib import error, parse, request

from fastapi import HTTPException, UploadFile


UPLOAD_ROOT = Path(os.getenv("AXONAI_UPLOAD_ROOT", Path(__file__).resolve().parent / "axonai_rehab_runtime" / "uploads" / "upper_limb_package"))
KEEP_UPLOADED_VIDEOS = os.getenv("AXONAI_KEEP_UPLOADED_VIDEOS", "false").strip().lower() in {"1", "true", "yes"}
VALID_VIDEO_EXTENSIONS = {".mp4", ".mov", ".m4v", ".webm", ".avi", ".mkv"}
DEFAULT_SUPABASE_BUCKET = "axonai-rehab-videos"


def object_storage_enabled() -> bool:
    return bool(os.getenv("AXONAI_OBJECT_STORAGE_BUCKET") or _supabase_storage_enabled())


def _supabase_storage_enabled() -> bool:
    return bool(os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_SERVICE_ROLE_KEY"))


def _storage_client():
    try:
        import boto3
    except ImportError as exc:
        raise RuntimeError("boto3 is required when AXONAI_OBJECT_STORAGE_BUCKET is configured") from exc

    return boto3.client(
        "s3",
        region_name=os.getenv("AXONAI_OBJECT_STORAGE_REGION") or "auto",
        endpoint_url=os.getenv("AXONAI_OBJECT_STORAGE_ENDPOINT_URL") or None,
        aws_access_key_id=os.getenv("AXONAI_OBJECT_STORAGE_ACCESS_KEY_ID") or None,
        aws_secret_access_key=os.getenv("AXONAI_OBJECT_STORAGE_SECRET_ACCESS_KEY") or None,
    )


def _public_url(bucket: str, object_key: str) -> str | None:
    base_url = os.getenv("AXONAI_OBJECT_STORAGE_PUBLIC_BASE_URL", "").rstrip("/")
    if not base_url:
        return None
    return f"{base_url}/{object_key}"


def _safe_segment(value: str | None, fallback: str) -> str:
    raw = (value or fallback).strip().replace("\\", "/")
    cleaned = "".join(ch if ch.isalnum() or ch in {"-", "_", "."} else "_" for ch in raw)
    return cleaned.strip("._/") or fallback


def _supabase_object_url(bucket: str, object_key: str) -> str:
    base_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    return f"{base_url}/storage/v1/object/{parse.quote(bucket, safe='')}/{parse.quote(object_key, safe='/')}"


def _upload_to_supabase_storage(local_path: Path, bucket: str, object_key: str, content_type: str) -> dict[str, Any]:
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not os.getenv("SUPABASE_URL") or not service_key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for Supabase Storage uploads")

    url = _supabase_object_url(bucket, object_key)
    data = local_path.read_bytes()
    upload_request = request.Request(
        url,
        data=data,
        method="POST",
        headers={
            "Authorization": f"Bearer {service_key}",
            "apikey": service_key,
            "Content-Type": content_type,
            "x-upsert": "true",
        },
    )
    try:
        with request.urlopen(upload_request, timeout=60) as response:
            response.read()
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Supabase Storage upload failed ({exc.code}): {detail}") from exc
    except error.URLError as exc:
        raise RuntimeError(f"Supabase Storage upload failed: {exc.reason}") from exc

    return {
        "provider": "supabase-storage",
        "bucket": bucket,
        "objectKey": object_key,
        "contentType": content_type,
        "publicUrl": None,
    }


def save_upload_for_analysis(
    upload_file: UploadFile | None,
    action_id: str,
    *,
    owner_user_id: str | None = None,
    package_key: str = "upper",
    store_video: bool = True,
) -> dict[str, Any]:
    if upload_file is None:
        return {"path": None, "storage": None}

    suffix = Path(upload_file.filename or "").suffix.lower() or ".mp4"
    if suffix not in VALID_VIDEO_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported extension for {action_id}: {suffix}")

    UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
    owner_segment = _safe_segment(owner_user_id, "unassigned")
    package_segment = _safe_segment(package_key, "upper")
    action_segment = _safe_segment(action_id, "unknown_action")
    object_key = f"{owner_segment}/{package_segment}/{action_segment}/{uuid.uuid4().hex}{suffix}"
    destination = UPLOAD_ROOT / object_key.replace("/", "_")
    with destination.open("wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)

    storage: dict[str, Any] | None = None
    content_type = upload_file.content_type or "application/octet-stream"
    supabase_bucket = os.getenv("AXONAI_SUPABASE_VIDEO_BUCKET") or os.getenv("SUPABASE_STORAGE_BUCKET") or DEFAULT_SUPABASE_BUCKET
    if store_video and _supabase_storage_enabled():
        try:
            storage = _upload_to_supabase_storage(destination, supabase_bucket, object_key, content_type)
        except RuntimeError as exc:
            storage = {
                "provider": "supabase-storage",
                "bucket": supabase_bucket,
                "objectKey": object_key,
                "contentType": content_type,
                "error": str(exc),
            }

    bucket = os.getenv("AXONAI_OBJECT_STORAGE_BUCKET")
    if store_video and bucket and (storage is None or storage.get("error")):
        client = _storage_client()
        client.upload_file(
            str(destination),
            bucket,
            object_key,
            ExtraArgs={"ContentType": content_type},
        )
        storage = {
            "provider": "s3-compatible",
            "bucket": bucket,
            "objectKey": object_key,
            "contentType": content_type,
            "publicUrl": _public_url(bucket, object_key),
        }

    return {
        "path": str(destination),
        "storage": storage,
        "sizeBytes": destination.stat().st_size,
        "contentType": content_type,
        "objectKey": object_key,
    }


def cleanup_analysis_file(path_value: str | None) -> None:
    if KEEP_UPLOADED_VIDEOS or not path_value:
        return
    try:
        Path(path_value).unlink(missing_ok=True)
    except OSError:
        pass
