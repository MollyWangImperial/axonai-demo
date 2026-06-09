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

from upper_limb_rehab_algorithm import ACTION_IDS, evaluate_upper_limb_collection, sample_manifest
from upper_limb_video_metrics import analyze_upper_limb_action_video
from patient_shoulder_flexion_api import analyze_shoulder_flexion_video
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


@router.post("/analyze-videos")
async def analyze_upper_limb_videos(
    patient_profile_json: str = Form("{}"),
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
        saved = save_upload_for_analysis(upload_file, action_id)
        actions[action_id] = {"path": saved["path"], "measuredMetrics": {}, "storage": saved["storage"]}
        if saved["storage"]:
            stored_videos[action_id] = saved["storage"]

    if actions["shoulder_flexion"]["path"]:
        try:
            shoulder_result = analyze_shoulder_flexion_video(
                video_path=Path(actions["shoulder_flexion"]["path"]),
                side=affected_side,
                sample_hz=30,
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
