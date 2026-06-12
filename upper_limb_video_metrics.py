"""First-pass video metric extraction for AxonAI upper-limb tasks.

These metrics are engineering proxies from phone-video landmarks. They are
intended to feed the deterministic rehab reasoning layer, not to serve as
standalone clinical measurements.
"""

from __future__ import annotations

import math
from pathlib import Path
from statistics import median
from typing import Any

import cv2
import numpy as np

from patient_shoulder_flexion_api import (
    _angular_velocity_deg_s,
    _choose_side,
    _compensation_findings,
    _elbow_angle,
    _extract_pose_frames,
    _movement_plane_deviation,
    _norm,
    _quality_summary,
    _shoulder_flexion_angle,
    _trunk_points,
)


def _clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def _finite(values: list[float]) -> list[float]:
    return [float(v) for v in values if not math.isnan(float(v))]


def _smoothness_from_series(values: list[float]) -> float:
    clean = _finite(values)
    if len(clean) < 5:
        return 0.45
    velocity = np.diff(np.array(clean, dtype=float))
    acceleration = np.diff(velocity)
    if acceleration.size == 0:
        return 0.65
    roughness = float(np.nanstd(acceleration))
    return round(_clamp(1.0 / (1.0 + roughness / 35.0)), 3)


def _common_quality_metrics(quality: dict[str, Any], frame_count: int | None = None) -> dict[str, float]:
    visibility = float(quality.get("median_required_landmark_visibility", 0.65) or 0.65)
    frame_factor = 1.0
    if frame_count is not None:
        frame_factor = _clamp(frame_count / 8.0, 0.45, 1.0)
    return {
        "meanKeypointConfidence": round(_clamp(visibility * frame_factor), 3),
        "landmarkMissingRatio": round(_clamp(1.0 - visibility * frame_factor), 3),
        "repetitionConsistency": round(_clamp(0.72 * frame_factor), 3),
    }


def _extract_pose(video_path: Path, side: str, sample_hz: float = 6.0):
    frames = _extract_pose_frames(
        video_path=video_path,
        sample_hz=sample_hz,
        pose_model_path=None,
        min_detection_confidence=0.3,
        min_tracking_confidence=0.3,
    )
    if len(frames) < 3:
        raise RuntimeError("Too few pose frames detected.")
    selected_side = _choose_side(frames) if side == "auto" else side
    if selected_side not in {"left", "right"}:
        selected_side = "right"
    quality = _quality_summary(frames, selected_side)
    return frames, selected_side, quality


def _compensation_numbers(frames, side: str, angles: list[float], peak_idx: int) -> dict[str, float]:
    velocities = _angular_velocity_deg_s(angles, [frame.timestamp_ms for frame in frames])
    findings = _compensation_findings(
        frames=frames,
        side=side,
        angles=angles,
        velocities=velocities,
        target_idx=peak_idx,
        target_deg=90.0,
        tolerance_deg=10.0,
    )
    shoulder_hike_cm = 0.0
    trunk_angle = 0.0
    for finding in findings:
        evidence = finding.get("evidence", {})
        if finding.get("code") == "shoulder_hike":
            ratio = max(
                float(evidence.get("shoulder_hike_ratio_of_torso", 0.0) or 0.0),
                float(evidence.get("shoulder_asymmetry_ratio_of_torso", 0.0) or 0.0),
            )
            shoulder_hike_cm = max(shoulder_hike_cm, ratio * 32.0)
        if finding.get("code") == "trunk_compensation":
            trunk_angle = max(trunk_angle, float(evidence.get("trunk_angle_change_deg", 0.0) or 0.0))
    return {"shoulderHikeCm": round(shoulder_hike_cm, 2), "trunkAngleChangeDeg": round(trunk_angle, 1)}


def _wrist_to_shoulder_distance(frame, side: str) -> float:
    lm = frame.landmarks
    return _norm(lm[f"{side}_wrist"] - lm[f"{side}_shoulder"])


def _arm_length(frame, side: str) -> float:
    lm = frame.landmarks
    upper = _norm(lm[f"{side}_elbow"] - lm[f"{side}_shoulder"])
    lower = _norm(lm[f"{side}_wrist"] - lm[f"{side}_elbow"])
    return max(upper + lower, 1e-6)


def analyze_shoulder_abduction(video_path: Path, side: str = "auto") -> dict[str, Any]:
    frames, selected_side, quality = _extract_pose(video_path, side)
    elevation = [_shoulder_flexion_angle(frame, selected_side) for frame in frames]
    plane = [_movement_plane_deviation(frame, selected_side) for frame in frames]
    clean_elevation = _finite(elevation)
    if not clean_elevation:
        raise RuntimeError("No valid shoulder elevation angles.")
    peak_idx = int(np.nanargmax(np.array(elevation, dtype=float)))
    peak_elevation = float(np.nanmax(np.array(elevation, dtype=float)))
    peak_plane = max(_finite(plane) or [0.0])
    comp = _compensation_numbers(frames, selected_side, elevation, peak_idx)
    return {
        **_common_quality_metrics(quality, len(frames)),
        "selectedSide": selected_side,
        "shoulderAbductionRomDeg": round(peak_elevation, 1),
        "movementPlaneDeviationDeg": round(peak_plane, 1),
        "targetMet": peak_elevation >= 80,
        "smoothnessScore": _smoothness_from_series(elevation),
        "trunkSideBendDeg": comp["trunkAngleChangeDeg"],
        "shoulderHikeCm": comp["shoulderHikeCm"],
    }


def analyze_forward_reach(video_path: Path, side: str = "auto") -> dict[str, Any]:
    frames, selected_side, quality = _extract_pose(video_path, side)
    distances = [_wrist_to_shoulder_distance(frame, selected_side) / _arm_length(frame, selected_side) for frame in frames]
    peak_idx = int(np.nanargmax(np.array(distances, dtype=float)))
    elbow_angles = [_elbow_angle(frame, selected_side) for frame in frames]
    shoulder_angles = [_shoulder_flexion_angle(frame, selected_side) for frame in frames]
    comp = _compensation_numbers(frames, selected_side, shoulder_angles, peak_idx)
    return {
        **_common_quality_metrics(quality, len(frames)),
        "selectedSide": selected_side,
        "reachCompletionRatio": round(_clamp(max(_finite(distances) or [0.0]), 0, 1.15), 3),
        "peakElbowExtensionDeg": round(max(_finite(elbow_angles) or [0.0]), 1),
        "trunkForwardLeanDeg": comp["trunkAngleChangeDeg"],
        "shoulderHikeCm": comp["shoulderHikeCm"],
        "shoulderFlexionDuringReachDeg": round(float(shoulder_angles[peak_idx]), 1),
        "smoothnessScore": _smoothness_from_series(distances),
    }


def analyze_elbow_flex_ext(video_path: Path, side: str = "auto") -> dict[str, Any]:
    frames, selected_side, quality = _extract_pose(video_path, side)
    elbow_angles = _finite([_elbow_angle(frame, selected_side) for frame in frames])
    if not elbow_angles:
        raise RuntimeError("No valid elbow angles.")
    return {
        **_common_quality_metrics(quality, len(frames)),
        "selectedSide": selected_side,
        "elbowRomDeg": round(max(elbow_angles) - min(elbow_angles), 1),
        "peakElbowFlexionDeg": round(min(elbow_angles), 1),
        "peakElbowExtensionDeg": round(max(elbow_angles), 1),
        "repetitionRomStdDeg": round(float(np.nanstd(elbow_angles)), 1),
        "smoothnessScore": _smoothness_from_series(elbow_angles),
    }


def analyze_wrist_extension(video_path: Path, side: str = "auto") -> dict[str, Any]:
    frames, selected_side, quality = _extract_pose(video_path, side)
    wrist_angles: list[float] = []
    for frame in frames:
        lm = frame.landmarks
        forearm = lm[f"{selected_side}_wrist"] - lm[f"{selected_side}_elbow"]
        hand = lm[f"{selected_side}_index"] - lm[f"{selected_side}_wrist"]
        angle = math.degrees(
            math.acos(
                float(np.clip(np.dot(forearm, hand) / max(_norm(forearm) * _norm(hand), 1e-9), -1.0, 1.0))
            )
        )
        wrist_angles.append(angle)
    clean = _finite(wrist_angles)
    peak_extension_proxy = max(abs(180.0 - angle) for angle in clean) if clean else 0.0
    active_hold = sum(1 for angle in clean if abs(180.0 - angle) >= max(peak_extension_proxy - 8.0, 10.0)) / 12.0
    return {
        **_common_quality_metrics(quality, len(frames)),
        "selectedSide": selected_side,
        "wristExtensionRomDeg": round(float(peak_extension_proxy), 1),
        "activeHoldSec": round(float(active_hold), 2),
        "smoothnessScore": _smoothness_from_series(wrist_angles),
    }


def _extract_hand_opening(video_path: Path, sample_hz: float = 12.0) -> dict[str, Any]:
    import mediapipe as mp

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError(f"Could not open video: {video_path}")
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frame_step = max(int(round(fps / max(sample_hz, 1.0))), 1)
    scores: list[float] = []
    frame_idx = 0
    with mp.solutions.hands.Hands(static_image_mode=False, max_num_hands=2, min_detection_confidence=0.5) as hands:
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            if frame_idx % frame_step != 0:
                frame_idx += 1
                continue
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            result = hands.process(rgb)
            if result.multi_hand_landmarks:
                best_score = 0.0
                for hand_landmarks in result.multi_hand_landmarks:
                    pts = hand_landmarks.landmark
                    wrist = np.array([pts[0].x, pts[0].y, pts[0].z], dtype=float)
                    index_mcp = np.array([pts[5].x, pts[5].y, pts[5].z], dtype=float)
                    pinky_mcp = np.array([pts[17].x, pts[17].y, pts[17].z], dtype=float)
                    palm = max(_norm(index_mcp - pinky_mcp), 1e-6)
                    tips = [8, 12, 16, 20]
                    score = float(np.mean([_norm(np.array([pts[i].x, pts[i].y, pts[i].z], dtype=float) - wrist) / palm for i in tips]))
                    best_score = max(best_score, score)
                scores.append(best_score)
            frame_idx += 1
    cap.release()
    if not scores:
        return {"handOpenScore": 0.0, "releaseSuccess": False, "releaseTimeSec": None, "meanKeypointConfidence": 0.35, "landmarkMissingRatio": 0.8, "repetitionConsistency": 0.4}
    min_score = min(scores)
    max_score = max(scores)
    return {
        "handOpenScore": round(_clamp((max_score - 1.5) / 2.0), 3),
        "releaseSuccess": bool(max_score - min_score > 0.35 and max_score > 1.9),
        "releaseTimeSec": round(len(scores) / sample_hz, 2),
        "meanKeypointConfidence": 0.72,
        "landmarkMissingRatio": 0.15,
        "repetitionConsistency": 0.65,
    }


def analyze_grasp_release(video_path: Path, side: str = "auto") -> dict[str, Any]:
    del side
    return _extract_hand_opening(video_path)


def analyze_finger_nose_target(video_path: Path, side: str = "auto") -> dict[str, Any]:
    frames, selected_side, quality = _extract_pose(video_path, side)
    wrist_points = [frame.landmarks[f"{selected_side}_wrist"] for frame in frames]
    if len(wrist_points) < 5:
        raise RuntimeError("Too few wrist landmarks detected.")
    stacked = np.vstack(wrist_points)
    endpoint = stacked[-max(3, len(stacked) // 5) :]
    spread = float(np.mean(np.linalg.norm(endpoint - endpoint.mean(axis=0), axis=1)))
    path = [float(point[0] + point[1] + point[2]) for point in wrist_points]
    return {
        **_common_quality_metrics(quality, len(frames)),
        "selectedSide": selected_side,
        "endpointErrorCm": round(spread * 100.0, 1),
        "smoothnessScore": _smoothness_from_series(path),
    }


def analyze_hand_to_mouth(video_path: Path, side: str = "auto") -> dict[str, Any]:
    frames, selected_side, quality = _extract_pose(video_path, side)
    elbow_angles = [_elbow_angle(frame, selected_side) for frame in frames]
    distances_to_head: list[float] = []
    for frame in frames:
        lm = frame.landmarks
        mid_shoulder, _, _ = _trunk_points(frame)
        wrist = lm[f"{selected_side}_wrist"]
        torso_len = max(_norm(mid_shoulder - ((lm["left_hip"] + lm["right_hip"]) / 2.0)), 1e-6)
        distances_to_head.append(_norm(wrist - mid_shoulder) / torso_len)
    min_distance = min(_finite(distances_to_head) or [99.0])
    return {
        **_common_quality_metrics(quality, len(frames)),
        "selectedSide": selected_side,
        "targetMet": min_distance < 0.75,
        "peakElbowFlexionDeg": round(min(_finite(elbow_angles) or [180.0]), 1),
        "peakSupinationDeg": None,
        "smoothnessScore": _smoothness_from_series(distances_to_head),
    }


def analyze_forearm_pronation_supination(video_path: Path, side: str = "auto") -> dict[str, Any]:
    frames, selected_side, quality = _extract_pose(video_path, side)
    rotation_proxy: list[float] = []
    for frame in frames:
        lm = frame.landmarks
        wrist = lm[f"{selected_side}_wrist"]
        index = lm[f"{selected_side}_index"]
        elbow = lm[f"{selected_side}_elbow"]
        forearm = wrist - elbow
        hand_axis = index - wrist
        forearm_norm = forearm / max(_norm(forearm), 1e-9)
        hand_norm = hand_axis / max(_norm(hand_axis), 1e-9)
        projection = hand_norm - float(np.dot(hand_norm, forearm_norm)) * forearm_norm
        rotation_proxy.append(math.degrees(math.atan2(float(projection[2]), float(projection[1]))))
    clean = _finite(rotation_proxy)
    if not clean:
        raise RuntimeError("No valid forearm rotation landmarks.")
    rotation_range = max(clean) - min(clean)
    split_rom = max(rotation_range / 2.0, 0.0)
    return {
        **_common_quality_metrics(quality, len(frames)),
        "selectedSide": selected_side,
        "supinationRomDeg": round(split_rom, 1),
        "pronationRomDeg": round(split_rom, 1),
        "forearmRotationArcDeg": round(rotation_range, 1),
        "smoothnessScore": _smoothness_from_series(rotation_proxy),
    }


def analyze_upper_limb_action_video(action_id: str, video_path: Path, side: str = "auto") -> dict[str, Any]:
    analyzers = {
        "shoulder_abduction": analyze_shoulder_abduction,
        "hand_to_mouth": analyze_hand_to_mouth,
        "forward_reach": analyze_forward_reach,
        "elbow_flex_ext": analyze_elbow_flex_ext,
        "forearm_pronation_supination": analyze_forearm_pronation_supination,
        "wrist_extension": analyze_wrist_extension,
        "grasp_release": analyze_grasp_release,
        "finger_nose_target": analyze_finger_nose_target,
    }
    analyzer = analyzers.get(action_id)
    if analyzer is None:
        return {}
    return analyzer(video_path, side=side)
