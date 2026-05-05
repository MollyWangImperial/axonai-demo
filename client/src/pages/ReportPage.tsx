/**
 * ReportPage — Functional Movement Assessment
 * Design: Clean light app-shell (#F7F8FA bg, white cards, teal/blue accents)
 * 5 Modules:
 *   1. Overview          — visual-only capability fingerprint
 *   2. Auto Metrics      — OpenPose/OpenCap derived (no extra input)
 *   3. Guided-Video      — standardised tests with instruction videos
 *   4. AI-Model Metrics  — require trained model (EMG, fall-risk, etc.)
 *   5. Manual Input      — therapist-entered clinical scales
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useAssessment } from "@/contexts/AssessmentContext";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import {
  ArrowLeft, Download, User, Calendar, Clock, ChevronDown, ChevronUp,
  Play, Brain, Cpu, ClipboardList, Activity, CheckCircle2,
  AlertTriangle, Info, BarChart2, Zap, BookOpen, Plus,
  FileSpreadsheet, Upload, X, Loader2,
} from "lucide-react";

// ─── App shell colours (CSS vars defined in index.css .app-shell) ─────────────
const C = {
  bg:      "var(--app-bg)",
  surface: "var(--app-surface)",
  border:  "var(--app-border)",
  text:    "var(--app-text)",
  text2:   "var(--app-text-2)",
  text3:   "var(--app-text-3)",
  teal:    "var(--app-teal)",
  tealDim: "var(--app-teal-dim)",
  blue:    "var(--app-blue)",
  blueDim: "var(--app-blue-dim)",
  amber:   "var(--app-amber)",
  red:     "var(--app-red)",
  green:   "var(--app-green)",
  purple:  "var(--app-purple)",
};

// ─── Mock data ────────────────────────────────────────────────────────────────
const overviewRadar = [
  { axis: "Gait",         score: 62, ref: 100 },
  { axis: "Balance",      score: 58, ref: 100 },
  { axis: "Strength",     score: 45, ref: 100 },
  { axis: "Coordination", score: 70, ref: 100 },
  { axis: "Endurance",    score: 54, ref: 100 },
  { axis: "Symmetry",     score: 71, ref: 100 },
];

const autoMetrics = [
  { group: "Spatiotemporal", items: [
    { label: "Gait Speed",         value: "0.65", unit: "m/s",  ref: "1.20",  risk: "high" },
    { label: "Cadence",            value: "78",   unit: "spm",  ref: "110",   risk: "medium" },
    { label: "Stride Length (L)",  value: "112",  unit: "cm",   ref: "145",   risk: "medium" },
    { label: "Stride Length (R)",  value: "138",  unit: "cm",   ref: "145",   risk: "low" },
    { label: "Step Time (L)",      value: "0.62", unit: "s",    ref: "0.52",  risk: "medium" },
    { label: "Step Time (R)",      value: "0.50", unit: "s",    ref: "0.52",  risk: "low" },
    { label: "Step Width",         value: "14.2", unit: "cm",   ref: "10–12", risk: "medium" },
  ]},
  { group: "Phase Ratios", items: [
    { label: "Stance Phase (L)",   value: "64",   unit: "%",    ref: "60",    risk: "medium" },
    { label: "Swing Phase (L)",    value: "36",   unit: "%",    ref: "40",    risk: "medium" },
    { label: "Bilateral Symmetry", value: "71",   unit: "%",    ref: "≥90",   risk: "high" },
  ]},
  { group: "Joint Kinematics", items: [
    { label: "Hip Flexion ROM",      value: "24",  unit: "°",  ref: "30–40", risk: "medium" },
    { label: "Hip Extension ROM",    value: "8",   unit: "°",  ref: "10–15", risk: "medium" },
    { label: "Knee Flexion ROM",     value: "52",  unit: "°",  ref: "60–70", risk: "medium" },
    { label: "Ankle Dorsiflexion",   value: "8",   unit: "°",  ref: "10–15", risk: "medium" },
    { label: "Pelvic Tilt",          value: "12",  unit: "°",  ref: "4–8",   risk: "high" },
    { label: "Pelvic Rotation",      value: "9",   unit: "°",  ref: "4–6",   risk: "high" },
    { label: "Trunk Lateral Lean",   value: "6",   unit: "°",  ref: "≤3",    risk: "high" },
    { label: "Toe Clearance (L)",    value: "1.1", unit: "cm", ref: "≥1.5",  risk: "high" },
  ]},
];

const guidedMetrics = [
  {
    label: "Single-Leg Stance — Left",
    unit: "s",
    videoTitle: "Single-Leg Stance Test",
    videoDesc: "Stand on your left leg with arms crossed over chest. Hold for up to 30 seconds. Eyes open.",
    videoThumb: "balance",
  },
  {
    label: "Single-Leg Stance — Right",
    unit: "s",
    videoTitle: "Single-Leg Stance Test",
    videoDesc: "Stand on your right leg with arms crossed over chest. Hold for up to 30 seconds. Eyes open.",
    videoThumb: "balance",
  },
  {
    label: "Timed Up-and-Go (TUG)",
    unit: "s",
    videoTitle: "Timed Up-and-Go Test",
    videoDesc: "From seated position: rise, walk 3 m at comfortable pace, turn around, walk back, sit down. Timer starts on 'Go'.",
    videoThumb: "tug",
  },
  {
    label: "10-Metre Walk Test",
    unit: "m/s",
    videoTitle: "10-Metre Walk Test",
    videoDesc: "Walk 10 metres at your comfortable pace. Timer records the middle 6 metres to exclude acceleration/deceleration.",
    videoThumb: "walk",
  },
  {
    label: "Functional Reach",
    unit: "cm",
    videoTitle: "Functional Reach Test",
    videoDesc: "Stand beside a wall-mounted ruler. Reach forward with dominant arm as far as possible without stepping or losing balance.",
    videoThumb: "reach",
  },
  {
    label: "30-Second Sit-to-Stand",
    unit: "reps",
    videoTitle: "30-Second Chair Stand Test",
    videoDesc: "From seated position with arms crossed: rise to full stand and return to seated. Count repetitions in 30 seconds.",
    videoThumb: "sts",
  },
  {
    label: "Stair Ascent Time",
    unit: "s",
    videoTitle: "Stair Ascent Test",
    videoDesc: "Ascend 10 standard steps at comfortable pace using handrail if needed. Timer starts at first step.",
    videoThumb: "stair",
  },
  {
    label: "Stair Descent Time",
    unit: "s",
    videoTitle: "Stair Descent Test",
    videoDesc: "Descend 10 standard steps at comfortable pace using handrail if needed. Timer starts at first step.",
    videoThumb: "stair",
  },
  {
    label: "Tandem Stance (Eyes Open)",
    unit: "s",
    videoTitle: "Tandem Stance Test",
    videoDesc: "Place one foot directly in front of the other (heel-to-toe). Hold for up to 30 seconds with eyes open.",
    videoThumb: "tandem",
  },
  {
    label: "Tandem Stance (Eyes Closed)",
    unit: "s",
    videoTitle: "Romberg Tandem Test",
    videoDesc: "Same as eyes-open tandem stance but with eyes closed. Hold for up to 30 seconds.",
    videoThumb: "tandem",
  },
];

const aiMetrics = [
  {
    id: "muscle_strength",
    label: "Muscle Strength Estimation",
    unit: "Nm",
    muscles: ["Hip Flexors", "Knee Extensors", "Ankle Plantarflexors"],
    description: "Estimates peak joint torque from kinematic patterns using a model trained on simultaneous EMG + dynamometer data.",
    datasetInstructions: [
      "Recruit ≥50 subjects (mix of healthy + post-stroke)",
      "Instrument with surface EMG on target muscle groups",
      "Record isometric MVC trials on isokinetic dynamometer (3 trials × 5 s each)",
      "Simultaneously capture walking video with calibrated camera",
      "Label each frame with torque values; train regression model (e.g., LSTM or Transformer)",
    ],
    datasetType: "EMG + Dynamometer",
    modelStatus: "not_loaded",
  },
  {
    id: "spasticity",
    label: "Spasticity Grade",
    unit: "MAS (0–4)",
    muscles: ["Biceps", "Wrist Flexors", "Quadriceps", "Gastrocnemius"],
    description: "Classifies Modified Ashworth Scale grade from passive movement kinematics and EMG co-activation patterns.",
    datasetInstructions: [
      "Collect ≥200 clinical assessments with certified therapist MAS labels",
      "Record passive limb movement with motion capture + surface EMG",
      "Annotate resistance onset, catch, and release events",
      "Train ordinal classifier (0, 1, 1+, 2, 3, 4); validate with ICC ≥0.80",
    ],
    datasetType: "EMG + Clinical Labels",
    modelStatus: "not_loaded",
  },
  {
    id: "fatigue",
    label: "Fatigue Index",
    unit: "%",
    muscles: [],
    description: "Quantifies gait deterioration over a 6-minute walk by comparing early vs late stride kinematics.",
    datasetInstructions: [
      "Record 6-minute walk test with continuous video capture",
      "Segment into 30-second epochs; compute kinematic features per epoch",
      "Collect self-reported RPE (Borg scale) at each epoch",
      "Train regression model mapping kinematic change to fatigue score",
    ],
    datasetType: "Longitudinal Kinematics + RPE",
    modelStatus: "not_loaded",
  },
  {
    id: "fall_risk",
    label: "Fall Risk Score",
    unit: "0–100",
    muscles: [],
    description: "Predicts 6-month fall probability from gait variability, balance metrics, and patient demographics.",
    datasetInstructions: [
      "Enrol ≥300 community-dwelling stroke survivors",
      "Collect baseline gait assessment + demographics + medications",
      "Follow up for 6 months with daily fall diary",
      "Label each participant as faller / non-faller; train binary classifier",
      "Validate with AUC ≥0.75 on held-out test set",
    ],
    datasetType: "Prospective Cohort + Fall Diary",
    modelStatus: "not_loaded",
  },
  {
    id: "compensation",
    label: "Compensatory Movement Index",
    unit: "0–100",
    muscles: [],
    description: "Quantifies trunk/pelvis compensation strategies adopted to offset distal weakness or spasticity.",
    datasetInstructions: [
      "Collect paired kinematics from healthy controls + matched post-stroke patients",
      "Define compensation features: trunk lean, pelvic hike, hip circumduction, vaulting",
      "Train anomaly detection or regression model on healthy reference distribution",
      "Validate against expert therapist compensation ratings (ICC ≥0.75)",
    ],
    datasetType: "Paired Healthy / Post-Stroke Kinematics",
    modelStatus: "not_loaded",
  },
];

const manualScales = [
  {
    id: "fma_ue",
    label: "Fugl-Meyer Assessment — Upper Extremity",
    abbr: "FMA-UE",
    range: [0, 66],
    description: "Assesses motor recovery of the upper limb. Higher scores indicate greater motor function.",
    subscales: ["Shoulder/Elbow/Forearm (0–36)", "Wrist (0–10)", "Hand (0–14)", "Coordination/Speed (0–6)"],
  },
  {
    id: "fma_le",
    label: "Fugl-Meyer Assessment — Lower Extremity",
    abbr: "FMA-LE",
    range: [0, 34],
    description: "Assesses motor recovery of the lower limb. Higher scores indicate greater motor function.",
    subscales: ["Hip/Knee/Ankle (0–28)", "Coordination/Speed (0–6)"],
  },
  {
    id: "mas",
    label: "Modified Ashworth Scale",
    abbr: "MAS",
    range: [0, 4],
    description: "Grades muscle spasticity during passive stretch. Assessed per muscle group.",
    subscales: ["Elbow Flexors", "Wrist Flexors", "Knee Extensors", "Ankle Plantarflexors"],
    isPerMuscle: true,
  },
  {
    id: "brunnstrom",
    label: "Brunnstrom Stage",
    abbr: "BS",
    range: [1, 6],
    description: "Stages motor recovery after stroke from flaccidity (1) to near-normal movement (6).",
    subscales: ["Upper Extremity", "Lower Extremity", "Hand"],
    isPerMuscle: true,
  },
  {
    id: "nihss",
    label: "NIH Stroke Scale",
    abbr: "NIHSS",
    range: [0, 42],
    description: "Quantifies neurological impairment. Scores 0–4 = minor, 5–15 = moderate, 16–20 = moderate-severe, 21–42 = severe.",
    subscales: [],
  },
  {
    id: "barthel",
    label: "Barthel Index",
    abbr: "BI",
    range: [0, 100],
    description: "Measures functional independence in activities of daily living. Higher scores indicate greater independence.",
    subscales: [],
  },
  {
    id: "pain_vas",
    label: "Pain — Visual Analogue Scale",
    abbr: "VAS",
    range: [0, 10],
    description: "Patient-reported pain intensity. 0 = no pain, 10 = worst imaginable pain.",
    subscales: [],
  },
];

// ─── Shared sub-components ────────────────────────────────────────────────────

function RiskPill({ risk }: { risk: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    high:   { bg: "#FEF2F2", color: "#DC2626", label: "Deficit" },
    medium: { bg: "#FFFBEB", color: "#D97706", label: "Borderline" },
    low:    { bg: "#F0FDF4", color: "#059669", label: "Normal" },
  };
  const s = map[risk] ?? map.low;
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

function ModuleHeader({
  number, icon: Icon, title, subtitle, color,
}: {
  number: number; icon: React.ElementType; title: string; subtitle: string; color: string;
}) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div
        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
        style={{ backgroundColor: color }}
      >
        {number}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <Icon size={15} style={{ color }} />
          <h2 className="text-base font-semibold" style={{ color: C.text }}>{title}</h2>
        </div>
        <p className="text-xs" style={{ color: C.text3 }}>{subtitle}</p>
      </div>
    </div>
  );
}

function ModuleCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl p-6 mb-6 ${className}`}
      style={{
        backgroundColor: C.surface,
        border: `1px solid ${C.border}`,
        boxShadow: "var(--app-shadow-md)",
      }}
    >
      {children}
    </div>
  );
}

// ─── Module 1: Overview ───────────────────────────────────────────────────────

function OverviewModule({ metrics }: { metrics: any }) {
  const overallScore = Math.round(
    overviewRadar.reduce((s, d) => s + d.score, 0) / overviewRadar.length
  );

  const scoreColor =
    overallScore >= 75 ? C.green :
    overallScore >= 50 ? C.amber : C.red;

  return (
    <ModuleCard>
      <ModuleHeader
        number={1}
        icon={Activity}
        title="Functional Capability Overview"
        subtitle="Normalised against age- and sex-matched reference population (100 = healthy reference)"
        color="#00B89A"
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        {/* Overall score circle */}
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="relative w-36 h-36">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="50" fill="none" stroke={C.border} strokeWidth="10" />
              <circle
                cx="60" cy="60" r="50" fill="none"
                stroke={scoreColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - overallScore / 100)}`}
                style={{ transition: "stroke-dashoffset 1s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black" style={{ color: scoreColor }}>{overallScore}</span>
              <span className="text-xs font-medium" style={{ color: C.text3 }}>/100</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs font-semibold" style={{ color: C.text2 }}>Overall Score</div>
            <div className="text-xs mt-0.5" style={{ color: C.text3 }}>
              {overallScore >= 75 ? "Good" : overallScore >= 50 ? "Moderate Impairment" : "Significant Impairment"}
            </div>
          </div>
        </div>

        {/* Radar chart — no text labels on axes, just the shape */}
        <div className="lg:col-span-2 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={overviewRadar} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <PolarGrid stroke={C.border} />
              <PolarAngleAxis
                dataKey="axis"
                tick={{ fill: C.text2, fontSize: 11, fontWeight: 600 }}
              />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name="Reference"
                dataKey="ref"
                stroke="#E4E7ED"
                fill="#E4E7ED"
                fillOpacity={0.3}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <Radar
                name="Patient"
                dataKey="score"
                stroke="#00B89A"
                fill="#00B89A"
                fillOpacity={0.25}
                strokeWidth={2.5}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 6 dimension pills — visual only */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-4">
        {overviewRadar.map((d) => {
          const pct = d.score;
          const col = pct >= 75 ? C.green : pct >= 50 ? C.amber : C.red;
          return (
            <div
              key={d.axis}
              className="flex flex-col items-center gap-1.5 rounded-xl py-3 px-2"
              style={{ backgroundColor: C.bg }}
            >
              <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: C.border }}>
                <div
                  className="h-1.5 rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: col }}
                />
              </div>
              <span className="text-xs font-bold" style={{ color: col }}>{pct}</span>
              <span className="text-xs" style={{ color: C.text3 }}>{d.axis}</span>
            </div>
          );
        })}
      </div>
    </ModuleCard>
  );
}

// ─── Module 2: Auto Metrics ───────────────────────────────────────────────────

function AutoMetricsModule() {
  const [openGroup, setOpenGroup] = useState<string | null>("Spatiotemporal");

  return (
    <ModuleCard>
      <ModuleHeader
        number={2}
        icon={BarChart2}
        title="Kinematic & Spatiotemporal Metrics"
        subtitle="Objective movement parameters that quantify how a patient walks, moves, and maintains balance — forming the clinical foundation for diagnosis and progress tracking"
        color="#2563EB"
      />
      <div className="space-y-3">
        {autoMetrics.map((group) => (
          <div
            key={group.group}
            className="rounded-xl overflow-hidden"
            style={{ border: `1px solid ${C.border}` }}
          >
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50"
              style={{ backgroundColor: C.bg }}
              onClick={() => setOpenGroup(openGroup === group.group ? null : group.group)}
            >
              <span className="text-sm font-semibold" style={{ color: C.text }}>{group.group}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: C.text3 }}>{group.items.length} metrics</span>
                {openGroup === group.group ? <ChevronUp size={14} style={{ color: C.text3 }} /> : <ChevronDown size={14} style={{ color: C.text3 }} />}
              </div>
            </button>
            <AnimatePresence>
              {openGroup === group.group && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-2 space-y-2">
                    {group.items.map((item) => {
                      const pct = Math.min(100, (parseFloat(item.value) / parseFloat(item.ref)) * 100) || 60;
                      const barColor =
                        item.risk === "high" ? C.red :
                        item.risk === "medium" ? C.amber : C.green;
                      return (
                        <div key={item.label} className="grid grid-cols-12 items-center gap-3">
                          <div className="col-span-4 text-xs font-medium" style={{ color: C.text2 }}>
                            {item.label}
                          </div>
                          <div className="col-span-4">
                            <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: C.border }}>
                              <div
                                className="h-1.5 rounded-full"
                                style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }}
                              />
                            </div>
                          </div>
                          <div className="col-span-2 text-xs font-bold text-right" style={{ color: C.text }}>
                            {item.value} <span style={{ color: C.text3 }}>{item.unit}</span>
                          </div>
                          <div className="col-span-2 flex justify-end">
                            <RiskPill risk={item.risk} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </ModuleCard>
  );
}

// ─── Module 3: Guided-Video Metrics ──────────────────────────────────────────

// YouTube video IDs for guided metrics (only Single-Leg Stance has one for now)
// Note: YouTube iframes require domain whitelisting; we use thumbnail + open-in-new-tab approach
const YOUTUBE_IDS: Record<string, string> = {
  balance: "78PpqNX_t0w", // Single-Leg Stance – Post-stroke Exercise (American Heart Association)
};

function VideoThumb({ type, label }: { type: string; label: string }) {
  const ytId = YOUTUBE_IDS[type];
  const [expanded, setExpanded] = useState(false);

  if (ytId) {
    const thumbUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    const watchUrl = `https://www.youtube.com/watch?v=${ytId}`;
    return (
      <div className="w-full">
        {/* Expandable toggle button */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
          style={{
            backgroundColor: expanded ? C.blue + "12" : C.bg,
            border: `1px solid ${expanded ? C.blue + "40" : C.border}`,
            color: expanded ? C.blue : C.text2,
          }}
        >
          <Play size={11} style={{ color: expanded ? C.blue : C.text3 }} />
          {expanded ? "Hide Instruction Video" : "Watch Instruction Video"}
          <ChevronDown
            size={12}
            style={{
              color: expanded ? C.blue : C.text3,
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          />
        </button>

        {/* Collapsible video panel */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="mt-2 rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                {/* Thumbnail with play overlay */}
                <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                  <img
                    src={thumbUrl}
                    alt={label}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)" }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: "rgba(255,255,255,0.92)" }}
                    >
                      <Play size={22} style={{ color: C.blue, marginLeft: 3 }} />
                    </div>
                  </div>
                  <div
                    className="absolute bottom-2 right-2 text-xs font-semibold px-2 py-0.5 rounded"
                    style={{ backgroundColor: "rgba(0,0,0,0.75)", color: "#fff" }}
                  >
                    0:54
                  </div>
                </div>
                {/* Footer */}
                <div
                  className="flex items-center justify-between px-3 py-2.5"
                  style={{ backgroundColor: C.surface }}
                >
                  <div>
                    <div className="text-xs font-semibold" style={{ color: C.text }}>Single-Leg Stance – Post-stroke</div>
                    <div className="text-xs" style={{ color: C.text3 }}>American Heart Association · 25K views</div>
                  </div>
                  <a
                    href={watchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                    style={{ backgroundColor: C.blue, color: "#fff" }}
                  >
                    <Play size={11} style={{ marginLeft: 1 }} />
                    Watch on YouTube
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // No video yet — coming soon placeholder
  return (
    <div
      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
      style={{ backgroundColor: "#F1F5F9", border: `1px dashed ${C.border}`, color: C.text3 }}
    >
      <Play size={11} style={{ color: C.text3 }} />
      Instruction video coming soon
    </div>
  );
}

function GuidedMetricRow({ metric, index }: { metric: typeof guidedMetrics[0]; index: number }) {
  const [value, setValue] = useState("");
  const hasVideo = metric.videoThumb in { balance: 1 };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="py-4"
      style={{ borderBottom: `1px solid ${C.border}` }}
    >
      {/* Top row: label + input */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-sm font-semibold mb-0.5" style={{ color: C.text }}>{metric.label}</div>
          <div className="text-xs leading-relaxed" style={{ color: C.text3 }}>{metric.videoDesc}</div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="—"
              className="w-20 text-right text-sm font-bold rounded-lg px-3 py-1.5 outline-none transition-all"
              style={{
                border: `1.5px solid ${value ? C.teal : C.border}`,
                backgroundColor: value ? "rgba(0,184,154,0.04)" : C.bg,
                color: C.text,
              }}
            />
            <span className="text-xs w-8" style={{ color: C.text3 }}>{metric.unit}</span>
          </div>
          {value && (
            <div className="flex items-center gap-1 text-xs" style={{ color: C.green }}>
              <CheckCircle2 size={11} />
              Recorded
            </div>
          )}
        </div>
      </div>

      {/* Video thumbnail — full width for Single-Leg Stance, small for others */}
      <div className={hasVideo ? "w-full" : "h-16 w-24"}>
        <VideoThumb type={metric.videoThumb} label={metric.label} />
      </div>

    </motion.div>
  );
}

function GuidedVideoModule() {
  return (
    <ModuleCard>
      <ModuleHeader
        number={3}
        icon={Play}
        title="Standardised Functional Tests"
        subtitle="Each test requires a specific movement protocol. Watch the guide video, perform the test, and enter the result."
        color="#7C3AED"
      />
      <div className="divide-y" style={{ borderTop: `1px solid ${C.border}` }}>
        {guidedMetrics.map((m, i) => (
          <GuidedMetricRow key={m.label} metric={m} index={i} />
        ))}
      </div>
    </ModuleCard>
  );
}

// ─── Module 4: AI-Model Metrics ───────────────────────────────────────────────

// Excel template storage path (uploaded via manus-upload-file --webdev)
const EXCEL_TEMPLATE_PATH = "/manus-storage/axonai_ai_dataset_template_c75e94f1.xlsx";

function AIModelCard({ metric }: { metric: typeof aiMetrics[0] }) {
  const [expanded, setExpanded] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  const handleRun = () => {
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      setResult("Model not yet loaded. Upload a trained model to compute this metric.");
    }, 1200);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadState("uploading");
    setUploadedFile(file.name);
    // Simulate upload + training trigger
    setTimeout(() => {
      setUploadState("done");
    }, 2200);
  };

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: `1px solid ${C.border}` }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between px-5 py-4" style={{ backgroundColor: C.bg }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "rgba(124,58,237,0.10)" }}
          >
            <Cpu size={14} style={{ color: C.purple }} />
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: C.text }}>{metric.label}</div>
            {metric.muscles.length > 0 && (
              <div className="text-xs mt-0.5" style={{ color: C.text3 }}>
                {metric.muscles.join(" · ")}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {result ? (
            <span
              className="text-xs px-2 py-1 rounded-lg"
              style={{ backgroundColor: "#FEF9C3", color: "#92400E" }}
            >
              {metric.unit}
            </span>
          ) : (
            <span
              className="text-xs px-2 py-1 rounded-lg font-mono"
              style={{ backgroundColor: C.border, color: C.text3 }}
            >
              — {metric.unit}
            </span>
          )}
          <button
            onClick={handleRun}
            disabled={running}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
            style={{
              backgroundColor: running ? C.border : C.purple,
              color: running ? C.text3 : "#fff",
            }}
          >
            {running ? (
              <><span className="animate-spin inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full" />Running…</>
            ) : (
              <><Zap size={12} />Run Model</>
            )}
          </button>
          <button onClick={() => setExpanded(!expanded)} style={{ color: C.text3 }}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div
          className="px-5 py-2 text-xs flex items-start gap-2"
          style={{ backgroundColor: "#FFFBEB", borderTop: `1px solid #FDE68A` }}
        >
          <AlertTriangle size={12} style={{ color: C.amber, flexShrink: 0, marginTop: 1 }} />
          <span style={{ color: "#92400E" }}>{result}</span>
        </div>
      )}

      {/* Dataset instructions */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="px-5 py-4"
              style={{ borderTop: `1px solid ${C.border}`, backgroundColor: C.surface }}
            >
              <p className="text-xs mb-3" style={{ color: C.text2 }}>{metric.description}</p>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={12} style={{ color: C.purple }} />
                <span className="text-xs font-semibold" style={{ color: C.purple }}>
                  Dataset Construction Guide — {metric.datasetType}
                </span>
              </div>
              <ol className="space-y-1.5">
                {metric.datasetInstructions.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: C.text2 }}>
                    <span
                      className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-white font-bold text-[10px]"
                      style={{ backgroundColor: C.purple }}
                    >
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
              {/* Dataset template download + upload-to-train */}
              <div className="mt-4 rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ backgroundColor: "rgba(124,58,237,0.06)", borderBottom: `1px solid ${C.border}` }}
                >
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet size={14} style={{ color: C.purple }} />
                    <span className="text-xs font-semibold" style={{ color: C.purple }}>Dataset Template &amp; Model Training</span>
                  </div>
                </div>
                <div className="p-4 space-y-3" style={{ backgroundColor: C.surface }}>
                  {/* Step 1: Download template */}
                  <div className="flex items-start gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 text-white"
                      style={{ backgroundColor: C.purple }}
                    >1</div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold mb-1" style={{ color: C.text }}>Download the dataset template</p>
                      <p className="text-xs mb-2" style={{ color: C.text2 }}>Fill in the Excel file with your collected data following the column definitions and sample rows provided.</p>
                      <a
                        href={EXCEL_TEMPLATE_PATH}
                        download
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80 text-white"
                        style={{ backgroundColor: C.purple }}
                      >
                        <FileSpreadsheet size={12} />
                        Download Excel Template
                      </a>
                    </div>
                  </div>

                  {/* Step 2: Upload filled dataset */}
                  <div className="flex items-start gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 text-white"
                      style={{ backgroundColor: C.purple }}
                    >2</div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold mb-1" style={{ color: C.text }}>Upload your completed dataset</p>
                      <p className="text-xs mb-2" style={{ color: C.text2 }}>Once you have collected sufficient data, upload the completed Excel file. The backend will automatically begin model training.</p>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".xlsx,.csv"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                        <div
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                          style={{
                            border: `1.5px dashed ${uploadState === "done" ? C.green : C.purple}`,
                            color: uploadState === "done" ? C.green : C.purple,
                            backgroundColor: uploadState === "done" ? "rgba(5,150,105,0.06)" : "rgba(124,58,237,0.06)",
                          }}
                        >
                          {uploadState === "uploading" ? (
                            <><Loader2 size={12} className="animate-spin" />Uploading &amp; queuing training…</>
                          ) : uploadState === "done" ? (
                            <><CheckCircle2 size={12} />Dataset uploaded — training queued</>
                          ) : (
                            <><Upload size={12} />Upload Completed Dataset (.xlsx / .csv)</>
                          )}
                        </div>
                      </label>
                      {uploadedFile && uploadState !== "idle" && (
                        <p className="text-xs mt-1" style={{ color: C.text3 }}>{uploadedFile}</p>
                      )}
                    </div>
                  </div>

                  {uploadState === "done" && (
                    <div
                      className="flex items-start gap-2 text-xs rounded-lg px-3 py-2"
                      style={{ backgroundColor: "rgba(5,150,105,0.08)", color: C.green }}
                    >
                      <CheckCircle2 size={12} style={{ flexShrink: 0, marginTop: 1 }} />
                      <span>Training job queued. You will be notified when the model is ready. The "Run Model" button will activate automatically.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AIModelModule() {
  return (
    <ModuleCard>
      <ModuleHeader
        number={4}
        icon={Brain}
        title="AI-Assisted Metrics"
        subtitle="These metrics require a custom AI model trained on specialist datasets. Expand each card for dataset construction guidance."
        color="#7C3AED"
      />
      <div className="space-y-3">
        {aiMetrics.map((m) => (
          <AIModelCard key={m.id} metric={m} />
        ))}
      </div>
    </ModuleCard>
  );
}

// ─── Module 5: Manual Input ───────────────────────────────────────────────────

function ManualScaleRow({ scale }: { scale: typeof manualScales[0] }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [mainValue, setMainValue] = useState("");

  const isPerMuscle = scale.isPerMuscle && scale.subscales.length > 0;

  return (
    <div
      className="rounded-xl px-5 py-4"
      style={{ border: `1px solid ${C.border}`, backgroundColor: C.bg }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-md"
              style={{ backgroundColor: "rgba(37,99,235,0.08)", color: C.blue }}
            >
              {scale.abbr}
            </span>
            <span className="text-sm font-semibold" style={{ color: C.text }}>{scale.label}</span>
          </div>
          <p className="text-xs mt-1" style={{ color: C.text3 }}>{scale.description}</p>
          <p className="text-xs mt-0.5 font-mono" style={{ color: C.text3 }}>
            Range: {scale.range[0]}–{scale.range[1]}
          </p>
        </div>
        {!isPerMuscle && (
          <div className="flex-shrink-0 flex items-center gap-2">
            <input
              type="number"
              min={scale.range[0]}
              max={scale.range[1]}
              value={mainValue}
              onChange={(e) => setMainValue(e.target.value)}
              placeholder="—"
              className="w-20 text-right text-sm font-bold rounded-lg px-3 py-1.5 outline-none"
              style={{
                border: `1.5px solid ${mainValue ? C.blue : C.border}`,
                backgroundColor: mainValue ? "rgba(37,99,235,0.04)" : C.surface,
                color: C.text,
              }}
            />
            <span className="text-xs" style={{ color: C.text3 }}>/ {scale.range[1]}</span>
          </div>
        )}
      </div>
      {isPerMuscle && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
          {scale.subscales.map((sub) => (
            <div
              key={sub}
              className="flex flex-col gap-1 rounded-lg px-3 py-2"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
            >
              <span className="text-xs" style={{ color: C.text3 }}>{sub}</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={scale.range[0]}
                  max={scale.range[1]}
                  value={values[sub] ?? ""}
                  onChange={(e) => setValues({ ...values, [sub]: e.target.value })}
                  placeholder="—"
                  className="w-14 text-right text-sm font-bold rounded-md px-2 py-1 outline-none"
                  style={{
                    border: `1.5px solid ${values[sub] ? C.blue : C.border}`,
                    backgroundColor: values[sub] ? "rgba(37,99,235,0.04)" : C.bg,
                    color: C.text,
                  }}
                />
                <span className="text-xs" style={{ color: C.text3 }}>/{scale.range[1]}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {!isPerMuscle && scale.subscales.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          {scale.subscales.map((sub) => (
            <div
              key={sub}
              className="flex items-center justify-between rounded-lg px-3 py-2"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
            >
              <span className="text-xs" style={{ color: C.text2 }}>{sub}</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={values[sub] ?? ""}
                  onChange={(e) => setValues({ ...values, [sub]: e.target.value })}
                  placeholder="—"
                  className="w-16 text-right text-xs font-bold rounded-md px-2 py-1 outline-none"
                  style={{
                    border: `1.5px solid ${values[sub] ? C.blue : C.border}`,
                    backgroundColor: values[sub] ? "rgba(37,99,235,0.04)" : C.bg,
                    color: C.text,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ManualInputModule() {
  const [notes, setNotes] = useState("");

  return (
    <ModuleCard>
      <ModuleHeader
        number={5}
        icon={ClipboardList}
        title="Clinical Scales — Manual Input"
        subtitle="Therapist-entered standardised assessments that cannot be computed from video alone"
        color="#2563EB"
      />
      <div className="space-y-3">
        {manualScales.map((s) => (
          <ManualScaleRow key={s.id} scale={s} />
        ))}
        {/* Clinical notes */}
        <div
          className="rounded-xl px-5 py-4"
          style={{ border: `1px solid ${C.border}`, backgroundColor: C.bg }}
        >
          <label className="text-sm font-semibold block mb-2" style={{ color: C.text }}>
            Clinical Notes
          </label>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Record any additional clinical observations, patient-reported symptoms, or contextual factors relevant to this assessment…"
            className="w-full text-sm rounded-xl px-4 py-3 outline-none resize-none transition-all"
            style={{
              border: `1.5px solid ${notes ? C.blue : C.border}`,
              backgroundColor: C.surface,
              color: C.text,
            }}
          />
        </div>
      </div>
    </ModuleCard>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ReportPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { metrics, patientName } = useAssessment();

  return (
    <div
      className="app-shell min-h-screen"
      style={{ backgroundColor: C.bg, color: C.text }}
    >
      {/* Navbar */}
      <nav
        className="sticky top-0 z-30 flex items-center justify-between px-6 py-3"
        style={{
          backgroundColor: C.surface,
          borderBottom: `1px solid ${C.border}`,
          boxShadow: "var(--app-shadow)",
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/upload")}
            className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-70"
            style={{ color: C.text2 }}
          >
            <ArrowLeft size={15} />
            Upload
          </button>
          <div className="w-px h-4" style={{ backgroundColor: C.border }} />
          <span className="font-black tracking-widest text-base" style={{ color: C.teal }}>AXONAI</span>
          <span className="text-xs hidden sm:block" style={{ color: C.text3 }}>/ Functional Movement Assessment</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
            style={{
              border: `1px solid ${C.border}`,
              backgroundColor: C.surface,
              color: C.text2,
            }}
          >
            <Download size={13} />
            Export PDF
          </button>
          <div className="flex items-center gap-2 text-sm" style={{ color: C.text2 }}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ backgroundColor: C.tealDim }}
            >
              <User size={14} style={{ color: C.teal }} />
            </div>
            <span className="hidden sm:block text-xs">{user?.name}</span>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3"
            style={{ backgroundColor: C.tealDim, color: C.teal }}
          >
            <Activity size={11} />
            Step 2 of 3 — Assessment Report
          </div>
          <h1 className="text-2xl font-black mb-1" style={{ color: C.text }}>
            Functional Movement Assessment
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: C.text3 }}>
            <span className="flex items-center gap-1.5">
              <User size={11} />
              {patientName}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={11} />
              {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={11} />
              Session 3 of 8
            </span>
          </div>
        </motion.div>

        {/* 5 Modules */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <OverviewModule metrics={metrics} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }}>
          <AutoMetricsModule />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <GuidedVideoModule />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.20 }}>
          <AIModelModule />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <ManualInputModule />
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl p-6"
          style={{
            backgroundColor: C.surface,
            border: `1px solid ${C.border}`,
            boxShadow: "var(--app-shadow-md)",
          }}
        >
          <div>
            <h3 className="font-bold mb-1" style={{ color: C.text }}>
              Ready to generate the rehabilitation plan?
            </h3>
            <p className="text-sm" style={{ color: C.text2 }}>
              AxonAI will use this assessment to generate a personalised programme for {patientName}.
            </p>
          </div>
          <button
            onClick={() => navigate("/rehab-plan")}
            className="flex-shrink-0 flex items-center gap-2 font-bold px-6 py-3 rounded-xl transition-all hover:opacity-90 text-sm whitespace-nowrap text-white"
            style={{ backgroundColor: C.teal }}
          >
            Generate Rehab Plan
            <ChevronDown size={16} className="-rotate-90" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
