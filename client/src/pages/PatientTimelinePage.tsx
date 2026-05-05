/**
 * PatientTimelinePage — AxonAI
 * Longitudinal view of a patient's full rehabilitation journey:
 * assessments, agent actions, plan adaptations, check-ins, escalations.
 * Design: Clean light app-shell, timeline-first layout.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  ArrowLeft, Brain, CheckCircle2, AlertTriangle, Calendar, FileText,
  TrendingUp, TrendingDown, Activity, Zap, ChevronDown, ChevronRight,
  MessageSquare, Shield, Clock, BarChart2, Play, Check, X,
} from "lucide-react";

const C = {
  bg:       "#F7F8FA",
  surface:  "#FFFFFF",
  border:   "#E4E7ED",
  text:     "#1A1D23",
  text2:    "#5A6070",
  text3:    "#9AA0AE",
  teal:     "#00B89A",
  tealDim:  "rgba(0,184,154,0.10)",
  blue:     "#2563EB",
  blueDim:  "rgba(37,99,235,0.08)",
  purple:   "#7C3AED",
  red:      "#DC2626",
  redDim:   "rgba(220,38,38,0.08)",
  amber:    "#D97706",
  amberDim: "rgba(217,119,6,0.08)",
  green:    "#059669",
  greenDim: "rgba(5,150,105,0.08)",
};

// ─── Mock patient data ────────────────────────────────────────────────────────

const patient = {
  id: "p1",
  name: "James Thornton",
  age: 68,
  avatar: "JT",
  color: C.teal,
  diagnosis: "Post-stroke gait rehabilitation",
  strokeDate: "12 Jan 2025",
  admissionDate: "28 Jan 2025",
  week: 3,
  totalWeeks: 8,
  compliance: 87,
  gaitScore: 58,
  gaitDelta: +8,
  fallRisk: "Moderate",
  therapist: "Dr. Erisa",
  institution: "King's College Hospital NHS",
  goals: ["Independent community ambulation", "Return to daily activities", "Fall risk reduction"],
};

const gaitTrend = [
  { label: "Wk 1 A1", score: 42, target: 80, date: "3 Feb" },
  { label: "Wk 2 A2", score: 51, target: 80, date: "10 Feb" },
  { label: "Wk 3 A3", score: 58, target: 80, date: "17 Feb" },
];

const radarCurrent = [
  { metric: "Gait Speed",   current: 62, reference: 100 },
  { metric: "Symmetry",     current: 71, reference: 100 },
  { metric: "Balance",      current: 55, reference: 100 },
  { metric: "Cadence",      current: 74, reference: 100 },
  { metric: "Stride",       current: 58, reference: 100 },
  { metric: "Ankle ROM",    current: 48, reference: 100 },
];

// Timeline events — chronological, newest first
const timelineEvents = [
  {
    id: "e1",
    date: "Today · 9:15am",
    type: "session",
    icon: CheckCircle2,
    iconColor: C.green,
    iconBg: C.greenDim,
    title: "Session completed — Hip & Pelvic",
    detail: "Sit-to-Stand 3×10, Seated Knee Raise 2×20, Pelvic Tilts 3×15. Duration: 28 min. Patient reported RPE 2/10.",
    agent: null,
    expandable: false,
  },
  {
    id: "e2",
    date: "Today · 8:00am",
    type: "agent_proposal",
    icon: Brain,
    iconColor: C.teal,
    iconBg: C.tealDim,
    title: "Agent proposed: Advance to Week 4 protocol",
    detail: "Based on 5 consecutive sessions at RPE ≤ 2/10 and Gait Score +8 pts, agent recommended increasing Seated Knee Raise to 3×20 and adding Standing Hip Abduction 2×15.",
    agent: { status: "approved", by: "Dr. Erisa", time: "8:45am" },
    expandable: true,
    reasoning: "Patient has consistently completed all prescribed sets at very low perceived exertion. Gait Score trajectory (+8 pts in 2 weeks) is above the expected 5 pts/2-week threshold for this protocol. Confidence: 94%.",
  },
  {
    id: "e3",
    date: "17 Feb · 2:30pm",
    type: "assessment",
    icon: BarChart2,
    iconColor: C.blue,
    iconBg: C.blueDim,
    title: "Assessment 3 — Gait Score 58/100 (+8 pts)",
    detail: "Full kinematic assessment completed. Gait speed 0.82 m/s (↑0.09), step symmetry 71% (↑6%), ankle dorsiflexion 12° (↑3°). Fall risk remains Moderate.",
    agent: null,
    expandable: true,
    metrics: { gaitScore: 58, symmetry: 71, gaitSpeed: 0.82, fallRisk: "Moderate" },
  },
  {
    id: "e4",
    date: "15 Feb",
    type: "missed",
    icon: AlertTriangle,
    iconColor: C.amber,
    iconBg: C.amberDim,
    title: "Session missed — Balance Training",
    detail: "Patient reported fatigue via app check-in. Agent logged the miss and sent a supportive message. No plan adjustment triggered (single miss within tolerance).",
    agent: { status: "auto", by: "Agent", time: "6:00pm" },
    expandable: false,
  },
  {
    id: "e5",
    date: "14 Feb",
    type: "checkin",
    icon: MessageSquare,
    iconColor: C.purple,
    iconBg: "rgba(124,58,237,0.08)",
    title: "Daily check-in — Pain VAS 3/10, Fatigue: Mild",
    detail: "Patient reported: Pain 3/10 (stable), Fatigue: mild, Mood: good. No concerns flagged. Agent noted stable pain trend over 5 days.",
    agent: null,
    expandable: false,
  },
  {
    id: "e6",
    date: "10 Feb · 3:00pm",
    type: "assessment",
    icon: BarChart2,
    iconColor: C.blue,
    iconBg: C.blueDim,
    title: "Assessment 2 — Gait Score 51/100 (+9 pts)",
    detail: "Significant improvement in gait speed (0.73 m/s) and step symmetry (65%). Hip flexion ROM improved to 28°. Agent generated updated rehab plan.",
    agent: { status: "approved", by: "Dr. Erisa", time: "4:15pm" },
    expandable: true,
    metrics: { gaitScore: 51, symmetry: 65, gaitSpeed: 0.73, fallRisk: "Moderate-High" },
  },
  {
    id: "e7",
    date: "3 Feb · 10:00am",
    type: "assessment",
    icon: BarChart2,
    iconColor: C.blue,
    iconBg: C.blueDim,
    title: "Assessment 1 — Baseline Gait Score 42/100",
    detail: "Initial assessment. Gait speed 0.64 m/s, step symmetry 58%, significant right-side compensatory lean. Fall risk: High. Agent generated initial 8-week rehabilitation plan.",
    agent: { status: "approved", by: "Dr. Erisa", time: "11:30am" },
    expandable: true,
    metrics: { gaitScore: 42, symmetry: 58, gaitSpeed: 0.64, fallRisk: "High" },
  },
  {
    id: "e8",
    date: "28 Jan",
    type: "onboarded",
    icon: Zap,
    iconColor: C.teal,
    iconBg: C.tealDim,
    title: "Patient onboarded — rehabilitation programme initiated",
    detail: "James Thornton enrolled in AxonAI-monitored stroke rehabilitation. Diagnosis: post-stroke gait impairment (16 days post-event). Programme: 8-week structured gait and balance rehabilitation.",
    agent: null,
    expandable: false,
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function TimelineEvent({ event, index }: { event: typeof timelineEvents[0]; index: number }) {
  const [expanded, setExpanded] = useState(index === 0 || event.type === "assessment");
  const Icon = event.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex gap-4"
    >
      {/* Timeline spine */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center z-10"
          style={{ backgroundColor: event.iconBg, border: `2px solid ${event.iconColor}30` }}
        >
          <Icon size={15} style={{ color: event.iconColor }} />
        </div>
        {index < timelineEvents.length - 1 && (
          <div className="w-0.5 flex-1 mt-1" style={{ backgroundColor: C.border, minHeight: 24 }} />
        )}
      </div>

      {/* Event card */}
      <div
        className="flex-1 rounded-2xl mb-3 overflow-hidden"
        style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
      >
        <div
          className="flex items-start justify-between px-4 py-3 cursor-pointer"
          onClick={() => event.expandable && setExpanded(v => !v)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="text-xs" style={{ color: C.text3 }}>{event.date}</span>
              {event.agent && (
                <span
                  className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: event.agent.status === "approved" ? C.greenDim : C.tealDim,
                    color: event.agent.status === "approved" ? C.green : C.teal,
                  }}
                >
                  {event.agent.status === "approved" ? `✓ Approved by ${event.agent.by}` : `⚡ Agent auto-action`}
                </span>
              )}
            </div>
            <p className="text-sm font-semibold" style={{ color: C.text }}>{event.title}</p>
          </div>
          {event.expandable && (
            <ChevronDown
              size={14}
              style={{
                color: C.text3,
                flexShrink: 0,
                marginLeft: 8,
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            />
          )}
        </div>

        <AnimatePresence>
          {(expanded || !event.expandable) && (
            <motion.div
              initial={event.expandable ? { opacity: 0, height: 0 } : false}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4">
                <p className="text-xs leading-relaxed mb-3" style={{ color: C.text2 }}>{event.detail}</p>

                {/* Assessment metrics snapshot */}
                {event.metrics && (
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {[
                      { label: "Gait Score", value: `${event.metrics.gaitScore}/100`, color: C.blue },
                      { label: "Symmetry",   value: `${event.metrics.symmetry}%`,     color: C.teal },
                      { label: "Gait Speed", value: `${event.metrics.gaitSpeed} m/s`, color: C.purple },
                      { label: "Fall Risk",  value: event.metrics.fallRisk,           color: event.metrics.fallRisk === "High" ? C.red : event.metrics.fallRisk === "Moderate-High" ? C.amber : C.amber },
                    ].map(m => (
                      <div
                        key={m.label}
                        className="rounded-xl p-2.5 text-center"
                        style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}
                      >
                        <div className="text-sm font-bold" style={{ color: m.color }}>{m.value}</div>
                        <div className="text-xs" style={{ color: C.text3 }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Agent reasoning */}
                {event.reasoning && (
                  <div
                    className="rounded-xl p-3 text-xs leading-relaxed"
                    style={{ backgroundColor: C.tealDim, border: `1px solid ${C.teal}22` }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Brain size={10} style={{ color: C.teal }} />
                      <span className="font-semibold" style={{ color: C.teal }}>Agent Reasoning</span>
                    </div>
                    <span style={{ color: C.text2 }}>{event.reasoning}</span>
                  </div>
                )}

                {/* View full report link for assessments */}
                {event.type === "assessment" && (
                  <button
                    className="mt-2 flex items-center gap-1 text-xs font-semibold"
                    style={{ color: C.blue }}
                  >
                    <FileText size={11} />
                    View full assessment report
                    <ChevronRight size={11} />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PatientTimelinePage() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"timeline" | "metrics" | "plan">("timeline");

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg, fontFamily: "'Inter', sans-serif" }}>

      {/* Top nav */}
      <header
        className="flex items-center gap-4 px-6 py-3.5 border-b sticky top-0 z-20"
        style={{ backgroundColor: C.surface, borderColor: C.border }}
      >
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 text-sm font-medium hover:opacity-70 transition-opacity"
          style={{ color: C.text2 }}
        >
          <ArrowLeft size={15} />
          Command Centre
        </button>
        <div className="w-px h-4" style={{ backgroundColor: C.border }} />
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ backgroundColor: patient.color }}
          >
            {patient.avatar}
          </div>
          <div>
            <span className="text-sm font-bold" style={{ color: C.text }}>{patient.name}</span>
            <span className="text-xs ml-2" style={{ color: C.text3 }}>Age {patient.age} · {patient.diagnosis}</span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {[
            { label: "Timeline", tab: "timeline" },
            { label: "Metrics", tab: "metrics" },
            { label: "Rehab Plan", tab: "plan" },
          ].map(t => (
            <button
              key={t.tab}
              onClick={() => setActiveTab(t.tab as any)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={{
                backgroundColor: activeTab === t.tab ? C.teal : "transparent",
                color: activeTab === t.tab ? "#fff" : C.text2,
              }}
            >
              {t.label}
            </button>
          ))}
          <button
            onClick={() => navigate("/report")}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg ml-2 transition-all hover:opacity-80"
            style={{ backgroundColor: C.blue, color: "#fff" }}
          >
            <BarChart2 size={11} />
            New Assessment
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-6">
        <AnimatePresence mode="wait">

          {/* ── TIMELINE TAB ── */}
          {activeTab === "timeline" && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-3 gap-6"
            >
              {/* Timeline (2/3) */}
              <div className="col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold" style={{ color: C.text }}>Patient Journey</h2>
                  <span className="text-xs" style={{ color: C.text3 }}>Week {patient.week} of {patient.totalWeeks} · Started {patient.admissionDate}</span>
                </div>
                <div>
                  {timelineEvents.map((event, i) => (
                    <TimelineEvent key={event.id} event={event} index={i} />
                  ))}
                </div>
              </div>

              {/* Sidebar (1/3) */}
              <div className="space-y-4">
                {/* Patient summary */}
                <div
                  className="rounded-2xl p-4"
                  style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
                >
                  <h3 className="text-xs font-bold mb-3 uppercase tracking-wide" style={{ color: C.text3 }}>Patient Summary</h3>
                  <div className="space-y-2">
                    {[
                      { label: "Stroke date",   value: patient.strokeDate },
                      { label: "Enrolled",       value: patient.admissionDate },
                      { label: "Programme",      value: `${patient.totalWeeks}-week gait rehab` },
                      { label: "Compliance",     value: `${patient.compliance}%` },
                      { label: "Fall risk",      value: patient.fallRisk },
                      { label: "Therapist",      value: patient.therapist },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between text-xs">
                        <span style={{ color: C.text3 }}>{row.label}</span>
                        <span className="font-semibold" style={{ color: C.text }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Goals */}
                <div
                  className="rounded-2xl p-4"
                  style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
                >
                  <h3 className="text-xs font-bold mb-3 uppercase tracking-wide" style={{ color: C.text3 }}>Rehabilitation Goals</h3>
                  <div className="space-y-2">
                    {patient.goals.map((g, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: C.tealDim }}>
                          <span className="text-xs font-bold" style={{ color: C.teal }}>{i + 1}</span>
                        </div>
                        <span className="text-xs leading-relaxed" style={{ color: C.text2 }}>{g}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Current gait score */}
                <div
                  className="rounded-2xl p-4"
                  style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
                >
                  <h3 className="text-xs font-bold mb-3 uppercase tracking-wide" style={{ color: C.text3 }}>Gait Score Trend</h3>
                  <div className="flex items-end gap-1 mb-2">
                    <span className="text-3xl font-bold" style={{ color: C.text }}>{patient.gaitScore}</span>
                    <span className="text-sm mb-1" style={{ color: C.text3 }}>/100</span>
                    <span className="text-sm font-semibold mb-1 ml-1" style={{ color: C.green }}>+{patient.gaitDelta}</span>
                  </div>
                  <ResponsiveContainer width="100%" height={80}>
                    <LineChart data={gaitTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                      <XAxis dataKey="label" tick={{ fontSize: 9, fill: C.text3 }} />
                      <YAxis domain={[30, 90]} tick={{ fontSize: 9, fill: C.text3 }} width={24} />
                      <Tooltip
                        contentStyle={{ fontSize: 11, border: `1px solid ${C.border}`, borderRadius: 8 }}
                        formatter={(v: any) => [v, "Score"]}
                      />
                      <ReferenceLine y={80} stroke={C.teal} strokeDasharray="4 2" strokeWidth={1} />
                      <Line type="monotone" dataKey="score" stroke={C.blue} strokeWidth={2} dot={{ r: 3, fill: C.blue }} />
                    </LineChart>
                  </ResponsiveContainer>
                  <p className="text-xs mt-1" style={{ color: C.text3 }}>Dashed line = target (80/100)</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── METRICS TAB ── */}
          {activeTab === "metrics" && (
            <motion.div
              key="metrics"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="grid grid-cols-2 gap-6">
                {/* Radar */}
                <div
                  className="rounded-2xl p-5"
                  style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
                >
                  <h3 className="text-sm font-bold mb-1" style={{ color: C.text }}>Movement Profile — Assessment 3</h3>
                  <p className="text-xs mb-4" style={{ color: C.text3 }}>Patient vs healthy reference (% of normal)</p>
                  <ResponsiveContainer width="100%" height={260}>
                    <RadarChart data={radarCurrent}>
                      <PolarGrid stroke={C.border} />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: C.text3 }} />
                      <Radar name="Reference" dataKey="reference" stroke={C.border} fill={C.border} fillOpacity={0.2} />
                      <Radar name="Patient" dataKey="current" stroke={C.teal} fill={C.teal} fillOpacity={0.25} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Gait score over time */}
                <div
                  className="rounded-2xl p-5"
                  style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
                >
                  <h3 className="text-sm font-bold mb-1" style={{ color: C.text }}>Gait Score Progression</h3>
                  <p className="text-xs mb-4" style={{ color: C.text3 }}>Across all assessments · Target: 80/100</p>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={gaitTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.text3 }} />
                      <YAxis domain={[30, 90]} tick={{ fontSize: 10, fill: C.text3 }} width={28} />
                      <Tooltip contentStyle={{ fontSize: 11, border: `1px solid ${C.border}`, borderRadius: 8 }} />
                      <ReferenceLine y={80} stroke={C.teal} strokeDasharray="4 2" strokeWidth={1.5} label={{ value: "Target", fill: C.teal, fontSize: 10 }} />
                      <Line type="monotone" dataKey="score" stroke={C.blue} strokeWidth={2.5} dot={{ r: 4, fill: C.blue }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Key metrics table */}
                <div
                  className="col-span-2 rounded-2xl overflow-hidden"
                  style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
                >
                  <div className="px-5 py-3 border-b" style={{ borderColor: C.border }}>
                    <h3 className="text-sm font-bold" style={{ color: C.text }}>Metric Comparison Across Assessments</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ backgroundColor: C.bg }}>
                          {["Metric", "Baseline (A1)", "Assessment 2", "Assessment 3 (Latest)", "Change", "Normal Range"].map(h => (
                            <th key={h} className="px-4 py-2.5 text-left font-semibold" style={{ color: C.text3 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { metric: "Gait Speed (m/s)",     a1: "0.64", a2: "0.73", a3: "0.82", delta: "+0.18", normal: "1.2–1.4", up: true },
                          { metric: "Step Symmetry (%)",    a1: "58",   a2: "65",   a3: "71",   delta: "+13%",  normal: "95–100%", up: true },
                          { metric: "Cadence (steps/min)",  a1: "82",   a2: "88",   a3: "94",   delta: "+12",   normal: "100–120", up: true },
                          { metric: "Stride Length (cm)",   a1: "92",   a2: "101",  a3: "108",  delta: "+16",   normal: "140–160", up: true },
                          { metric: "Ankle Dorsiflexion (°)",a1: "9",  a2: "11",   a3: "12",   delta: "+3°",   normal: "15–20°",  up: true },
                          { metric: "Hip Flexion ROM (°)",  a1: "22",   a2: "28",   a3: "31",   delta: "+9°",   normal: "35–45°",  up: true },
                          { metric: "Pain VAS (0–10)",      a1: "5",    a2: "4",    a3: "3",    delta: "-2",    normal: "0–2",     up: false },
                        ].map((row, i) => (
                          <tr key={row.metric} style={{ backgroundColor: i % 2 === 0 ? C.surface : "#FAFBFC", borderTop: `1px solid ${C.border}` }}>
                            <td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{row.metric}</td>
                            <td className="px-4 py-2.5" style={{ color: C.text2 }}>{row.a1}</td>
                            <td className="px-4 py-2.5" style={{ color: C.text2 }}>{row.a2}</td>
                            <td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{row.a3}</td>
                            <td className="px-4 py-2.5">
                              <span className="font-semibold" style={{ color: row.up ? C.green : C.red }}>
                                {row.delta}
                              </span>
                            </td>
                            <td className="px-4 py-2.5" style={{ color: C.text3 }}>{row.normal}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── PLAN TAB ── */}
          {activeTab === "plan" && (
            <motion.div
              key="plan"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div
                className="rounded-2xl p-5"
                style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: C.text }}>Current Rehabilitation Plan</h3>
                    <p className="text-xs mt-0.5" style={{ color: C.text3 }}>Week 3 of 8 · AI-generated and therapist-approved</p>
                  </div>
                  <button
                    onClick={() => navigate("/rehab-plan")}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                    style={{ backgroundColor: C.teal, color: "#fff" }}
                  >
                    Edit Plan
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                    <div
                      key={day}
                      className="rounded-xl p-3 text-center"
                      style={{ backgroundColor: i < 5 ? C.tealDim : C.bg, border: `1px solid ${i < 5 ? C.teal + "30" : C.border}` }}
                    >
                      <div className="text-xs font-bold mb-2" style={{ color: i < 5 ? C.teal : C.text3 }}>{day}</div>
                      {i < 5 ? (
                        <div className="text-xs" style={{ color: C.text2 }}>
                          {["Hip & Pelvic", "Balance", "Gait", "Hip & Pelvic", "Full Circuit"][i]}
                        </div>
                      ) : (
                        <div className="text-xs" style={{ color: C.text3 }}>Rest</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Agent plan history */}
              <div
                className="rounded-2xl p-5"
                style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
              >
                <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>Plan Adaptation History</h3>
                <div className="space-y-3">
                  {[
                    { date: "Today", version: "v3 (current)", change: "Week 4 protocol — increased Seated Knee Raise to 3×20, added Standing Hip Abduction 2×15", status: "approved" },
                    { date: "10 Feb", version: "v2", change: "Week 2→3 progression — added Pelvic Tilts 3×15, increased Hip Flexor Stretch to 3×30s", status: "approved" },
                    { date: "3 Feb", version: "v1 (baseline)", change: "Initial 8-week plan generated from Assessment 1 baseline metrics", status: "approved" },
                  ].map((v, i) => (
                    <div key={i} className="flex items-start gap-3 py-2.5 border-b last:border-0" style={{ borderColor: C.border }}>
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: C.greenDim }}
                      >
                        <Check size={9} style={{ color: C.green }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold" style={{ color: C.text }}>{v.version}</span>
                          <span className="text-xs" style={{ color: C.text3 }}>{v.date}</span>
                        </div>
                        <p className="text-xs" style={{ color: C.text2 }}>{v.change}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
