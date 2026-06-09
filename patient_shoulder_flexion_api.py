# -*- coding: utf-8 -*-
"""Video endpoint for shoulder flexion-to-90 assessment.

This module can run as a standalone FastAPI service:

    uvicorn patient_shoulder_flexion_api:app --host 0.0.0.0 --port 8010

It also exposes ``router`` so it can be mounted by the existing project API:

    from patient_shoulder_flexion_api import router as shoulder_flexion_router
    app.include_router(shoulder_flexion_router)

Clinical scope:
    The endpoint estimates movement quality from video landmarks. It does not
    directly measure maximum voluntary anterior-deltoid force. True strength
    grading still needs clinician resistance, dynamometry, or EMG.
"""

from __future__ import annotations

import math
import shutil
import uuid
from dataclasses import dataclass
from pathlib import Path
from statistics import median
from typing import Any

import cv2
import numpy as np
from fastapi import APIRouter, FastAPI, File, Form, HTTPException, UploadFile


UPLOAD_ROOT = Path(__file__).resolve().parent / ".web" / "public" / "uploads" / "upper_limb"
VALID_VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm"}

POSE_NAMES = {
    "left_shoulder": 11,
    "right_shoulder": 12,
    "left_elbow": 13,
    "right_elbow": 14,
    "left_wrist": 15,
    "right_wrist": 16,
    "left_index": 19,
    "right_index": 20,
    "left_hip": 23,
    "right_hip": 24,
}


@dataclass
class PoseFrame:
    timestamp_ms: int
    landmarks: dict[str, np.ndarray]
    visibility: dict[str, float]
    source: str


def _as_point(landmark: Any) -> np.ndarray:
    return np.array(
        [
            float(getattr(landmark, "x", 0.0)),
            float(getattr(landmark, "y", 0.0)),
            float(getattr(landmark, "z", 0.0)),
        ],
        dtype=float,
    )


def _visibility(landmark: Any) -> float:
    return float(getattr(landmark, "visibility", getattr(landmark, "presence", 1.0)))


def _pose_frame_from_landmarks(
    raw_landmarks: list[Any],
    timestamp_ms: int,
    source: str,
) -> PoseFrame | None:
    if len(raw_landmarks) <= max(POSE_NAMES.values()):
        return None

    landmarks = {name: _as_point(raw_landmarks[idx]) for name, idx in POSE_NAMES.items()}
    visibility = {name: _visibility(raw_landmarks[idx]) for name, idx in POSE_NAMES.items()}
    return PoseFrame(
        timestamp_ms=timestamp_ms,
        landmarks=landmarks,
        visibility=visibility,
        source=source,
    )


def _norm(vector: np.ndarray) -> float:
    return float(np.linalg.norm(vector))


def _unit(vector: np.ndarray) -> np.ndarray:
    length = _norm(vector)
    if length < 1e-9:
        return np.zeros(3, dtype=float)
    return vector / length


def _angle_deg(vector_a: np.ndarray, vector_b: np.ndarray) -> float:
    a = _unit(vector_a)
    b = _unit(vector_b)
    if _norm(a) < 1e-9 or _norm(b) < 1e-9:
        return float("nan")
    dot = float(np.clip(np.dot(a, b), -1.0, 1.0))
    return float(math.degrees(math.acos(dot)))


def _midpoint(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    return (a + b) / 2.0


def _median_point(points: list[np.ndarray]) -> np.ndarray:
    if not points:
        return np.zeros(3, dtype=float)
    return np.median(np.vstack(points), axis=0)


def _side_prefix(side: str) -> str:
    if side not in {"left", "right"}:
        raise ValueError("side must be 'left' or 'right'")
    return side


def _trunk_points(frame: PoseFrame) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    lm = frame.landmarks
    mid_shoulder = _midpoint(lm["left_shoulder"], lm["right_shoulder"])
    mid_hip = _midpoint(lm["left_hip"], lm["right_hip"])
    trunk = mid_shoulder - mid_hip
    return mid_shoulder, mid_hip, trunk


def _shoulder_flexion_angle(frame: PoseFrame, side: str) -> float:
    side = _side_prefix(side)
    lm = frame.landmarks
    _, _, trunk = _trunk_points(frame)
    humerus = lm[f"{side}_elbow"] - lm[f"{side}_shoulder"]

    # Arm-at-side is roughly opposite the trunk-up axis; 90 deg is humerus
    # perpendicular to trunk. This is an elevation/flexion proxy from landmarks.
    angle = _angle_deg(humerus, -trunk)
    if math.isnan(angle):
        return float("nan")
    return float(np.clip(angle, 0.0, 180.0))


def _elbow_angle(frame: PoseFrame, side: str) -> float:
    side = _side_prefix(side)
    lm = frame.landmarks
    upper = lm[f"{side}_shoulder"] - lm[f"{side}_elbow"]
    lower = lm[f"{side}_wrist"] - lm[f"{side}_elbow"]
    return _angle_deg(upper, lower)


def _movement_plane_deviation(frame: PoseFrame, side: str) -> float:
    side = _side_prefix(side)
    lm = frame.landmarks
    _, _, trunk = _trunk_points(frame)
    shoulder_axis = lm["right_shoulder"] - lm["left_shoulder"]
    humerus = lm[f"{side}_elbow"] - lm[f"{side}_shoulder"]

    lateral = _unit(shoulder_axis)
    humerus_unit = _unit(humerus)
    if _norm(lateral) < 1e-9 or _norm(humerus_unit) < 1e-9 or _norm(trunk) < 1e-9:
        return float("nan")

    # Forward flexion should have limited lateral/abduction component.
    lateral_component = abs(float(np.dot(humerus_unit, lateral)))
    return float(math.degrees(math.asin(np.clip(lateral_component, 0.0, 1.0))))


def _angular_velocity_deg_s(angles: list[float], timestamps_ms: list[int]) -> list[float]:
    velocities: list[float] = [0.0 for _ in angles]
    for idx in range(1, len(angles)):
        dt = max((timestamps_ms[idx] - timestamps_ms[idx - 1]) / 1000.0, 1e-6)
        if math.isnan(angles[idx]) or math.isnan(angles[idx - 1]):
            velocities[idx] = 0.0
        else:
            velocities[idx] = (angles[idx] - angles[idx - 1]) / dt
    return velocities


def _longest_hold_duration_s(
    angles: list[float],
    velocities: list[float],
    timestamps_ms: list[int],
    target_deg: float,
    tolerance_deg: float,
) -> float:
    best_ms = 0
    current_start: int | None = None
    lower = target_deg - tolerance_deg
    upper = target_deg + max(tolerance_deg, 15.0)
    for angle, velocity, timestamp in zip(angles, velocities, timestamps_ms):
        in_hold = lower <= angle <= upper and abs(velocity) <= 25.0
        if in_hold and current_start is None:
            current_start = timestamp
        elif not in_hold and current_start is not None:
            best_ms = max(best_ms, timestamp - current_start)
            current_start = None
    if current_start is not None and timestamps_ms:
        best_ms = max(best_ms, timestamps_ms[-1] - current_start)
    return round(best_ms / 1000.0, 3)


def _first_time_to_target_s(
    angles: list[float],
    timestamps_ms: list[int],
    target_deg: float,
    baseline_threshold_deg: float = 20.0,
) -> float | None:
    start_time: int | None = None
    for angle, timestamp in zip(angles, timestamps_ms):
        if start_time is None and angle <= baseline_threshold_deg:
            start_time = timestamp
        if start_time is not None and angle >= target_deg:
            return round((timestamp - start_time) / 1000.0, 3)
    return None


def _choose_side(frames: list[PoseFrame]) -> str:
    left_peak = max((_shoulder_flexion_angle(frame, "left") for frame in frames), default=0.0)
    right_peak = max((_shoulder_flexion_angle(frame, "right") for frame in frames), default=0.0)
    return "left" if left_peak >= right_peak else "right"


def _baseline_indices(angles: list[float]) -> list[int]:
    neutral = [idx for idx, angle in enumerate(angles) if not math.isnan(angle) and angle < 35.0]
    if neutral:
        return neutral[: min(10, len(neutral))]
    return list(range(min(10, len(angles))))


def _compensation_findings(
    frames: list[PoseFrame],
    side: str,
    angles: list[float],
    velocities: list[float],
    target_idx: int,
    target_deg: float,
    tolerance_deg: float,
) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    if not frames:
        return findings

    baseline_idxs = _baseline_indices(angles)
    baseline_frames = [frames[idx] for idx in baseline_idxs]
    base_mid_shoulders = [_trunk_points(frame)[0] for frame in baseline_frames]
    base_mid_hips = [_trunk_points(frame)[1] for frame in baseline_frames]
    baseline_mid_shoulder = _median_point(base_mid_shoulders)
    baseline_mid_hip = _median_point(base_mid_hips)
    baseline_trunk = baseline_mid_shoulder - baseline_mid_hip
    baseline_trunk_unit = _unit(baseline_trunk)
    torso_len = max(_norm(baseline_trunk), 1e-6)

    target_frame = frames[target_idx]
    target_lm = target_frame.landmarks
    side_shoulder = target_lm[f"{side}_shoulder"]
    contra = "right" if side == "left" else "left"
    contra_shoulder = target_lm[f"{contra}_shoulder"]

    baseline_side_height = median(
        float(np.dot(frame.landmarks[f"{side}_shoulder"] - _trunk_points(frame)[1], baseline_trunk_unit))
        for frame in baseline_frames
    )
    target_side_height = float(np.dot(side_shoulder - _trunk_points(target_frame)[1], baseline_trunk_unit))
    shoulder_hike_ratio = (target_side_height - baseline_side_height) / torso_len

    shoulder_asymmetry_ratio = abs(
        float(np.dot(side_shoulder - contra_shoulder, baseline_trunk_unit))
    ) / torso_len

    if shoulder_hike_ratio > 0.08 or shoulder_asymmetry_ratio > 0.08:
        findings.append(
            {
                "code": "shoulder_hike",
                "name_zh": "耸肩/肩胛上提代偿",
                "severity": _severity(max(shoulder_hike_ratio, shoulder_asymmetry_ratio), 0.08, 0.16),
                "evidence": {
                    "shoulder_hike_ratio_of_torso": round(float(shoulder_hike_ratio), 3),
                    "shoulder_asymmetry_ratio_of_torso": round(float(shoulder_asymmetry_ratio), 3),
                },
                "clinical_note": "患侧肩部随前举明显上提，提示可能用斜方肌/肩胛上提替代肩屈曲控制。",
            }
        )

    _, _, current_trunk = _trunk_points(target_frame)
    trunk_angle_change = _angle_deg(current_trunk, baseline_trunk)
    if trunk_angle_change > 12.0:
        findings.append(
            {
                "code": "trunk_compensation",
                "name_zh": "躯干后仰/侧倾代偿",
                "severity": _severity(trunk_angle_change, 12.0, 24.0),
                "evidence": {"trunk_angle_change_deg": round(float(trunk_angle_change), 1)},
                "clinical_note": "躯干姿势改变较大，可能通过身体后仰或侧倾降低肩屈曲需求。",
            }
        )

    elbow = _elbow_angle(target_frame, side)
    if elbow < 150.0:
        findings.append(
            {
                "code": "elbow_flexion",
                "name_zh": "肘屈曲代偿",
                "severity": _severity(150.0 - elbow, 15.0, 35.0),
                "evidence": {"elbow_angle_deg": round(float(elbow), 1)},
                "clinical_note": "前举时肘关节没有保持接近伸直，可能减少力臂并降低三角肌前束负荷。",
            }
        )

    plane_deviation = _movement_plane_deviation(target_frame, side)
    if not math.isnan(plane_deviation) and plane_deviation > 28.0:
        findings.append(
            {
                "code": "abduction_or_cross_body_drift",
                "name_zh": "外展/跨中线偏移",
                "severity": _severity(plane_deviation, 28.0, 45.0),
                "evidence": {"movement_plane_deviation_deg": round(float(plane_deviation), 1)},
                "clinical_note": "上臂偏离前举平面，可能用肩外展或躯干旋转帮助完成动作。",
            }
        )

    peak_velocity = max((abs(v) for v in velocities), default=0.0)
    time_to_target = _first_time_to_target_s(angles, [f.timestamp_ms for f in frames], target_deg - tolerance_deg)
    if peak_velocity > 180.0 or (time_to_target is not None and time_to_target < 0.5):
        findings.append(
            {
                "code": "momentum_strategy",
                "name_zh": "借助惯性/快速摆动",
                "severity": _severity(peak_velocity, 180.0, 280.0),
                "evidence": {
                    "peak_velocity_deg_s": round(float(peak_velocity), 1),
                    "time_to_target_s": time_to_target,
                },
                "clinical_note": "动作过快可能代表借助惯性完成前举，建议要求患者慢速控制并复测。",
            }
        )

    return findings


def _severity(value: float, mild_threshold: float, severe_threshold: float) -> str:
    if value >= severe_threshold:
        return "high"
    if value >= mild_threshold:
        return "moderate"
    return "low"


def _strength_grade(
    peak_angle: float,
    hold_duration_s: float,
    compensation_count: int,
    hand_load_kg: float,
    patient_weight_kg: float | None,
) -> dict[str, Any]:
    if peak_angle < 10.0:
        grade = "0-1/5 indeterminate from video"
        rationale = "No meaningful visible shoulder flexion. Video cannot determine palpable contraction."
    elif peak_angle < 60.0:
        grade = "2+/5 partial antigravity proxy"
        rationale = "Partial active movement against gravity was visible, but the arm did not approach 90 degrees."
    elif peak_angle < 80.0:
        grade = "3-/5 partial antigravity proxy"
        rationale = "The arm elevated substantially against gravity but did not reach the 90-degree target."
    elif hold_duration_s < 1.0:
        grade = "3-/5 near-target without stable hold"
        rationale = "The arm reached the target zone but did not hold it steadily."
    elif hand_load_kg > 0.0:
        relative_load = hand_load_kg / patient_weight_kg if patient_weight_kg else None
        if relative_load is not None and relative_load >= 0.08:
            grade = "4+/5 to 5/5 remote-load proxy"
        elif relative_load is not None and relative_load >= 0.03:
            grade = "4/5 remote-load proxy"
        else:
            grade = "3+/5 remote-load proxy"
        rationale = "The patient held the target zone with an external hand load. This is not equivalent to clinician-applied resistance."
    else:
        grade = "3/5 antigravity proxy"
        rationale = "The patient reached and held roughly 90 degrees against gravity without measured external resistance."

    reach_score = min(max(peak_angle / 90.0, 0.0), 1.0) * 60.0
    hold_score = min(max(hold_duration_s / 3.0, 0.0), 1.0) * 25.0
    load_score = 0.0
    if hand_load_kg > 0.0 and patient_weight_kg:
        load_score = min(hand_load_kg / max(patient_weight_kg * 0.08, 0.1), 1.0) * 15.0
    compensation_penalty = min(compensation_count * 8.0, 24.0)
    score = max(0.0, min(100.0, reach_score + hold_score + load_score - compensation_penalty))

    return {
        "mmt_grade_video_proxy": grade,
        "score_0_100": round(score, 1),
        "rationale": rationale,
        "compensation_penalty_points": round(compensation_penalty, 1),
        "important_limitations": [
            "Video alone estimates task performance, not true maximum anterior-deltoid force.",
            "Shoulder flexion also involves pectoralis major, coracobrachialis, biceps, scapular stabilizers, and trunk control.",
            "Use clinician resistance, hand-held dynamometry, or EMG if diagnostic strength measurement is required.",
        ],
    }


def _estimate_torque_and_deltoid_force(
    frame: PoseFrame,
    side: str,
    angle_deg: float,
    patient_weight_kg: float | None,
    hand_load_kg: float,
    anterior_deltoid_moment_arm_m: float,
) -> dict[str, Any]:
    if patient_weight_kg is None or patient_weight_kg <= 0.0:
        return {
            "available": False,
            "reason": "patient_weight_kg is required for anthropometric torque estimation.",
        }
    if frame.source != "world":
        return {
            "available": False,
            "reason": "metric/world landmarks are required for torque estimation.",
        }

    side = _side_prefix(side)
    lm = frame.landmarks
    shoulder = lm[f"{side}_shoulder"]
    elbow = lm[f"{side}_elbow"]
    wrist = lm[f"{side}_wrist"]
    index = lm[f"{side}_index"]

    upper_arm_len = _norm(elbow - shoulder)
    forearm_len = _norm(wrist - elbow)
    hand_len = max(_norm(index - wrist), 0.08)

    # Common adult anthropometric segment mass fractions and COM locations.
    upper_arm_mass = 0.0271 * patient_weight_kg
    forearm_mass = 0.0162 * patient_weight_kg
    hand_mass = 0.0061 * patient_weight_kg

    sin_factor = abs(math.sin(math.radians(float(np.clip(angle_deg, 0.0, 180.0)))))
    gravity = 9.80665
    torque_nm = gravity * sin_factor * (
        upper_arm_mass * (0.436 * upper_arm_len)
        + forearm_mass * (upper_arm_len + 0.430 * forearm_len)
        + hand_mass * (upper_arm_len + forearm_len + 0.506 * hand_len)
        + max(hand_load_kg, 0.0) * (upper_arm_len + forearm_len + hand_len)
    )

    moment_arm = max(float(anterior_deltoid_moment_arm_m), 0.005)
    deltoid_force_n = torque_nm / moment_arm

    return {
        "available": True,
        "estimated_shoulder_flexion_torque_nm": round(float(torque_nm), 2),
        "estimated_anterior_deltoid_force_n": round(float(deltoid_force_n), 1),
        "anterior_deltoid_moment_arm_m": round(float(moment_arm), 4),
        "segment_lengths_m": {
            "upper_arm": round(float(upper_arm_len), 3),
            "forearm": round(float(forearm_len), 3),
            "hand": round(float(hand_len), 3),
        },
        "note": "This estimates gravitational shoulder-flexion demand, not maximum muscle strength.",
    }


def _quality_summary(landmark_frames: list[PoseFrame], side: str) -> dict[str, Any]:
    required = [
        f"{side}_shoulder",
        f"{side}_elbow",
        f"{side}_wrist",
        "left_hip",
        "right_hip",
    ]
    vis_values: list[float] = []
    for frame in landmark_frames:
        vis_values.extend(frame.visibility.get(name, 0.0) for name in required)
    median_visibility = median(vis_values) if vis_values else 0.0
    return {
        "landmark_frame_count": len(landmark_frames),
        "landmark_source": landmark_frames[0].source if landmark_frames else "none",
        "median_required_landmark_visibility": round(float(median_visibility), 3),
        "confidence": "high" if median_visibility >= 0.75 else "moderate" if median_visibility >= 0.5 else "low",
    }


def _extract_pose_frames(
    video_path: Path,
    sample_hz: float,
    pose_model_path: str | None,
    min_detection_confidence: float,
    min_tracking_confidence: float,
) -> list[PoseFrame]:
    try:
        import mediapipe as mp
    except ImportError as exc:
        raise RuntimeError(
            "mediapipe is not installed. Install it with `python -m pip install mediapipe`, "
            "or mount this router in an environment that already has MediaPipe."
        ) from exc

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError(f"Could not open video: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frame_step = max(int(round(fps / max(sample_hz, 1.0))), 1)
    frames: list[PoseFrame] = []

    model_path = Path(pose_model_path).expanduser() if pose_model_path else None
    use_tasks = bool(model_path and model_path.exists())

    try:
        if use_tasks:
            frames = _extract_with_mediapipe_tasks(
                mp=mp,
                cap=cap,
                fps=fps,
                frame_step=frame_step,
                model_path=model_path,
                min_detection_confidence=min_detection_confidence,
                min_tracking_confidence=min_tracking_confidence,
            )
        else:
            frames = _extract_with_legacy_mediapipe_pose(
                mp=mp,
                cap=cap,
                fps=fps,
                frame_step=frame_step,
                min_detection_confidence=min_detection_confidence,
                min_tracking_confidence=min_tracking_confidence,
            )
    finally:
        cap.release()

    return frames


def _extract_with_mediapipe_tasks(
    mp: Any,
    cap: cv2.VideoCapture,
    fps: float,
    frame_step: int,
    model_path: Path,
    min_detection_confidence: float,
    min_tracking_confidence: float,
) -> list[PoseFrame]:
    BaseOptions = mp.tasks.BaseOptions
    PoseLandmarker = mp.tasks.vision.PoseLandmarker
    PoseLandmarkerOptions = mp.tasks.vision.PoseLandmarkerOptions
    VisionRunningMode = mp.tasks.vision.RunningMode

    options = PoseLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=str(model_path)),
        running_mode=VisionRunningMode.VIDEO,
        num_poses=1,
        min_pose_detection_confidence=min_detection_confidence,
        min_tracking_confidence=min_tracking_confidence,
    )

    frames: list[PoseFrame] = []
    frame_idx = 0
    with PoseLandmarker.create_from_options(options) as landmarker:
        while True:
            ok, frame_bgr = cap.read()
            if not ok:
                break
            if frame_idx % frame_step != 0:
                frame_idx += 1
                continue

            timestamp_ms = int(round(frame_idx / fps * 1000.0))
            frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
            result = landmarker.detect_for_video(mp_image, timestamp_ms)

            if result.pose_world_landmarks:
                pose_frame = _pose_frame_from_landmarks(
                    result.pose_world_landmarks[0],
                    timestamp_ms=timestamp_ms,
                    source="world",
                )
            elif result.pose_landmarks:
                pose_frame = _pose_frame_from_landmarks(
                    result.pose_landmarks[0],
                    timestamp_ms=timestamp_ms,
                    source="image",
                )
            else:
                pose_frame = None

            if pose_frame is not None:
                frames.append(pose_frame)
            frame_idx += 1
    return frames


def _extract_with_legacy_mediapipe_pose(
    mp: Any,
    cap: cv2.VideoCapture,
    fps: float,
    frame_step: int,
    min_detection_confidence: float,
    min_tracking_confidence: float,
) -> list[PoseFrame]:
    frames: list[PoseFrame] = []
    frame_idx = 0

    with mp.solutions.pose.Pose(
        static_image_mode=False,
        model_complexity=1,
        smooth_landmarks=True,
        enable_segmentation=False,
        min_detection_confidence=min_detection_confidence,
        min_tracking_confidence=min_tracking_confidence,
    ) as pose:
        while True:
            ok, frame_bgr = cap.read()
            if not ok:
                break
            if frame_idx % frame_step != 0:
                frame_idx += 1
                continue

            timestamp_ms = int(round(frame_idx / fps * 1000.0))
            frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
            result = pose.process(frame_rgb)

            if result.pose_world_landmarks:
                pose_frame = _pose_frame_from_landmarks(
                    result.pose_world_landmarks.landmark,
                    timestamp_ms=timestamp_ms,
                    source="world",
                )
            elif result.pose_landmarks:
                pose_frame = _pose_frame_from_landmarks(
                    result.pose_landmarks.landmark,
                    timestamp_ms=timestamp_ms,
                    source="image",
                )
            else:
                pose_frame = None

            if pose_frame is not None:
                frames.append(pose_frame)
            frame_idx += 1
    return frames


def analyze_shoulder_flexion_video(
    video_path: Path,
    side: str = "auto",
    patient_weight_kg: float | None = None,
    hand_load_kg: float = 0.0,
    target_deg: float = 90.0,
    target_tolerance_deg: float = 10.0,
    sample_hz: float = 15.0,
    pose_model_path: str | None = None,
    anterior_deltoid_moment_arm_m: float = 0.025,
    min_detection_confidence: float = 0.5,
    min_tracking_confidence: float = 0.5,
) -> dict[str, Any]:
    frames = _extract_pose_frames(
        video_path=video_path,
        sample_hz=sample_hz,
        pose_model_path=pose_model_path,
        min_detection_confidence=min_detection_confidence,
        min_tracking_confidence=min_tracking_confidence,
    )
    if len(frames) < 5:
        raise RuntimeError(
            "Too few pose frames were detected. Use a well-lit side/front view with the full trunk and arm visible."
        )

    selected_side = _choose_side(frames) if side == "auto" else side
    if selected_side not in {"left", "right"}:
        raise ValueError("side must be 'left', 'right', or 'auto'")

    angles = [_shoulder_flexion_angle(frame, selected_side) for frame in frames]
    timestamps_ms = [frame.timestamp_ms for frame in frames]
    velocities = _angular_velocity_deg_s(angles, timestamps_ms)
    peak_idx = int(np.nanargmax(np.array(angles, dtype=float)))
    peak_angle = float(angles[peak_idx])

    target_candidates = [
        idx
        for idx, angle in enumerate(angles)
        if not math.isnan(angle) and abs(angle - target_deg) <= max(target_tolerance_deg, 1.0)
    ]
    target_idx = min(target_candidates, key=lambda idx: abs(angles[idx] - target_deg)) if target_candidates else peak_idx
    target_angle = float(angles[target_idx])
    hold_duration_s = _longest_hold_duration_s(
        angles=angles,
        velocities=velocities,
        timestamps_ms=timestamps_ms,
        target_deg=target_deg,
        tolerance_deg=target_tolerance_deg,
    )

    compensations = _compensation_findings(
        frames=frames,
        side=selected_side,
        angles=angles,
        velocities=velocities,
        target_idx=target_idx,
        target_deg=target_deg,
        tolerance_deg=target_tolerance_deg,
    )
    strength = _strength_grade(
        peak_angle=peak_angle,
        hold_duration_s=hold_duration_s,
        compensation_count=len(compensations),
        hand_load_kg=hand_load_kg,
        patient_weight_kg=patient_weight_kg,
    )
    force = _estimate_torque_and_deltoid_force(
        frame=frames[target_idx],
        side=selected_side,
        angle_deg=target_angle,
        patient_weight_kg=patient_weight_kg,
        hand_load_kg=hand_load_kg,
        anterior_deltoid_moment_arm_m=anterior_deltoid_moment_arm_m,
    )

    left_peak = max(_shoulder_flexion_angle(frame, "left") for frame in frames)
    right_peak = max(_shoulder_flexion_angle(frame, "right") for frame in frames)

    return {
        "status": "success",
        "exercise": {
            "name": "shoulder_flexion_to_90",
            "name_zh": "手臂前举至90度",
            "target_muscle": "anterior deltoid",
            "target_muscle_zh": "三角肌前束",
            "selected_side": selected_side,
        },
        "input": {
            "video_path": str(video_path),
            "patient_weight_kg": patient_weight_kg,
            "hand_load_kg": hand_load_kg,
            "target_deg": target_deg,
            "target_tolerance_deg": target_tolerance_deg,
            "sample_hz": sample_hz,
        },
        "key_metrics": {
            "target_reached": bool(peak_angle >= target_deg - target_tolerance_deg),
            "peak_shoulder_flexion_deg": round(float(peak_angle), 1),
            "target_frame_shoulder_flexion_deg": round(float(target_angle), 1),
            "hold_duration_near_90_s": hold_duration_s,
            "peak_angular_velocity_deg_s": round(max((abs(v) for v in velocities), default=0.0), 1),
            "left_peak_shoulder_flexion_deg": round(float(left_peak), 1),
            "right_peak_shoulder_flexion_deg": round(float(right_peak), 1),
            "left_right_peak_difference_deg": round(float(abs(left_peak - right_peak)), 1),
            "target_timestamp_ms": frames[target_idx].timestamp_ms,
        },
        "strength": strength,
        "estimated_force": force,
        "compensations": compensations,
        "pose_quality": _quality_summary(frames, selected_side),
        "clinical_disclaimer": (
            "This is a screening/rehab analytics estimate from video landmarks. "
            "It should not be used as a standalone diagnosis or replacement for clinician assessment."
        ),
    }


def _save_upload(upload_file: UploadFile) -> Path:
    suffix = Path(upload_file.filename or "").suffix.lower() or ".mp4"
    if suffix not in VALID_VIDEO_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported video extension '{suffix}'. Use one of {sorted(VALID_VIDEO_EXTENSIONS)}.",
        )

    UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
    destination = UPLOAD_ROOT / f"shoulder_flexion_{uuid.uuid4().hex}{suffix}"
    with destination.open("wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
    return destination


router = APIRouter()


@router.post("/api/analyze-shoulder-flexion-90")
async def api_analyze_shoulder_flexion_90(
    video: UploadFile = File(...),
    side: str = Form("auto"),
    patient_weight_kg: float | None = Form(None),
    hand_load_kg: float = Form(0.0),
    target_deg: float = Form(90.0),
    target_tolerance_deg: float = Form(10.0),
    sample_hz: float = Form(15.0),
    pose_model_path: str = Form(""),
    anterior_deltoid_moment_arm_m: float = Form(0.025),
    min_detection_confidence: float = Form(0.5),
    min_tracking_confidence: float = Form(0.5),
) -> dict[str, Any]:
    if side not in {"auto", "left", "right"}:
        raise HTTPException(status_code=400, detail="side must be 'auto', 'left', or 'right'.")
    if sample_hz <= 0 or sample_hz > 60:
        raise HTTPException(status_code=400, detail="sample_hz must be in the range 1-60.")
    if target_tolerance_deg <= 0:
        raise HTTPException(status_code=400, detail="target_tolerance_deg must be positive.")

    video_path = _save_upload(video)
    try:
        return analyze_shoulder_flexion_video(
            video_path=video_path,
            side=side,
            patient_weight_kg=patient_weight_kg,
            hand_load_kg=max(hand_load_kg, 0.0),
            target_deg=target_deg,
            target_tolerance_deg=target_tolerance_deg,
            sample_hz=sample_hz,
            pose_model_path=pose_model_path or None,
            anterior_deltoid_moment_arm_m=anterior_deltoid_moment_arm_m,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"shoulder flexion analysis failed: {exc}") from exc


app = FastAPI(title="AxonAI Upper Limb Video Assessment")
app.include_router(router)

