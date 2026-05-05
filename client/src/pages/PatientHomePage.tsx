/**
 * PatientHomePage — AxonAI Patient Workspace
 * Design: Clean light shell — warm white #FAFBFC, teal accent, large readable type
 * Sections: Assessment Due Banner · AI Message · Today's Tasks · Daily Check-In
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  CheckCircle2, Circle, ChevronRight, Flame, Heart,
  MessageSquare, Upload, LogOut, Home, Video, Bell,
  Sparkles, AlertCircle, ChevronDown, ChevronUp, Play,
  Activity, Zap, Star,
} from "lucide-react";

/* ── Design tokens ─────────────────────────────────────────────────── */
const C = {
  bg:       "#F7F8FA",
  surface:  "#FFFFFF",
  border:   "#E4E7ED",
  text:     "#1A1D23",
  text2:    "#5A6070",
  text3:    "#9AA0AE",
  teal:     "#00B89A",
  tealDim:  "rgba(0,184,154,0.10)",
  tealBorder:"rgba(0,184,154,0.25)",
  amber:    "#F59E0B",
  amberDim: "rgba(245,158,11,0.10)",
  blue:     "#3B82F6",
  blueDim:  "rgba(59,130,246,0.10)",
  purple:   "#8B5CF6",
  purpleDim:"rgba(139,92,246,0.10)",
  green:    "#10B981",
  greenDim: "rgba(16,185,129,0.10)",
  red:      "#EF4444",
  redDim:   "rgba(239,68,68,0.08)",
};

/* ── Mock data ──────────────────────────────────────────────────────── */
const PATIENT_DATA = {
  name: "James",
  fullName: "James Thornton",
  patientId: "PT-001",
  week: 3,
  totalWeeks: 8,
  daysIntoWeek: 4,
  assessmentDue: true,
  assessmentDaysOverdue: 0, // 0 = due today
  streak: 4,
  weeklyCompliance: 78,
};

const AI_MESSAGES = [
  {
    id: 1,
    type: "progress",
    icon: Sparkles,
    color: C.teal,
    bg: C.tealDim,
    title: "Great progress this week, James!",
    body: "Your walking speed has improved by 8% since last assessment (0.82 → 0.89 m/s). Your step symmetry is also trending upward. Keep it up — you're on track for your Week 4 goals.",
    time: "Today, 8:00 AM",
    from: "AxonAI",
    read: false,
  },
  {
    id: 2,
    type: "therapist",
    icon: MessageSquare,
    color: C.blue,
    bg: C.blueDim,
    title: "Message from Dr. Erisa",
    body: "Hi James, I've reviewed your latest assessment and I'm really pleased with your progress. I've adjusted your hip flexor stretch to 3 sets × 45 seconds — your flexibility has improved enough to handle the increase. See you at your next clinic appointment on Friday.",
    time: "Yesterday, 3:15 PM",
    from: "Dr. Erisa (Therapist)",
    read: true,
  },
];

const TODAY_TASKS = [
  {
    id: "t1",
    name: "Hip Flexor Stretch",
    sets: 3, reps: null, hold: 45,
    unit: "s hold",
    focus: "Hip flexibility",
    difficulty: "Beginner",
    diffColor: C.green,
    estimatedMin: 5,
    videoId: "iZdJZjScmCc",
    cue: "Kneel on affected leg, push hips forward gently. Keep trunk upright.",
    completed: false,
  },
  {
    id: "t2",
    name: "Supine Hip Flexion",
    sets: 3, reps: 15, hold: null,
    unit: "reps",
    focus: "Hip flexor activation",
    difficulty: "Beginner",
    diffColor: C.green,
    estimatedMin: 8,
    videoId: null,
    cue: "Lie on back, slowly raise knee toward chest to 90°, hold 2 s, lower with control.",
    completed: true,
  },
  {
    id: "t3",
    name: "Seated Knee Raise",
    sets: 2, reps: 20, hold: null,
    unit: "reps",
    focus: "Hip flexor endurance",
    difficulty: "Beginner",
    diffColor: C.green,
    estimatedMin: 6,
    videoId: null,
    cue: "Sit upright on a chair, lift knee to hip height, hold 1 s, lower. Keep back straight.",
    completed: false,
  },
  {
    id: "t4",
    name: "Pelvic Tilts",
    sets: 3, reps: 15, hold: null,
    unit: "reps",
    focus: "Lumbo-pelvic control",
    difficulty: "Beginner",
    diffColor: C.green,
    estimatedMin: 5,
    videoId: null,
    cue: "Lie on back with knees bent. Flatten lower back against floor by tightening abs.",
    completed: false,
  },
  {
    id: "t5",
    name: "Standing Hip Abduction",
    sets: 2, reps: 15, hold: null,
    unit: "reps",
    focus: "Lateral hip stability",
    difficulty: "Intermediate",
    diffColor: C.amber,
    estimatedMin: 7,
    videoId: null,
    cue: "Stand holding a chair, lift affected leg sideways to 30°, hold 2 s, lower slowly.",
    completed: false,
  },
];

const PAIN_SCALE = [
  { value: 0, label: "None", color: C.green },
  { value: 1, label: "", color: C.green },
  { value: 2, label: "Mild", color: "#84CC16" },
  { value: 3, label: "", color: "#EAB308" },
  { value: 4, label: "Moderate", color: C.amber },
  { value: 5, label: "", color: "#F97316" },
  { value: 6, label: "Significant", color: "#EF4444" },
  { value: 7, label: "", color: C.red },
  { value: 8, label: "Severe", color: "#DC2626" },
  { value: 9, label: "", color: "#B91C1C" },
  { value: 10, label: "Worst", color: "#991B1B" },
];

/* ── Sub-components ─────────────────────────────────────────────────── */

function NavBar({ onNavigate }: { onNavigate: (p: string) => void }) {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b"
      style={{ backgroundColor: C.surface, borderColor: C.border }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: C.teal }}
        >
          <Zap size={14} color="#fff" />
        </div>
        <span className="font-bold text-sm" style={{ color: C.text }}>AxonAI</span>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium ml-1"
          style={{ backgroundColor: C.tealDim, color: C.teal }}
        >
          Patient
        </span>
      </div>

      <nav className="flex items-center gap-1">
        {[
          { icon: Home, label: "Home", path: "/patient-home" },
          { icon: Upload, label: "Upload", path: "/patient-upload" },
          { icon: MessageSquare, label: "Messages", path: "/patient-messages" },
        ].map(({ icon: Icon, label, path }) => (
          <button
            key={path}
            onClick={() => onNavigate(path)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-gray-50"
            style={{ color: C.text2 }}
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg transition-colors hover:bg-gray-50 ml-1"
          title="Sign out"
        >
          <LogOut size={14} style={{ color: C.text3 }} />
        </button>
      </nav>
    </header>
  );
}

function AssessmentDueBanner({ onUpload }: { onUpload: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 flex items-center justify-between gap-4"
      style={{
        background: `linear-gradient(135deg, ${C.amber}18 0%, ${C.amber}08 100%)`,
        border: `1.5px solid ${C.amber}40`,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: C.amberDim }}
        >
          <AlertCircle size={20} style={{ color: C.amber }} />
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: C.text }}>
            Weekly Assessment Due Today
          </p>
          <p className="text-xs mt-0.5" style={{ color: C.text2 }}>
            Please record a 30-second walk video so your therapist can track your progress this week.
          </p>
        </div>
      </div>
      <button
        onClick={onUpload}
        className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl flex-shrink-0 transition-all hover:opacity-80"
        style={{ backgroundColor: C.amber, color: "#fff" }}
      >
        <Video size={13} />
        Record Now
      </button>
    </motion.div>
  );
}

function AIMessageCard({ msg, onReadMore }: { msg: typeof AI_MESSAGES[0]; onReadMore: () => void }) {
  const Icon = msg.icon;
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="rounded-2xl p-4 cursor-pointer transition-all hover:shadow-sm"
      style={{
        backgroundColor: C.surface,
        border: `1.5px solid ${msg.read ? C.border : msg.color + "40"}`,
      }}
      onClick={onReadMore}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: msg.bg }}
        >
          <Icon size={16} style={{ color: msg.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-bold truncate" style={{ color: C.text }}>{msg.title}</p>
            {!msg.read && (
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: msg.color }}
              />
            )}
          </div>
          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: C.text2 }}>{msg.body}</p>
          <p className="text-xs mt-1.5" style={{ color: C.text3 }}>{msg.time} · {msg.from}</p>
        </div>
        <ChevronRight size={14} style={{ color: C.text3 }} className="flex-shrink-0 mt-1" />
      </div>
    </motion.div>
  );
}

function TaskCard({ task, onToggle }: {
  task: typeof TODAY_TASKS[0];
  onToggle: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      className="rounded-2xl overflow-hidden transition-all"
      style={{
        backgroundColor: C.surface,
        border: `1.5px solid ${task.completed ? C.teal + "40" : C.border}`,
        opacity: task.completed ? 0.75 : 1,
      }}
    >
      {/* Header row */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
          className="flex-shrink-0 transition-transform hover:scale-110"
        >
          {task.completed
            ? <CheckCircle2 size={22} style={{ color: C.teal }} />
            : <Circle size={22} style={{ color: C.border }} />
          }
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p
              className="text-sm font-semibold"
              style={{
                color: C.text,
                textDecoration: task.completed ? "line-through" : "none",
              }}
            >
              {task.name}
            </p>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: task.diffColor + "18", color: task.diffColor }}
            >
              {task.difficulty}
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: C.text3 }}>
            {task.sets} sets ×{" "}
            {task.reps ? `${task.reps} reps` : `${task.hold}s hold`}
            {" · "}{task.estimatedMin} min · {task.focus}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {task.videoId && (
            <a
              href={`https://www.youtube.com/watch?v=${task.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all hover:opacity-80"
              style={{ backgroundColor: C.tealDim, color: C.teal }}
            >
              <Play size={11} />
              Video
            </a>
          )}
          {expanded
            ? <ChevronUp size={14} style={{ color: C.text3 }} />
            : <ChevronDown size={14} style={{ color: C.text3 }} />
          }
        </div>
      </div>

      {/* Expanded cue */}
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
              className="px-4 pb-4 pt-0 ml-9"
              style={{ borderTop: `1px solid ${C.border}` }}
            >
              <p className="text-xs leading-relaxed pt-3" style={{ color: C.text2 }}>
                <span className="font-semibold" style={{ color: C.text }}>How to do it: </span>
                {task.cue}
              </p>
              {!task.videoId && (
                <p className="text-xs mt-2 italic" style={{ color: C.text3 }}>
                  Instruction video coming soon
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DailyCheckIn() {
  const [pain, setPain] = useState<number | null>(null);
  const [fatigue, setFatigue] = useState<number | null>(null);
  const [mood, setMood] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const moods = [
    { label: "😔", desc: "Low" },
    { label: "😐", desc: "Okay" },
    { label: "🙂", desc: "Good" },
    { label: "😄", desc: "Great" },
  ];

  const handleSubmit = () => {
    if (pain === null || fatigue === null || mood === null) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl p-6 text-center"
        style={{ backgroundColor: C.surface, border: `1.5px solid ${C.teal}40` }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
          style={{ backgroundColor: C.tealDim }}
        >
          <CheckCircle2 size={24} style={{ color: C.teal }} />
        </div>
        <p className="font-bold text-sm" style={{ color: C.text }}>Daily check-in recorded</p>
        <p className="text-xs mt-1" style={{ color: C.text2 }}>
          Your therapist has been notified. See you tomorrow!
        </p>
      </motion.div>
    );
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{ backgroundColor: C.surface, border: `1.5px solid ${C.border}` }}
    >
      <h3 className="text-sm font-bold mb-4" style={{ color: C.text }}>Daily Check-In</h3>

      {/* Pain scale */}
      <div className="mb-5">
        <p className="text-xs font-semibold mb-2" style={{ color: C.text2 }}>
          Pain level right now
          {pain !== null && (
            <span className="ml-2 font-bold" style={{ color: PAIN_SCALE[pain].color }}>
              {pain}/10 — {PAIN_SCALE[pain].label || ""}
            </span>
          )}
        </p>
        <div className="flex gap-1">
          {PAIN_SCALE.map(({ value, color }) => (
            <button
              key={value}
              onClick={() => setPain(value)}
              className="flex-1 h-8 rounded-lg text-xs font-bold transition-all hover:scale-105"
              style={{
                backgroundColor: pain === value ? color : color + "22",
                color: pain === value ? "#fff" : color,
                border: pain === value ? `2px solid ${color}` : `1px solid ${color}44`,
              }}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {/* Fatigue */}
      <div className="mb-5">
        <p className="text-xs font-semibold mb-2" style={{ color: C.text2 }}>
          Fatigue level
          {fatigue !== null && (
            <span className="ml-2 font-bold" style={{ color: PAIN_SCALE[fatigue].color }}>
              {fatigue}/10
            </span>
          )}
        </p>
        <div className="flex gap-1">
          {PAIN_SCALE.map(({ value, color }) => (
            <button
              key={value}
              onClick={() => setFatigue(value)}
              className="flex-1 h-8 rounded-lg text-xs font-bold transition-all hover:scale-105"
              style={{
                backgroundColor: fatigue === value ? color : color + "22",
                color: fatigue === value ? "#fff" : color,
                border: fatigue === value ? `2px solid ${color}` : `1px solid ${color}44`,
              }}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {/* Mood */}
      <div className="mb-5">
        <p className="text-xs font-semibold mb-2" style={{ color: C.text2 }}>How are you feeling overall?</p>
        <div className="flex gap-2">
          {moods.map(({ label, desc }) => (
            <button
              key={desc}
              onClick={() => setMood(desc)}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all hover:scale-105"
              style={{
                backgroundColor: mood === desc ? C.tealDim : "#F7F8FA",
                border: `1.5px solid ${mood === desc ? C.teal : C.border}`,
              }}
            >
              <span className="text-xl">{label}</span>
              <span className="text-xs font-medium" style={{ color: mood === desc ? C.teal : C.text3 }}>{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="mb-4">
        <p className="text-xs font-semibold mb-2" style={{ color: C.text2 }}>Any notes for your therapist? (optional)</p>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="e.g. Left knee felt stiff during hip raises today…"
          rows={2}
          className="w-full text-xs rounded-xl px-3 py-2.5 resize-none outline-none transition-all"
          style={{
            backgroundColor: "#F7F8FA",
            border: `1.5px solid ${C.border}`,
            color: C.text,
          }}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={pain === null || fatigue === null || mood === null}
        className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ backgroundColor: C.teal, color: "#fff" }}
      >
        Submit Check-In
      </button>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────────────── */
export default function PatientHomePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [tasks, setTasks] = useState(TODAY_TASKS);
  const [activeMsg, setActiveMsg] = useState<typeof AI_MESSAGES[0] | null>(null);

  const completedCount = tasks.filter(t => t.completed).length;
  const totalMin = tasks.reduce((s, t) => s + t.estimatedMin, 0);
  const completedMin = tasks.filter(t => t.completed).reduce((s, t) => s + t.estimatedMin, 0);

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg }}>
      <NavBar onNavigate={navigate} />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold" style={{ color: C.text }}>
            Good morning, {user?.name?.split(" ")[0] ?? "James"} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: C.text2 }}>
            Week {PATIENT_DATA.week} of {PATIENT_DATA.totalWeeks} · Day {PATIENT_DATA.daysIntoWeek}
            <span
              className="ml-3 inline-flex items-center gap-1 font-semibold"
              style={{ color: C.amber }}
            >
              <Flame size={13} /> {PATIENT_DATA.streak}-day streak
            </span>
          </p>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl p-4"
          style={{ backgroundColor: C.surface, border: `1.5px solid ${C.border}` }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold" style={{ color: C.text }}>
              Today's Progress
            </p>
            <p className="text-xs font-bold" style={{ color: C.teal }}>
              {completedCount}/{tasks.length} tasks · {completedMin}/{totalMin} min
            </p>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: C.tealDim }}>
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: C.teal }}
              initial={{ width: 0 }}
              animate={{ width: `${(completedCount / tasks.length) * 100}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs" style={{ color: C.text3 }}>
              Weekly compliance: <span className="font-bold" style={{ color: C.text2 }}>{PATIENT_DATA.weeklyCompliance}%</span>
            </p>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={11}
                  fill={i < Math.round(PATIENT_DATA.weeklyCompliance / 20) ? C.amber : "none"}
                  style={{ color: C.amber }}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Assessment due banner */}
        {PATIENT_DATA.assessmentDue && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <AssessmentDueBanner onUpload={() => navigate("/patient-upload")} />
          </motion.div>
        )}

        {/* AI Messages */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold" style={{ color: C.text }}>Messages</h2>
            <button
              onClick={() => navigate("/patient-messages")}
              className="text-xs font-medium"
              style={{ color: C.teal }}
            >
              View all →
            </button>
          </div>
          <div className="space-y-2">
            {AI_MESSAGES.map(msg => (
              <AIMessageCard key={msg.id} msg={msg} onReadMore={() => setActiveMsg(msg)} />
            ))}
          </div>
        </motion.div>

        {/* Today's Tasks */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold" style={{ color: C.text }}>Today's Exercises</h2>
            <span className="text-xs" style={{ color: C.text3 }}>{totalMin} min total</span>
          </div>
          <div className="space-y-2">
            {tasks.map(task => (
              <TaskCard key={task.id} task={task} onToggle={toggleTask} />
            ))}
          </div>
        </motion.div>

        {/* Daily Check-In */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <h2 className="text-sm font-bold mb-3" style={{ color: C.text }}>Daily Check-In</h2>
          <DailyCheckIn />
        </motion.div>

        <div className="h-8" />
      </main>

      {/* Message detail modal */}
      <AnimatePresence>
        {activeMsg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            onClick={() => setActiveMsg(null)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="w-full max-w-md rounded-2xl p-6"
              style={{ backgroundColor: C.surface }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: activeMsg.bg }}
                >
                  <activeMsg.icon size={18} style={{ color: activeMsg.color }} />
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: C.text }}>{activeMsg.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: C.text3 }}>{activeMsg.time} · {activeMsg.from}</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: C.text2 }}>{activeMsg.body}</p>
              <button
                onClick={() => setActiveMsg(null)}
                className="mt-5 w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-80"
                style={{ backgroundColor: C.teal, color: "#fff" }}
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
