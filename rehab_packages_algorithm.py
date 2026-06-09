# -*- coding: utf-8 -*-
"""Reasoning algorithms for non-upper-limb AxonAI rehab packages.

The package logic mirrors ``upper_limb_rehab_algorithm.py``:
- source-backed domains and training principles are explicit,
- phone-video/pose metrics are treated as engineering screening proxies,
- outputs are patient-facing decision support, not diagnosis.
"""

from __future__ import annotations

import copy
import json
from dataclasses import asdict, dataclass, field
from typing import Any


WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


SOURCES = {
    "arat": {
        "name": "Action Research Arm Test",
        "url": "https://www.gu.se/en/neuroscience-physiology/action-research-arm-test",
        "use": "Hand/arm activity-capacity domains: grasp, grip, pinch, gross movement.",
    },
    "bbt_nhpt": {
        "name": "Box and Block Test / Nine-Hole Peg Test",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC9833478/",
        "use": "Common gross and fine manual dexterity measures after stroke.",
    },
    "wmft": {
        "name": "Wolf Motor Function Test",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC3754424/",
        "use": "Timed upper-limb functional tasks and movement-quality context.",
    },
    "tug_10mwt": {
        "name": "Timed Up and Go / 10 Meter Walk Test",
        "url": "https://www.sralab.org/rehabilitation-measures/timed-and-go",
        "use": "Common mobility, walking ability, and fall-risk screening constructs.",
    },
    "berg_balance": {
        "name": "Berg Balance Scale",
        "url": "https://www.sralab.org/rehabilitation-measures/berg-balance-scale",
        "use": "Functional standing balance domains and fall-risk context.",
    },
    "tis_tct": {
        "name": "Trunk Impairment Scale / Trunk Control Test",
        "url": "https://journals.sagepub.com/doi/pdf/10.1191/0269215504cr733oa",
        "use": "Static sitting balance, dynamic sitting balance, trunk coordination, rolling/supine-to-sit constructs.",
    },
    "nice_ng236": {
        "name": "NICE NG236 Stroke rehabilitation in adults",
        "url": "https://www.nice.org.uk/guidance/ng236/chapter/Recommendations",
        "use": "Repetitive task training, strength, mobility, balance, and functional practice principles.",
    },
    "canadian_stroke_best_practices": {
        "name": "Canadian Stroke Best Practices",
        "url": "https://www.strokebestpractices.ca/recommendations/stroke-rehabilitation",
        "use": "Task-specific practice, progressive exercise, balance/mobility/upper-extremity rehabilitation principles.",
    },
    "therapeutic_exercise": {
        "name": "Therapeutic exercise principles",
        "url": "https://fadavispt.mhmedical.com/Book.aspx?bookid=2262",
        "use": "ROM, strengthening, motor control, dosage, progression, and safety principles.",
    },
}


PACKAGE_AUDIT = {
    "hand": {
        "source_backed_domains": [
            "Gross grasp/release and pinch precision are aligned with ARAT hand activity domains.",
            "Manual dexterity concepts are aligned with Box and Block Test and Nine-Hole Peg Test constructs.",
        ],
        "engineering_proxy_rules": [
            "Phone-video estimates of hand opening, release timing, tapping rate, drops, and object-transfer counts are screening proxies.",
            "Numeric cutoffs are task-protocol heuristics, not official BBT/NHPT/ARAT scores.",
        ],
    },
    "gait": {
        "source_backed_domains": [
            "Walking speed, TUG-style mobility, sit-to-stand, turning, and step clearance map to common stroke mobility assessment constructs.",
            "Training choices follow repetitive task practice, gait practice, transfer practice, and progressive strengthening principles.",
        ],
        "engineering_proxy_rules": [
            "Single-phone video gait speed, step symmetry, foot clearance, and turn metrics are screening proxies.",
            "Fall-risk flags are triage prompts; they are not formal TUG, 10MWT, DGI, FGA, or BBS scores.",
        ],
    },
    "balance": {
        "source_backed_domains": [
            "Quiet standing, functional reach, weight shift, and stepping reactions map to Berg Balance Scale / functional balance constructs.",
            "Exercise choices follow static balance, dynamic balance, weight-shift, and task-oriented balance practice principles.",
        ],
        "engineering_proxy_rules": [
            "Sway, reach distance, weight-shift symmetry, and stepping-reaction timing from video are screening proxies.",
            "Safety escalation is based on conservative engineering rules when instability is observed.",
        ],
    },
    "trunk": {
        "source_backed_domains": [
            "Static sitting, dynamic sitting reach, trunk rotation, and supine-to-sit map to TIS/TCT constructs.",
            "Training choices follow trunk control, sitting balance, bed mobility, and task-specific postural control principles.",
        ],
        "engineering_proxy_rules": [
            "Trunk angle, lateral reach, sitting sway, rotation range, and bed-mobility timing from video are engineering proxies.",
            "Cause hypotheses cannot confirm trunk muscle force, sensory loss, neglect, vestibular issues, or pain.",
        ],
    },
}


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


@dataclass
class PackageDefinition:
    key: str
    title: str
    actions: list[str]
    source_basis: list[str]
    metric_specs: dict[str, list[str]]
    exercise_library: dict[str, ExercisePlanItem]


def metric(metrics: dict[str, Any], key: str, default: float | None = None) -> float | None:
    value = metrics.get(key, default)
    if value is None or isinstance(value, bool):
        return default
    try:
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


def confidence_for_action(metrics: dict[str, Any]) -> int:
    if not metrics:
        return 0
    keypoint = metric(metrics, "meanKeypointConfidence", 0.72) or 0.72
    missing = metric(metrics, "landmarkMissingRatio", 0.2) or 0.2
    consistency = metric(metrics, "repetitionConsistency", 0.65) or 0.65
    return int(max(0, min(100, keypoint * 35 + (1 - missing) * 35 + consistency * 30)))


def _exercise(
    exercise_id: str,
    name: str,
    improves: list[str],
    dose: str,
    days: list[str],
    instructions: list[str],
    precautions: list[str],
    progression: str,
    source_basis: list[str],
) -> ExercisePlanItem:
    return ExercisePlanItem(exercise_id, name, improves, dose, days, instructions, precautions, progression, source_basis)


PACKAGE_DEFINITIONS: dict[str, PackageDefinition] = {
    "hand": PackageDefinition(
        "hand",
        "Hand Function Package",
        ["gross_grasp_release", "pinch_precision", "finger_tapping", "object_transfer", "peg_like_precision"],
        ["arat", "bbt_nhpt", "wmft"],
        {
            "gross_grasp_release": ["releaseSuccess", "handOpenScore", "releaseTimeSec"],
            "pinch_precision": ["pinchControlScore", "dropCount"],
            "finger_tapping": ["tappingRateHz", "fingerIndividuationScore"],
            "object_transfer": ["objectTransferCount", "dropCount"],
            "peg_like_precision": ["precisionCompletionSec", "endpointErrorCm"],
        },
        {
            "supported_grasp_release": _exercise(
                "supported_grasp_release",
                "Supported grasp and active release",
                ["hand_release_difficulty", "gross_manual_dexterity_limitation"],
                "3 sets x 8-12 reps",
                ["Mon", "Tue", "Thu", "Fri", "Sun"],
                ["Place the forearm on a table.", "Grasp a soft object gently.", "Open the hand actively and release without pulling the fingers."],
                ["Stop if finger pain or spasticity increases.", "Use a larger soft object if release is difficult."],
                "Progress to smaller objects only when release is smooth.",
                ["arat", "canadian_stroke_best_practices", "therapeutic_exercise"],
            ),
            "pinch_pick_place": _exercise(
                "pinch_pick_place",
                "Large pinch pick-and-place",
                ["pinch_precision_limitation"],
                "2-3 sets x 8 items",
                ["Tue", "Thu", "Sat"],
                ["Pick up large light objects with thumb and index finger.", "Move each item to a nearby container.", "Prioritize accuracy over speed."],
                ["Avoid tiny objects until safe.", "Keep the wrist supported if needed."],
                "Progress by reducing object size or increasing distance.",
                ["arat", "bbt_nhpt", "therapeutic_exercise"],
            ),
            "finger_tap_sequence": _exercise(
                "finger_tap_sequence",
                "Slow finger tap sequence",
                ["finger_individuation_difficulty", "fine_manual_dexterity_limitation"],
                "2 sets x 20-30 sec",
                ["Mon", "Wed", "Fri"],
                ["Place the hand on a table.", "Tap one finger at a time slowly.", "Reset if the whole hand moves together."],
                ["Do not force stiff fingers.", "Use short bouts to avoid fatigue."],
                "Progress by increasing sequence length before increasing speed.",
                ["bbt_nhpt", "therapeutic_exercise"],
            ),
        },
    ),
    "gait": PackageDefinition(
        "gait",
        "Gait Package",
        ["sit_to_stand", "short_walk", "timed_up_go", "step_clearance", "turn_180"],
        ["tug_10mwt", "nice_ng236", "canadian_stroke_best_practices"],
        {
            "sit_to_stand": ["sitToStandSec", "usesHands", "kneeControlScore"],
            "short_walk": ["gaitSpeedMps", "stepSymmetryRatio", "stanceAsymmetryPct"],
            "timed_up_go": ["tugSec", "turnSteps", "lossOfBalance"],
            "step_clearance": ["minimumFootClearanceCm", "toeDragEvents"],
            "turn_180": ["turnSteps", "turnTimeSec", "lossOfBalance"],
        },
        {
            "sit_to_stand_practice": _exercise(
                "sit_to_stand_practice",
                "Sit-to-stand practice",
                ["transfer_power_limitation", "gait_stability_limitation"],
                "3 sets x 5-8 reps",
                ["Mon", "Tue", "Thu", "Sat"],
                ["Sit near the front of a stable chair.", "Stand up with even weight through both feet.", "Sit down slowly with control."],
                ["Use a caregiver or rail if balance is uncertain.", "Stop if dizzy or unsafe."],
                "Progress by reducing hand support before increasing repetitions.",
                ["nice_ng236", "canadian_stroke_best_practices", "therapeutic_exercise"],
            ),
            "short_walk_intervals": _exercise(
                "short_walk_intervals",
                "Short walking intervals",
                ["slow_gait_speed", "step_asymmetry"],
                "5-8 short walks with rest",
                ["Mon", "Wed", "Fri", "Sun"],
                ["Walk a short safe path.", "Aim for even steps.", "Rest before quality drops."],
                ["Use prescribed aid.", "Have supervision if falls risk is present."],
                "Progress distance only when step quality stays consistent.",
                ["tug_10mwt", "nice_ng236", "therapeutic_exercise"],
            ),
            "toe_clearance_drill": _exercise(
                "toe_clearance_drill",
                "Toe-clearance stepping",
                ["foot_clearance_limitation"],
                "2-3 sets x 8 steps",
                ["Tue", "Thu", "Sat"],
                ["Stand with support nearby.", "Step over a very low marker.", "Lift the toes and place the foot quietly."],
                ["Keep obstacle very low.", "Do not practice alone if catching the toes."],
                "Progress marker height only with therapist approval.",
                ["nice_ng236", "therapeutic_exercise"],
            ),
        },
    ),
    "balance": PackageDefinition(
        "balance",
        "Balance Package",
        ["quiet_stand", "functional_reach", "weight_shift", "sit_to_stand_balance", "step_reaction"],
        ["berg_balance", "tug_10mwt", "nice_ng236"],
        {
            "quiet_stand": ["swayCm", "stanceTimeSec", "lossOfBalance"],
            "functional_reach": ["reachDistanceCm", "steppingDuringReach"],
            "weight_shift": ["weightShiftSymmetry", "swayCm"],
            "sit_to_stand_balance": ["sitToStandSec", "lossOfBalance"],
            "step_reaction": ["reactionStepTimeSec", "extraSteps"],
        },
        {
            "supported_weight_shift": _exercise(
                "supported_weight_shift",
                "Supported side-to-side weight shift",
                ["weight_shift_limitation", "standing_balance_limitation"],
                "3 sets x 30 sec",
                ["Mon", "Tue", "Thu", "Sat"],
                ["Stand near a counter.", "Shift weight slowly left and right.", "Keep both feet planted unless instructed otherwise."],
                ["Use supervision if unsteady.", "Stop if dizziness occurs."],
                "Progress by reducing hand support, not by closing eyes.",
                ["berg_balance", "nice_ng236", "therapeutic_exercise"],
            ),
            "safe_forward_reach": _exercise(
                "safe_forward_reach",
                "Supported forward reach",
                ["functional_reach_limitation"],
                "2-3 sets x 8 reaches",
                ["Mon", "Wed", "Fri"],
                ["Stand or sit with support nearby.", "Reach forward to a safe target.", "Return upright before the next reach."],
                ["Keep target within safe range.", "Do not lean until stepping is needed."],
                "Progress target distance only when control is steady.",
                ["berg_balance", "therapeutic_exercise"],
            ),
            "stepping_response": _exercise(
                "stepping_response",
                "Controlled stepping response",
                ["stepping_reaction_limitation", "turning_balance_limitation"],
                "2 sets x 6-8 steps each side",
                ["Tue", "Thu", "Sat"],
                ["Stand with support nearby.", "Step out and return slowly.", "Keep the trunk upright."],
                ["Use caregiver support if any falls risk.", "Avoid fast perturbations without therapist supervision."],
                "Progress by changing direction before increasing speed.",
                ["berg_balance", "nice_ng236", "therapeutic_exercise"],
            ),
        },
    ),
    "trunk": PackageDefinition(
        "trunk",
        "Trunk Control Package",
        ["static_sitting", "lateral_reach_sitting", "trunk_rotation", "supine_to_sit", "sit_to_stand_trunk"],
        ["tis_tct", "nice_ng236", "canadian_stroke_best_practices"],
        {
            "static_sitting": ["sittingSwayCm", "sittingTimeSec", "usesArmSupport"],
            "lateral_reach_sitting": ["lateralReachCm", "trunkControlScore", "lossOfBalance"],
            "trunk_rotation": ["trunkRotationDeg", "symmetryRatio"],
            "supine_to_sit": ["supineToSitSec", "assistanceNeeded"],
            "sit_to_stand_trunk": ["trunkFlexionControlScore", "lateralLeanDeg"],
        },
        {
            "seated_midline_control": _exercise(
                "seated_midline_control",
                "Seated midline control",
                ["static_sitting_control_limitation", "trunk_control_limitation"],
                "3 sets x 30-45 sec",
                ["Mon", "Tue", "Thu", "Sat"],
                ["Sit with feet supported.", "Find upright midline posture.", "Hold while breathing normally."],
                ["Use supervision if sitting balance is poor.", "Avoid fatigue-driven slumping."],
                "Progress by reducing hand support before adding movement.",
                ["tis_tct", "therapeutic_exercise"],
            ),
            "seated_lateral_reach": _exercise(
                "seated_lateral_reach",
                "Seated lateral reach",
                ["dynamic_sitting_balance_limitation"],
                "2-3 sets x 8 reaches each side",
                ["Mon", "Wed", "Fri"],
                ["Sit safely with feet supported.", "Reach sideways within control.", "Return to midline slowly."],
                ["Keep reach small if balance is uncertain.", "Have someone nearby if needed."],
                "Progress reach distance only without losing midline return.",
                ["tis_tct", "therapeutic_exercise"],
            ),
            "trunk_rotation_practice": _exercise(
                "trunk_rotation_practice",
                "Seated trunk rotation",
                ["trunk_rotation_limitation", "trunk_coordination_limitation"],
                "2 sets x 8 turns each side",
                ["Tue", "Thu", "Sat"],
                ["Sit tall.", "Turn the shoulders and trunk slowly.", "Return to center with control."],
                ["Avoid twisting into pain.", "Keep hips stable."],
                "Progress by reaching to a target during rotation.",
                ["tis_tct", "therapeutic_exercise"],
            ),
        },
    ),
}


def action_analysis(package_key: str, action_id: str, metrics: dict[str, Any]) -> dict[str, Any]:
    problems: list[str] = []
    evidence: list[str] = []
    confidence = confidence_for_action(metrics)

    if not metrics:
        return {"action_id": action_id, "metrics": {}, "metric_confidence": 0, "problems": [], "evidence": ["No measured movement metrics were provided."]}

    if package_key == "hand":
        if action_id == "gross_grasp_release":
            if not bool_metric(metrics, "releaseSuccess", True) or (metric(metrics, "handOpenScore", 1) or 1) < 0.55:
                problems.append("hand_release_difficulty")
                evidence.append("Grasp-release task shows incomplete or limited active hand opening.")
        if action_id == "pinch_precision" and (metric(metrics, "pinchControlScore", 1) or 1) < 0.6:
            problems.append("pinch_precision_limitation")
            evidence.append("Pinch control score is below the task target.")
        if action_id == "finger_tapping":
            if (metric(metrics, "tappingRateHz", 2) or 2) < 1.0 or (metric(metrics, "fingerIndividuationScore", 1) or 1) < 0.55:
                problems.append("finger_individuation_difficulty")
                evidence.append("Finger tapping is slow or fingers move together.")
        if action_id in {"object_transfer", "peg_like_precision"}:
            if (metric(metrics, "dropCount", 0) or 0) > 1 or (metric(metrics, "precisionCompletionSec", 0) or 0) > 45:
                problems.append("fine_manual_dexterity_limitation")
                evidence.append("Object transfer or precision task is slow, inaccurate, or includes drops.")

    if package_key == "gait":
        if (metric(metrics, "gaitSpeedMps", 1.0) or 1.0) < 0.6:
            problems.append("slow_gait_speed")
            evidence.append("Estimated gait speed is below a conservative community-mobility screening target.")
        if (metric(metrics, "sitToStandSec", 0) or 0) > 5 or bool_metric(metrics, "usesHands", False):
            problems.append("transfer_power_limitation")
            evidence.append("Sit-to-stand is slow or relies on hand support.")
        if abs((metric(metrics, "stepSymmetryRatio", 1.0) or 1.0) - 1.0) > 0.25 or (metric(metrics, "stanceAsymmetryPct", 0) or 0) > 20:
            problems.append("step_asymmetry")
            evidence.append("Step or stance symmetry is outside the screening target.")
        if (metric(metrics, "minimumFootClearanceCm", 8) or 8) < 3 or (metric(metrics, "toeDragEvents", 0) or 0) > 0:
            problems.append("foot_clearance_limitation")
            evidence.append("Toe clearance appears reduced or toe drag was detected.")
        if (metric(metrics, "tugSec", 0) or 0) > 14 or (metric(metrics, "turnSteps", 0) or 0) > 6 or bool_metric(metrics, "lossOfBalance", False):
            problems.append("gait_stability_limitation")
            evidence.append("TUG/turning screen suggests mobility or turning instability.")

    if package_key == "balance":
        if (metric(metrics, "stanceTimeSec", 30) or 30) < 20 or bool_metric(metrics, "lossOfBalance", False) or (metric(metrics, "swayCm", 0) or 0) > 8:
            problems.append("standing_balance_limitation")
            evidence.append("Quiet standing shows short hold time, large sway, or balance loss.")
        if (metric(metrics, "reachDistanceCm", 30) or 30) < 18 or bool_metric(metrics, "steppingDuringReach", False):
            problems.append("functional_reach_limitation")
            evidence.append("Forward reach is short or requires stepping.")
        if abs((metric(metrics, "weightShiftSymmetry", 1.0) or 1.0) - 1.0) > 0.3:
            problems.append("weight_shift_limitation")
            evidence.append("Weight shift is asymmetric.")
        if (metric(metrics, "reactionStepTimeSec", 0) or 0) > 1.2 or (metric(metrics, "extraSteps", 0) or 0) > 1:
            problems.append("stepping_reaction_limitation")
            evidence.append("Stepping response is delayed or requires extra steps.")

    if package_key == "trunk":
        if (metric(metrics, "sittingTimeSec", 30) or 30) < 20 or bool_metric(metrics, "usesArmSupport", False) or (metric(metrics, "sittingSwayCm", 0) or 0) > 6:
            problems.append("static_sitting_control_limitation")
            evidence.append("Static sitting requires support, is short, or has large sway.")
        if (metric(metrics, "lateralReachCm", 25) or 25) < 12 or bool_metric(metrics, "lossOfBalance", False):
            problems.append("dynamic_sitting_balance_limitation")
            evidence.append("Lateral sitting reach is limited or unstable.")
        if (metric(metrics, "trunkRotationDeg", 60) or 60) < 35 or abs((metric(metrics, "symmetryRatio", 1.0) or 1.0) - 1.0) > 0.3:
            problems.append("trunk_rotation_limitation")
            evidence.append("Trunk rotation is limited or asymmetric.")
        if (metric(metrics, "supineToSitSec", 0) or 0) > 8 or bool_metric(metrics, "assistanceNeeded", False):
            problems.append("bed_mobility_limitation")
            evidence.append("Supine-to-sit is slow or needs assistance.")
        if (metric(metrics, "lateralLeanDeg", 0) or 0) > 10 or (metric(metrics, "trunkFlexionControlScore", 1) or 1) < 0.6:
            problems.append("trunk_control_limitation")
            evidence.append("Sit-to-stand trunk control shows lateral lean or poor flexion control.")

    return {
        "action_id": action_id,
        "metrics": metrics,
        "metric_confidence": confidence,
        "problems": sorted(set(problems)),
        "evidence": evidence,
    }


def summarize_problem(package_key: str, problem_id: str, evidence: list[str]) -> FunctionalProblem:
    catalog = {
        "hand_release_difficulty": ("Hand release difficulty", "Opening the hand after grasping is difficult.", ["releasing objects", "dressing", "using utensils"], ["arat", "bbt_nhpt"]),
        "pinch_precision_limitation": ("Pinch precision limitation", "Thumb-finger precision control is limited.", ["buttoning", "picking up small items", "writing tasks"], ["arat", "bbt_nhpt"]),
        "finger_individuation_difficulty": ("Finger individuation difficulty", "Individual finger control is slow or coupled.", ["typing", "fine motor tasks", "object manipulation"], ["bbt_nhpt"]),
        "fine_manual_dexterity_limitation": ("Fine manual dexterity limitation", "Small object handling is slow or inaccurate.", ["medication handling", "coins/keys", "meal preparation"], ["bbt_nhpt", "arat"]),
        "slow_gait_speed": ("Slow gait speed", "Walking speed is reduced.", ["community walking", "crossing roads", "fatigue management"], ["tug_10mwt"]),
        "transfer_power_limitation": ("Sit-to-stand limitation", "Standing from a chair requires extra time or support.", ["toileting", "chair transfers", "getting out of bed"], ["tug_10mwt", "nice_ng236"]),
        "step_asymmetry": ("Step asymmetry", "Step timing or stance appears uneven.", ["walking efficiency", "stability", "fatigue"], ["tug_10mwt"]),
        "foot_clearance_limitation": ("Foot clearance limitation", "The foot may not clear the floor reliably.", ["tripping risk", "stairs", "walking outdoors"], ["tug_10mwt"]),
        "gait_stability_limitation": ("Gait or turning stability limitation", "Walking or turning appears unstable.", ["turning", "bathroom mobility", "fall risk"], ["tug_10mwt", "berg_balance"]),
        "standing_balance_limitation": ("Standing balance limitation", "Standing still is unsteady or short.", ["standing ADLs", "showering", "fall prevention"], ["berg_balance"]),
        "functional_reach_limitation": ("Functional reach limitation", "Reaching while balanced is limited.", ["kitchen tasks", "dressing", "picking up objects"], ["berg_balance"]),
        "weight_shift_limitation": ("Weight-shift limitation", "Weight transfer between sides is uneven.", ["walking", "turning", "transfers"], ["berg_balance"]),
        "stepping_reaction_limitation": ("Stepping reaction limitation", "Corrective stepping is delayed or inefficient.", ["fall recovery", "crowded environments", "turning"], ["berg_balance"]),
        "static_sitting_control_limitation": ("Static sitting control limitation", "Sitting upright is not yet steady.", ["sitting ADLs", "reaching from chair", "wheelchair posture"], ["tis_tct"]),
        "dynamic_sitting_balance_limitation": ("Dynamic sitting balance limitation", "Reaching from sitting is limited or unstable.", ["dressing", "bedside activities", "reaching"], ["tis_tct"]),
        "trunk_rotation_limitation": ("Trunk rotation limitation", "Turning the trunk is limited or asymmetric.", ["rolling", "reaching across body", "walking turns"], ["tis_tct"]),
        "bed_mobility_limitation": ("Bed mobility limitation", "Moving from lying to sitting is slow or assisted.", ["getting out of bed", "independence", "caregiver burden"], ["tis_tct"]),
        "trunk_control_limitation": ("Trunk control limitation", "The trunk leans or lacks control during functional movement.", ["transfers", "walking", "reaching"], ["tis_tct"]),
    }
    title, summary, impact, sources = catalog[problem_id]
    severity = "moderate" if len(evidence) < 3 else "severe"
    return FunctionalProblem(problem_id, title, severity, summary, impact, evidence, sources, "source-backed domain + clinically-informed engineering threshold")


def build_cause_hypotheses(problem_ids: set[str], evidence: list[str]) -> list[CauseHypothesis]:
    hypotheses: list[CauseHypothesis] = []
    for problem_id in sorted(problem_ids):
        if "hand" in problem_id or "pinch" in problem_id or "finger" in problem_id or "dexterity" in problem_id:
            cause = "Possible reduced selective hand control, finger extensor control, sensory feedback, tone, or grip/pinch coordination."
            uncertainty = ["Video cannot measure grip force, pinch force, tone, tactile sensation, or intrinsic muscle force."]
            more = ["therapist hand assessment", "grip/pinch dynamometry", "tone and sensory screen"]
        elif "gait" in problem_id or "step" in problem_id or "foot" in problem_id or "transfer" in problem_id:
            cause = "Possible lower-limb weakness, reduced selective control, balance limitation, spasticity, foot drop, or confidence/fear contribution."
            uncertainty = ["Single-camera video cannot confirm strength, sensation, vestibular contribution, or ankle dorsiflexor force."]
            more = ["10MWT/TUG by therapist", "falls-risk screen", "OpenSim gait IK/ID if mechanism is unclear"]
        elif "balance" in problem_id or "reach" in problem_id or "weight_shift" in problem_id:
            cause = "Possible impaired postural control, sensory integration, weight-bearing confidence, or stepping strategy."
            uncertainty = ["Video cannot fully assess vestibular, somatosensory, visual, or fear-of-falling contributions."]
            more = ["BBS/Mini-BESTest/PASS-style therapist review", "supervised retest"]
        else:
            cause = "Possible reduced trunk control, dynamic sitting balance, trunk coordination, bed mobility, or postural endurance."
            uncertainty = ["Video cannot confirm trunk muscle force, neglect, pain, sensory loss, or cardiopulmonary fatigue."]
            more = ["TIS/TCT-style therapist review", "bed mobility and sitting balance retest"]
        hypotheses.append(CauseHypothesis(problem_id, cause, "moderate", [e for e in evidence if e], uncertainty, more))
    return hypotheses


def build_exercise_plan(definition: PackageDefinition, problem_ids: set[str], low_confidence: bool) -> list[ExercisePlanItem]:
    selected: list[ExercisePlanItem] = []
    for item in definition.exercise_library.values():
        if problem_ids.intersection(item.improves):
            selected.append(copy.deepcopy(item))
    if not selected:
        selected = [copy.deepcopy(item) for item in list(definition.exercise_library.values())[:2]]
    if low_confidence:
        for item in selected:
            item.precautions.append("Keep intensity low until video uncertainty is resolved or reviewed by a therapist.")
    return selected[:5]


def evaluate_package_collection(package_key: str, manifest: dict[str, Any]) -> dict[str, Any]:
    if package_key not in PACKAGE_DEFINITIONS:
        raise ValueError(f"Unknown package: {package_key}")
    definition = PACKAGE_DEFINITIONS[package_key]
    action_records = manifest.get("actions", {}) if isinstance(manifest.get("actions"), dict) else {}
    action_results = []
    evidence_by_problem: dict[str, list[str]] = {}
    for action_id in definition.actions:
        record = action_records.get(action_id, {})
        metrics = record.get("measuredMetrics", {}) or {}
        result = action_analysis(package_key, action_id, metrics)
        action_results.append(result)
        for problem_id in result["problems"]:
            evidence_by_problem.setdefault(problem_id, []).extend(result["evidence"])
    problems = [summarize_problem(package_key, problem_id, evidence) for problem_id, evidence in evidence_by_problem.items()]
    problem_ids = {problem.id for problem in problems}
    all_evidence = [evidence for action in action_results for evidence in action["evidence"]]
    hypotheses = build_cause_hypotheses(problem_ids, all_evidence)
    low_confidence_actions = [action["action_id"] for action in action_results if action["metric_confidence"] < 60]
    plan = build_exercise_plan(definition, problem_ids, bool(low_confidence_actions))
    review_note = (
        "A therapist should review pain, falls risk, severe spasticity, unclear results, or unsafe task performance. "
        "Phone-video findings are screening estimates, not official standardized test scores or diagnosis."
    )
    return {
        "algorithmVersion": f"{package_key}-package-v1.0",
        "packageKey": package_key,
        "packageTitle": definition.title,
        "scope": "patient-facing decision support, not diagnosis",
        "sources": {key: SOURCES[key] for key in set(definition.source_basis + [src for item in plan for src in item.source_basis]) if key in SOURCES},
        "clinicalLogicAudit": {
            "source_backed_domains": PACKAGE_AUDIT[package_key]["source_backed_domains"],
            "engineering_proxy_rules": PACKAGE_AUDIT[package_key]["engineering_proxy_rules"],
            "requires_clinical_validation": [
                "Validate video-derived metrics against therapist-scored standardized measures.",
                "Validate problem-to-exercise mapping with licensed rehabilitation clinicians.",
                "Use therapist approval before production clinical prescription.",
            ],
        },
        "qualitySummary": {
            "failed": [],
            "review": low_confidence_actions,
            "missingMetrics": [action["action_id"] for action in action_results if not action["metrics"]],
            "meanConfidence": round(sum(action["metric_confidence"] for action in action_results) / len(action_results), 1),
        },
        "actionAnalyses": action_results,
        "functionalProblems": [asdict(problem) for problem in problems],
        "causeHypotheses": [asdict(hypothesis) for hypothesis in hypotheses],
        "opensimDecision": {
            "needed": package_key == "gait" and bool(problem_ids.intersection({"step_asymmetry", "foot_clearance_limitation", "gait_stability_limitation"})),
            "priority": "recommended" if low_confidence_actions else "not_required_for_basic_plan",
            "reasons": ["Low confidence or gait mechanism uncertainty should trigger retake, therapist review, or deeper biomechanical analysis."] if low_confidence_actions else ["Functional screening is internally consistent enough for a conservative starter plan."],
            "recommended_workflow": ["Retake unclear videos", "Therapist review", "OpenSim gait IK/ID when joint mechanics are needed"] if package_key == "gait" else ["Retake unclear videos", "Therapist review"],
        },
        "weeklyExercisePlan": [asdict(item) for item in plan],
        "patientFacingSummary": {
            "title": f"Your {definition.title.lower()} training priorities",
            "problems": [problem.patient_summary for problem in problems],
            "trainingFocus": [item.name for item in plan],
            "reviewNote": review_note,
        },
    }


def sample_manifest(package_key: str) -> dict[str, Any]:
    base = {"meanKeypointConfidence": 0.78, "landmarkMissingRatio": 0.15, "repetitionConsistency": 0.7}
    samples = {
        "hand": {
            "gross_grasp_release": {"releaseSuccess": False, "handOpenScore": 0.42, "releaseTimeSec": 4.2},
            "pinch_precision": {"pinchControlScore": 0.48, "dropCount": 2},
            "finger_tapping": {"tappingRateHz": 0.7, "fingerIndividuationScore": 0.45},
            "object_transfer": {"objectTransferCount": 5, "dropCount": 2},
            "peg_like_precision": {"precisionCompletionSec": 52, "endpointErrorCm": 6},
        },
        "gait": {
            "sit_to_stand": {"sitToStandSec": 6.5, "usesHands": True, "kneeControlScore": 0.5},
            "short_walk": {"gaitSpeedMps": 0.45, "stepSymmetryRatio": 1.38, "stanceAsymmetryPct": 28},
            "timed_up_go": {"tugSec": 18.5, "turnSteps": 8, "lossOfBalance": False},
            "step_clearance": {"minimumFootClearanceCm": 2.5, "toeDragEvents": 1},
            "turn_180": {"turnSteps": 7, "turnTimeSec": 5.5, "lossOfBalance": False},
        },
        "balance": {
            "quiet_stand": {"swayCm": 9, "stanceTimeSec": 18, "lossOfBalance": False},
            "functional_reach": {"reachDistanceCm": 14, "steppingDuringReach": True},
            "weight_shift": {"weightShiftSymmetry": 1.45, "swayCm": 7},
            "sit_to_stand_balance": {"sitToStandSec": 6.0, "lossOfBalance": False},
            "step_reaction": {"reactionStepTimeSec": 1.5, "extraSteps": 2},
        },
        "trunk": {
            "static_sitting": {"sittingSwayCm": 7, "sittingTimeSec": 18, "usesArmSupport": True},
            "lateral_reach_sitting": {"lateralReachCm": 9, "trunkControlScore": 0.5, "lossOfBalance": False},
            "trunk_rotation": {"trunkRotationDeg": 30, "symmetryRatio": 1.4},
            "supine_to_sit": {"supineToSitSec": 10, "assistanceNeeded": True},
            "sit_to_stand_trunk": {"trunkFlexionControlScore": 0.45, "lateralLeanDeg": 14},
        },
    }
    if package_key not in samples:
        raise ValueError(f"Unknown package: {package_key}")
    return {"patientProfile": {"safetyFlags": []}, "actions": {action: {"measuredMetrics": {**base, **metrics}} for action, metrics in samples[package_key].items()}}


def main() -> int:
    import argparse

    parser = argparse.ArgumentParser(description="Evaluate AxonAI rehab package collection.")
    parser.add_argument("package", choices=sorted(PACKAGE_DEFINITIONS))
    parser.add_argument("--manifest")
    args = parser.parse_args()
    manifest = json.loads(open(args.manifest, encoding="utf-8").read()) if args.manifest else sample_manifest(args.package)
    print(json.dumps(evaluate_package_collection(args.package, manifest), ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
