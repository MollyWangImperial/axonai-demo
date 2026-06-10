# -*- coding: utf-8 -*-
"""FastAPI router for non-upper-limb rehab package analysis.

The first production-ready path for these packages accepts measured metrics
from the app/video pipeline. Package-specific video extractors can be added
behind the same request shape later.
"""

from __future__ import annotations

from typing import Any, Literal

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

from rehab_packages_algorithm import PACKAGE_DEFINITIONS, evaluate_package_collection, sample_manifest
from upper_limb_rehab_algorithm import inspect_video
from axonai_video_storage import cleanup_analysis_file, save_upload_for_analysis


PackageKey = Literal["hand", "gait", "balance", "trunk"]


class PackageActionRecord(BaseModel):
    path: str | None = None
    uri: str | None = None
    filename: str | None = None
    measuredMetrics: dict[str, Any] = Field(default_factory=dict)
    quality: dict[str, Any] = Field(default_factory=dict)


class PackageAnalyzeRequest(BaseModel):
    patientProfile: dict[str, Any] = Field(default_factory=dict)
    actions: dict[str, PackageActionRecord] = Field(default_factory=dict)
    savedFiles: dict[str, PackageActionRecord] = Field(default_factory=dict)
    measuredMetrics: dict[str, dict[str, Any]] = Field(default_factory=dict)


router = APIRouter(prefix="/api/rehab-packages", tags=["rehab-packages"])


PACKAGE_QUALITY_TIPS = {
    "hand": [
        "Keep the whole hand and wrist close to the camera but fully in frame.",
        "Use a plain table background so fingers and objects are easy to see.",
        "Record the full grasp, release, or finger task slowly."
    ],
    "gait": [
        "Place the phone far enough away to show the whole body and both feet.",
        "Keep the walking path well lit and avoid cutting off the feet.",
        "Use supervision or an assistive device if balance is uncertain."
    ],
    "balance": [
        "Keep the whole body and feet in view during standing or reaching.",
        "Use a stable support nearby and record in a well-lit area.",
        "Stop and retake only if safe; do not practice balance tasks alone if you may fall."
    ],
    "trunk": [
        "Keep the head, shoulders, trunk, hips, and support surface in view.",
        "Record the complete sitting, reaching, turning, or bed-mobility task.",
        "Use a side/front angle that shows trunk movement clearly."
    ],
}


def _package_quality_response(package_key: str, action_id: str, path: str) -> dict[str, Any]:
    quality = inspect_video(path)
    issues = list(quality.issues)
    if quality.metadata.get("durationSec", 0) and quality.metadata.get("durationSec", 0) < 2.5:
        issues.append("The task may not include a complete movement repetition.")
    passed = quality.status == "pass" and quality.score >= 70
    return {
        "packageKey": package_key,
        "actionId": action_id,
        "passed": passed,
        "status": "pass" if passed else "fail",
        "score": quality.score,
        "videoQuality": {
            "status": quality.status,
            "score": quality.score,
            "issues": quality.issues,
            "metadata": quality.metadata,
        },
        "issues": issues,
        "patientMessage": "Video quality passed. You can continue to the next movement." if passed else "Please retake this movement video.",
        "tips": PACKAGE_QUALITY_TIPS.get(package_key, ["Keep the full body part in view, use good lighting, and record the full movement."]),
        "ruleType": "general video-quality gate; package-specific pose metrics still require the package video extractor",
    }


@router.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "packages": {
            key: {
                "title": definition.title,
                "algorithmVersion": f"{key}-package-v1.0",
                "requiredActions": definition.actions,
            }
            for key, definition in PACKAGE_DEFINITIONS.items()
        },
    }


@router.get("/{package_key}/sample")
def package_sample(package_key: PackageKey) -> dict[str, Any]:
    return evaluate_package_collection(package_key, sample_manifest(package_key))


@router.post("/{package_key}/quality-check-video")
async def quality_check_package_video(
    package_key: PackageKey,
    action_id: str = Form(...),
    video: UploadFile = File(...),
) -> dict[str, Any]:
    definition = PACKAGE_DEFINITIONS[package_key]
    if action_id not in definition.actions:
        raise HTTPException(status_code=400, detail=f"Unknown action for {package_key}: {action_id}")
    saved = save_upload_for_analysis(video, action_id, package_key=package_key, store_video=False)
    try:
        if not saved["path"]:
            raise HTTPException(status_code=400, detail="No video uploaded.")
        return _package_quality_response(package_key, action_id, saved["path"])
    finally:
        cleanup_analysis_file(saved.get("path"))


@router.post("/{package_key}/analyze")
def analyze_package(package_key: PackageKey, payload: PackageAnalyzeRequest) -> dict[str, Any]:
    try:
        definition = PACKAGE_DEFINITIONS[package_key]
        source_records = payload.actions or payload.savedFiles
        actions: dict[str, Any] = {}
        for action_id in definition.actions:
            record_model = source_records.get(action_id)
            record = record_model.model_dump() if record_model else {}
            if not record.get("path") and str(record.get("uri", "")).startswith("file://"):
                record["path"] = str(record["uri"]).replace("file://", "", 1)
            if action_id in payload.measuredMetrics:
                record["measuredMetrics"] = payload.measuredMetrics[action_id]
            actions[action_id] = record

        manifest = {
            "patientProfile": payload.patientProfile,
            "actions": actions,
        }
        return evaluate_package_collection(package_key, manifest)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=f"Unknown package: {package_key}") from exc
    except Exception as exc:  # pragma: no cover - defensive API boundary
        raise HTTPException(status_code=500, detail=f"{package_key} analysis failed: {exc}") from exc
