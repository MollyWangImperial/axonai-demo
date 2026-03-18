import os
import json
import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from plotly.offline import plot


KINEMATIC_GUIDELINES = {
    "Pelvis Kinematics": """
Pelvis Rotations:
- Tilt: Forward/backward rotation (normal: ~5° anterior tilt)
- List: Side-to-side tilting (should be minimal, < 5°)
- Rotation: Horizontal plane rotation (normal: ~8° range)

Pelvis Translations:
- X: Forward progression (should be steady)
- Y: Vertical displacement (normal: 4-5 cm oscillation)
- Z: Medial-lateral sway (should be minimal)

Trajectory:
- Shows the walking path from above (bird's eye view)
""",
    "Lower Limb Kinematics": """
Hip Joint:
- Flexion: 0-30° during stance, up to 40° during swing
- Adduction: Should be minimal (< 10°)
- Rotation: Internal/external rotation (< 10° range)

Knee Joint:
- Flexion: 0-15° during stance, 60° peak during swing
- Smooth pattern indicates healthy gait

Ankle Joint:
- Dorsiflexion: 10° at initial contact
- Plantarflexion: 20° at toe-off

Symmetry:
- Left and right should show similar patterns
""",
    "Lumbar/Spine Kinematics": """
Lumbar Spine:
- Extension: Forward/backward bending (normal: small oscillations)
- Bending: Side-to-side movement (should be minimal)
- Rotation: Horizontal plane rotation (coordinates with pelvis)

Normal Pattern:
- Spine should remain relatively stable with small, rhythmic oscillations coordinated with the gait cycle.
""",
    "Upper Limb Kinematics": """
Shoulder Joint:
- Flexion/Extension: Arms swing 20-30° forward and backward
- Pattern: Counter to leg movement (right arm forward with left leg)

Elbow Joint:
- Flexion: Typically 20-30° during normal walking
- Variation: Increases with faster walking speed

Arm Swing:
- Important for balance and energy efficiency. Asymmetry may indicate neurological or musculoskeletal issues
""",
}


def _apply_professional_layout(fig: go.Figure, height: int | None = None) -> go.Figure:
    fig.update_layout(
        template="plotly_white",
        paper_bgcolor="white",
        plot_bgcolor="white",
        font=dict(size=12),
        margin=dict(l=40, r=30, t=60, b=40),
    )
    if height is not None:
        fig.update_layout(height=height)
    return fig


def _find_pairs(columns: list[str]) -> list[tuple[str, str]]:
    pairs = []
    for col in columns:
        if col.endswith("_l"):
            r = col.replace("_l", "_r")
            if r in columns:
                pairs.append((col, r))
    return pairs


def _create_subplot(df: pd.DataFrame, cols: list[str], title_prefix: str) -> go.Figure | None:
    if not cols:
        return None

    fig = make_subplots(
        rows=len(cols),
        cols=1,
        shared_xaxes=True,
        vertical_spacing=0.04,
        subplot_titles=[c.replace("_", " ").title() for c in cols],
    )

    for i, col in enumerate(cols):
        fig.add_trace(
            go.Scatter(
                x=df["time"],
                y=df[col],
                mode="lines",
                name=col,
            ),
            row=i + 1,
            col=1,
        )

    # Smaller than before so it looks better in-app.
    fig.update_layout(
        title=title_prefix,
        height=max(360, 220 * len(cols)),
        showlegend=False,
    )
    return _apply_professional_layout(fig)


def build_gait_report_data(json_file: str) -> dict:
    with open(json_file) as f:
        raw = json.load(f)

    gait_metrics = raw["gait_analysis"]["body"]["metrics"]
    datasets = raw["gait_analysis"]["body"]["datasets"]
    df = pd.DataFrame(datasets)

    summary_metrics = {
        "Trial Duration (s)": round(df["time"].max(), 2),
        "Number of Frames": len(df),
        "Average Walking Speed (m/s)": round(
            (df["pelvis_tx"].iloc[-1] - df["pelvis_tx"].iloc[0]) / df["time"].max(), 2
        ),
        "Max Hip Flexion (°)": round(
            max(df["hip_flexion_r"].max(), df["hip_flexion_l"].max()), 1
        ),
        "Max Knee Flexion (°)": round(
            max(df["knee_angle_r"].max(), df["knee_angle_l"].max()), 1
        ),
    }

    metric_table_data = [
        [m["label"], m["value"], f"{m['min_limit']}-{m['max_limit']}"]
        for m in gait_metrics.values()
    ]
    metric_table_fig = go.Figure(
        data=[
            go.Table(
                header=dict(
                    values=["Metric", "Value", "Reference"],
                    fill_color="#E5E7EB",
                    align="left",
                ),
                cells=dict(
                    values=list(zip(*metric_table_data)),
                    fill_color="white",
                    align="left",
                ),
            )
        ]
    )
    _apply_professional_layout(metric_table_fig, height=340)

    symmetry_data = []
    for l, r in _find_pairs(df.columns):
        diff = abs(df[l] - df[r]).mean()
        symmetry_data.append([l.replace("_l", ""), round(diff, 2)])

    symmetry_fig = go.Figure(
        data=[
            go.Table(
                header=dict(
                    values=["Joint", "Mean L-R Difference"],
                    fill_color="#E5E7EB",
                    align="left",
                ),
                cells=dict(
                    values=list(zip(*symmetry_data)),
                    fill_color="white",
                    align="left",
                ),
            )
        ]
    )
    _apply_professional_layout(symmetry_fig, height=340)

    pelvis_cols = [c for c in df.columns if "pelvis" in c]
    lower_cols = [c for c in df.columns if any(x in c for x in ["hip", "knee", "ankle", "subtalar"])]
    lumbar_cols = [c for c in df.columns if "lumbar" in c]
    upper_cols = [c for c in df.columns if any(x in c for x in ["arm", "elbow", "shoulder"])]

    plots_info = [
        (pelvis_cols, "Pelvis Kinematics"),
        (lower_cols, "Lower Limb Kinematics"),
        (lumbar_cols, "Lumbar/Spine Kinematics"),
        (upper_cols, "Upper Limb Kinematics"),
    ]

    sections = []
    for cols, title in plots_info:
        fig = _create_subplot(df, cols, title)
        if fig is not None:
            sections.append(
                {
                    "title": title,
                    "guideline": KINEMATIC_GUIDELINES.get(title, ""),
                    "figure": fig,
                }
            )

    return {
        "summary_metrics": summary_metrics,
        "metric_table_fig": metric_table_fig,
        "symmetry_fig": symmetry_fig,
        "sections": sections,
    }
# -----------------------------
# Run example
# -----------------------------
if __name__=="__main__":
    generate_interactive_gait_report("gait_output.json")
