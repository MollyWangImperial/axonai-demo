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

from fastapi import HTTPException, UploadFile


UPLOAD_ROOT = Path(os.getenv("AXONAI_UPLOAD_ROOT", Path(__file__).resolve().parent / "axonai_rehab_runtime" / "uploads" / "upper_limb_package"))
KEEP_UPLOADED_VIDEOS = os.getenv("AXONAI_KEEP_UPLOADED_VIDEOS", "false").strip().lower() in {"1", "true", "yes"}
VALID_VIDEO_EXTENSIONS = {".mp4", ".mov", ".m4v", ".webm", ".avi", ".mkv"}


def object_storage_enabled() -> bool:
    return bool(os.getenv("AXONAI_OBJECT_STORAGE_BUCKET"))


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


def save_upload_for_analysis(upload_file: UploadFile | None, action_id: str) -> dict[str, Any]:
    if upload_file is None:
        return {"path": None, "storage": None}

    suffix = Path(upload_file.filename or "").suffix.lower() or ".mp4"
    if suffix not in VALID_VIDEO_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported extension for {action_id}: {suffix}")

    UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
    object_key = f"upper-limb/{action_id}/{uuid.uuid4().hex}{suffix}"
    destination = UPLOAD_ROOT / object_key.replace("/", "_")
    with destination.open("wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)

    storage: dict[str, Any] | None = None
    bucket = os.getenv("AXONAI_OBJECT_STORAGE_BUCKET")
    if bucket:
        client = _storage_client()
        content_type = upload_file.content_type or "application/octet-stream"
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

    return {"path": str(destination), "storage": storage}


def cleanup_analysis_file(path_value: str | None) -> None:
    if KEEP_UPLOADED_VIDEOS or not path_value:
        return
    try:
        Path(path_value).unlink(missing_ok=True)
    except OSError:
        pass
