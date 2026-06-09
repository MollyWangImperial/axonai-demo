# Upper-Limb Clinical Logic Audit

This audit describes the current English app/backend logic for identifying
functional problems and generating exercise plans. It is not a clinical
validation report.

## What Is Source-Backed

- Functional domains are aligned with common stroke upper-limb assessments:
  shoulder/elbow/forearm, wrist/hand, and coordination domains follow the
  Fugl-Meyer Upper Extremity structure.
- Grasp/release, gross arm movement, reach, and object-related activity
  concepts are aligned with ARAT and WMFT-style activity-capacity domains.
- Training selection follows broad stroke rehabilitation guideline principles:
  repetitive, task-specific, functionally meaningful upper-limb practice,
  ROM/active-assisted movement when control is limited, and progression only
  when movement is controlled and safe.
- Conservative home-program doses are inspired by GRASP-style practice and
  therapeutic exercise principles, but are deliberately lower than full
  supervised high-dose programs.

## What Is Engineering Logic

These parts are reasonable screening heuristics, but they are not validated
clinical cutoffs:

- MediaPipe/OpenCV estimates of ROM, trunk lean, shoulder hike, reach ratio,
  endpoint spread, hand opening, and smoothness.
- Numeric thresholds such as shoulder flexion below 90 degrees, shoulder
  abduction below 80 degrees, wrist extension below 25 degrees, trunk lean
  above 12 degrees, and endpoint error above 8 cm.
- Confidence scoring from video quality, landmark visibility, landmark missing
  ratio, and repetition consistency.
- Cross-action contradiction rules, such as isolated shoulder elevation looking
  poor while reach looks strong.
- OpenSim escalation rules when confidence is low, compensation is large,
  evidence conflicts, or safety flags are present.
- Cause hypotheses such as possible reduced selective control, abnormal tone,
  pain limitation, or sensory/coordination contribution. These hypotheses need
  therapist review and/or additional measures.

## Current Safety Position

The system should describe outputs as:

- "functional problem screening"
- "possible causes"
- "training priorities"
- "therapist review recommended when uncertain"

It should not describe outputs as:

- diagnosis
- official FMA-UE, ARAT, or WMFT score
- measured muscle force
- confirmed spasticity/tone diagnosis
- confirmed passive ROM restriction
- clinically prescribed plan without therapist approval

## Validation Needed Before Launch

- Compare video-derived metrics with therapist-rated FMA-UE, ARAT, WMFT,
  goniometry, and where possible dynamometry/EMG.
- Ask licensed stroke rehabilitation clinicians to review the mapping:
  functional problem -> possible cause -> training goal -> exercise plan.
- Add therapist dashboard review and plan approval before production use.
- Add explicit consent, privacy, audit log, and safety escalation flows.

