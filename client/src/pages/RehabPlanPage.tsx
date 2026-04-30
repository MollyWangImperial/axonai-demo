/**
 * RehabPlanPage — AxonAI Personalised Rehabilitation Plan
 * Design: Dark navy, teal/violet accent, glassmorphism
 * Expandable modules: Key Focus Areas, Training Plan, Weekly Schedule, Nutrition
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useAssessment } from "@/contexts/AssessmentContext";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Download,
  Target,
  Dumbbell,
  Calendar,
  Apple,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Flame,
  Heart,
  Zap,
  LayoutGrid,
  Users,
} from "lucide-react";

// ─── Module data ──────────────────────────────────────────────────────────────

const focusAreas = [
  {
    id: "hip",
    title: "Left Hip Flexor Strengthening",
    priority: "Critical",
    priorityColor: "#ef4444",
    rationale: "Hip flexion ROM limited to 15° (normative: 30°). Primary driver of reduced stride length and gait asymmetry.",
    exercises: ["Hip flexor stretch — 3×30s hold", "Supine hip flexion — 3×15 reps", "Seated knee raise — 2×20 reps"],
    frequency: "Daily",
    duration: "20 min",
  },
  {
    id: "pelvic",
    title: "Pelvic Stability & Core Control",
    priority: "High",
    priorityColor: "#f59e0b",
    rationale: "Compensatory pelvic tilt observed during terminal stance. Core weakness contributing to lateral trunk shift.",
    exercises: ["Pelvic tilts — 3×15 reps", "Dead bug — 3×10 reps each side", "Side-lying hip abduction — 3×15 reps"],
    frequency: "5×/week",
    duration: "15 min",
  },
  {
    id: "ankle",
    title: "Ankle Dorsiflexion Mobilisation",
    priority: "High",
    priorityColor: "#f59e0b",
    rationale: "Ankle dorsiflexion deficit of 20° increases toe-drag risk and reduces push-off power during pre-swing.",
    exercises: ["Calf stretch against wall — 3×30s", "Ankle alphabet — 2 sets each foot", "Resistance band dorsiflexion — 3×20 reps"],
    frequency: "Daily",
    duration: "10 min",
  },
  {
    id: "balance",
    title: "Balance & Proprioception Training",
    priority: "Moderate",
    priorityColor: "#8B5CF6",
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
    color: "#00D4AA",
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
    color: "#8B5CF6",
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
    color: "#00A8FF",
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
  { day: "Monday", sessions: ["Hip Flexor Strengthening (30 min)", "Pelvic Stability (15 min)"], homeTask: "Ankle stretch × 3 sets" },
  { day: "Tuesday", sessions: ["Balance Training (30 min)"], homeTask: "Hip flexor stretch × 3 sets" },
  { day: "Wednesday", sessions: ["Gait Retraining (45 min)", "Ankle Mobilisation (15 min)"], homeTask: "Resistance band exercises" },
  { day: "Thursday", sessions: ["Rest / Light Walk (20 min)"], homeTask: "Balance board × 3 sets" },
  { day: "Friday", sessions: ["Full Lower Limb Circuit (40 min)"], homeTask: "Ankle alphabet × 2 sets" },
  { day: "Saturday", sessions: ["Functional Movement (35 min)"], homeTask: "Community walk 15 min" },
  { day: "Sunday", sessions: ["Active Recovery / Stretching (30 min)"], homeTask: "Relaxation & light stretching" },
];

const nutritionAdvice = [
  {
    category: "Protein Intake",
    icon: Dumbbell,
    color: "#00D4AA",
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
    color: "#F59E0B",
    recommendation: "Adequate calcium and vitamin D to support skeletal integrity, particularly important post-stroke.",
    foods: ["Dairy or fortified plant milk", "Oily fish, egg yolks", "Leafy greens (kale, broccoli)"],
    timing: "Vitamin D supplement 1000–2000 IU/day (consult GP); calcium with meals",
  },
  {
    category: "Hydration",
    icon: Flame,
    color: "#00A8FF",
    recommendation: "Adequate hydration supports muscle function, cognitive performance, and exercise tolerance.",
    foods: ["Water (primary)", "Herbal teas, diluted juice", "Electrolyte drinks post-exercise"],
    timing: "2–2.5L daily; 500ml in the 2 hours before each session",
  },
];

// ─── Expandable module ────────────────────────────────────────────────────────

function Module({
  title,
  icon: Icon,
  color,
  defaultOpen = false,
  children,
  badge,
}: {
  title: string;
  icon: React.ElementType;
  color: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className="border rounded-2xl overflow-hidden transition-all"
      style={{ borderColor: open ? color + "40" : "rgba(255,255,255,0.08)" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/3 transition-all text-left"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: color + "20" }}
          >
            <Icon size={17} style={{ color }} />
          </div>
          <div>
            <span className="text-white font-semibold text-sm">{title}</span>
            {badge && (
              <span
                className="ml-2 text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: color + "20", color }}
              >
                {badge}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{open ? "Collapse" : "Expand"}</span>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={16} className="text-slate-400" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 border-t border-white/5">{children}</div>
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
    <div className="min-h-screen bg-[#050d1a] text-white">
      <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-[#8B5CF6]/6 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#00D4AA]/6 rounded-full blur-[120px] pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#050d1a]/80 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/report")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            Report
          </button>
          <div className="w-px h-4 bg-white/20" />
          <span className="text-white font-black tracking-widest text-lg">AXONAI</span>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <span>/</span>
            <span className="text-slate-300">Rehab Plan</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 border border-white/10">
            <Download size={13} />
            Export Plan
          </button>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <div className="w-7 h-7 rounded-full bg-[#00D4AA]/20 flex items-center justify-center">
              <User size={14} className="text-[#00D4AA]" />
            </div>
            <span className="hidden sm:block">{user?.name}</span>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-[#8B5CF6] text-xs font-medium mb-4">
            <LayoutGrid size={12} />
            Step 3 of 3 — Personalised Rehab Plan
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            AI-Driven Personalised Rehabilitation Plan
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl">
            The system has analysed kinematic defects using deep learning algorithms, automatically generating a complete home rehab prescription including focus areas, exercise library, and nutrition guidance.
          </p>
        </motion.div>

        {/* Patient summary banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-gradient-to-r from-[#00D4AA]/10 to-[#8B5CF6]/10 border border-[#00D4AA]/20 rounded-2xl p-5 mb-6"
        >
          <div className="flex flex-wrap items-start gap-6">
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Patient</p>
              <p className="text-white font-semibold">{patientName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Diagnosis</p>
              <p className="text-white font-semibold">Post-stroke gait rehabilitation</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Gait Score</p>
              <p className="font-semibold" style={{ color: "#00D4AA" }}>{metrics.gaitScore}/100</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Walking Speed</p>
              <p className="font-semibold text-amber-400">{metrics.speed} m/s (impaired)</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Programme Duration</p>
              <p className="text-white font-semibold flex items-center gap-1.5">
                <Clock size={13} className="text-[#8B5CF6]" />
                8 weeks
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4 pt-3 border-t border-white/10">
            Based on current gait data, the most prominent abnormal feature is reduced walking speed (0.65 m/s), indicating impaired gait efficiency and stability. Significant compensatory strategies are observed, which may lead to abnormal gait patterns and joint wear. The following progressive plan focuses on restoring gait rhythm, lower limb control, balance, and walking ability.
          </p>
        </motion.div>

        {/* Expandable modules */}
        <div className="space-y-3">
          {/* 1. Key Focus Areas */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Module title="Key Focus Areas" icon={Target} color="#ef4444" defaultOpen badge="4 areas identified">
              <div className="pt-4 space-y-4">
                {focusAreas.map((area) => (
                  <div key={area.id} className="bg-white/5 rounded-xl p-4 border border-white/8">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-semibold text-white">{area.title}</h4>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: area.priorityColor + "20", color: area.priorityColor }}
                        >
                          {area.priority}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock size={10} />
                          {area.duration}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">{area.rationale}</p>
                    <div className="space-y-1">
                      {area.exercises.map((ex) => (
                        <div key={ex} className="flex items-center gap-2 text-xs text-slate-300">
                          <CheckCircle2 size={11} className="text-[#00D4AA] flex-shrink-0" />
                          {ex}
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      Frequency: <span className="text-slate-300">{area.frequency}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Module>
          </motion.div>

          {/* 2. Training Plan */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Module title="Progressive Training Plan" icon={Dumbbell} color="#00D4AA" badge="3 phases · 8 weeks">
              <div className="pt-4 space-y-5">
                {trainingPlan.map((phase) => (
                  <div key={phase.week} className="border border-white/8 rounded-xl overflow-hidden">
                    <div
                      className="px-4 py-3 flex items-center justify-between"
                      style={{ backgroundColor: phase.color + "15", borderBottom: `1px solid ${phase.color}30` }}
                    >
                      <div>
                        <span className="text-sm font-bold text-white">{phase.week}</span>
                        <span
                          className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: phase.color + "25", color: phase.color }}
                        >
                          {phase.phase}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-slate-400 mb-3">
                        <span className="text-slate-300 font-medium">Goal: </span>{phase.goal}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                        {phase.sessions.map((s) => (
                          <div key={s.day} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                            <span
                              className="text-xs font-bold w-8 flex-shrink-0"
                              style={{ color: phase.color }}
                            >
                              {s.day}
                            </span>
                            <span className="text-xs text-slate-300 flex-1">{s.focus}</span>
                            <span className="text-xs text-slate-500">{s.duration}</span>
                            <span
                              className="text-xs px-1.5 py-0.5 rounded font-medium"
                              style={{
                                backgroundColor:
                                  s.intensity.includes("High") ? "#ef444420" :
                                  s.intensity.includes("Mod") ? "#f59e0b20" : "#10b98120",
                                color:
                                  s.intensity.includes("High") ? "#ef4444" :
                                  s.intensity.includes("Mod") ? "#f59e0b" : "#10b981",
                              }}
                            >
                              {s.intensity}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-start gap-2 text-xs text-slate-400 bg-white/3 rounded-lg px-3 py-2">
                        <AlertCircle size={11} className="text-[#00D4AA] flex-shrink-0 mt-0.5" />
                        <span><span className="text-[#00D4AA] font-medium">Home programme: </span>{phase.homeExercises}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Module>
          </motion.div>

          {/* 3. Weekly Schedule */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Module title="Weekly Schedule" icon={Calendar} color="#8B5CF6" badge="Week 3 template">
              <div className="pt-4 space-y-2">
                {weeklySchedule.map((day, i) => (
                  <div
                    key={day.day}
                    className={`flex items-start gap-4 p-3 rounded-xl ${i === 0 || i === 2 || i === 4 ? "bg-white/5 border border-white/8" : "bg-white/3"}`}
                  >
                    <div className="w-20 flex-shrink-0">
                      <span className={`text-xs font-bold ${i === 0 || i === 2 || i === 4 ? "text-[#8B5CF6]" : "text-slate-400"}`}>
                        {day.day}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      {day.sessions.map((s) => (
                        <div key={s} className="flex items-center gap-1.5 text-xs text-slate-300 mb-0.5">
                          <CheckCircle2 size={10} className="text-[#8B5CF6] flex-shrink-0" />
                          {s}
                        </div>
                      ))}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-slate-500">Home:</p>
                      <p className="text-xs text-slate-400">{day.homeTask}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Module>
          </motion.div>

          {/* 4. Nutrition Advice */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Module title="Nutrition & Recovery Guidance" icon={Apple} color="#10B981" badge="4 categories">
              <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {nutritionAdvice.map((item) => (
                  <div key={item.category} className="bg-white/5 border border-white/8 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: item.color + "20" }}
                      >
                        <item.icon size={15} style={{ color: item.color }} />
                      </div>
                      <span className="text-sm font-semibold text-white">{item.category}</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">{item.recommendation}</p>
                    <div className="space-y-1 mb-3">
                      {item.foods.map((f) => (
                        <div key={f} className="flex items-center gap-1.5 text-xs text-slate-300">
                          <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                          {f}
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-slate-500 bg-white/5 rounded-lg px-2.5 py-1.5">
                      <span style={{ color: item.color }} className="font-medium">Timing: </span>
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
          className="text-xs text-slate-600 text-center mt-6 px-4"
        >
          This plan is based solely on the provided gait metrics and static rehab performance, serving as a rehab reference and does not constitute a medical diagnosis. Always consult a qualified physiotherapist before commencing any rehabilitation programme.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-[#8B5CF6]/10 to-[#00D4AA]/10 border border-[#8B5CF6]/20 rounded-2xl p-6"
        >
          <div>
            <h3 className="text-white font-bold mb-1">Monitor patient progress in real time</h3>
            <p className="text-sm text-slate-400">
              Access the Therapist Workspace to track {patientName}'s compliance, adjust the plan, and communicate remotely.
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex-shrink-0 flex items-center gap-2 bg-gradient-to-r from-[#8B5CF6] to-[#00A8FF] text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-all text-sm whitespace-nowrap"
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
