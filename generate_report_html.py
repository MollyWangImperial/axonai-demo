import os
import json
import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from plotly.offline import plot

def generate_interactive_gait_report(json_file, output_html="interactive_gait_report.html"):
    """
    Generate a modern interactive HTML gait report from a gait JSON file.
    """

    # -----------------------------
    # Load JSON
    # -----------------------------
    with open(json_file) as f:
        raw = json.load(f)

    gait_metrics = raw["gait_analysis"]["body"]["metrics"]
    datasets = raw["gait_analysis"]["body"]["datasets"]
    df = pd.DataFrame(datasets)

    # -----------------------------
    # Compute Summary Metrics
    # -----------------------------
    summary_metrics = {
        "Trial Duration (s)": round(df["time"].max(), 2),
        "Number of Frames": len(df),
        "Average Walking Speed (m/s)": round((df['pelvis_tx'].iloc[-1] - df['pelvis_tx'].iloc[0]) / df["time"].max(), 2),
        "Max Hip Flexion (°)": round(max(df['hip_flexion_r'].max(), df['hip_flexion_l'].max()), 1),
        "Max Knee Flexion (°)": round(max(df['knee_angle_r'].max(), df['knee_angle_l'].max()), 1)
    }

    # -----------------------------
    # Gait Metrics Table
    # -----------------------------
    metric_table_data = [
        [m["label"], m["value"], f"{m['min_limit']}-{m['max_limit']}"] 
        for m in gait_metrics.values()
    ]
    metric_table_fig = go.Figure(data=[go.Table(
        header=dict(values=["Metric", "Value", "Reference"], fill_color='lightgrey'),
        cells=dict(values=list(zip(*metric_table_data)))
    )])
    metric_table_fig.update_layout(template='plotly_white', height=400)

    # -----------------------------
    # Left-Right Symmetry Table
    # -----------------------------
    def find_pairs(columns):
        pairs = []
        for col in columns:
            if col.endswith("_l"):
                r = col.replace("_l", "_r")
                if r in columns:
                    pairs.append((col, r))
        return pairs

    symmetry_data = []
    for l, r in find_pairs(df.columns):
        diff = abs(df[l] - df[r]).mean()
        symmetry_data.append([l.replace("_l",""), round(diff,2)])
    symmetry_fig = go.Figure(data=[go.Table(
        header=dict(values=["Joint", "Mean L-R Difference"], fill_color='lightgrey'),
        cells=dict(values=list(zip(*symmetry_data)))
    )])
    symmetry_fig.update_layout(template='plotly_white', height=400)

    # -----------------------------
    # Kinematic Plots
    # -----------------------------
    plots = []

    def create_subplot(cols, title_prefix):
        if not cols: 
            return None
        fig = make_subplots(rows=len(cols), cols=1, shared_xaxes=True,
                            vertical_spacing=0.03,
                            subplot_titles=[c.replace("_"," ").title() for c in cols])
        for i, col in enumerate(cols):
            fig.add_trace(go.Scatter(x=df["time"], y=df[col], mode="lines", name=col), row=i+1, col=1)
        fig.update_layout(height=300*len(cols), title=title_prefix, template='plotly_white')
        return fig

    pelvis_cols = [c for c in df.columns if "pelvis" in c]
    lower_cols = [c for c in df.columns if any(x in c for x in ["hip","knee","ankle","subtalar"])]
    lumbar_cols = [c for c in df.columns if "lumbar" in c]
    upper_cols = [c for c in df.columns if any(x in c for x in ["arm","elbow","shoulder"])]

    plots_info = [
        (pelvis_cols, "Pelvis Kinematics"),
        (lower_cols, "Lower Limb Kinematics"),
        (lumbar_cols, "Lumbar/Spine Kinematics"),
        (upper_cols, "Upper Limb Kinematics")
    ]

    for cols, title in plots_info:
        fig = create_subplot(cols, title)
        if fig:
            plots.append((title, fig))

    # -----------------------------
    # Kinematic Guidelines
    # -----------------------------
    KINEMATIC_GUIDELINES = {
        "Pelvis Kinematics": """
        <b>Pelvis Rotations:</b><br>
        - Tilt: Forward/backward rotation (normal: ~5° anterior tilt)<br>
        - List: Side-to-side tilting (should be minimal, < 5°)<br>
        - Rotation: Horizontal plane rotation (normal: ~8° range)<br>
        <b>Pelvis Translations:</b><br>
        - X: Forward progression (should be steady)<br>
        - Y: Vertical displacement (normal: 4-5 cm oscillation)<br>
        - Z: Medial-lateral sway (should be minimal)<br>
        <b>Trajectory:</b> Shows the walking path from above (bird's eye view)
        """,
        "Lower Limb Kinematics": """
        <b>Hip Joint:</b><br>
        - Flexion: 0-30° during stance, up to 40° during swing<br>
        - Adduction: Should be minimal (< 10°)<br>
        - Rotation: Internal/external rotation (< 10° range)<br>
        <b>Knee Joint:</b><br>
        - Flexion: 0-15° during stance, 60° peak during swing<br>
        - Smooth pattern indicates healthy gait<br>
        <b>Ankle Joint:</b><br>
        - Dorsiflexion: 10° at initial contact<br>
        - Plantarflexion: 20° at toe-off<br>
        <b>Symmetry:</b> Left and right should show similar patterns
        """,
        "Lumbar/Spine Kinematics": """
        <b>Lumbar Spine:</b><br>
        - Extension: Forward/backward bending (normal: small oscillations)<br>
        - Bending: Side-to-side movement (should be minimal)<br>
        - Rotation: Horizontal plane rotation (coordinates with pelvis)<br>
        <b>Normal Pattern:</b> Spine should remain relatively stable with small, rhythmic oscillations coordinated with the gait cycle.
        """,
        "Upper Limb Kinematics": """
        <b>Shoulder Joint:</b><br>
        - Flexion/Extension: Arms swing 20-30° forward and backward<br>
        - Pattern: Counter to leg movement (right arm forward with left leg)<br>
        <b>Elbow Joint:</b><br>
        - Flexion: Typically 20-30° during normal walking<br>
        - Variation: Increases with faster walking speed<br>
        <b>Arm Swing:</b> Important for balance and energy efficiency. Asymmetry may indicate neurological or musculoskeletal issues
        """
    }

    # -----------------------------
    # Generate HTML
    # -----------------------------
    html_content = """
    <html>
    <head>
        <title>Interactive Gait Report</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    </head>
    <body>
    <div class="container my-4">
        <h1 class="mb-4">Interactive Gait Report</h1>

        <!-- Summary Metrics -->
        <div class="card mb-4">
            <div class="card-header">Summary Metrics</div>
            <div class="card-body">
                <ul>
    """
    for k,v in summary_metrics.items():
        html_content += f"<li><b>{k}:</b> {v}</li>"
    html_content += """
                </ul>
            </div>
        </div>
    """

    # Metric Table
    html_content += '<div class="card mb-4"><div class="card-header">Gait Metrics</div><div class="card-body">'
    html_content += plot(metric_table_fig, output_type='div', include_plotlyjs='cdn')
    html_content += "</div></div>"

    # Symmetry Table
    html_content += '<div class="card mb-4"><div class="card-header">Left-Right Symmetry</div><div class="card-body">'
    html_content += plot(symmetry_fig, output_type='div', include_plotlyjs=False)
    html_content += "</div></div>"

    # Kinematic Plots (accordion with guidelines)
    html_content += '<div class="accordion" id="kinematicAccordion">'
    for i, (title, fig) in enumerate(plots):
        guideline_text = KINEMATIC_GUIDELINES.get(title, "")
        html_content += f'''
        <div class="accordion-item">
            <h2 class="accordion-header" id="heading{i}">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse{i}" aria-expanded="false" aria-controls="collapse{i}">
                    {title}
                </button>
            </h2>
            <div id="collapse{i}" class="accordion-collapse collapse" aria-labelledby="heading{i}" data-bs-parent="#kinematicAccordion">
                <div class="accordion-body">
                    {plot(fig, output_type='div', include_plotlyjs=False)}
                    <hr>
                    <h5>Interpretation Guidelines</h5>
                    <div style="font-size:0.9rem;">{guideline_text}</div>
                </div>
            </div>
        </div>
        '''
    html_content += "</div></div></body></html>"

    with open(output_html, "w") as f:
        f.write(html_content)

    print("Interactive gait report generated:", output_html)

# -----------------------------
# Run example
# -----------------------------
if __name__=="__main__":
    generate_interactive_gait_report("gait_output.json")
