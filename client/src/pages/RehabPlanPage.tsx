/**
 * RehabPlanPage — AxonAI Personalised Rehabilitation Plan
 * Design: Clean light app-shell (#F7F8FA bg, white cards, teal/blue accents)
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useAssessment } from "@/contexts/AssessmentContext";
import {
  ArrowLeft, ChevronDown, ChevronRight, Download,
  Target, Dumbbell, Calendar, Apple, User, Clock,
  CheckCircle2, AlertCircle, Flame, Heart, Zap,
  LayoutGrid, Users,
} from "lucide-react";

const C = {
  bg:      "#F7F8FA",
  surface: "#FFFFFF",
  border:  "#E4E7ED",
  text:    "#1A1D23",
  text2:   "#5A6070",
  text3:   "#9AA0AE",
  teal:    "#00B89A",
  tealDim: "rgba(0,184,154,0.10)",
  blue:    "#2563EB",
  purple:  "#7C3AED",
  red:     "#DC2626",
  amber:   "#D97706",
  green:   "#059669",
};

// ─── Module data ──────────────────────────────────────────────────────────────

const focusAreas = [
  {
    id: "hip",
    title: "Left Hip Flexor Strengthening",
    priority: "Critical",
    priorityColor: C.red,
    rationale: "Hip flexion ROM limited to 15° (normative: 30°). Primary driver of reduced stride length and gait asymmetry.",
    exercises: ["Hip flexor stretch — 3×30s hold", "Supine hip flexion — 3×15 reps", "Seated knee raise — 2×20 reps"],
    frequency: "Daily",
    duration: "20 min",
  },
  {
    id: "pelvic",
    title: "Pelvic Stability & Core Control",
    priority: "High",
    priorityColor: C.amber,
    rationale: "Compensatory pelvic tilt observed during terminal stance. Core weakness contributing to lateral trunk shift.",
    exercises: ["Pelvic tilts — 3×15 reps", "Dead bug — 3×10 reps each side", "Side-lying hip abduction — 3×15 reps"],
    frequency: "5×/week",
    duration: "15 min",
  },
  {
    id: "ankle",
    title: "Ankle Dorsiflexion Mobilisation",
    priority: "High",
    priorityColor: C.amber,
    rationale: "Ankle dorsiflexion deficit of 20° increases toe-drag risk and reduces push-off power during pre-swing.",
    exercises: ["Calf stretch against wall — 3×30s", "Ankle alphabet — 2 sets each foot", "Resistance band dorsiflexion — 3×20 reps"],
    frequency: "Daily",
    duration: "10 min",
  },
  {
    id: "balance",
    title: "Balance & Proprioception Training",
    priority: "Moderate",
    priorityColor: C.purple,
    rationale: "Single-leg stance time reduced to 4.2s (normative: >10s). Centre of mass sway 42% above threshold.",
    exercises: ["Single-leg stance — 3×30s each", "Tandem walking — 2×10m", "Balance board standing — 3×45s"],
    frequency: "4×/week",
    duration: "15 min",
  },
];

const trainingPlan = [
  {
    week: "Weeks 1–2",
    phase: "Foundation",
    color: C.teal,
    goal: "Restore baseline ROM and activate inhibited muscle groups",
    sessions: [
      { day: "Mon", focus: "Hip & Pelvic", duration: "35 min", intensity: "Low" },
      { day: "Wed", focus: "Ankle & Balance", duration: "30 min", intensity: "Low" },
      { day: "Fri", focus: "Full Lower Limb", duration: "40 min", intensity: "Low–Mod" },
    ],
    homeExercises: "Daily: hip flexor stretch, ankle mobilisation (15 min)",
  },
  {
    week: "Weeks 3–4",
    phase: "Strengthening",
    color: C.purple,
    goal: "Progressive loading of hip flexors and ankle dorsiflexors",
    sessions: [
      { day: "Mon", focus: "Hip Strength", duration: "40 min", intensity: "Moderate" },
      { day: "Tue", focus: "Balance Training", duration: "30 min", intensity: "Moderate" },
      { day: "Thu", focus: "Gait Retraining", duration: "45 min", intensity: "Moderate" },
      { day: "Sat", focus: "Functional Movement", duration: "35 min", intensity: "Moderate" },
    ],
    homeExercises: "Daily: resistance band exercises, balance board (20 min)",
  },
  {
    week: "Weeks 5–8",
    phase: "Functional Integration",
    color: C.blue,
    goal: "Integrate gains into normalised gait pattern and community mobility",
    sessions: [
      { day: "Mon", focus: "Gait & Speed", duration: "45 min", intensity: "Mod–High" },
      { day: "Wed", focus: "Endurance Walk", duration: "50 min", intensity: "Moderate" },
      { day: "Fri", focus: "Functional Tasks", duration: "45 min", intensity: "Mod–High" },
      { day: "Sun", focus: "Active Recovery", duration: "30 min", intensity: "Low" },
    ],
    homeExercises: "Daily: 20-min community walk, home programme (25 min)",
  },
];

const weeklySchedule = [
  { day: "Monday",    sessions: ["Hip Flexor Strengthening (30 min)", "Pelvic Stability (15 min)"], homeTask: "Ankle stretch × 3 sets" },
  { day: "Tuesday",   sessions: ["Balance Training (30 min)"],                                       homeTask: "Hip flexor stretch × 3 sets" },
  { day: "Wednesday", sessions: ["Gait Retraining (45 min)", "Ankle Mobilisation (15 min)"],         homeTask: "Resistance band exercises" },
  { day: "Thursday",  sessions: ["Rest / Light Walk (20 min)"],                                      homeTask: "Balance board × 3 sets" },
  { day: "Friday",    sessions: ["Full Lower Limb Circuit (40 min)"],                                homeTask: "Ankle alphabet × 2 sets" },
  { day: "Saturday",  sessions: ["Functional Movement (35 min)"],                                    homeTask: "Community walk 15 min" },
  { day: "Sunday",    sessions: ["Active Recovery / Stretching (30 min)"],                           homeTask: "Relaxation & light stretching" },
];

const nutritionAdvice = [
  {
    category: "Protein Intake",
    icon: Dumbbell,
    color: C.teal,
    recommendation: "1.4–1.6g protein per kg body weight daily to support muscle repair and hypertrophy during rehabilitation.",
    foods: ["Chicken breast, salmon, eggs", "Greek yoghurt, cottage cheese", "Legumes, tofu, quinoa"],
    timing: "Distribute across 3–4 meals; 20–30g within 30 min post-session",
  },
  {
    category: "Anti-Inflammatory Diet",
    icon: Heart,
    color: "#EC4899",
    recommendation: "Reduce systemic inflammation to support neural recovery and reduce joint pain during exercise.",
    foods: ["Oily fish (omega-3)", "Berries, leafy greens", "Turmeric, ginger, olive oil"],
    timing: "Incorporate at every meal; avoid processed foods and refined sugars",
  },
  {
    category: "Bone & Joint Health",
    icon: Zap,
    color: C.amber,
    recommendation: "Adequate calcium and vitamin D to support skeletal integrity, particularly important post-stroke.",
    foods: ["Dairy or fortified plant milk", "Oily fish, egg yolks", "Leafy greens (kale, broccoli)"],
    timing: "Vitamin D supplement 1000–2000 IU/day (consult GP); calcium with meals",
  },
  {
    category: "Hydration",
    icon: Flame,
    color: C.blue,
    recommendation: "Adequate hydration supports muscle function, cognitive performance, and exercise tolerance.",
    foods: ["Water (primary)", "Herbal teas, diluted juice", "Electrolyte drinks post-exercise"],
    timing: "2–2.5L daily; 500ml in the 2 hours before each session",
  },
];

// ─── Expandable module ────────────────────────────────────────────────────────

function Module({
  title, icon: Icon, color, defaultOpen = false, children, badge,
}: {
  title: string; icon: React.ElementType; color: string;
  defaultOpen?: boolean; children: React.ReactNode; badge?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{
        backgroundColor: C.surface,
        border: `1px solid ${open ? color + "50" : C.border}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: color + "15" }}
          >
            <Icon size={17} style={{ color }} />
          </div>
          <div>
            <span className="font-semibold text-sm" style={{ color: C.text }}>{title}</span>
            {badge && (
              <span
                className="ml-2 text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: color + "15", color }}
              >
                {badge}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: C.text3 }}>{open ? "Collapse" : "Expand"}</span>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={16} style={{ color: C.text3 }} />
          </motion.div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div
              className="px-5 pb-5"
              style={{ borderTop: `1px solid ${C.border}` }}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RehabPlanPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { patientName, metrics } = useAssessment();

  return (
    <div className="app-shell min-h-screen" style={{ backgroundColor: C.bg, color: C.text }}>
      {/* Navbar */}
      <nav
        className="sticky top-0 z-30 flex items-center justify-between px-6 py-3"
        style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/report")}
            className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-60"
            style={{ color: C.text2 }}
          >
            <ArrowLeft size={15} />
            Assessment Report
          </button>
          <div className="w-px h-4" style={{ backgroundColor: C.border }} />
          <span className="font-black tracking-widest text-base" style={{ color: C.teal }}>AXONAI</span>
          <span className="text-xs hidden sm:block" style={{ color: C.text3 }}>/ Rehab Plan</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
            style={{ border: `1px solid ${C.border}`, backgroundColor: C.surface, color: C.text2 }}
          >
            <Download size={13} />
            Export Plan
          </button>
          <div className="flex items-center gap-2 text-sm" style={{ color: C.text2 }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: C.tealDim }}>
              <User size={14} style={{ color: C.teal }} />
            </div>
            <span className="hidden sm:block text-xs">{user?.name}</span>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4"
            style={{ backgroundColor: "rgba(124,58,237,0.10)", color: C.purple }}
          >
            <LayoutGrid size={12} />
            Step 3 of 3 — Personalised Rehab Plan
          </div>
          <h1 className="text-3xl font-black mb-2" style={{ color: C.text }}>
            AI-Driven Personalised Rehabilitation Plan
          </h1>
          <p className="text-sm max-w-2xl" style={{ color: C.text2 }}>
            Kinematic deficits have been analysed using deep learning algorithms, generating a complete home rehabilitation prescription including focus areas, exercise library, and nutrition guidance.
          </p>
        </motion.div>

        {/* Patient summary banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl p-5 mb-6"
          style={{
            backgroundColor: C.surface,
            border: `1px solid ${C.border}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
          }}
        >
          <div className="flex flex-wrap items-start gap-6">
            {[
              { label: "Patient",           value: patientName,                   color: C.text },
              { label: "Diagnosis",         value: "Post-stroke gait rehab",      color: C.text },
              { label: "Gait Score",        value: `${metrics.gaitScore}/100`,    color: C.teal },
              { label: "Walking Speed",     value: `${metrics.speed} m/s`,        color: C.amber },
              { label: "Programme",         value: "8 weeks",                     color: C.purple },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs mb-0.5" style={{ color: C.text3 }}>{item.label}</p>
                <p className="font-semibold text-sm" style={{ color: item.color }}>{item.value}</p>
              </div>
            ))}
          </div>
          <p
            className="text-xs mt-4 pt-3 leading-relaxed"
            style={{ color: C.text3, borderTop: `1px solid ${C.border}` }}
          >
            Based on current gait data, the most prominent abnormal feature is reduced walking speed (0.65 m/s), indicating impaired gait efficiency and stability. Significant compensatory strategies are observed. The following progressive plan focuses on restoring gait rhythm, lower limb control, balance, and walking ability.
          </p>
        </motion.div>

        {/* Expandable modules */}
        <div className="space-y-3">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Module title="Key Focus Areas" icon={Target} color={C.red} defaultOpen badge="4 areas identified">
              <div className="pt-4 space-y-3">
                {focusAreas.map((area) => (
                  <div
                    key={area.id}
                    className="rounded-xl p-4"
                    style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-semibold" style={{ color: C.text }}>{area.title}</h4>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: area.priorityColor + "15", color: area.priorityColor }}
                        >
                          {area.priority}
                        </span>
                        <span className="text-xs flex items-center gap-1" style={{ color: C.text3 }}>
                          <Clock size={10} />{area.duration}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs mb-2 leading-relaxed" style={{ color: C.text2 }}>{area.rationale}</p>
                    <div className="space-y-1">
                      {area.exercises.map((ex) => (
                        <div key={ex} className="flex items-center gap-2 text-xs" style={{ color: C.text2 }}>
                          <CheckCircle2 size={11} style={{ color: C.teal, flexShrink: 0 }} />
                          {ex}
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-xs" style={{ color: C.text3 }}>
                      Frequency: <span style={{ color: C.text2, fontWeight: 600 }}>{area.frequency}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Module>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Module title="Progressive Training Plan" icon={Dumbbell} color={C.teal} badge="3 phases · 8 weeks">
              <div className="pt-4 space-y-4">
                {trainingPlan.map((phase) => (
                  <div
                    key={phase.week}
                    className="rounded-xl overflow-hidden"
                    style={{ border: `1px solid ${C.border}` }}
                  >
                    <div
                      className="px-4 py-3 flex items-center justify-between"
                      style={{ backgroundColor: phase.color + "10", borderBottom: `1px solid ${phase.color}25` }}
                    >
                      <div>
                        <span className="text-sm font-bold" style={{ color: C.text }}>{phase.week}</span>
                        <span
                          className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: phase.color + "20", color: phase.color }}
                        >
                          {phase.phase}
                        </span>
                      </div>
                    </div>
                    <div className="p-4" style={{ backgroundColor: C.surface }}>
                      <p className="text-xs mb-3" style={{ color: C.text2 }}>
                        <span style={{ color: C.text, fontWeight: 600 }}>Goal: </span>{phase.goal}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                        {phase.sessions.map((s) => (
                          <div
                            key={s.day}
                            className="flex items-center gap-2 rounded-lg px-3 py-2"
                            style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}
                          >
                            <span className="text-xs font-bold w-8 flex-shrink-0" style={{ color: phase.color }}>{s.day}</span>
                            <span className="text-xs flex-1" style={{ color: C.text2 }}>{s.focus}</span>
                            <span className="text-xs" style={{ color: C.text3 }}>{s.duration}</span>
                            <span
                              className="text-xs px-1.5 py-0.5 rounded font-medium"
                              style={{
                                backgroundColor: s.intensity.includes("High") ? "#FEF2F2" : s.intensity.includes("Mod") ? "#FFFBEB" : "#F0FDF4",
                                color: s.intensity.includes("High") ? C.red : s.intensity.includes("Mod") ? C.amber : C.green,
                              }}
                            >
                              {s.intensity}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div
                        className="flex items-start gap-2 text-xs rounded-lg px-3 py-2"
                        style={{ backgroundColor: C.tealDim, color: C.teal }}
                      >
                        <AlertCircle size={11} style={{ flexShrink: 0, marginTop: 1 }} />
                        <span><span className="font-semibold">Home programme: </span>{phase.homeExercises}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Module>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Module title="Weekly Schedule" icon={Calendar} color={C.purple} badge="Week 3 template">
              <div className="pt-4 space-y-2">
                {weeklySchedule.map((day, i) => (
                  <div
                    key={day.day}
                    className="flex items-start gap-4 p-3 rounded-xl"
                    style={{
                      backgroundColor: i % 2 === 0 ? C.bg : C.surface,
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    <div className="w-20 flex-shrink-0">
                      <span className="text-xs font-bold" style={{ color: i % 2 === 0 ? C.purple : C.text3 }}>{day.day}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      {day.sessions.map((s) => (
                        <div key={s} className="flex items-center gap-1.5 text-xs mb-0.5" style={{ color: C.text2 }}>
                          <CheckCircle2 size={10} style={{ color: C.purple, flexShrink: 0 }} />
                          {s}
                        </div>
                      ))}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs" style={{ color: C.text3 }}>Home:</p>
                      <p className="text-xs" style={{ color: C.text2 }}>{day.homeTask}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Module>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Module title="Nutrition & Recovery Guidance" icon={Apple} color={C.green} badge="4 categories">
              <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {nutritionAdvice.map((item) => (
                  <div
                    key={item.category}
                    className="rounded-xl p-4"
                    style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: item.color + "15" }}
                      >
                        <item.icon size={15} style={{ color: item.color }} />
                      </div>
                      <span className="text-sm font-semibold" style={{ color: C.text }}>{item.category}</span>
                    </div>
                    <p className="text-xs mb-3 leading-relaxed" style={{ color: C.text2 }}>{item.recommendation}</p>
                    <div className="space-y-1 mb-3">
                      {item.foods.map((f) => (
                        <div key={f} className="flex items-center gap-1.5 text-xs" style={{ color: C.text2 }}>
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                          {f}
                        </div>
                      ))}
                    </div>
                    <div
                      className="text-xs rounded-lg px-2.5 py-1.5"
                      style={{ backgroundColor: item.color + "10", color: C.text2 }}
                    >
                      <span style={{ color: item.color, fontWeight: 600 }}>Timing: </span>
                      {item.timing}
                    </div>
                  </div>
                ))}
              </div>
            </Module>
          </motion.div>
        </div>

        {/* Disclaimer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xs text-center mt-6 px-4"
          style={{ color: C.text3 }}
        >
          This plan is based solely on the provided gait metrics and serves as a rehabilitation reference only. It does not constitute a medical diagnosis. Always consult a qualified physiotherapist before commencing any rehabilitation programme.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl p-6"
          style={{
            backgroundColor: C.surface,
            border: `1px solid ${C.border}`,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        >
          <div>
            <h3 className="font-bold mb-1" style={{ color: C.text }}>Monitor patient progress in real time</h3>
            <p className="text-sm" style={{ color: C.text2 }}>
              Access the Therapist Workspace to track {patientName}'s compliance, adjust the plan, and communicate remotely.
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex-shrink-0 flex items-center gap-2 font-bold px-6 py-3 rounded-xl transition-all text-sm whitespace-nowrap text-white hover:opacity-90"
            style={{ backgroundColor: C.teal, boxShadow: `0 4px 16px ${C.teal}40` }}
          >
            <Users size={15} />
            Therapist Dashboard
            <ChevronRight size={16} />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
