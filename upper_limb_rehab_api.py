# -*- coding: utf-8 -*-
"""FastAPI endpoint for upper-limb rehab analysis.

Run standalone:

    uvicorn upper_limb_rehab_api:app --host 0.0.0.0 --port 8020

Or mount in the project API:

    from upper_limb_rehab_api import router as upper_limb_rehab_router
    app.include_router(upper_limb_rehab_router)
"""

from __future__ import annotations

from typing import Any

import json
from pathlib import Path

from fastapi import APIRouter, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from upper_limb_rehab_algorithm import ACTION_IDS, evaluate_upper_limb_collection, inspect_video, sample_manifest
from upper_limb_video_metrics import analyze_upper_limb_action_video
from patient_shoulder_flexion_api import analyze_shoulder_flexion_video
from axonai_rehab_db import save_uploaded_video_record
from axonai_video_storage import cleanup_analysis_file, save_upload_for_analysis

class UpperLimbVideoRecord(BaseModel):
    path: str | None = None
    uri: str | None = None
    filename: str | None = None
    measuredMetrics: dict[str, Any] = Field(default_factory=dict)


class UpperLimbAnalyzeRequest(BaseModel):
    patientProfile: dict[str, Any] = Field(default_factory=dict)
    savedFiles: dict[str, UpperLimbVideoRecord] = Field(default_factory=dict)
    actions: dict[str, UpperLimbVideoRecord] = Field(default_factory=dict)
    measuredMetrics: dict[str, dict[str, Any]] = Field(default_factory=dict)


router = APIRouter(prefix="/api/upper-limb", tags=["upper-limb-rehab"])


@router.get("/health")
def health() -> dict[str, Any]:
    return {"status": "ok", "algorithm": "upper-limb-v1.0", "requiredActions": ACTION_IDS}


@router.get("/sample")
def sample() -> dict[str, Any]:
    return evaluate_upper_limb_collection(sample_manifest())


@router.post("/analyze")
def analyze_upper_limb(payload: UpperLimbAnalyzeRequest) -> dict[str, Any]:
    try:
        actions: dict[str, Any] = {}
        source_records = payload.actions or payload.savedFiles

        for action_id in ACTION_IDS:
            record_model = source_records.get(action_id)
            record = record_model.model_dump() if record_model else {}
            if not record.get("path") and record.get("uri", "").startswith("file://"):
                record["path"] = record["uri"].replace("file://", "", 1)
            if action_id in payload.measuredMetrics:
                record["measuredMetrics"] = payload.measuredMetrics[action_id]
            actions[action_id] = record

        manifest = {
            "patientProfile": payload.patientProfile,
            "actions": actions,
        }
        return evaluate_upper_limb_collection(manifest)
    except Exception as exc:  # pragma: no cover - defensive API boundary
        raise HTTPException(status_code=500, detail=f"Upper-limb analysis failed: {exc}") from exc


def _save_optional_upload(upload_file: UploadFile | None, action_id: str) -> str | None:
    return save_upload_for_analysis(upload_file, action_id)["path"]


def _metrics_from_shoulder_flexion_result(result: dict[str, Any]) -> dict[str, Any]:
    key_metrics = result.get("key_metrics", {})
    quality = result.get("pose_quality", {})
    compensations = result.get("compensations", [])
    compensation_text = " ".join(str(item) for item in compensations).lower()
    return {
        "shoulderFlexionRomDeg": key_metrics.get("peak_shoulder_flexion_deg"),
        "targetMet": key_metrics.get("target_reached", False),
        "trunkExtensionDeg": 16 if "trunk" in compensation_text else 0,
        "shoulderHikeCm": 4.0 if "shoulder" in compensation_text or "hike" in compensation_text else 0,
        "smoothnessScore": 0.65,
        "meanKeypointConfidence": quality.get("median_visibility", quality.get("mean_visibility", 0.78)),
        "landmarkMissingRatio": 1 - float(quality.get("valid_frame_ratio", 0.9) or 0.9),
        "repetitionConsistency": 0.75,
    }


def _quality_issue_tips(issues: list[str], metric_error: str | None = None) -> list[str]:
    tips: list[str] = []
    issue_text = " ".join(issues).lower()
    if "too short" in issue_text:
        tips.append("Record the full movement from start to finish, including the return to the starting position.")
    if "resolution" in issue_text or "landmark" in issue_text or metric_error:
        tips.append("Move the phone farther away so the full affected arm, shoulder, elbow, wrist, and upper trunk stay in view.")
    if "dark" in issue_text:
        tips.append("Turn on more light or face a brighter area so the arm is clearly visible.")
    if "blurry" in issue_text or "unstable" in issue_text:
        tips.append("Keep the phone still on a table/tripod and move slowly.")
    if not tips:
        tips.append("Keep the full upper body in frame, use good lighting, and repeat the movement slowly.")
    return tips


def _quality_response(action_id: str, path: str, side: str) -> dict[str, Any]:
    quality = inspect_video(path)
    metrics: dict[str, Any] = {}
    metric_error: str | None = None
    try:
        if action_id == "shoulder_flexion":
            shoulder_result = analyze_shoulder_flexion_video(
                video_path=Path(path),
                side=side,
                sample_hz=8,
                min_detection_confidence=0.3,
                min_tracking_confidence=0.3,
            )
            metrics = _metrics_from_shoulder_flexion_result(shoulder_result)
        else:
            metrics = analyze_upper_limb_action_video(action_id, Path(path), side=side)
    except Exception as exc:
        metric_error = str(exc)

    mean_keypoint = float(metrics.get("meanKeypointConfidence", 0.0) or 0.0)
    missing_ratio = float(metrics.get("landmarkMissingRatio", 1.0) or 1.0)
    repetition = float(metrics.get("repetitionConsistency", 0.0) or 0.0)
    keypoint_score = int(max(0, min(100, mean_keypoint * 45 + (1 - missing_ratio) * 35 + repetition * 20)))
    combined_score = int(round(quality.score * 0.55 + keypoint_score * 0.45)) if metrics else min(quality.score, 54)
    issues = list(quality.issues)

    if metric_error:
        issues.append("Arm keypoints were not detected reliably.")
    if metrics and mean_keypoint < 0.55:
        issues.append("Arm keypoint confidence is low.")
    if metrics and missing_ratio > 0.35:
        issues.append("Some required arm landmarks are missing.")

    passed = quality.status == "pass" and metrics and combined_score >= 70 and mean_keypoint >= 0.55 and missing_ratio <= 0.35
    status = "pass" if passed else "fail"
    return {
        "actionId": action_id,
        "passed": passed,
        "status": status,
        "score": combined_score,
        "videoQuality": {
            "status": quality.status,
            "score": quality.score,
            "issues": quality.issues,
            "metadata": quality.metadata,
        },
        "keypointQuality": {
            "meanKeypointConfidence": mean_keypoint if metrics else None,
            "landmarkMissingRatio": missing_ratio if metrics else None,
            "repetitionConsistency": repetition if metrics else None,
            "metricExtractionError": metric_error,
        },
        "issues": issues,
        "patientMessage": "Video quality passed. You can continue to the next movement." if passed else "Please retake this movement video.",
        "tips": _quality_issue_tips(issues, metric_error),
    }


@router.post("/quality-check-video")
async def quality_check_upper_limb_video(
    action_id: str = Form(...),
    affected_side: str = Form("auto"),
    video: UploadFile = File(...),
) -> dict[str, Any]:
    if action_id not in ACTION_IDS:
        raise HTTPException(status_code=400, detail=f"Unknown upper-limb action: {action_id}")
    saved = save_upload_for_analysis(video, action_id, package_key="upper", store_video=False)
    try:
        if not saved["path"]:
            raise HTTPException(status_code=400, detail="No video uploaded.")
        return _quality_response(action_id, saved["path"], affected_side)
    finally:
        cleanup_analysis_file(saved.get("path"))


@router.post("/analyze-videos")
async def analyze_upper_limb_videos(
    patient_profile_json: str = Form("{}"),
    patient_user_id: str | None = Form(None),
    affected_side: str = Form("auto"),
    action_ids_json: str = Form("[]"),
    videos: list[UploadFile] = File(default=[]),
    shoulder_flexion: UploadFile | None = File(None),
    shoulder_abduction: UploadFile | None = File(None),
    hand_to_mouth: UploadFile | None = File(None),
    forward_reach: UploadFile | None = File(None),
    elbow_flex_ext: UploadFile | None = File(None),
    forearm_pronation_supination: UploadFile | None = File(None),
    wrist_extension: UploadFile | None = File(None),
    grasp_release: UploadFile | None = File(None),
    finger_nose_target: UploadFile | None = File(None),
) -> dict[str, Any]:
    try:
        patient_profile = json.loads(patient_profile_json or "{}")
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="patient_profile_json must be valid JSON") from exc

    try:
        action_ids = json.loads(action_ids_json or "[]")
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="action_ids_json must be valid JSON") from exc
    if not isinstance(action_ids, list):
        raise HTTPException(status_code=400, detail="action_ids_json must be a JSON list")

    uploads = {
        "shoulder_flexion": shoulder_flexion,
        "shoulder_abduction": shoulder_abduction,
        "hand_to_mouth": hand_to_mouth,
        "forward_reach": forward_reach,
        "elbow_flex_ext": elbow_flex_ext,
        "forearm_pronation_supination": forearm_pronation_supination,
        "wrist_extension": wrist_extension,
        "grasp_release": grasp_release,
        "finger_nose_target": finger_nose_target,
    }
    if videos:
        inferred_ids = []
        for upload_file in videos:
            stem = Path(upload_file.filename or "").stem
            inferred = next((action_id for action_id in uploads if stem.startswith(action_id)), stem)
            inferred_ids.append(inferred)
        mapped_ids = [str(item) for item in action_ids] if len(action_ids) == len(videos) else inferred_ids
        for action_id, upload_file in zip(mapped_ids, videos):
            if action_id in uploads:
                uploads[action_id] = upload_file
    actions: dict[str, Any] = {}
    stored_videos: dict[str, Any] = {}
    for action_id, upload_file in uploads.items():
        saved = save_upload_for_analysis(upload_file, action_id, owner_user_id=patient_user_id, package_key="upper")
        actions[action_id] = {"path": saved["path"], "measuredMetrics": {}, "storage": saved["storage"]}
        if saved["storage"]:
            stored_videos[action_id] = {
                **saved["storage"],
                "sizeBytes": saved.get("sizeBytes"),
            }
            if not saved["storage"].get("error"):
                try:
                    stored_videos[action_id]["metadata"] = save_uploaded_video_record(
                        owner_user_id=patient_user_id,
                        package_key="upper",
                        action_id=action_id,
                        storage=saved["storage"],
                        size_bytes=saved.get("sizeBytes"),
                        quality={},
                    )
                except Exception as exc:
                    stored_videos[action_id]["metadataError"] = str(exc)

    if actions["shoulder_flexion"]["path"]:
        try:
            shoulder_result = analyze_shoulder_flexion_video(
                video_path=Path(actions["shoulder_flexion"]["path"]),
                side=affected_side,
                sample_hz=12,
                min_detection_confidence=0.3,
                min_tracking_confidence=0.3,
            )
            actions["shoulder_flexion"]["measuredMetrics"] = _metrics_from_shoulder_flexion_result(shoulder_result)
            actions["shoulder_flexion"]["sourceAnalysis"] = shoulder_result
        except Exception as exc:
            actions["shoulder_flexion"]["metricExtractionError"] = str(exc)

    for action_id, record in actions.items():
        if action_id == "shoulder_flexion" or not record.get("path"):
            continue
        try:
            metrics = analyze_upper_limb_action_video(action_id, Path(record["path"]), side=affected_side)
            if metrics:
                record["measuredMetrics"] = metrics
        except Exception as exc:
            record["metricExtractionError"] = str(exc)

    result = evaluate_upper_limb_collection({"patientProfile": patient_profile, "actions": actions})
    result["storedVideos"] = stored_videos
    for record in actions.values():
        cleanup_analysis_file(record.get("path"))
    return result


app = FastAPI(title="AxonAI Upper Limb Rehab Analysis API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)
