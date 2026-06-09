# Rehab Package Clinical Logic Audit

This document audits the first-pass algorithms for the non-upper-limb packages:
Hand Function, Gait, Balance, and Trunk Control. These algorithms are decision
support prototypes, not diagnosis or official standardized test scoring.

## Shared Flow

Each package follows the same reasoning structure:

1. Collect package-specific functional tasks.
2. Check video/metric quality.
3. Extract objective task metrics.
4. Map metrics to patient-facing functional problems.
5. Generate possible cause hypotheses with explicit uncertainty.
6. Decide whether video-only analysis is sufficient or whether therapist review,
   retake, sensors, or OpenSim/deeper biomechanical analysis is needed.
7. Convert functional problems and likely causes into training goals.
8. Select a conservative one-week starter plan from task-specific rehabilitation
   principles.

## Source-Backed Clinical Domains

The package domains are based on established rehabilitation constructs:

- Hand package:
  - ARAT domains: grasp, grip, pinch, gross movement.
  - Box and Block / Nine-Hole Peg concepts: gross and fine manual dexterity.
  - WMFT concept: timed upper-limb functional tasks and movement quality.
- Gait package:
  - TUG and 10MWT-style constructs: walking speed, transfers, turning, mobility.
  - Stroke guideline concepts: repetitive task training, walking practice,
    transfers, stairs, and progressive exercise.
- Balance package:
  - Berg Balance Scale / functional balance constructs: quiet standing,
    functional reach, weight shift, sit-to-stand, stepping control.
  - Stroke guideline concepts: safe balance training, task-specific practice,
    falls-risk escalation.
- Trunk package:
  - Trunk Impairment Scale / Trunk Control Test constructs: static sitting,
    dynamic sitting, trunk coordination, rolling or supine-to-sit function.
  - Stroke guideline concepts: postural control, sitting balance, task practice.

## Engineering Proxy Rules

The current implementation uses phone-video or metric-manifest proxies. These are
reasonable engineering tactics, but they are not official scores.

- Hand:
  - `handOpenScore`, `releaseSuccess`, `releaseTimeSec`, `pinchControlScore`,
    `tappingRateHz`, `fingerIndividuationScore`, `dropCount`,
    `precisionCompletionSec`.
  - These screen release, pinch, finger individuation, and fine dexterity.
- Gait:
  - `gaitSpeedMps`, `stepSymmetryRatio`, `stanceAsymmetryPct`, `tugSec`,
    `turnSteps`, `minimumFootClearanceCm`, `toeDragEvents`.
  - These screen gait speed, asymmetry, turning stability, and foot clearance.
- Balance:
  - `swayCm`, `stanceTimeSec`, `reachDistanceCm`, `steppingDuringReach`,
    `weightShiftSymmetry`, `reactionStepTimeSec`, `extraSteps`.
  - These screen static balance, dynamic reach, weight shift, and stepping reaction.
- Trunk:
  - `sittingSwayCm`, `sittingTimeSec`, `usesArmSupport`, `lateralReachCm`,
    `trunkRotationDeg`, `symmetryRatio`, `supineToSitSec`, `lateralLeanDeg`.
  - These screen static/dynamic sitting, trunk rotation, bed mobility, and trunk
    control during functional tasks.

## Escalation Logic

The system recommends retake, therapist review, or deeper analysis when:

- Video/metric confidence is low.
- Required tasks or metrics are missing.
- Safety flags appear: pain, stopping, loss of balance, severe instability.
- Multiple functional problems are detected and mechanism is unclear.
- Gait package has mechanical questions where OpenSim IK/ID could clarify joint
  kinematics/kinetics.

OpenSim is not required for every patient. It is most useful when video shows a
functional problem but the mechanism is unclear, especially for gait mechanics,
joint loading, compensatory strategy, or kinetics.

## Validation Needed Before Clinical Launch

Before clinical production use:

- Validate video-derived metrics against therapist-scored ARAT, BBT, NHPT, WMFT,
  TUG, 10MWT, BBS, TIS, TCT, or clinic-selected equivalents.
- Have licensed rehabilitation clinicians review problem labels, escalation rules,
  contraindications, and exercise matching.
- Calibrate thresholds by package protocol, camera placement, patient severity,
  assistive-device use, and safety context.
- Add structured adverse-event and pain handling before unsupervised deployment.

## Key References

- NICE NG236 Stroke rehabilitation in adults:
  https://www.nice.org.uk/guidance/ng236/chapter/Recommendations
- Canadian Stroke Best Practices:
  https://www.strokebestpractices.ca/recommendations/stroke-rehabilitation
- Action Research Arm Test:
  https://www.gu.se/en/neuroscience-physiology/action-research-arm-test
- Box and Block / Nine-Hole Peg Test psychometric context:
  https://pmc.ncbi.nlm.nih.gov/articles/PMC9833478/
- Wolf Motor Function Test context:
  https://pmc.ncbi.nlm.nih.gov/articles/PMC3754424/
- Timed Up and Go, RehabMeasures:
  https://www.sralab.org/rehabilitation-measures/timed-and-go
- Berg Balance Scale, RehabMeasures:
  https://www.sralab.org/rehabilitation-measures/berg-balance-scale
- Trunk Impairment Scale, RehabMeasures:
  https://www.sralab.org/rehabilitation-measures/trunk-impairment-scale
