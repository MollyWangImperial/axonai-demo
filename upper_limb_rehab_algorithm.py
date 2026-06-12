"""Upper-limb rehab reasoning algorithm for AxonAI.

This module is intentionally standalone before app/backend integration.

It accepts an upper-limb collection manifest from the app, combines basic
video-quality checks with measured movement metrics, identifies functional
problems, generates cause hypotheses, decides whether OpenSim or therapist
review is needed, and returns a weekly exercise plan.

Important scope:
    This file contains deterministic rule logic. It does not diagnose disease,
    does not replace therapist review, and does not claim clinical validation.
    The app/backend should fill `measuredMetrics` from pose/keypoint analysis
    or OpenSim outputs. If metrics are missing, the algorithm requests retake,
    keypoint processing, OpenSim, or therapist review instead of inventing
    results.

Example:
    python upper_limb_rehab_algorithm.py --sample --output sample_upper_limb_result.json

    python upper_limb_rehab_algorithm.py --manifest path/to/upper_limb_manifest.json
"""

from __future__ import annotations

import argparse
import copy
import json
import math
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any


ACTION_IDS = [
    "shoulder_flexion",
    "shoulder_abduction",
    "hand_to_mouth",
    "forward_reach",
    "elbow_flex_ext",
    "forearm_pronation_supination",
    "wrist_extension",
    "grasp_release",
    "finger_nose_target",
]

SOURCES = {
    "fma_ue": {
        "name": "Fugl-Meyer Assessment Upper Extremity",
        "url": "https://www.gu.se/en/neuroscience-physiology/fugl-meyer-assessment",
        "use": "Stroke upper-limb impairment domains: shoulder/elbow/forearm, wrist, hand, coordination.",
    },
    "arat": {
        "name": "Action Research Arm Test",
        "url": "https://www.gu.se/en/neuroscience-physiology/action-research-arm-test",
        "use": "Activity-capacity domains: grasp, grip, pinch, gross arm movement.",
    },
    "wmft": {
        "name": "Wolf Motor Function Test task framework",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC3754424/",
        "use": "Timed upper-limb functional tasks and movement quality context.",
    },
    "nice_ng236": {
        "name": "NICE NG236 Stroke rehabilitation in adults",
        "url": "https://www.nice.org.uk/guidance/ng236/chapter/Recommendations",
        "use": "Repetitive task training for upper-limb weakness.",
    },
    "canadian_stroke_best_practices": {
        "name": "Canadian Stroke Best Practices: Upper Extremity",
        "url": "https://www.strokebestpractices.ca/recommendations/stroke-rehabilitation/management-of-the-upper-extremity-following-stroke",
        "use": "Task-specific upper-limb training, ROM, strengthening, GRASP-style home programs.",
    },
    "aha_asa_stroke_rehab": {
        "name": "AHA/ASA Guidelines for Adult Stroke Rehabilitation and Recovery",
        "url": "https://professional.heart.org/en/science-news/-/media/PHD-Files-2/Science-News/g/guidelines_for_adult_stroke_rehab_and_recovery_ucm_485182.pdf",
        "use": "Task-specific and functional task practice after stroke.",
    },
    "therapeutic_exercise": {
        "name": "Therapeutic exercise principles",
        "url": "https://fadavispt.mhmedical.com/Book.aspx?bookid=2262",
        "use": "ROM, active-assisted exercise, strengthening, dosage, progression, and safety principles.",
    },
}

CLINICAL_LOGIC_AUDIT = {
    "source_backed_domains": [
        {
            "area": "Upper-limb impairment domains",
            "code_usage": "Shoulder/elbow/forearm, wrist/hand, and coordination groupings.",
            "source_basis": ["fma_ue"],
            "note": "The domains follow standardized post-stroke upper-extremity assessment structure; the app does not calculate an official FMA-UE score.",
        },
        {
            "area": "Activity-capacity domains",
            "code_usage": "Reach, grasp/release, hand-to-mouth/gross arm movement, and object-related training targets.",
            "source_basis": ["arat", "wmft"],
            "note": "The collected actions are inspired by ARAT/WMFT-style functional domains; the app does not calculate official ARAT or WMFT scores.",
        },
        {
            "area": "Training principle",
            "code_usage": "Task-specific, repetitive, functional upper-limb practice with safe progression.",
            "source_basis": ["nice_ng236", "canadian_stroke_best_practices", "aha_asa_stroke_rehab"],
            "note": "The plan selection follows guideline-level principles rather than a validated prescription engine.",
        },
        {
            "area": "Home practice dose anchor",
            "code_usage": "Most exercises use small sets/reps across multiple days, with low-intensity precautions when uncertainty is high.",
            "source_basis": ["canadian_stroke_best_practices", "therapeutic_exercise"],
            "note": "GRASP-style programs support higher total practice time when therapist-supervised; this prototype gives conservative starter doses.",
        },
    ],
    "engineering_proxy_rules": [
        {
            "area": "Phone-video metrics",
            "code_usage": "ROM, reach ratio, smoothness, endpoint spread, shoulder hike, and trunk lean estimated from MediaPipe/OpenCV landmarks.",
            "reasonableness": "Reasonable for screening and triage because these are observable movement-quality features, but not equivalent to goniometry, dynamometry, EMG, or therapist-scored standardized tests.",
            "must_flag": True,
        },
        {
            "area": "Numeric thresholds",
            "code_usage": "Examples: shoulder flexion <90 deg, shoulder abduction <80 deg, trunk lean >12 deg, wrist extension <25 deg, endpoint error >8 cm.",
            "reasonableness": "Chosen as conservative task-target heuristics for the capture protocol and not as published diagnostic cutoffs.",
            "must_flag": True,
        },
        {
            "area": "Cause hypotheses",
            "code_usage": "Maps functional problems to possible causes such as reduced selective control, compensation, tone, pain, or proprioceptive/coordination issues.",
            "reasonableness": "Clinically plausible differential reasoning, but video alone cannot confirm muscle force, spasticity, passive ROM, pain source, or sensation.",
            "must_flag": True,
        },
        {
            "area": "OpenSim trigger logic",
            "code_usage": "Triggers retake/OpenSim/therapist review when confidence is low, cross-action evidence conflicts, compensation is large, or safety flags exist.",
            "reasonableness": "Reasonable engineering escalation rule; it is a safety/uncertainty gate, not a validated clinical decision rule.",
            "must_flag": True,
        },
    ],
    "requires_clinical_validation": [
        "Validate phone-video metric thresholds against therapist-rated FMA-UE/ARAT/WMFT and goniometry/dynamometry where available.",
        "Validate exercise selection and dose with licensed stroke rehabilitation clinicians before production patient use.",
        "Add therapist override and approval before labeling any plan as clinically prescribed.",
    ],
}


@dataclass
class VideoQuality:
    status: str
    score: int
    issues: list[str] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class ActionAnalysis:
    action_id: str
    video_quality: VideoQuality
    metrics: dict[str, float | bool | str | None]
    metric_confidence: int
    problems: list[str] = field(default_factory=list)
    evidence: list[str] = field(default_factory=list)


@dataclass
class FunctionalProblem:
    id: str
    title: str
    severity: str
    patient_summary: str
    daily_life_impact: list[str]
    evidence: list[str]
    source_basis: list[str]
    rule_type: str


@dataclass
class CauseHypothesis:
    problem_id: str
    cause: str
    support_level: str
    supporting_evidence: list[str]
    uncertainty: list[str]
    needs_more_data: list[str]


@dataclass
class OpenSimDecision:
    needed: bool
    priority: str
    reasons: list[str]
    recommended_workflow: list[str]


@dataclass
class ExercisePlanItem:
    exercise_id: str
    name: str
    improves: list[str]
    dose: str
    days: list[str]
    instructions: list[str]
    precautions: list[str]
    progression: str
    source_basis: list[str]


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def classify_severity(value: float, mild: float, moderate: float, direction: str = "low_is_bad") -> str:
    if direction == "low_is_bad":
        if value < moderate:
            return "severe"
        if value < mild:
            return "moderate"
        return "mild"
    if value > moderate:
        return "severe"
    if value > mild:
        return "moderate"
    return "mild"


def load_manifest(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def inspect_video(path: str | None) -> VideoQuality:
    if not path:
        return VideoQuality("missing", 0, ["No video path provided."])

    video_path = Path(path)
    if not video_path.exists():
        return VideoQuality("missing", 0, [f"Video file does not exist: {video_path}"])

    try:
        import cv2  # type: ignore
    except Exception:
        return VideoQuality(
            "unknown",
            70,
            ["OpenCV is not available; only file existence was checked."],
            {"path": str(video_path), "sizeBytes": video_path.stat().st_size},
        )

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        return VideoQuality("failed", 10, ["Video could not be opened."], {"path": str(video_path)})

    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    fps = float(cap.get(cv2.CAP_PROP_FPS) or 0)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
    duration = frame_count / fps if fps > 0 else 0

    brightness_values: list[float] = []
    blur_values: list[float] = []
    sample_count = 0
    step = max(frame_count // 6, 1)

    for frame_idx in range(0, frame_count, step):
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        ok, frame = cap.read()
        if not ok:
            continue
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        brightness_values.append(float(gray.mean()))
        blur_values.append(float(cv2.Laplacian(gray, cv2.CV_64F).var()))
        sample_count += 1
        if sample_count >= 6:
            break

    cap.release()

    issues: list[str] = []
    score = 100
    if duration < 2.0:
        issues.append("Video is too short for a complete movement repetition.")
        score -= 25
    if width < 360 or height < 480:
        issues.append("Resolution is low; body landmarks may be unreliable.")
        score -= 15
    if brightness_values and sum(brightness_values) / len(brightness_values) < 45:
        issues.append("Video appears too dark.")
        score -= 20
    if blur_values and sum(blur_values) / len(blur_values) < 30:
        issues.append("Video appears blurry or unstable.")
        score -= 15

    status = "pass" if score >= 75 else "review" if score >= 55 else "fail"
    return VideoQuality(
        status,
        int(clamp(score, 0, 100)),
        issues,
        {
            "path": str(video_path),
            "sizeBytes": video_path.stat().st_size,
            "durationSec": round(duration, 2),
            "width": width,
            "height": height,
            "fps": round(fps, 2),
            "meanBrightness": round(sum(brightness_values) / len(brightness_values), 2) if brightness_values else None,
            "meanBlur": round(sum(blur_values) / len(blur_values), 2) if blur_values else None,
        },
    )


def metric(metrics: dict[str, Any], key: str, default: float | None = None) -> float | None:
    value = metrics.get(key, default)
    if value is None or isinstance(value, bool):
        return default
    try:
        if isinstance(value, float) and math.isnan(value):
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def bool_metric(metrics: dict[str, Any], key: str, default: bool = False) -> bool:
    value = metrics.get(key, default)
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in {"true", "yes", "1"}
    return bool(value)


def action_confidence(video_quality: VideoQuality, metrics: dict[str, Any]) -> int:
    keypoint_conf = metric(metrics, "meanKeypointConfidence", 0.0) or 0.0
    missing_ratio = metric(metrics, "landmarkMissingRatio", 1.0) or 1.0
    repetition_consistency = metric(metrics, "repetitionConsistency", 0.5) or 0.5

    score = (
        video_quality.score * 0.35
        + clamp(keypoint_conf, 0, 1) * 30
        + (1 - clamp(missing_ratio, 0, 1)) * 20
        + clamp(repetition_consistency, 0, 1) * 15
    )
    return int(clamp(score, 0, 100))


def analyze_action(action_id: str, record: dict[str, Any]) -> ActionAnalysis:
    metrics = record.get("measuredMetrics", {}) or {}
    video_path = record.get("path") or record.get("videoPath")
    if not video_path and metrics:
        quality = VideoQuality(
            "not_checked",
            75,
            ["No video path provided; using externally supplied movement metrics."],
            {"path": None},
        )
    else:
        quality = inspect_video(video_path)
    confidence = action_confidence(quality, metrics)
    problems: list[str] = []
    evidence: list[str] = []

    if not metrics:
        evidence.append("No measured movement metrics were provided; keypoint/OpenSim preprocessing is required.")
        return ActionAnalysis(action_id, quality, metrics, confidence, problems, evidence)

    if action_id == "shoulder_flexion":
        rom = metric(metrics, "shoulderFlexionRomDeg")
        trunk_ext = metric(metrics, "trunkExtensionDeg", 0) or 0
        shoulder_hike = metric(metrics, "shoulderHikeCm", 0) or 0
        smoothness = metric(metrics, "smoothnessScore", 1) or 1
        if rom is not None and rom < 90:
            problems.append("limited_active_shoulder_elevation")
            evidence.append(f"Shoulder flexion ROM is {rom:.0f} deg, below the 90 deg collection target.")
        if trunk_ext > 10 or shoulder_hike > 3:
            problems.append("trunk_or_scapular_compensation")
            evidence.append(f"Compensation during shoulder elevation: trunk extension {trunk_ext:.0f} deg, shoulder hike {shoulder_hike:.1f} cm.")
        if smoothness < 0.55:
            problems.append("poor_upper_limb_smoothness")
            evidence.append(f"Movement smoothness score is low ({smoothness:.2f}).")

    if action_id == "shoulder_abduction":
        rom = metric(metrics, "shoulderAbductionRomDeg")
        trunk_side = metric(metrics, "trunkSideBendDeg", 0) or 0
        shoulder_hike = metric(metrics, "shoulderHikeCm", 0) or 0
        if rom is not None and rom < 80:
            problems.append("limited_shoulder_abduction")
            evidence.append(f"Shoulder abduction ROM is {rom:.0f} deg.")
        if trunk_side > 8 or shoulder_hike > 3:
            problems.append("trunk_or_scapular_compensation")
            evidence.append(f"Abduction uses compensation: trunk side bend {trunk_side:.0f} deg, shoulder hike {shoulder_hike:.1f} cm.")

    if action_id == "hand_to_mouth":
        target_met = bool_metric(metrics, "targetMet")
        elbow_flex = metric(metrics, "peakElbowFlexionDeg")
        forearm_sup = metric(metrics, "peakSupinationDeg")
        if not target_met:
            problems.append("hand_to_mouth_difficulty")
            evidence.append("Hand-to-mouth target was not reached.")
        if elbow_flex is not None and elbow_flex < 100:
            problems.append("limited_elbow_flexion_control")
            evidence.append(f"Peak elbow flexion during hand-to-mouth is {elbow_flex:.0f} deg.")
        if forearm_sup is not None and forearm_sup < 45:
            problems.append("limited_forearm_supination")
            evidence.append(f"Forearm supination during hand-to-mouth is {forearm_sup:.0f} deg.")

    if action_id == "forward_reach":
        reach_ratio = metric(metrics, "reachCompletionRatio")
        elbow_ext = metric(metrics, "peakElbowExtensionDeg")
        trunk_flex = metric(metrics, "trunkForwardLeanDeg", 0) or 0
        if reach_ratio is not None and reach_ratio < 0.8:
            problems.append("forward_reach_limitation")
            evidence.append(f"Forward reach completion ratio is {reach_ratio:.2f}.")
        if elbow_ext is not None and elbow_ext < 145:
            problems.append("limited_elbow_extension_control")
            evidence.append(f"Peak elbow extension is {elbow_ext:.0f} deg.")
        if trunk_flex > 12:
            problems.append("trunk_or_scapular_compensation")
            evidence.append(f"Forward reach uses trunk lean ({trunk_flex:.0f} deg).")

    if action_id == "elbow_flex_ext":
        elbow_rom = metric(metrics, "elbowRomDeg")
        variability = metric(metrics, "repetitionRomStdDeg", 0) or 0
        if elbow_rom is not None and elbow_rom < 80:
            problems.append("limited_elbow_control")
            evidence.append(f"Elbow flexion/extension ROM is {elbow_rom:.0f} deg.")
        if variability > 18:
            problems.append("poor_repetition_control")
            evidence.append(f"Elbow ROM varies by {variability:.0f} deg across repetitions.")

    if action_id == "forearm_pronation_supination":
        sup = metric(metrics, "supinationRomDeg")
        pro = metric(metrics, "pronationRomDeg")
        if sup is not None and sup < 55:
            problems.append("limited_forearm_supination")
            evidence.append(f"Supination ROM is {sup:.0f} deg.")
        if pro is not None and pro < 55:
            problems.append("limited_forearm_pronation")
            evidence.append(f"Pronation ROM is {pro:.0f} deg.")

    if action_id == "wrist_extension":
        wrist_ext = metric(metrics, "wristExtensionRomDeg")
        hold_sec = metric(metrics, "activeHoldSec", 0) or 0
        if wrist_ext is not None and wrist_ext < 25:
            problems.append("limited_wrist_extension")
            evidence.append(f"Wrist extension ROM is {wrist_ext:.0f} deg.")
        if hold_sec < 2:
            problems.append("limited_wrist_extension")
            evidence.append(f"Active wrist extension hold is only {hold_sec:.1f} sec.")

    if action_id == "grasp_release":
        release_success = bool_metric(metrics, "releaseSuccess")
        release_time = metric(metrics, "releaseTimeSec")
        hand_open = metric(metrics, "handOpenScore")
        if not release_success:
            problems.append("grasp_release_difficulty")
            evidence.append("Active release was not completed.")
        if release_time is not None and release_time > 3:
            problems.append("grasp_release_difficulty")
            evidence.append(f"Release time is delayed ({release_time:.1f} sec).")
        if hand_open is not None and hand_open < 0.55:
            problems.append("limited_hand_opening")
            evidence.append(f"Hand opening score is low ({hand_open:.2f}).")

    if action_id == "finger_nose_target":
        endpoint_error = metric(metrics, "endpointErrorCm")
        path_smoothness = metric(metrics, "smoothnessScore")
        if endpoint_error is not None and endpoint_error > 8:
            problems.append("upper_limb_coordination_difficulty")
            evidence.append(f"Endpoint error is {endpoint_error:.1f} cm.")
        if path_smoothness is not None and path_smoothness < 0.55:
            problems.append("upper_limb_coordination_difficulty")
            evidence.append(f"Target-touch smoothness is low ({path_smoothness:.2f}).")

    return ActionAnalysis(action_id, quality, metrics, confidence, problems, evidence)


def summarize_functional_problems(actions: list[ActionAnalysis]) -> list[FunctionalProblem]:
    evidence_by_problem: dict[str, list[str]] = {}
    for action in actions:
        for problem in set(action.problems):
            evidence_by_problem.setdefault(problem, []).extend(action.evidence)

    problems: list[FunctionalProblem] = []
    add = problems.append

    if "limited_active_shoulder_elevation" in evidence_by_problem:
        evidence_count = len(evidence_by_problem["limited_active_shoulder_elevation"])
        add(
            FunctionalProblem(
                "limited_active_shoulder_elevation",
                "Limited active shoulder elevation",
                "severe" if evidence_count >= 2 else "moderate",
                "The affected arm tends to stop early during lifting.",
                ["reaching a shelf", "washing face or hair", "putting on clothing"],
                evidence_by_problem["limited_active_shoulder_elevation"],
                ["fma_ue", "wmft"],
                "source-backed domain + clinically-informed engineering threshold",
            )
        )

    if "trunk_or_scapular_compensation" in evidence_by_problem:
        add(
            FunctionalProblem(
                "trunk_or_scapular_compensation",
                "Clear trunk or scapular compensation",
                "moderate",
                "The body assists the arm during lifting or reaching.",
                ["reaching forward", "lifting objects", "controlled arm use while sitting"],
                evidence_by_problem["trunk_or_scapular_compensation"],
                ["fma_ue", "wmft"],
                "clinically-informed engineering rule",
            )
        )

    if "forward_reach_limitation" in evidence_by_problem or "limited_elbow_extension_control" in evidence_by_problem:
        evidence = evidence_by_problem.get("forward_reach_limitation", []) + evidence_by_problem.get("limited_elbow_extension_control", [])
        add(
            FunctionalProblem(
                "forward_reach_limitation",
                "Forward reach and elbow extension difficulty",
                "moderate",
                "The affected arm has difficulty reaching forward with control.",
                ["reaching for a cup", "touching a table object", "using the arm during meals"],
                evidence,
                ["arat", "wmft", "nice_ng236"],
                "source-backed task domain + clinically-informed engineering threshold",
            )
        )

    if "limited_forearm_supination" in evidence_by_problem or "limited_forearm_pronation" in evidence_by_problem:
        evidence = evidence_by_problem.get("limited_forearm_supination", []) + evidence_by_problem.get("limited_forearm_pronation", [])
        add(
            FunctionalProblem(
                "forearm_rotation_limitation",
                "Forearm turning limitation",
                "moderate",
                "Turning the palm up or down is limited.",
                ["feeding", "holding a bowl", "turning a door handle"],
                evidence,
                ["fma_ue", "arat"],
                "source-backed domain + clinically-informed engineering threshold",
            )
        )

    if "limited_wrist_extension" in evidence_by_problem or "grasp_release_difficulty" in evidence_by_problem or "limited_hand_opening" in evidence_by_problem:
        evidence = (
            evidence_by_problem.get("limited_wrist_extension", [])
            + evidence_by_problem.get("grasp_release_difficulty", [])
            + evidence_by_problem.get("limited_hand_opening", [])
        )
        add(
            FunctionalProblem(
                "wrist_hand_release_difficulty",
                "Weak wrist extension and hand release",
                "moderate",
                "Opening the hand after grasping is not smooth enough.",
                ["holding cups", "releasing objects", "dressing tasks"],
                evidence,
                ["fma_ue", "arat"],
                "source-backed domain + clinically-informed engineering threshold",
            )
        )

    if "upper_limb_coordination_difficulty" in evidence_by_problem or "poor_upper_limb_smoothness" in evidence_by_problem:
        evidence = evidence_by_problem.get("upper_limb_coordination_difficulty", []) + evidence_by_problem.get("poor_upper_limb_smoothness", [])
        add(
            FunctionalProblem(
                "upper_limb_coordination_difficulty",
                "Upper-limb coordination difficulty",
                "mild",
                "The arm movement is not yet smooth or accurate.",
                ["target touching", "placing the hand accurately", "controlled daily tasks"],
                evidence,
                ["fma_ue", "wmft"],
                "source-backed domain + clinically-informed engineering threshold",
            )
        )

    return problems


def build_cause_hypotheses(problems: list[FunctionalProblem], actions: list[ActionAnalysis]) -> list[CauseHypothesis]:
    evidence_text = [item for action in actions for item in action.evidence]
    hypotheses: list[CauseHypothesis] = []

    problem_ids = {problem.id for problem in problems}
    if "limited_active_shoulder_elevation" in problem_ids:
        support = [e for e in evidence_text if "Shoulder flexion ROM" in e or "Compensation" in e]
        hypotheses.append(
            CauseHypothesis(
                "limited_active_shoulder_elevation",
                "Possible reduced active shoulder flexion control with scapular stabilization difficulty",
                "moderate",
                support,
                ["Video alone cannot confirm muscle force deficit, pain limitation, or passive ROM restriction."],
                ["pain report", "passive ROM", "OpenSim IK/ID if mechanism remains unclear"],
            )
        )

    if "trunk_or_scapular_compensation" in problem_ids:
        support = [e for e in evidence_text if "trunk" in e.lower() or "shoulder hike" in e.lower()]
        hypotheses.append(
            CauseHypothesis(
                "trunk_or_scapular_compensation",
                "Possible compensatory strategy to complete reach/lift when arm control is insufficient",
                "strong" if len(support) >= 2 else "moderate",
                support,
                ["Scapular motion is difficult to infer from a single phone camera."],
                ["second camera view", "therapist observation", "OpenSim IK if trunk/arm contribution must be quantified"],
            )
        )

    if "forward_reach_limitation" in problem_ids:
        hypotheses.append(
            CauseHypothesis(
                "forward_reach_limitation",
                "Possible limited elbow extension control, shoulder flexion control, or sitting trunk control",
                "moderate",
                [e for e in evidence_text if "reach" in e.lower() or "elbow" in e.lower()],
                ["Video cannot distinguish weakness from abnormal synergy or fear/pain with certainty."],
                ["OpenSim IK for joint contribution", "therapist review if painful or unsafe"],
            )
        )

    if "forearm_rotation_limitation" in problem_ids:
        hypotheses.append(
            CauseHypothesis(
                "forearm_rotation_limitation",
                "Possible limited selective forearm rotation control or flexor/pronator synergy",
                "moderate",
                [e for e in evidence_text if "supination" in e.lower() or "pronation" in e.lower()],
                ["Hand-held object position and camera angle can affect forearm rotation estimates."],
                ["retake with elbow at 90 deg", "therapist review if spasticity is obvious"],
            )
        )

    if "wrist_hand_release_difficulty" in problem_ids:
        hypotheses.append(
            CauseHypothesis(
                "wrist_hand_release_difficulty",
                "Possible limited wrist/finger extensor control or increased finger-flexor tone",
                "moderate",
                [e for e in evidence_text if "wrist" in e.lower() or "release" in e.lower() or "hand opening" in e.lower()],
                ["Phone video cannot directly measure grip force, tone, or intrinsic hand muscle force."],
                ["hand landmarks", "grip dynamometer", "Modified Ashworth/tone screen", "therapist review"],
            )
        )

    if "upper_limb_coordination_difficulty" in problem_ids:
        hypotheses.append(
            CauseHypothesis(
                "upper_limb_coordination_difficulty",
                "Possible impaired inter-joint coordination, endpoint control, or sensory/proprioceptive contribution",
                "moderate",
                [e for e in evidence_text if "smoothness" in e.lower() or "endpoint" in e.lower()],
                ["Video cannot directly evaluate sensation or proprioception."],
                ["target-touch retest", "therapist sensory/coordination screen"],
            )
        )

    return hypotheses


def detect_cross_action_conflicts(actions: list[ActionAnalysis]) -> list[str]:
    by_id = {action.action_id: action for action in actions}
    conflicts: list[str] = []

    shoulder = by_id.get("shoulder_flexion")
    reach = by_id.get("forward_reach")
    if shoulder and reach:
        shoulder_rom = metric(shoulder.metrics, "shoulderFlexionRomDeg")
        reach_shoulder = metric(reach.metrics, "shoulderFlexionDuringReachDeg")
        trunk_lean = metric(reach.metrics, "trunkForwardLeanDeg", 0) or 0
        if shoulder_rom is not None and reach_shoulder is not None:
            if shoulder_rom < 70 and reach_shoulder > 100 and trunk_lean < 8:
                conflicts.append(
                    "Shoulder flexion appears low in isolated lifting but high during forward reach without enough compensation to explain it."
                )

    wrist = by_id.get("wrist_extension")
    grasp = by_id.get("grasp_release")
    if wrist and grasp:
        wrist_ext = metric(wrist.metrics, "wristExtensionRomDeg")
        release_success = bool_metric(grasp.metrics, "releaseSuccess", True)
        if wrist_ext is not None and wrist_ext < 15 and release_success:
            conflicts.append(
                "Wrist extension appears severely limited but grasp-release succeeds; check hand landmark quality or task execution."
            )

    return conflicts


def decide_opensim(
    actions: list[ActionAnalysis],
    problems: list[FunctionalProblem],
    hypotheses: list[CauseHypothesis],
    patient_profile: dict[str, Any],
) -> OpenSimDecision:
    reasons: list[str] = []
    recommended: list[str] = []
    conflicts = detect_cross_action_conflicts(actions)
    low_confidence = [a.action_id for a in actions if a.metric_confidence < 60 and a.video_quality.status != "fail"]
    failed_quality = [a.action_id for a in actions if a.video_quality.status == "fail"]
    safety_flags = patient_profile.get("safetyFlags", []) or []

    if failed_quality:
        return OpenSimDecision(
            False,
            "retake_first",
            [f"Video quality failed for: {', '.join(failed_quality)}. Retake before deeper analysis."],
            ["Retake failed videos with full upper body visible and stable lighting."],
        )

    if conflicts:
        reasons.extend(conflicts)
        recommended.append("Retake the conflicting tasks or add a second camera view.")
        recommended.append("Run OpenSim IK if the conflict persists after retake.")

    if low_confidence:
        reasons.append(f"Low analysis confidence for: {', '.join(low_confidence)}.")
        recommended.append("Repeat keypoint processing or retake videos with better framing.")

    if any(problem.id == "trunk_or_scapular_compensation" for problem in problems):
        reasons.append("Large compensation is present; OpenSim IK can quantify target-joint vs trunk contribution.")
        recommended.append("OpenSim IK with trunk, shoulder, elbow, and forearm coordinates.")

    if any(h.support_level == "moderate" and h.needs_more_data for h in hypotheses):
        reasons.append("Cause hypotheses remain uncertain after video analysis.")

    high_risk_flags = {"Severe spasticity", "Recent surgery/fracture", "Medical instability", "Shoulder pain"}
    if high_risk_flags.intersection(set(safety_flags)):
        reasons.append(f"Safety flags require therapist review: {', '.join(high_risk_flags.intersection(set(safety_flags)))}.")
        recommended.append("Therapist review before higher-intensity progression.")

    if not reasons:
        return OpenSimDecision(
            False,
            "not_required_for_basic_plan",
            ["Functional problems are consistent enough for a basic patient-facing training plan."],
            ["Proceed with low-risk task-specific home plan and monitor symptoms."],
        )

    if "OpenSim IK with trunk, shoulder, elbow, and forearm coordinates." not in recommended:
        recommended.append("OpenSim IK if retake does not resolve uncertainty.")
    recommended.append("OpenSim ID / Static Optimization only if joint moments or muscle-force trends are needed.")
    return OpenSimDecision(True, "recommended", reasons, recommended)


EXERCISE_LIBRARY: dict[str, ExercisePlanItem] = {
    "table_slide": ExercisePlanItem(
        "table_slide",
        "Table slide forward elevation",
        ["limited_active_shoulder_elevation", "trunk_or_scapular_compensation"],
        "3 sets x 10-12 reps",
        ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        [
            "Sit upright with the forearm on a towel.",
            "Slide the affected hand forward slowly within a comfortable range.",
            "Pause for 2 seconds, then return with control.",
        ],
        ["Do not hike the shoulder.", "Stop if shoulder pain increases."],
        "Progress by reaching slightly farther while keeping the trunk quiet.",
        ["nice_ng236", "canadian_stroke_best_practices", "therapeutic_exercise"],
    ),
    "scapular_setting": ExercisePlanItem(
        "scapular_setting",
        "Scapular setting",
        ["trunk_or_scapular_compensation", "limited_active_shoulder_elevation"],
        "3 sets x 10 reps, hold 3 sec",
        ["Mon", "Tue", "Thu", "Fri", "Sun"],
        [
            "Sit tall with the neck relaxed.",
            "Gently draw the shoulder blade back and down without shrugging.",
            "Hold, relax, and repeat.",
        ],
        ["Keep the movement gentle.", "Avoid neck tension."],
        "Add mirror feedback when the movement is comfortable.",
        ["therapeutic_exercise", "canadian_stroke_best_practices"],
    ),
    "seated_reach": ExercisePlanItem(
        "seated_reach",
        "Seated forward reach to target",
        ["forward_reach_limitation", "limited_active_shoulder_elevation"],
        "3 sets x 8-10 reps",
        ["Mon", "Wed", "Fri", "Sat"],
        [
            "Place a cup or target within safe reach.",
            "Reach forward with the affected hand without lunging the trunk.",
            "Touch the target and return slowly.",
        ],
        ["Keep the target close enough to avoid falling forward.", "Use caregiver supervision if sitting balance is poor."],
        "Move the target slightly farther only when control is stable.",
        ["nice_ng236", "wmft", "arat"],
    ),
    "forearm_turning": ExercisePlanItem(
        "forearm_turning",
        "Forearm palm-up / palm-down turning",
        ["forearm_rotation_limitation"],
        "3 sets x 12 reps",
        ["Tue", "Thu", "Sat"],
        [
            "Keep the elbow bent around 90 degrees.",
            "Turn the palm up, then down, slowly.",
            "Keep the upper arm near the body.",
        ],
        ["Do not twist the whole trunk to replace forearm motion."],
        "Practice with a light object when range and control improve.",
        ["fma_ue", "arat", "therapeutic_exercise"],
    ),
    "wrist_lift_open": ExercisePlanItem(
        "wrist_lift_open",
        "Wrist lift and hand opening",
        ["wrist_hand_release_difficulty"],
        "3 sets x 8-12 reps",
        ["Tue", "Wed", "Fri", "Sun"],
        [
            "Place the forearm on the table with the hand near the edge.",
            "Lift the wrist gently.",
            "Open the fingers and hold for 2 seconds.",
        ],
        ["Do not force painful finger extension.", "Reduce repetitions if spasticity increases."],
        "Add grasp-release practice after wrist lift becomes smoother.",
        ["fma_ue", "arat", "canadian_stroke_best_practices"],
    ),
    "target_touch": ExercisePlanItem(
        "target_touch",
        "Slow target touching",
        ["upper_limb_coordination_difficulty"],
        "2-3 sets x 8 touches",
        ["Mon", "Wed", "Fri"],
        [
            "Place one visible target on the table or wall.",
            "Touch the target slowly with the affected index finger.",
            "Return to the start position before the next repetition.",
        ],
        ["Prioritize accuracy over speed."],
        "Add a second target when accuracy improves.",
        ["fma_ue", "wmft", "therapeutic_exercise"],
    ),
}


def build_exercise_plan(problems: list[FunctionalProblem], opensim: OpenSimDecision) -> list[ExercisePlanItem]:
    problem_ids = {problem.id for problem in problems}
    selected: list[ExercisePlanItem] = []
    for item in EXERCISE_LIBRARY.values():
        if problem_ids.intersection(set(item.improves)):
            selected.append(copy.deepcopy(item))

    if not selected:
        selected.extend([copy.deepcopy(EXERCISE_LIBRARY["table_slide"]), copy.deepcopy(EXERCISE_LIBRARY["target_touch"])])

    if opensim.priority in {"retake_first", "recommended"}:
        for item in selected:
            item.precautions.append("Keep intensity low until uncertainty or safety flags are reviewed.")

    return selected[:5]


def evaluate_upper_limb_collection(manifest: dict[str, Any]) -> dict[str, Any]:
    saved_files = manifest.get("savedFiles", {})
    patient_profile = manifest.get("patientProfile", {})

    action_records: dict[str, dict[str, Any]] = {}
    if isinstance(saved_files, dict):
        action_records.update(saved_files)
    if isinstance(manifest.get("actions"), dict):
        action_records.update(manifest["actions"])

    actions = [analyze_action(action_id, action_records.get(action_id, {})) for action_id in ACTION_IDS]
    problems = summarize_functional_problems(actions)
    hypotheses = build_cause_hypotheses(problems, actions)
    opensim = decide_opensim(actions, problems, hypotheses, patient_profile)
    plan = build_exercise_plan(problems, opensim)

    quality_summary = {
        "failed": [a.action_id for a in actions if a.video_quality.status == "fail"],
        "review": [a.action_id for a in actions if a.video_quality.status == "review"],
        "missingMetrics": [a.action_id for a in actions if not a.metrics],
        "meanConfidence": round(sum(a.metric_confidence for a in actions) / len(actions), 1),
    }

    return {
        "algorithmVersion": "upper-limb-v1.0",
        "scope": "patient-facing decision support, not diagnosis",
        "sources": SOURCES,
        "clinicalLogicAudit": CLINICAL_LOGIC_AUDIT,
        "qualitySummary": quality_summary,
        "actionAnalyses": [asdict(action) for action in actions],
        "functionalProblems": [asdict(problem) for problem in problems],
        "causeHypotheses": [asdict(hypothesis) for hypothesis in hypotheses],
        "opensimDecision": asdict(opensim),
        "weeklyExercisePlan": [asdict(item) for item in plan],
        "patientFacingSummary": {
            "title": "Your upper-limb training priorities",
            "problems": [problem.patient_summary for problem in problems],
            "trainingFocus": [item.name for item in plan],
            "reviewNote": "A therapist should review pain, severe spasticity, unclear results, or any high-risk safety flag. Phone-video findings are screening estimates, not formal FMA-UE, ARAT, WMFT, goniometry, dynamometry, or diagnosis.",
        },
    }


def sample_manifest() -> dict[str, Any]:
    base_metrics = {"meanKeypointConfidence": 0.86, "landmarkMissingRatio": 0.06, "repetitionConsistency": 0.82}
    return {
        "patientProfile": {
            "affectedSide": "Right",
            "language": "English",
            "safetyFlags": ["Shoulder pain"],
            "mainGoal": "Reach and use the affected hand in daily tasks",
        },
        "actions": {
            "shoulder_flexion": {
                "path": None,
                "measuredMetrics": {
                    **base_metrics,
                    "shoulderFlexionRomDeg": 58,
                    "trunkExtensionDeg": 16,
                    "shoulderHikeCm": 4.2,
                    "smoothnessScore": 0.48,
                },
            },
            "shoulder_abduction": {
                "path": None,
                "measuredMetrics": {
                    **base_metrics,
                    "shoulderAbductionRomDeg": 68,
                    "trunkSideBendDeg": 10,
                    "shoulderHikeCm": 3.8,
                },
            },
            "hand_to_mouth": {
                "path": None,
                "measuredMetrics": {**base_metrics, "targetMet": True, "peakElbowFlexionDeg": 112, "peakSupinationDeg": 38},
            },
            "forward_reach": {
                "path": None,
                "measuredMetrics": {
                    **base_metrics,
                    "reachCompletionRatio": 0.72,
                    "peakElbowExtensionDeg": 132,
                    "trunkForwardLeanDeg": 17,
                    "shoulderFlexionDuringReachDeg": 64,
                },
            },
            "elbow_flex_ext": {
                "path": None,
                "measuredMetrics": {**base_metrics, "elbowRomDeg": 92, "repetitionRomStdDeg": 12},
            },
            "forearm_pronation_supination": {
                "path": None,
                "measuredMetrics": {**base_metrics, "supinationRomDeg": 42, "pronationRomDeg": 64},
            },
            "wrist_extension": {
                "path": None,
                "measuredMetrics": {**base_metrics, "wristExtensionRomDeg": 18, "activeHoldSec": 1.2},
            },
            "grasp_release": {
                "path": None,
                "measuredMetrics": {**base_metrics, "releaseSuccess": False, "releaseTimeSec": 4.1, "handOpenScore": 0.42},
            },
            "finger_nose_target": {
                "path": None,
                "measuredMetrics": {**base_metrics, "endpointErrorCm": 6, "smoothnessScore": 0.62},
            },
        },
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate upper-limb rehab collection and generate a training plan.")
    parser.add_argument("--manifest", type=Path, help="JSON manifest from the app/backend.")
    parser.add_argument("--output", type=Path, help="Where to write the result JSON.")
    parser.add_argument("--sample", action="store_true", help="Run with built-in sample metrics.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.sample:
        manifest = sample_manifest()
    elif args.manifest:
        manifest = load_manifest(args.manifest)
    else:
        raise SystemExit("Provide --sample or --manifest path/to/manifest.json")

    result = evaluate_upper_limb_collection(manifest)
    payload = json.dumps(result, ensure_ascii=False, indent=2)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(payload, encoding="utf-8")
    else:
        print(payload)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
