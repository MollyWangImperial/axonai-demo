# Rehab Algorithm Rigor Notes

## Short Answer

The current algorithms are rigorous enough for MVP testing and therapist-facing
decision-support review. They are not rigorous enough to be marketed as diagnosis,
official standardized-test scoring, or autonomous clinical prescription.

## What Is Source-Backed

The package domains and training principles are grounded in established stroke
rehabilitation sources:

- NICE NG236 supports repetitive task training for upper-limb weakness and lower
  limb weakness, including reaching, grasping, manipulating objects, sit-to-stand,
  walking, and stairs.
- Canadian Stroke Best Practices supports affected-limb use during functional
  tasks, task-specific training, mobility/balance/transfer rehabilitation, and
  progressive practice.
- SRALab RehabMeasures supports common constructs used by therapists:
  - Box and Block / Nine-Hole Peg style hand dexterity.
  - Timed Up and Go and walking-speed style mobility.
  - Berg Balance Scale style standing balance and fall-risk constructs.
  - Trunk Impairment Scale / Trunk Control Test style trunk and sitting control.

## What Is Engineering Tactics

These are clinically reasonable screening proxies, but not official scores:

- Phone-video thresholds for brightness, blur, video length, and resolution.
- Keypoint-confidence cutoffs.
- ROM, smoothness, sway, reach distance, foot clearance, trunk lean, and hand
  opening estimates from phone video.
- Rule-based mapping from proxy metrics to functional problems.
- Conservative dose selection for a first-week home program.

The app and API should label these as screening estimates and recommend therapist
review for uncertainty, pain, fall risk, severe impairment, or conflicting results.

## Current Package Coverage

- Upper limb: video quality check, video metric extraction, functional problem
  identification, cause hypotheses, OpenSim/therapist-review decision, plan.
- Hand: source-backed reasoning and exercise matching; generic video quality gate
  now added. Package-specific hand metric extractor still needed.
- Gait: source-backed reasoning and exercise matching; generic video quality gate
  now added. Package-specific gait metric extractor still needed.
- Balance: source-backed reasoning and exercise matching; generic video quality
  gate now added. Package-specific balance metric extractor still needed.
- Trunk: source-backed reasoning and exercise matching; generic video quality gate
  now added. Package-specific trunk metric extractor still needed.

## Practical Testing Interpretation

For your upcoming testing:

- Use upper limb as the real end-to-end test.
- Use hand/gait/balance/trunk backend sample/analyze endpoints to inspect logic.
- Treat non-upper packages as logic-ready but not full video-analysis-ready until
  their package-specific video metric extractors are implemented.

## Key Sources

- NICE NG236 Stroke rehabilitation in adults:
  https://www.nice.org.uk/guidance/ng236/chapter/Recommendations
- Canadian Stroke Best Practices:
  https://www.strokebestpractices.ca/recommendations/stroke-rehabilitation
- SRALab Berg Balance Scale:
  https://www.sralab.org/rehabilitation-measures/berg-balance-scale
- SRALab Timed Up and Go:
  https://www.sralab.org/rehabilitation-measures/timed-and-go
- SRALab Box and Block Test:
  https://www.sralab.org/rehabilitation-measures/box-and-block-test
