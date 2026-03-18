import os
import sys
from pathlib import Path
import reflex as rx
import json
import uuid
import httpx

# Add parent directory to Python path
CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent.parent   # go up to axonai_vps folder

sys.path.append(str(PROJECT_ROOT))

from generate_report_html import build_gait_report_data
import plotly.graph_objects as go

UPLOAD_DIR = Path("uploaded_files")
UPLOAD_DIR.mkdir(exist_ok=True)

REPORTS_DIR = Path(".web/public/generated_reports")
REPORTS_DIR.mkdir(parents=True, exist_ok=True)


class State(rx.State):
    """App state."""

    # -------------------------
    # Camera configuration page
    # -------------------------
    cols: int = 6
    rows: int = 9
    square_size_mm: float = 25.0
    n_images: int = 25

    calib_video_left_name: str = ""
    calib_video_right_name: str = ""
    calib_video_left_path: str = ""
    calib_video_right_path: str = ""

    configured: bool = False

    # -------------------------
    # Report page
    # -------------------------
    patient_left_video_name: str = ""
    patient_right_video_name: str = ""
    patient_left_video_path: str = ""
    patient_right_video_path: str = ""

    report_status: str = ""
    status_message: str = ""

    summary_labels: list[str] = []
    summary_values: list[str] = []
    metric_table_fig: go.Figure = go.Figure()
    symmetry_fig: go.Figure = go.Figure()
    section_titles: list[str] = []
    section_guidelines: list[str] = []
    section_figures: list[go.Figure] = []
    
    server_base_url: str = "http://187.77.179.76:8000"

    processing_session_id: str = ""
    processing_trial_name: str = "walking"
    processing_trial_id: str = "walking"

    opencap_ready: bool = False
    opencap_status: str = ""
    gait_json_local_path: str = ""
    is_processing_opencap: bool = False
    is_generating_report: bool = False

    # -------------------------
    # ADD THESE STATE FIELDS INSIDE class State(rx.State):
    # -------------------------
    

    rehab_plan_ready: bool = False
    rehab_plan_status: str = ""
    rehab_plan_title: str = ""
    rehab_plan_overview: str = ""
    rehab_plan_disclaimer: str = ""

    rehab_priority_focus_areas: list[dict[str, str]] = []
    rehab_exercise_plan: list[dict[str, str]] = []
    rehab_weekly_schedule: list[dict[str, list[str] | str]] = []
    rehab_nutrition_suggestions: list[dict[str, str]] = []
    rehab_lifestyle_recommendations: list[str] = []
    rehab_follow_up_flags: list[str] = []

    rehab_priority_titles: list[str] = []
    rehab_priority_rationales: list[str] = []

    rehab_exercise_names: list[str] = []
    rehab_exercise_goals: list[str] = []
    rehab_exercise_instruction_blocks: list[str] = []
    rehab_exercise_sets: list[str] = []
    rehab_exercise_reps: list[str] = []
    rehab_exercise_frequencies: list[str] = []
    rehab_exercise_progressions: list[str] = []
    rehab_exercise_cautions: list[str] = []

    rehab_schedule_day_labels: list[str] = []
    rehab_schedule_activity_blocks: list[str] = []

    rehab_nutrition_titles: list[str] = []
    rehab_nutrition_recommendations: list[str] = []
    rehab_nutrition_why: list[str] = []

    @rx.var
    def can_generate_rehab_plan(self) -> bool:
        return self.report_ready

    report_text: str = ""
    report_ready: bool = False
    report_chat_input: str = ""
    chat_messages: list[dict[str, str]] = [
        {
            "role": "assistant",
            "content": "Hi! Once your gait report is generated, you can ask me questions about symmetry, cadence, stance phase, swing phase, and clinical interpretation.",
        }
    ]
    
    async def maybe_start_opencap(self):
        if not (self.patient_left_video_path and self.patient_right_video_path):
            return

        if self.opencap_ready or self.is_processing_opencap:
            return

        try:
            self.is_processing_opencap = True
            self.opencap_status = "Uploading videos to server and running OpenCap..."
            self.report_status = self.opencap_status

            if not self.processing_session_id:
                uid = uuid.uuid4().hex[:10]
                self.processing_session_id = f"session_{uid}"
                self.processing_trial_name = f"trial_{uid}"
                self.processing_trial_id = self.processing_trial_name

            async with httpx.AsyncClient(timeout=3600.0) as client:
                with open(self.patient_left_video_path, "rb") as f_left, open(self.patient_right_video_path, "rb") as f_right:
                    response = await client.post(
                        f"{self.server_base_url}/api/run-opencap",
                        data={
                            "session_name": self.processing_session_id,
                            "trial_name": self.processing_trial_name,
                            "trial_id": self.processing_trial_id,
                        },
                        files={
                            "left_video": (
                                os.path.basename(self.patient_left_video_path),
                                f_left,
                                "video/mp4",
                            ),
                            "right_video": (
                                os.path.basename(self.patient_right_video_path),
                                f_right,
                                "video/mp4",
                            ),
                        },
                    )

            response.raise_for_status()
            payload = response.json()

            self.opencap_ready = True
            self.opencap_status = "OpenCap processing completed successfully."
            self.report_status = self.opencap_status

        except Exception as e:
            self.opencap_ready = False
            self.opencap_status = f"OpenCap failed: {str(e)}"
            self.report_status = self.opencap_status

        finally:
            self.is_processing_opencap = False

    async def generate_rehab_plan(self):
        """Generate a structured rehab plan from the existing gait report data."""
        try:
            if not self.report_ready:
                self.rehab_plan_status = "Please generate the gait report first."
                return

            summary_metrics = {
                label: value for label, value in zip(self.summary_labels, self.summary_values)
            }

            gait_metrics = {
                "note": "Use the metric table figure / backend export if available."
            }

            symmetry_metrics = {
                "note": "Use symmetry figure / backend export if available."
            }

            section_interpretations = [
                {"title": title, "guideline": guideline}
                for title, guideline in zip(self.section_titles, self.section_guidelines)
            ]

            prompt = f"""
            You are a senior clinical rehabilitation planning assistant for a gait analysis platform.

            Your task is to generate a personalized rehabilitation plan based on the patient's gait analysis metrics and gait report findings.

            You must write in a professional, clinician-facing tone that is still easy for patients to understand.

            Important constraints:
            1. Do not diagnose.
            2. Do not claim medical certainty.
            3. Base your recommendations only on the provided gait findings and metrics.
            4. If a metric suggests asymmetry, weakness, reduced range of motion, compensation, or instability, explain that cautiously.
            5. The rehab plan should be practical, specific, and actionable.
            6. Include exercise dosage and progression suggestions.
            7. Include nutritional suggestions that support recovery, muscle function, bone/joint health, hydration, and overall mobility.
            8. Avoid extreme or unsafe recommendations.
            9. Include a short disclaimer that the plan should be reviewed by a licensed clinician or physiotherapist before implementation.
            10. Output valid JSON only. Do not include markdown fences.

            Patient context and gait data:
            - Summary metrics: {summary_metrics}
            - Gait metrics table: {gait_metrics}
            - Left-right symmetry findings: {symmetry_metrics}
            - Section-level interpretations: {section_interpretations}

            Return JSON in exactly this schema:
            {{
            "title": "Personalized Rehabilitation Plan",
            "overview": "2-4 sentence summary of the main rehab priorities based on the gait findings.",
            "priority_focus_areas": [
                {{
                "title": "Focus area name",
                "rationale": "Why this is important based on the gait findings."
                }}
            ],
            "exercise_plan": [
                {{
                "exercise_name": "string",
                "goal": "string",
                "instructions": [
                    "step 1",
                    "step 2",
                    "step 3"
                ],
                "dosage": {{
                    "sets": "string",
                    "reps": "string",
                    "frequency": "string",
                    "progression": "string"
                }},
                "caution": "string"
                }}
            ],
            "weekly_schedule": [
                {{
                "day_label": "Day 1",
                "activities": [
                    "activity 1",
                    "activity 2"
                ]
                }}
            ],
            "nutrition_suggestions": [
                {{
                "title": "string",
                "recommendation": "string",
                "why_it_matters": "string"
                }}
            ],
            "lifestyle_recommendations": [
                "string",
                "string"
            ],
            "follow_up_flags": [
                "string",
                "string"
            ],
            "disclaimer": "string"
            }}
            """.strip()

            # Replace this block with your real OpenAI call.
            # Example expectation: response_text is a JSON string.
            response_text = """
            {
            "title": "Personalized Rehabilitation Plan",
            "overview": "The gait findings suggest that rehabilitation should prioritize symmetry, lower-limb control, and walking efficiency. A gradual exercise program focused on mobility, strength, balance, and motor control may help improve gait quality. Nutritional support should emphasize hydration, protein intake, and micronutrients relevant to neuromuscular function. This plan should be reviewed by a licensed clinician before implementation.",
            "priority_focus_areas": [
                {
                "title": "Left-right symmetry",
                "rationale": "The gait findings suggest side-to-side asymmetry that may reflect uneven loading or reduced motor control."
                },
                {
                "title": "Hip and knee control",
                "rationale": "Reduced control across the lower limb may contribute to inefficient gait mechanics."
                }
            ],
            "exercise_plan": [
                {
                "exercise_name": "Sit-to-stand",
                "goal": "Improve lower-limb strength and movement symmetry.",
                "instructions": [
                    "Sit on a stable chair with feet hip-width apart.",
                    "Stand up while keeping weight evenly distributed.",
                    "Lower slowly with control."
                ],
                "dosage": {
                    "sets": "2-3",
                    "reps": "8-12",
                    "frequency": "3-4 times per week",
                    "progression": "Increase repetitions first, then add tempo control or light resistance."
                },
                "caution": "Stop if pain, dizziness, or major instability occurs."
                }
            ],
            "weekly_schedule": [
                {
                "day_label": "Day 1",
                "activities": [
                    "Mobility warm-up",
                    "Strength exercises",
                    "Short balance block"
                ]
                }
            ],
            "nutrition_suggestions": [
                {
                "title": "Adequate protein intake",
                "recommendation": "Include a protein source with meals to support muscle recovery.",
                "why_it_matters": "Muscle adaptation is important for strength and gait retraining."
                }
            ],
            "lifestyle_recommendations": [
                "Aim for regular walking practice within a comfortable tolerance.",
                "Prioritize sleep and hydration to support recovery."
            ],
            "follow_up_flags": [
                "Persistent worsening asymmetry",
                "Pain, repeated tripping, or marked instability"
            ],
            "disclaimer": "This plan is educational and should be reviewed by a licensed clinician or physiotherapist before implementation."
            }
            """.strip()

            import json
            parsed = json.loads(response_text)

            self.rehab_plan_title = parsed.get("title", "Personalized Rehabilitation Plan")
            self.rehab_plan_overview = parsed.get("overview", "")
            self.rehab_plan_disclaimer = parsed.get("disclaimer", "")

            priority_items = parsed.get("priority_focus_areas", [])
            self.rehab_priority_titles = [item.get("title", "") for item in priority_items]
            self.rehab_priority_rationales = [item.get("rationale", "") for item in priority_items]

            exercise_items = parsed.get("exercise_plan", [])
            self.rehab_exercise_names = [item.get("exercise_name", "") for item in exercise_items]
            self.rehab_exercise_goals = [item.get("goal", "") for item in exercise_items]
            self.rehab_exercise_instruction_blocks = [
                "\n".join([f"• {step}" for step in item.get("instructions", [])])
                for item in exercise_items
            ]
            self.rehab_exercise_sets = [item.get("dosage", {}).get("sets", "") for item in exercise_items]
            self.rehab_exercise_reps = [item.get("dosage", {}).get("reps", "") for item in exercise_items]
            self.rehab_exercise_frequencies = [item.get("dosage", {}).get("frequency", "") for item in exercise_items]
            self.rehab_exercise_progressions = [item.get("dosage", {}).get("progression", "") for item in exercise_items]
            self.rehab_exercise_cautions = [item.get("caution", "") for item in exercise_items]

            weekly_items = parsed.get("weekly_schedule", [])
            self.rehab_schedule_day_labels = [item.get("day_label", "") for item in weekly_items]
            self.rehab_schedule_activity_blocks = [
                "\n".join([f"• {activity}" for activity in item.get("activities", [])])
                for item in weekly_items
            ]

            nutrition_items = parsed.get("nutrition_suggestions", [])
            self.rehab_nutrition_titles = [item.get("title", "") for item in nutrition_items]
            self.rehab_nutrition_recommendations = [item.get("recommendation", "") for item in nutrition_items]
            self.rehab_nutrition_why = [item.get("why_it_matters", "") for item in nutrition_items]

            self.rehab_lifestyle_recommendations = parsed.get("lifestyle_recommendations", [])
            self.rehab_follow_up_flags = parsed.get("follow_up_flags", [])

            self.rehab_plan_ready = True
            self.rehab_plan_status = "Rehab plan generated successfully."
            return rx.redirect("/rehab-plan")

        except Exception as e:
            self.rehab_plan_status = f"Failed to generate rehab plan: {str(e)}"
            self.rehab_plan_ready = False

    def set_report_chat_input(self, value: str):
        self.report_chat_input = value

    async def open_report_workspace(self):
        try:
            if not self.opencap_ready:
                self.report_status = "Please wait until OpenCap processing finishes first."
                return

            self.is_generating_report = True
            self.report_status = "Generating gait results on server..."

            async with httpx.AsyncClient(timeout=1800.0) as client:
                response = await client.post(
                    f"{self.server_base_url}/api/generate-gait-results",
                    json={
                        "session_name": self.processing_session_id,
                        "trial_name": self.processing_trial_name,
                        "trial_id": self.processing_trial_id
                    },
                )
                
            # this saves the gait_output from the API locally and convert into display-ready figures and tables
            response.raise_for_status()
            payload = response.json()

            gait_output = payload["gait_output"]

            local_json_path = UPLOAD_DIR / f"{self.processing_session_id}_gait_output.json"
            local_json_path.write_text(json.dumps(gait_output), encoding="utf-8")
            self.gait_json_local_path = str(local_json_path)

            report = build_gait_report_data(str(local_json_path))

            self.summary_labels = list(report["summary_metrics"].keys())
            self.summary_values = [str(v) for v in report["summary_metrics"].values()]
            self.metric_table_fig = report["metric_table_fig"]
            self.symmetry_fig = report["symmetry_fig"]
            self.section_titles = [s["title"] for s in report["sections"]]
            self.section_guidelines = [s["guideline"] for s in report["sections"]]
            self.section_figures = [s["figure"] for s in report["sections"]]

            self.report_ready = True
            self.report_status = "AI gait report generated successfully."
            self.chat_messages = [
                {
                    "role": "assistant",
                    "content": "Your gait report is ready. Ask me anything about the findings on the left.",
                }
            ]
            self.report_chat_input = ""
            return rx.redirect("/report-review")

        except Exception as e:
            self.report_status = f"Failed to generate gait report: {str(e)}"
            return

        finally:
            self.is_generating_report = False
            
    def ask_report_question(self):
        """Handle one chat turn about the report."""
        question = self.report_chat_input.strip()
        if not question:
            return

        self.chat_messages.append({"role": "user", "content": question})

        q = question.lower()
        report_exists = bool(self.report_text.strip())

        if not report_exists:
            answer = "I do not see a generated report yet. Please generate the AI gait report first."
        elif "summary" in q or "summarize" in q:
            answer = (
                "This report suggests a broadly stable gait pattern with a possible mild left-right asymmetry "
                "during the stance-to-swing transition. The current version is a placeholder, so the metric fields "
                "are not yet numerically populated."
            )
        elif "asymmetry" in q or "symmetry" in q:
            answer = (
                "The report flags a possible mild asymmetry between the left and right sides. In a full pipeline, "
                "this would usually be interpreted using stance time, swing time, step length, joint angles, "
                "and side-to-side timing differences."
            )
        elif "clinician" in q or "clinical" in q:
            answer = (
                "A clinician would typically focus on whether the asymmetry is consistent, whether there is reduced "
                "joint excursion, whether foot clearance is limited, and whether compensatory motion appears at the hip or pelvis."
            )
        elif "cadence" in q or "speed" in q or "step length" in q or "stride length" in q:
            answer = (
                "Those metrics are listed in the report structure, but the placeholder version does not yet compute them. "
                "Once your real gait-analysis backend is connected, I can explain each metric and help interpret the results."
            )
        else:
            answer = (
                "Based on the current report, the main takeaway is that the gait pattern looks generally stable, "
                "with a possible mild asymmetry that deserves closer review. If you want, ask about clinical meaning, "
                "rehabilitation implications, or a patient-friendly summary."
            )

        self.chat_messages.append({"role": "assistant", "content": answer})
        self.report_chat_input = ""

    @rx.var
    def can_configure(self) -> bool:
        return bool(self.calib_video_left_name and self.calib_video_right_name)

    @rx.var
    def can_generate_report(self) -> bool:
        return bool(self.patient_left_video_name and self.patient_right_video_name)

    # -------------------------
    # Camera uploads
    # -------------------------
    async def handle_left_upload(self, files: list[rx.UploadFile]):
        if not files:
            return
        file = files[0]
        data = await file.read()
        save_path = UPLOAD_DIR / f"calib_left_{file.filename}"
        save_path.write_bytes(data)

        self.calib_video_left_name = file.filename
        self.calib_video_left_path = str(save_path)
        self.status_message = f"Uploaded LEFT calibration video: {file.filename}"
        self.configured = False

    async def handle_right_upload(self, files: list[rx.UploadFile]):
        if not files:
            return
        file = files[0]
        data = await file.read()
        save_path = UPLOAD_DIR / f"calib_right_{file.filename}"
        save_path.write_bytes(data)

        self.calib_video_right_name = file.filename
        self.calib_video_right_path = str(save_path)
        self.status_message = f"Uploaded RIGHT calibration video: {file.filename}"
        self.configured = False

    # -------------------------
    # Patient walking video uploads
    # -------------------------
    async def handle_patient_left_upload(self, files: list[rx.UploadFile]):
        if not files:
            return
        file = files[0]
        data = await file.read()
        save_path = UPLOAD_DIR / f"patient_left_{file.filename}"
        save_path.write_bytes(data)

        self.patient_left_video_name = file.filename
        self.patient_left_video_path = str(save_path)
        self.report_status = f"Uploaded patient LEFT walking video: {file.filename}"

        await self.maybe_start_opencap()
        
    async def handle_patient_right_upload(self, files: list[rx.UploadFile]):
        if not files:
            return
        file = files[0]
        data = await file.read()
        save_path = UPLOAD_DIR / f"patient_right_{file.filename}"
        save_path.write_bytes(data)

        self.patient_right_video_name = file.filename
        self.patient_right_video_path = str(save_path)
        self.report_status = f"Uploaded patient RIGHT walking video: {file.filename}"

        await self.maybe_start_opencap()
    # -------------------------
    # Field setters
    # -------------------------
    def set_cols(self, value: str):
        try:
            self.cols = int(value)
        except ValueError:
            pass

    def set_rows(self, value):
        self.rows = int(value)

    def set_square_size_mm(self, value):
        self.square_size_mm = float(value)

    def set_n_images(self, value):
        self.n_images = int(value)

    # -------------------------
    # Navigation / actions
    # -------------------------
    def configure_camera(self):
        """For now, just validate and redirect to the report page."""
        if not self.can_configure:
            self.status_message = "Please upload both LEFT and RIGHT calibration videos first."
            self.configured = False
            return

        self.configured = True
        self.status_message = (
            f"Camera configured successfully. "
            f"Cols={self.cols}, Rows={self.rows}, "
            f"Square size={self.square_size_mm} mm, "
            f"Frames={self.n_images}."
        )
        return rx.redirect("/report")

    def generate_empty_pdf_and_download(self):
        """Create a placeholder PDF and download it."""
        if not self.can_generate_report:
            self.report_status = "Please upload both LEFT and RIGHT patient walking videos first."
            return

        pdf_path = REPORTS_DIR / "axonai_report_placeholder.pdf"

        # Minimal valid PDF bytes.
        pdf_bytes = (
            b"%PDF-1.4\n"
            b"1 0 obj<<>>endobj\n"
            b"2 0 obj<< /Type /Catalog /Pages 3 0 R >>endobj\n"
            b"3 0 obj<< /Type /Pages /Kids [4 0 R] /Count 1 >>endobj\n"
            b"4 0 obj<< /Type /Page /Parent 3 0 R /MediaBox [0 0 595 842] "
            b"/Contents 5 0 R /Resources <<>> >>endobj\n"
            b"5 0 obj<< /Length 0 >>stream\n"
            b"\n"
            b"endstream\n"
            b"endobj\n"
            b"xref\n"
            b"0 6\n"
            b"0000000000 65535 f \n"
            b"0000000009 00000 n \n"
            b"0000000028 00000 n \n"
            b"0000000077 00000 n \n"
            b"0000000136 00000 n \n"
            b"0000000240 00000 n \n"
            b"trailer<< /Root 2 0 R /Size 6 >>\n"
            b"startxref\n"
            b"289\n"
            b"%%EOF"
        )
        pdf_path.write_bytes(pdf_bytes)

        self.report_status = "Placeholder PDF generated. Download should start automatically."
        return rx.download(
            url=f"/{pdf_path.as_posix()}",
            filename="axonai_report.pdf",
        )


# -------------------------
# ADD THESE UI HELPER FUNCTIONS
# -------------------------

def summary_metric_card(label, value) -> rx.Component:
    return rx.box(
        rx.text(
            label,
            color="rgba(255,255,255,0.62)",
            font_size="0.82rem",
            font_weight="500",
        ),
        rx.text(
            value,
            color="white",
            font_size="1.4rem",
            font_weight="800",
            line_height="1.1",
        ),
        padding="1rem 1.05rem",
        border_radius="18px",
        background="linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))",
        border="1px solid rgba(255,255,255,0.10)",
        box_shadow="0 12px 30px rgba(0,0,0,0.18)",
        width="100%",
    )


def clinical_guideline_box(text_value) -> rx.Component:
    return rx.box(
        rx.text(
            "Clinical interpretation",
            color="white",
            font_weight="700",
            font_size="0.95rem",
            margin_bottom="0.65rem",
        ),
        rx.text(
            text_value,
            color="rgba(255,255,255,0.76)",
            font_size="0.88rem",
            line_height="1.55",
            white_space="pre-wrap",
        ),
        padding="1rem 1.05rem",
        border_radius="18px",
        background="rgba(255,255,255,0.05)",
        border="1px solid rgba(255,255,255,0.09)",
        width="100%",
    )


def report_section_card(title, fig, guideline) -> rx.Component:
    return rx.el.details(
        rx.el.summary(
            rx.hstack(
                rx.text(
                    title,
                    color="white",
                    font_weight="800",
                    font_size="1.02rem",
                ),
                rx.spacer(),
                rx.text(
                    "Open",
                    color="rgba(255,255,255,0.55)",
                    font_size="0.82rem",
                ),
                width="100%",
                align="center",
            ),
            style={
                "listStyle": "none",
                "cursor": "pointer",
                "padding": "1rem 1.1rem",
                "userSelect": "none",
            },
        ),

        rx.box(
            rx.vstack(
                rx.box(
                    rx.plotly(
                        data=fig,
                        width="100%",
                        height="100%",
                    ),
                    width="100%",
                    min_height="24rem",
                    border_radius="18px",
                    overflow="hidden",
                    background="white",
                ),
                clinical_guideline_box(guideline),
                spacing="4",
                align="stretch",
                width="100%",
            ),
            padding="0 1.1rem 1.1rem 1.1rem",
        ),

        style={
            "width": "100%",
            "borderRadius": "22px",
            "background": "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.035))",
            "border": "1px solid rgba(255,255,255,0.09)",
            "overflow": "hidden",
        },
        open=False,
    )
    
def render_chat_message(message):
    is_user = message["role"] == "user"
    return rx.hstack(
        rx.cond(is_user, rx.spacer(), rx.fragment()),
        rx.box(
            rx.text(
                message["content"],
                color="white",
                font_size="0.95rem",
                line_height="1.5",
                white_space="pre_wrap",
            ),
            max_width="85%",
            padding="0.9rem 1rem",
            border_radius="18px",
            background=rx.cond(
                is_user,
                "linear-gradient(90deg, rgba(59,130,246,0.95), rgba(99,102,241,0.95))",
                "rgba(255,255,255,0.08)",
            ),
            border=rx.cond(
                is_user,
                "1px solid rgba(255,255,255,0.10)",
                "1px solid rgba(255,255,255,0.12)",
            ),
            box_shadow="0 10px 30px rgba(0,0,0,0.16)",
        ),
        rx.cond(is_user, rx.fragment(), rx.spacer()),
        width="100%",
        align="start",
    )

def report_chat_panel() -> rx.Component:
    return rx.box(
        rx.vstack(
            rx.vstack(
                rx.text(
                    "Report Chat",
                    color="white",
                    font_weight="700",
                    font_size="1.15rem",
                ),
                rx.text(
                    "Ask questions about the gait report.",
                    color="rgba(255,255,255,0.62)",
                    font_size="0.9rem",
                ),
                spacing="1",
                align="start",
                width="100%",
            ),

            rx.box(
                rx.vstack(
                    rx.foreach(State.chat_messages, render_chat_message),
                    spacing="3",
                    width="100%",
                    align="stretch",
                ),
                width="100%",
                flex="1",
                min_height="0",
                overflow_y="auto",
                padding="0.25rem",
            ),

            rx.box(
                rx.hstack(
                    rx.input(
                        value=State.report_chat_input,
                        on_change=State.set_report_chat_input,
                        placeholder="Ask about the report...",
                        width="100%",
                        size="3",
                        border_radius="14px",
                        background="rgba(255,255,255,0.08)",
                        color="white",
                        border="1px solid rgba(255,255,255,0.14)",
                    ),
                    rx.button(
                        "Send",
                        on_click=State.ask_report_question,
                        border_radius="14px",
                        background="linear-gradient(90deg, rgba(37,99,235,1), rgba(99,102,241,1))",
                        color="white",
                        font_weight="700",
                        _hover={"opacity": "0.95"},
                    ),
                    width="100%",
                    align="center",
                ),
                width="100%",
                padding_top="0.4rem",
                border_top="1px solid rgba(255,255,255,0.08)",
            ),

            spacing="4",
            width="100%",
            height="100%",
            align="stretch",
        ),
        width=["100%", "100%", "42%"],
        height="78vh",
        padding="1.2rem",
        border_radius="28px",
        background="linear-gradient(180deg, rgba(10,14,26,0.86), rgba(7,10,18,0.94))",
        border="1px solid rgba(255,255,255,0.10)",
        backdrop_filter="blur(18px)",
        box_shadow="0 24px 70px rgba(0,0,0,0.28)",
    )

def gait_report_viewer_panel() -> rx.Component:
    return rx.box(
        rx.vstack(
            rx.vstack(
                rx.text(
                    "Gait Report",
                    color="white",
                    font_weight="700",
                    font_size="1.15rem",
                ),
                rx.text(
                    "Interactive clinician-facing review dashboard.",
                    color="rgba(255,255,255,0.62)",
                    font_size="0.9rem",
                ),
                spacing="1",
                align="start",
                width="100%",
            ),

            rx.cond(
                State.report_ready,
                rx.box(
                    rx.vstack(
                        rx.grid(
                            rx.foreach(
                                    State.summary_labels,
                                    lambda label, i: summary_metric_card(
                                        label,
                                        State.summary_values[i],
                                    ),
                        ),
                            columns="3",
                            spacing="4",
                            width="100%",
                        ),
                        rx.box(
                            rx.text(
                                "Gait Metrics",
                                color="white",
                                font_weight="700",
                                margin_bottom="0.75rem",
                            ),
                            rx.box(
                                rx.plotly(data=State.metric_table_fig, width="100%", height="100%"),
                                width="100%",
                                min_height="22rem",
                                border_radius="18px",
                                overflow="hidden",
                                background="white",
                            ),
                            width="100%",
                        ),

                        rx.box(
                            rx.text(
                                "Left-Right Symmetry",
                                color="white",
                                font_weight="700",
                                margin_bottom="0.75rem",
                            ),
                            rx.box(
                                rx.plotly(data=State.symmetry_fig, width="100%", height="100%"),
                                width="100%",
                                min_height="22rem",
                                border_radius="18px",
                                overflow="hidden",
                                background="white",
                            ),
                            width="100%",
                        ),

                        rx.foreach(
                            rx.Var.range(State.section_titles.length()),
                            lambda i: report_section_card(
                                State.section_titles[i],
                                State.section_figures[i],
                                State.section_guidelines[i],
                            ),
                        ),

                        spacing="5",
                        width="100%",
                        align="stretch",
                    ),
                    width="100%",
                    flex="1",
                    min_height="0",
                    overflow_y="auto",
                    padding_right="0.2rem",
                ),
                rx.box(
                    rx.text(
                        "No report generated yet.",
                        color="rgba(255,255,255,0.78)",
                    ),
                    width="100%",
                    flex="1",
                    display="flex",
                    align_items="center",
                    justify_content="center",
                    border_radius="20px",
                    background="rgba(255,255,255,0.05)",
                    border="1px solid rgba(255,255,255,0.08)",
                ),
            ),

            spacing="4",
            width="100%",
            height="100%",
            align="stretch",
        ),
        width=["100%", "100%", "58%"],
        height="78vh",
        padding="1.2rem",
        border_radius="28px",
        background="linear-gradient(180deg, rgba(10,14,26,0.86), rgba(7,10,18,0.94))",
        border="1px solid rgba(255,255,255,0.10)",
        backdrop_filter="blur(18px)",
        box_shadow="0 24px 70px rgba(0,0,0,0.28)",
    )

def animated_background_wave() -> rx.Component:
    return rx.box(
        rx.box(
            position="absolute",
            top="-10%",
            left="-10%",
            width="28rem",
            height="28rem",
            border_radius="9999px",
            background="radial-gradient(circle, rgba(59,130,246,0.28) 0%, rgba(59,130,246,0.00) 70%)",
            filter="blur(20px)",
            animation="float1 12s ease-in-out infinite",
        ),
        rx.box(
            position="absolute",
            bottom="-15%",
            right="-10%",
            width="30rem",
            height="30rem",
            border_radius="9999px",
            background="radial-gradient(circle, rgba(16,185,129,0.22) 0%, rgba(16,185,129,0.00) 70%)",
            filter="blur(28px)",
            animation="float2 14s ease-in-out infinite",
        ),
        rx.box(
            position="absolute",
            top="18%",
            right="18%",
            width="16rem",
            height="16rem",
            border_radius="9999px",
            background="radial-gradient(circle, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.00) 70%)",
            filter="blur(18px)",
            animation="float3 10s ease-in-out infinite",
        ),
        position="absolute",
        inset="0",
        overflow="hidden",
        z_index="0",
        pointer_events="none",
    )

def floating_report_button() -> rx.Component:
    return rx.link(
        rx.box(
            rx.hstack(
                rx.box(
                    "🎥",
                    width="3rem",
                    height="3rem",
                    border_radius="9999px",
                    display="flex",
                    align_items="center",
                    justify_content="center",
                    background="linear-gradient(135deg, rgba(96,165,250,0.28), rgba(129,140,248,0.18))",
                    border="1px solid rgba(255,255,255,0.18)",
                    font_size="1.35rem",
                ),
                rx.vstack(
                    rx.text(
                        "AI Gait Report",
                        color="white",
                        font_weight="700",
                        font_size="1rem",
                        line_height="1.1",
                    ),
                    rx.text(
                        "Upload two sagittal-view videos",
                        color="rgba(255,255,255,0.72)",
                        font_size="0.84rem",
                        line_height="1.2",
                    ),
                    spacing="1",
                    align="start",
                ),
                rx.text(
                    "→",
                    color="rgba(255,255,255,0.82)",
                    font_size="1.4rem",
                    font_weight="800",
                    line_height="1",
                ),
                spacing="3",
                align="center",
            ),
            position="fixed",
            right="28px",
            bottom="28px",
            z_index="20",
            padding="0.9rem 1.05rem",
            border_radius="9999px",
            background="rgba(10, 14, 28, 0.72)",
            border="1px solid rgba(255,255,255,0.16)",
            backdrop_filter="blur(14px)",
            box_shadow="0 18px 60px rgba(0,0,0,0.35)",
            transition="all 0.25s ease",
            _hover={
                "transform": "translateY(-4px) scale(1.01)",
                "background": "rgba(18, 24, 44, 0.84)",
                "box_shadow": "0 22px 70px rgba(37, 99, 235, 0.22)",
            },
        ),
        href="/upload-report",
    )

def navbar() -> rx.Component:
    return rx.hstack(
        rx.spacer(),
        rx.link(
            rx.button(
                rx.hstack(
                    rx.text("About Us"),
                    rx.text(
                        "→",
                        color="white",
                        opacity="0.55",
                        font_size="1.3rem",   # makes arrow larger
                        font_weight="700",    # makes arrow thicker
                        line_height="1",
                        transition="all 0.2s ease",
                    ),
                    spacing="2",
                    align="center",
                ),
                size="3",
                color="white",
                background="rgba(255,255,255,0.06)",
                border="1px solid rgba(255,255,255,0.3)",
                backdrop_filter="blur(6px)",
                border_radius="9999px",
                padding_x="1.2rem",
                padding_y="0.6rem",
                transition="all 0.2s ease",
                _hover={
                    "background": "rgba(255,255,255,0.15)",
                    "padding_right": "1.5rem",
                },
            ),
            href="/about",
        ),

        position="absolute",
        top="20px",
        right="30px",
        z_index="5",
    )

def landing_page() -> rx.Component:
    return rx.box(
        navbar(),   # 👈 ADD THIS LINE
        floating_report_button(),
        rx.el.style(
            """
            @keyframes waveDrift1 {
                0% { transform: translateX(0px) translateY(0px); }
                50% { transform: translateX(-30px) translateY(10px); }
                100% { transform: translateX(0px) translateY(0px); }
            }

            @keyframes waveDrift2 {
                0% { transform: translateX(0px) translateY(0px); }
                50% { transform: translateX(35px) translateY(-12px); }
                100% { transform: translateX(0px) translateY(0px); }
            }

            @keyframes waveDrift3 {
                0% { transform: translateX(0px) translateY(0px); }
                50% { transform: translateX(-22px) translateY(8px); }
                100% { transform: translateX(0px) translateY(0px); }
            }

            @keyframes hueShift1 {
                0% { fill: rgba(180, 120, 255, 0.78); }
                33% { fill: rgba(80, 210, 255, 0.74); }
                66% { fill: rgba(120, 120, 255, 0.72); }
                100% { fill: rgba(180, 120, 255, 0.78); }
            }

            @keyframes hueShift2 {
                0% { fill: rgba(60, 210, 255, 0.72); }
                33% { fill: rgba(170, 120, 255, 0.70); }
                66% { fill: rgba(70, 160, 255, 0.72); }
                100% { fill: rgba(60, 210, 255, 0.72); }
            }

            @keyframes hueShift3 {
                0% { fill: rgba(95, 74, 255, 0.62); }
                33% { fill: rgba(40, 180, 255, 0.58); }
                66% { fill: rgba(160, 110, 255, 0.60); }
                100% { fill: rgba(95, 74, 255, 0.62); }
            }

            @keyframes glowPulse {
                0% { opacity: 0.28; transform: scale(1); }
                50% { opacity: 0.48; transform: scale(1.05); }
                100% { opacity: 0.28; transform: scale(1); }
            }

            @keyframes grainMove {
                0% { transform: translate(0, 0); }
                25% { transform: translate(-1%, 1%); }
                50% { transform: translate(1%, -1%); }
                75% { transform: translate(1%, 1%); }
                100% { transform: translate(0, 0); }
            }
            """
        ),

        # base background
        rx.box(
            position="absolute",
            inset="0",
            background="""
                radial-gradient(circle at 20% 20%, rgba(140,90,255,0.10) 0%, rgba(140,90,255,0.00) 24%),
                radial-gradient(circle at 80% 75%, rgba(0,210,220,0.08) 0%, rgba(0,210,220,0.00) 20%),
                linear-gradient(180deg, #05070c 0%, #070b14 34%, #07111c 68%, #06090f 100%)
            """,
            z_index="0",
        ),

        # soft glows
        rx.box(
            position="absolute",
            left="10%",
            top="16%",
            width="24rem",
            height="24rem",
            border_radius="9999px",
            background="radial-gradient(circle, rgba(193,139,255,0.18) 0%, rgba(193,139,255,0.00) 72%)",
            filter="blur(56px)",
            style={"animation": "glowPulse 9s ease-in-out infinite"},
            z_index="0",
            pointer_events="none",
        ),
        rx.box(
            position="absolute",
            right="8%",
            bottom="10%",
            width="26rem",
            height="26rem",
            border_radius="9999px",
            background="radial-gradient(circle, rgba(60,220,255,0.14) 0%, rgba(60,220,255,0.00) 72%)",
            filter="blur(60px)",
            style={"animation": "glowPulse 11s ease-in-out infinite"},
            z_index="0",
            pointer_events="none",
        ),

        # moving color-changing waves
        rx.el.svg(
            rx.el.path(
                d="M 0 620 C 140 560, 260 300, 430 260 C 620 215, 760 470, 980 500 C 1180 528, 1320 430, 1510 450 C 1700 470, 1860 610, 2000 650 L 2000 900 L 0 900 Z",
                style={
                    "animation": "waveDrift1 11s ease-in-out infinite, hueShift1 14s ease-in-out infinite"
                },
            ),
            rx.el.path(
                d="M 0 700 C 180 660, 300 430, 500 380 C 700 330, 840 560, 1060 610 C 1260 656, 1440 610, 1630 560 C 1810 512, 1910 520, 2000 540 L 2000 900 L 0 900 Z",
                style={
                    "animation": "waveDrift2 13s ease-in-out infinite, hueShift2 16s ease-in-out infinite"
                },
            ),
            rx.el.path(
                d="M 0 790 C 180 730, 360 600, 560 590 C 760 580, 930 700, 1140 740 C 1340 778, 1540 720, 1760 690 C 1880 674, 1940 680, 2000 700 L 2000 900 L 0 900 Z",
                style={
                    "animation": "waveDrift3 15s ease-in-out infinite, hueShift3 18s ease-in-out infinite"
                },
            ),
            viewBox="0 0 2000 900",
            preserveAspectRatio="none",
            width="100%",
            height="100%",
            position="absolute",
            inset="0",
            z_index="1",
            pointer_events="none",
        ),

        # vignette
        rx.box(
            position="absolute",
            inset="0",
            background="""
                radial-gradient(circle at center, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.14) 58%, rgba(0,0,0,0.34) 100%)
            """,
            z_index="2",
            pointer_events="none",
        ),

        # grain
        rx.box(
            position="absolute",
            inset="-10%",
            opacity="0.08",
            background="""
                radial-gradient(circle at 20% 20%, rgba(255,255,255,0.22) 0 0.6px, transparent 0.8px),
                radial-gradient(circle at 80% 30%, rgba(255,255,255,0.18) 0 0.7px, transparent 0.9px),
                radial-gradient(circle at 40% 80%, rgba(255,255,255,0.14) 0 0.7px, transparent 0.9px),
                radial-gradient(circle at 70% 70%, rgba(255,255,255,0.12) 0 0.6px, transparent 0.8px)
            """,
            background_size="20px 20px, 24px 24px, 28px 28px, 18px 18px",
            animation="grainMove 7s steps(6) infinite",
            pointer_events="none",
            z_index="3",
        ),
        # Content
        rx.vstack(
            rx.heading(
                "AxonAI is the first computer vision AI technology that understands human gait.",
                size="9",
                text_align="center",
                color="white",
                max_width="1200px",
                line_height="1.05",
                letter_spacing="-0.03em",
                text_shadow="0 2px 24px rgba(0,0,0,0.35)",
            ),
            rx.text(
                "Built by AI researchers and industry experts from",
                font_size="1.05rem",
                text_align="center",
                color="rgba(255,255,255,0.82)",
                max_width="980px",
                line_height="1.5",
            ),
        rx.hstack(
            rx.text(
                "Google DeepMind",
                color="rgba(255,255,255,0.78)",
                font_size="1.15rem",
                font_weight="500",
            ),

            rx.text(
                "IMPERIAL",
                color="rgba(255,255,255,0.92)",
                font_size="1.5rem",
                font_weight="700",
                letter_spacing="0.18em",
            ),

            rx.vstack(
                rx.text(
                    "BOSTON",
                    color="rgba(255,255,255,0.78)",
                    font_size="1.7rem",
                    font_weight="500",
                    letter_spacing="0.18em",
                    font_family="Georgia, 'Times New Roman', serif",
                    line_height="1",
                ),
                rx.text(
                    "UNIVERSITY",
                    color="rgba(255,255,255,0.78)",
                    font_size="1.1rem",
                    font_weight="500",
                    letter_spacing="0.20em",
                    font_family="Georgia, 'Times New Roman', serif",
                    line_height="1",
                ),
                spacing="0",
                align="center",
            ),

            rx.text(
                "Xifeng People's Hospital",
                color="rgba(255,255,255,0.7)",
                font_size="1.1rem",
            ),

            spacing="8",
            justify="center",
            align="center",
            flex_wrap="wrap",
            margin_top="0.25rem",
        ),
            spacing="7",
            align="center",
            width="100%",
            position="relative",
            z_index="2",
            padding_x="1.5rem",
        ),
        min_height="100vh",
        width="100%",
        position="relative",
        display="flex",
        align_items="center",
        justify_content="center",
        overflow="hidden",
    )

def setting_input(label: str, value, on_change, min_v, max_v, step) -> rx.Component:
    return rx.box(
        rx.text(label, margin_bottom="0.45rem", font_weight="500"),
        rx.input(
            type="number",
            value=value,
            min=min_v,
            max=max_v,
            step=step,
            on_change=on_change,
            width="100%",
            size="3",
            background="white",
            border="1px solid #d1d5db",
        ),
        width="100%",
    )


def upload_panel(title: str, upload_id: str, button_text: str, filename_var, handler) -> rx.Component:
    return rx.box(
        rx.text(title, font_weight="600", font_size="1.1rem", margin_bottom="0.8rem"),
        rx.upload(
            rx.vstack(
                rx.button(button_text, variant="soft", color_scheme="blue"),
                rx.text(
                    "Accepted formats: .mov, .mp4, .avi, .mkv",
                    color="#6b7280",
                    size="2",
                ),
                align="start",
                spacing="2",
            ),
            id=upload_id,
            multiple=False,
            accept={"video/*": [".mov", ".mp4", ".avi", ".mkv"]},
            border="1px dashed #cbd5e1",
            border_radius="16px",
            padding="1.25rem",
            width="100%",
            background="#fafafa",
        ),
        rx.cond(
            filename_var != "",
            rx.text("Selected file: ", rx.code(filename_var), margin_top="0.8rem"),
            rx.text("No file uploaded yet.", margin_top="0.8rem", color="#6b7280"),
        ),
        rx.button(
            "Upload",
            on_click=handler(rx.upload_files(upload_id=upload_id)),
            width="100%",
            margin_top="0.9rem",
            size="3",
            border_radius="12px",
        ),
        background="white",
        border="1px solid #e5e7eb",
        border_radius="20px",
        padding="1.2rem",
        box_shadow="0 10px 30px rgba(2, 6, 23, 0.05)",
        width="100%",
    )

def cinematic_upload_box(
    title: str,
    subtitle: str,
    upload_id: str,
    filename_var,
    handler,
    accent_color: str,
    icon: str,
) -> rx.Component:
    return rx.box(
        rx.vstack(
            rx.hstack(
                rx.box(
                    icon,
                    width="3.2rem",
                    height="3.2rem",
                    border_radius="18px",
                    display="flex",
                    align_items="center",
                    justify_content="center",
                    font_size="1.5rem",
                    background=f"linear-gradient(135deg, {accent_color}, rgba(255,255,255,0.08))",
                    border="1px solid rgba(255,255,255,0.16)",
                    box_shadow="0 10px 30px rgba(0,0,0,0.18)",
                ),
                rx.vstack(
                    rx.text(
                        title,
                        color="white",
                        font_weight="700",
                        font_size="1.2rem",
                    ),
                    rx.text(
                        subtitle,
                        color="rgba(255,255,255,0.66)",
                        font_size="0.92rem",
                    ),
                    spacing="1",
                    align="start",
                ),
                width="100%",
                align="center",
                spacing="3",
            ),
            rx.upload(
                rx.vstack(
                    rx.text(
                        "Drag & drop video here",
                        color="white",
                        font_weight="700",
                        font_size="1.05rem",
                    ),
                    rx.text(
                        "or click to browse files",
                        color="rgba(255,255,255,0.62)",
                        font_size="0.9rem",
                    ),
                    rx.text(
                        "Accepted: .mp4, .mov, .avi, .mkv",
                        color="rgba(255,255,255,0.46)",
                        font_size="0.8rem",
                    ),
                    spacing="2",
                    align="center",
                ),
                id=upload_id,
                multiple=False,
                accept={"video/*": [".mov", ".mp4", ".avi", ".mkv"]},
                width="100%",
                padding="2.4rem 1.2rem",
                border_radius="24px",
                border="1.5px dashed rgba(255,255,255,0.18)",
                background="linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
            ),
            rx.cond(
                filename_var != "",
                rx.box(
                    rx.text(
                        f"Selected: ",
                        as_="span",
                        color="rgba(255,255,255,0.7)",
                    ),
                    rx.code(
                        filename_var,
                        color="white",
                        background="rgba(255,255,255,0.08)",
                        padding="0.15rem 0.45rem",
                        border_radius="8px",
                    ),
                    width="100%",
                ),
                rx.text(
                    "No video uploaded yet.",
                    color="rgba(255,255,255,0.5)",
                    width="100%",
                ),
            ),
            rx.button(
                "Upload video",
                on_click=handler(rx.upload_files(upload_id=upload_id)),
                width="100%",
                size="4",
                border_radius="16px",
                background=f"linear-gradient(90deg, {accent_color}, rgba(99,102,241,0.92))",
                color="white",
                font_weight="700",
                box_shadow="0 14px 34px rgba(59,130,246,0.22)",
                _hover={
                    "opacity": "0.94",
                    "transform": "translateY(-1px)",
                },
            ),
            spacing="5",
            align="start",
            width="100%",
        ),
        width=["100%", "100%", "47%"],
        min_height="26rem",
        padding="1.35rem",
        border_radius="28px",
        background="linear-gradient(180deg, rgba(10,14,26,0.82), rgba(7,10,18,0.92))",
        border="1px solid rgba(255,255,255,0.1)",
        backdrop_filter="blur(18px)",
        box_shadow="0 24px 70px rgba(0,0,0,0.28)",
    )

def configure_page() -> rx.Component:
    return rx.box(
        rx.vstack(
            rx.hstack(
                rx.link(
                    rx.text("← Back", color="#2563eb", font_weight="600"),
                    href="/",
                ),
                width="100%",
            ),
            rx.heading("Step 1 — Configure camera intrinsics", size="8", color="#0f172a"),
            rx.text(
                "Set checkerboard parameters and upload stereo calibration videos.",
                color="#475569",
                size="4",
            ),
            rx.box(
                rx.heading("Checkerboard settings", size="5", margin_bottom="1rem"),
                rx.hstack(
                    setting_input("Cols (internal corners)", State.cols, State.set_cols, 3, 25, 1),
                    setting_input("Rows (internal corners)", State.rows, State.set_rows, 3, 25, 1),
                    setting_input("Square size (mm)", State.square_size_mm, State.set_square_size_mm, 1, 200, 1),
                    spacing="4",
                    width="100%",
                    flex_wrap="wrap",
                ),
                background="rgba(255,255,255,0.9)",
                border="1px solid #e5e7eb",
                border_radius="22px",
                padding="1.5rem",
                box_shadow="0 12px 35px rgba(15, 23, 42, 0.06)",
                width="100%",
            ),
            rx.hstack(
                upload_panel(
                    "Upload LEFT calibration video",
                    "left_upload",
                    "Choose LEFT video",
                    State.calib_video_left_name,
                    State.handle_left_upload,
                ),
                upload_panel(
                    "Upload RIGHT calibration video",
                    "right_upload",
                    "Choose RIGHT video",
                    State.calib_video_right_name,
                    State.handle_right_upload,
                ),
                spacing="4",
                width="100%",
                flex_wrap="wrap",
                align="start",
            ),
            rx.box(
                rx.text(
                    "Number of sampled frames per calibration video",
                    margin_bottom="0.45rem",
                    font_weight="500",
                ),
                rx.input(
                    type="number",
                    value=State.n_images,
                    min=5,
                    max=100,
                    step=1,
                    on_change=State.set_n_images,
                    width="240px",
                    background="white",
                ),
                width="100%",
            ),
            rx.text(
                "Each calibration video should show the checkerboard from multiple positions and angles.",
                color="#64748b",
                size="3",
            ),
            rx.button(
                "⚙️ Configure camera",
                on_click=State.configure_camera,
                size="4",
                border_radius="9999px",
                padding_x="1.5rem",
            ),
            rx.cond(
                State.status_message != "",
                rx.callout(State.status_message, icon="info", width="100%"),
            ),
            rx.cond(
                State.configured,
                rx.badge("Configured", color_scheme="green", size="3"),
            ),
            spacing="5",
            align="start",
            width="100%",
            max_width="1200px",
        ),
        min_height="100vh",
        width="100%",
        padding="2.5rem",
        background="""
            radial-gradient(circle at top left, rgba(59,130,246,0.10), transparent 30%),
            linear-gradient(180deg, #f8fbff 0%, #f3f6fb 100%)
        """,
    )


def report_page() -> rx.Component:
    return rx.box(
        rx.vstack(
            rx.hstack(
                rx.link(
                    rx.text("← Back to configuration", color="#2563eb", font_weight="600"),
                    href="/configure",
                ),
                width="100%",
            ),
            rx.heading("Step 2 — Generate patient report", size="8", color="#0f172a"),
            rx.text(
                "Upload the patient's walking videos from the left and right cameras, then generate a report.",
                color="#475569",
                size="4",
            ),
            rx.hstack(
                upload_panel(
                    "Upload patient LEFT walking video",
                    "patient_left_upload",
                    "Choose LEFT walking video",
                    State.patient_left_video_name,
                    State.handle_patient_left_upload,
                ),
                upload_panel(
                    "Upload patient RIGHT walking video",
                    "patient_right_upload",
                    "Choose RIGHT walking video",
                    State.patient_right_video_name,
                    State.handle_patient_right_upload,
                ),
                spacing="4",
                width="100%",
                flex_wrap="wrap",
                align="start",
            ),
            rx.button(
                "Generate report",
                on_click=State.open_report_workspace,
                disabled=~State.can_generate_report,
                size="4",
                border_radius="9999px",
                padding_x="1.5rem",
            ),
            rx.cond(
                State.report_status != "",
                rx.callout(State.report_status, icon="info", width="100%"),
            ),
            spacing="5",
            align="start",
            width="100%",
            max_width="1200px",
        ),
        min_height="100vh",
        width="100%",
        padding="2.5rem",
        background="""
            radial-gradient(circle at top left, rgba(16,185,129,0.08), transparent 30%),
            linear-gradient(180deg, #f8fbff 0%, #f3f6fb 100%)
        """,
    )
def upload_report_page() -> rx.Component:
    return rx.box(
        rx.el.style(
            """
            @keyframes uploadGlowA {
                0% { transform: translate(0px, 0px) scale(1); opacity: 0.30; }
                50% { transform: translate(18px, -10px) scale(1.08); opacity: 0.48; }
                100% { transform: translate(0px, 0px) scale(1); opacity: 0.30; }
            }

            @keyframes uploadGlowB {
                0% { transform: translate(0px, 0px) scale(1); opacity: 0.22; }
                50% { transform: translate(-16px, 12px) scale(1.06); opacity: 0.40; }
                100% { transform: translate(0px, 0px) scale(1); opacity: 0.22; }
            }

            @keyframes gridMove {
                0% { transform: translateY(0px); }
                50% { transform: translateY(8px); }
                100% { transform: translateY(0px); }
            }
            """
        ),

        # background
        rx.box(
            position="absolute",
            inset="0",
            background="""
                radial-gradient(circle at 18% 22%, rgba(96,165,250,0.14) 0%, rgba(96,165,250,0.00) 26%),
                radial-gradient(circle at 82% 30%, rgba(129,140,248,0.15) 0%, rgba(129,140,248,0.00) 26%),
                radial-gradient(circle at 50% 82%, rgba(45,212,191,0.10) 0%, rgba(45,212,191,0.00) 28%),
                linear-gradient(180deg, #040814 0%, #070d1d 50%, #050914 100%)
            """,
            z_index="0",
        ),

        rx.box(
            position="absolute",
            inset="0",
            background="""
                linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)
            """,
            background_size="44px 44px",
            mask_image="linear-gradient(180deg, rgba(0,0,0,0.65), transparent 95%)",
            opacity="0.25",
            animation="gridMove 8s ease-in-out infinite",
            z_index="1",
            pointer_events="none",
        ),

        rx.box(
            position="absolute",
            top="12%",
            left="8%",
            width="24rem",
            height="24rem",
            border_radius="9999px",
            background="radial-gradient(circle, rgba(96,165,250,0.26) 0%, rgba(96,165,250,0.00) 72%)",
            filter="blur(70px)",
            animation="uploadGlowA 10s ease-in-out infinite",
            z_index="1",
            pointer_events="none",
        ),
        rx.box(
            position="absolute",
            right="10%",
            bottom="10%",
            width="28rem",
            height="28rem",
            border_radius="9999px",
            background="radial-gradient(circle, rgba(129,140,248,0.22) 0%, rgba(129,140,248,0.00) 72%)",
            filter="blur(76px)",
            animation="uploadGlowB 12s ease-in-out infinite",
            z_index="1",
            pointer_events="none",
        ),

        rx.vstack(
            rx.hstack(
                rx.link(
                    rx.text("← Back Home", color="rgba(255,255,255,0.84)", font_weight="600"),
                    href="/",
                ),
                rx.spacer(),
                width="100%",
            ),

            rx.vstack(
                rx.heading(
                    "Upload sagittal-view videos from both cameras",
                    color="white",
                    size="9",
                    text_align="center",
                    max_width="1100px",
                    letter_spacing="-0.03em",
                    line_height="1.02",
                ),
                rx.text(
                    "Place the left-camera video on the left and the right-camera video on the right. "
                    "Then generate your AI gait report below.",
                    color="rgba(255,255,255,0.72)",
                    font_size="1.05rem",
                    text_align="center",
                    max_width="840px",
                    line_height="1.6",
                ),
                spacing="4",
                align="center",
                width="100%",
            ),

            rx.hstack(
                cinematic_upload_box(
                    "Left Camera",
                    "Upload the sagittal view captured from the left side.",
                    "patient_left_upload_new",
                    State.patient_left_video_name,
                    State.handle_patient_left_upload,
                    "rgba(59,130,246,0.95)",
                    "⬅️",
                ),
                cinematic_upload_box(
                    "Right Camera",
                    "Upload the sagittal view captured from the right side.",
                    "patient_right_upload_new",
                    State.patient_right_video_name,
                    State.handle_patient_right_upload,
                    "rgba(99,102,241,0.95)",
                    "➡️",
                ),
                width="100%",
                spacing="6",
                align="stretch",
                justify="center",
                flex_wrap="wrap",
            ),

            rx.vstack(
                rx.button(
                    "Get AI report",
                    on_click=State.open_report_workspace,
                    disabled=~State.opencap_ready,
                    size="4",
                    border_radius="9999px",
                    padding_x="2.2rem",
                    padding_y="1.6rem",
                    background="linear-gradient(90deg, rgba(37,99,235,1), rgba(99,102,241,1), rgba(45,212,191,0.92))",
                    color="white",
                    font_weight="800",
                    font_size="1.05rem",
                    box_shadow="0 18px 50px rgba(59,130,246,0.28)",
                    _hover={
                        "transform": "translateY(-2px) scale(1.01)",
                        "opacity": "0.96",
                    },
                ),
                rx.cond(
                    State.opencap_ready,
                    rx.text(
                        "Videos processed successfully. Click below to generate the AI report.",
                        color="rgba(255,255,255,0.72)",
                        font_size="0.9rem",
                    ),
                    rx.text(
                        "After both videos are uploaded, the server will run OpenCap automatically.",
                        color="rgba(255,255,255,0.52)",
                        font_size="0.9rem",
                    ),
                ),
                spacing="3",
                align="center",
                padding_top="0.5rem",
            ),

            rx.cond(
                State.report_status != "",
                rx.box(
                    rx.text(
                        State.report_status,
                        color="white",
                        font_weight="500",
                    ),
                    width="100%",
                    max_width="800px",
                    background="rgba(255,255,255,0.08)",
                    border="1px solid rgba(255,255,255,0.12)",
                    border_radius="20px",
                    padding="1rem 1.1rem",
                    backdrop_filter="blur(10px)",
                ),
            ),

            spacing="8",
            align="center",
            width="100%",
            max_width="1320px",
            margin="0 auto",
            padding="2rem 1.5rem 3rem 1.5rem",
            position="relative",
            z_index="2",
        ),

        min_height="100vh",
        width="100%",
        position="relative",
        overflow="hidden",
    )
# -------------------------
# ADD THIS NEW PAGE FUNCTION
# -------------------------
def rehab_section_card(title: str, body: rx.Component) -> rx.Component:
    return rx.box(
        rx.vstack(
            rx.text(
                title,
                color="white",
                font_weight="800",
                font_size="1.08rem",
            ),
            body,
            spacing="3",
            align="start",
            width="100%",
        ),
        width="100%",
        padding="1.2rem",
        border_radius="24px",
        background="linear-gradient(180deg, rgba(10,14,26,0.86), rgba(7,10,18,0.94))",
        border="1px solid rgba(255,255,255,0.10)",
        backdrop_filter="blur(18px)",
        box_shadow="0 24px 70px rgba(0,0,0,0.28)",
    )


def exercise_card_by_index(i) -> rx.Component:
    return rx.box(
        rx.vstack(
            rx.text(State.rehab_exercise_names[i], color="white", font_weight="800", font_size="1rem"),
            rx.text(State.rehab_exercise_goals[i], color="rgba(255,255,255,0.76)", font_size="0.92rem"),
            rx.text("Instructions", color="white", font_weight="700", margin_top="0.4rem"),
            rx.text(
                State.rehab_exercise_instruction_blocks[i],
                color="rgba(255,255,255,0.72)",
                font_size="0.9rem",
                white_space="pre-wrap",
            ),
            rx.text("Dosage", color="white", font_weight="700", margin_top="0.4rem"),
            rx.text(f"Sets: ", as_="span"),
            rx.text(State.rehab_exercise_sets[i], color="rgba(255,255,255,0.72)", font_size="0.9rem"),
            rx.text(f"Reps: {State.rehab_exercise_reps[i]}", color="rgba(255,255,255,0.72)", font_size="0.9rem"),
            rx.text(f"Frequency: {State.rehab_exercise_frequencies[i]}", color="rgba(255,255,255,0.72)", font_size="0.9rem"),
            rx.text(f"Progression: {State.rehab_exercise_progressions[i]}", color="rgba(255,255,255,0.72)", font_size="0.9rem"),
            rx.text(f"Caution: {State.rehab_exercise_cautions[i]}", color="rgba(255,255,255,0.62)", font_size="0.88rem"),
            spacing="2",
            align="start",
            width="100%",
        ),
        width="100%",
        padding="1rem",
        border_radius="20px",
        background="rgba(255,255,255,0.05)",
        border="1px solid rgba(255,255,255,0.08)",
    )
    
def nutrition_card_by_index(i) -> rx.Component:
    return rx.box(
        rx.vstack(
            rx.text(State.rehab_nutrition_titles[i], color="white", font_weight="800", font_size="1rem"),
            rx.text(State.rehab_nutrition_recommendations[i], color="rgba(255,255,255,0.76)", font_size="0.92rem"),
            rx.text(State.rehab_nutrition_why[i], color="rgba(255,255,255,0.62)", font_size="0.88rem"),
            spacing="2",
            align="start",
            width="100%",
        ),
        width="100%",
        padding="1rem",
        border_radius="20px",
        background="rgba(255,255,255,0.05)",
        border="1px solid rgba(255,255,255,0.08)",
    )

def report_review_page() -> rx.Component:
    return rx.box(
            
        rx.box(
            position="absolute",
            inset="0",
            background="""
                radial-gradient(circle at 18% 22%, rgba(96,165,250,0.14) 0%, rgba(96,165,250,0.00) 26%),
                radial-gradient(circle at 82% 30%, rgba(129,140,248,0.15) 0%, rgba(129,140,248,0.00) 26%),
                radial-gradient(circle at 50% 82%, rgba(45,212,191,0.10) 0%, rgba(45,212,191,0.00) 28%),
                linear-gradient(180deg, #040814 0%, #070d1d 50%, #050914 100%)
            """,
            z_index="0",
        ),

        rx.vstack(
            rx.hstack(
                rx.link(
                    rx.text(
                        "← Back to upload",
                        color="rgba(255,255,255,0.84)",
                        font_weight="600",
                    ),
                    href="/upload-report",
                ),
                rx.spacer(),
                rx.button(
                    "Get Rehab Plan",
                    on_click=State.generate_rehab_plan,
                    disabled=~State.can_generate_rehab_plan,
                    size="3",
                    border_radius="9999px",
                    padding_x="1.2rem",
                    background="linear-gradient(90deg, rgba(16,185,129,1), rgba(59,130,246,1))",
                    color="white",
                    font_weight="800",
                    box_shadow="0 14px 34px rgba(16,185,129,0.22)",
                    _hover={
                        "opacity": "0.96",
                        "transform": "translateY(-1px)",
                    },
                ),
                width="100%",
                align="center",
            ),

            rx.vstack(
                rx.heading(
                    "AI Gait Report Review",
                    color="white",
                    size="8",
                    text_align="center",
                    letter_spacing="-0.03em",
                ),
                rx.text(
                    "Review the generated report on the right and ask questions on the left.",
                    color="rgba(255,255,255,0.72)",
                    font_size="1rem",
                    text_align="center",
                    max_width="820px",
                ),
                spacing="3",
                align="center",
                width="100%",
            ),

            rx.hstack(
                report_chat_panel(),
                gait_report_viewer_panel(),
                width="100%",
                spacing="6",
                align="stretch",
                justify="center",
            ),

            width="100%",
            max_width="1450px",
            margin="0 auto",
            padding="2rem 1.5rem 2.5rem 1.5rem",
            spacing="6",
            align="center",
            position="relative",
            z_index="2",
        ),

        min_height="100vh",
        width="100%",
        position="relative",
        overflow="hidden",
    )
    
def rehab_plan_page() -> rx.Component:
    return rx.box(
        rx.box(
            position="absolute",
            inset="0",
            background="""
                radial-gradient(circle at 18% 22%, rgba(96,165,250,0.14) 0%, rgba(96,165,250,0.00) 26%),
                radial-gradient(circle at 82% 30%, rgba(129,140,248,0.15) 0%, rgba(129,140,248,0.00) 26%),
                radial-gradient(circle at 50% 82%, rgba(45,212,191,0.10) 0%, rgba(45,212,191,0.00) 28%),
                linear-gradient(180deg, #040814 0%, #070d1d 50%, #050914 100%)
            """,
            z_index="0",
        ),

        rx.vstack(
            rx.hstack(
                rx.link(
                    rx.text("← Back to report review", color="rgba(255,255,255,0.84)", font_weight="600"),
                    href="/report-review",
                ),
                rx.spacer(),
                width="100%",
            ),

            rx.vstack(
                rx.heading(
                    State.rehab_plan_title,
                    color="white",
                    size="8",
                    text_align="center",
                    letter_spacing="-0.03em",
                ),
                rx.text(
                    State.rehab_plan_overview,
                    color="rgba(255,255,255,0.76)",
                    font_size="1rem",
                    text_align="center",
                    max_width="920px",
                    line_height="1.7",
                ),
                spacing="3",
                align="center",
                width="100%",
            ),
            rehab_section_card(
                "Priority Focus Areas",
                rx.vstack(
                    rx.foreach(
                        rx.Var.range(State.rehab_priority_titles.length()),
                        lambda i: rx.box(
                            rx.text(State.rehab_priority_titles[i], color="white", font_weight="800"),
                            rx.text(
                                State.rehab_priority_rationales[i],
                                color="rgba(255,255,255,0.72)",
                                font_size="0.92rem",
                            ),
                            width="100%",
                            padding="0.9rem",
                            border_radius="18px",
                            background="rgba(255,255,255,0.05)",
                            border="1px solid rgba(255,255,255,0.08)",
                        ),
                    ),
                    spacing="3",
                    width="100%",
                    align="stretch",
                ),
            ),

            rehab_section_card(
                "Exercise Plan",
                rx.vstack(
                    rx.foreach(
                        rx.Var.range(State.rehab_exercise_names.length()),
                        exercise_card_by_index,
                    ),
                    spacing="4",
                    width="100%",
                    align="stretch",
                ),
            ),

            rehab_section_card(
                "Weekly Schedule",
                rx.vstack(
                    rx.foreach(
                        rx.Var.range(State.rehab_schedule_day_labels.length()),
                        lambda i: rx.box(
                            rx.text(State.rehab_schedule_day_labels[i], color="white", font_weight="800"),
                            rx.text(
                                State.rehab_schedule_activity_blocks[i],
                                color="rgba(255,255,255,0.72)",
                                font_size="0.92rem",
                                white_space="pre-wrap",
                            ),
                            width="100%",
                            padding="1rem",
                            border_radius="20px",
                            background="rgba(255,255,255,0.05)",
                            border="1px solid rgba(255,255,255,0.08)",
                        ),
                    ),
                    spacing="3",
                    width="100%",
                    align="stretch",
                ),
            ),

            rehab_section_card(
                "Nutritional Suggestions",
                rx.vstack(
                    rx.foreach(
                        rx.Var.range(State.rehab_nutrition_titles.length()),
                        nutrition_card_by_index,
                    ),
                    spacing="4",
                    width="100%",
                    align="stretch",
                ),
                ),

            rehab_section_card(
                "Lifestyle Recommendations",
                rx.vstack(
                    rx.foreach(
                        State.rehab_lifestyle_recommendations,
                        lambda item: rx.text(
                            f"• {item}",
                            color="rgba(255,255,255,0.72)",
                            font_size="0.92rem",
                        ),
                    ),
                    spacing="2",
                    width="100%",
                    align="start",
                ),
            ),

            rehab_section_card(
                "Follow-up Flags",
                rx.vstack(
                    rx.foreach(
                        State.rehab_follow_up_flags,
                        lambda item: rx.text(
                            f"• {item}",
                            color="rgba(255,255,255,0.72)",
                            font_size="0.92rem",
                        ),
                    ),
                    spacing="2",
                    width="100%",
                    align="start",
                ),
            ),

            rx.box(
                rx.text(
                    State.rehab_plan_disclaimer,
                    color="rgba(255,255,255,0.62)",
                    font_size="0.88rem",
                    line_height="1.6",
                ),
                width="100%",
                padding="1rem 1.1rem",
                border_radius="18px",
                background="rgba(245,158,11,0.08)",
                border="1px solid rgba(245,158,11,0.18)",
            ),

            width="100%",
            max_width="1180px",
            margin="0 auto",
            padding="2rem 1.5rem 3rem 1.5rem",
            spacing="5",
            align="stretch",
            position="relative",
            z_index="2",
        ),

        min_height="100vh",
        width="100%",
        position="relative",
        overflow="hidden",
    )

app = rx.App(
    theme=rx.theme(
        appearance="light",
        has_background=True,
        radius="large",
        accent_color="blue",
    ),
)

app.add_page(landing_page, route="/", title="AxonAI")
app.add_page(configure_page, route="/configure", title="Configure Camera")
app.add_page(report_page, route="/report", title="Generate Report")
app.add_page(upload_report_page, route="/upload-report", title="AI Gait Report Upload")
app.add_page(report_review_page, route="/report-review", title="Report Review")
app.add_page(rehab_plan_page, route="/rehab-plan", title="Rehab Plan")