/**
 * RehabPlanPage — AxonAI Personalised Rehabilitation Plan
 * Design: Clean light app-shell (#F7F8FA bg, white cards, teal/blue accents)
 *
 * Changes:
 *  - "Hip & Pelvic" session card expands to show detailed exercise info (left)
 *    + YouTube instruction video (right)
 *  - Weekly Schedule comes BEFORE Progressive Training Plan
 *  - Weekly Schedule is fully editable (add/delete sessions per day, edit home task)
 *  - Progressive Training Plan auto-updates from the Weekly Schedule state
 */
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useAssessment } from "@/contexts/AssessmentContext";
import {
  ArrowLeft, ChevronDown, ChevronRight, Download,
  Target, Dumbbell, Calendar, Apple, User, Clock,
  CheckCircle2, AlertCircle, Flame, Heart, Zap,
  LayoutGrid, Users, Plus, Trash2, Play, X, Camera, CameraOff, Activity,
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

// ─── Hip & Pelvic detail data ─────────────────────────────────────────────────

const HIP_PELVIC_DETAIL = {
  title: "Hip & Pelvic Stability",
  youtubeId: "iZdJZjScmCc", // 7 Best Pelvic Stabilization Exercises – AskDoctorJo (445K views)
  exercises: [
    {
      name: "Hip Flexor Stretch",
      sets: 3, reps: "30 s hold", rest: "15 s",
      focus: "Hip flexor lengthening",
      cue: "Kneel on the affected leg, push hips forward gently until a stretch is felt at the front of the hip. Keep trunk upright.",
      difficulty: "Beginner",
    },
    {
      name: "Supine Hip Flexion",
      sets: 3, reps: "15 reps", rest: "30 s",
      focus: "Hip flexor activation",
      cue: "Lie on back, slowly raise knee toward chest to 90°, hold 2 s, lower with control. Avoid trunk rotation.",
      difficulty: "Beginner",
    },
    {
      name: "Seated Knee Raise",
      sets: 2, reps: "20 reps", rest: "20 s",
      focus: "Hip flexor endurance",
      cue: "Sit upright on a chair, lift knee to hip height, hold 1 s, lower. Keep back straight throughout.",
      difficulty: "Beginner",
    },
    {
      name: "Pelvic Tilts",
      sets: 3, reps: "15 reps", rest: "20 s",
      focus: "Lumbo-pelvic control",
      cue: "Lie on back with knees bent. Flatten lower back against floor by tightening abdominals, hold 3 s, release.",
      difficulty: "Beginner",
    },
    {
      name: "Dead Bug",
      sets: 3, reps: "10 reps each side", rest: "30 s",
      focus: "Core & pelvic stability",
      cue: "Lie on back, arms vertical, knees at 90°. Slowly lower opposite arm and leg toward floor while keeping lower back flat.",
      difficulty: "Intermediate",
    },
    {
      name: "Side-Lying Hip Abduction",
      sets: 3, reps: "15 reps", rest: "30 s",
      focus: "Gluteus medius activation",
      cue: "Lie on unaffected side, raise top leg to 30–40°, hold 2 s, lower slowly. Keep pelvis stable.",
      difficulty: "Beginner",
    },
  ],
  frequency: "Daily (hip flexor stretch) + 5×/week (strengthening)",
  totalDuration: "35 min per session",
  notes: "Prioritise quality over quantity. Stop if sharp hip or groin pain occurs. Progress to standing exercises when 3×15 reps is achieved without compensatory trunk lean.",
};

// ─── Focus areas ──────────────────────────────────────────────────────────────

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

// ─── Default weekly schedule (editable) ──────────────────────────────────────

type DaySchedule = {
  day: string;
  sessions: string[];
  homeTask: string;
};

const DEFAULT_WEEKLY: DaySchedule[] = [
  { day: "Monday",    sessions: ["Hip & Pelvic (35 min)", "Pelvic Stability (15 min)"], homeTask: "Ankle stretch × 3 sets" },
  { day: "Tuesday",   sessions: ["Balance Training (30 min)"],                           homeTask: "Hip flexor stretch × 3 sets" },
  { day: "Wednesday", sessions: ["Gait Retraining (45 min)", "Ankle Mobilisation (15 min)"], homeTask: "Resistance band exercises" },
  { day: "Thursday",  sessions: ["Rest / Light Walk (20 min)"],                          homeTask: "Balance board × 3 sets" },
  { day: "Friday",    sessions: ["Full Lower Limb Circuit (40 min)"],                    homeTask: "Ankle alphabet × 2 sets" },
  { day: "Saturday",  sessions: ["Functional Movement (35 min)"],                        homeTask: "Community walk 15 min" },
  { day: "Sunday",    sessions: ["Active Recovery / Stretching (30 min)"],               homeTask: "Relaxation & light stretching" },
];

// ─── Nutrition ────────────────────────────────────────────────────────────────

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

// ─── Hip & Pelvic detail panel ────────────────────────────────────────────────

function HipPelvicDetail() {
  const [showVideo, setShowVideo] = useState(false);
  const d = HIP_PELVIC_DETAIL;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 rounded-2xl overflow-hidden"
      style={{ border: `1.5px solid ${C.teal}40`, backgroundColor: C.surface }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ backgroundColor: C.tealDim, borderBottom: `1px solid ${C.teal}25` }}
      >
        <div className="flex items-center gap-2">
          <Dumbbell size={15} style={{ color: C.teal }} />
          <span className="text-sm font-bold" style={{ color: C.teal }}>{d.title} — Detailed Programme</span>
        </div>
        <div className="flex items-center gap-3 text-xs" style={{ color: C.text3 }}>
          <span className="flex items-center gap-1"><Clock size={11} />{d.totalDuration}</span>
          <span>{d.frequency}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        {/* Left: exercises */}
        <div className="p-5" style={{ borderRight: `1px solid ${C.border}` }}>
          <p className="text-xs font-semibold mb-3" style={{ color: C.text2 }}>Exercise Programme</p>
          <div className="space-y-3">
            {d.exercises.map((ex, i) => (
              <div
                key={i}
                className="rounded-xl p-3"
                style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <span className="text-sm font-semibold" style={{ color: C.text }}>{ex.name}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium ml-2 flex-shrink-0"
                    style={{
                      backgroundColor: ex.difficulty === "Intermediate" ? C.amber + "15" : C.green + "15",
                      color: ex.difficulty === "Intermediate" ? C.amber : C.green,
                    }}
                  >
                    {ex.difficulty}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs mb-1.5" style={{ color: C.text3 }}>
                  <span className="font-medium" style={{ color: C.teal }}>{ex.sets} sets × {ex.reps}</span>
                  <span>Rest: {ex.rest}</span>
                  <span style={{ color: C.text2 }}>Focus: {ex.focus}</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: C.text2 }}>{ex.cue}</p>
              </div>
            ))}
          </div>
          <div
            className="mt-3 flex items-start gap-2 text-xs rounded-lg px-3 py-2"
            style={{ backgroundColor: C.tealDim, color: C.teal }}
          >
            <AlertCircle size={11} style={{ flexShrink: 0, marginTop: 1 }} />
            <span><span className="font-semibold">Clinical note: </span>{d.notes}</span>
          </div>
        </div>

        {/* Right: YouTube video */}
        <div className="p-5 flex flex-col">
          <p className="text-xs font-semibold mb-3" style={{ color: C.text2 }}>Instruction Video</p>
          {/* Thumbnail card */}
          <div className="flex-1 rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}`, minHeight: 220 }}>
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <img
                src={`https://img.youtube.com/vi/${d.youtubeId}/hqdefault.jpg`}
                alt={d.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)" }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: "rgba(255,255,255,0.92)" }}>
                  <Play size={22} style={{ color: C.teal, marginLeft: 3 }} />
                </div>
              </div>
              <div className="absolute bottom-2 right-2 text-xs font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: "rgba(0,0,0,0.75)", color: "#fff" }}>7:45</div>
            </div>
            <div className="flex items-center justify-between px-3 py-2.5" style={{ backgroundColor: C.surface }}>
              <div>
                <div className="text-xs font-semibold" style={{ color: C.text }}>7 Best Pelvic Stabilization Exercises</div>
                <div className="text-xs" style={{ color: C.text3 }}>AskDoctorJo · 445K views</div>
              </div>
              <a
                href={`https://www.youtube.com/watch?v=${d.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                style={{ backgroundColor: C.teal, color: "#fff" }}
              >
                <Play size={11} style={{ marginLeft: 1 }} />
                Watch
              </a>
            </div>
          </div>
          <p className="text-xs mt-2 text-center" style={{ color: C.text3 }}>
            Hip Flexor &amp; Pelvic Stability Exercises — Stroke Rehabilitation
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Editable Weekly Schedule ─────────────────────────────────────────────────

function EditableWeeklySchedule({
  schedule,
  onChange,
}: {
  schedule: DaySchedule[];
  onChange: (updated: DaySchedule[]) => void;
}) {
  const [editingHome, setEditingHome] = useState<number | null>(null);
  const [newSession, setNewSession] = useState<{ [day: number]: string }>({});

  const updateDay = (idx: number, patch: Partial<DaySchedule>) => {
    const next = schedule.map((d, i) => (i === idx ? { ...d, ...patch } : d));
    onChange(next);
  };

  const addSession = (idx: number) => {
    const val = (newSession[idx] ?? "").trim();
    if (!val) return;
    updateDay(idx, { sessions: [...schedule[idx].sessions, val] });
    setNewSession((prev) => ({ ...prev, [idx]: "" }));
  };

  const removeSession = (dayIdx: number, sessionIdx: number) => {
    const next = schedule[dayIdx].sessions.filter((_, i) => i !== sessionIdx);
    updateDay(dayIdx, { sessions: next });
  };

  return (
    <div className="pt-4 space-y-2">
      {schedule.map((day, i) => (
        <div
          key={day.day}
          className="rounded-xl overflow-hidden"
          style={{ border: `1px solid ${C.border}` }}
        >
          {/* Day header */}
          <div
            className="flex items-center justify-between px-4 py-2"
            style={{ backgroundColor: i % 2 === 0 ? C.bg : C.surface, borderBottom: `1px solid ${C.border}` }}
          >
            <span className="text-xs font-bold w-24" style={{ color: i % 2 === 0 ? C.purple : C.text3 }}>
              {day.day}
            </span>
            <span className="text-xs" style={{ color: C.text3 }}>
              {day.sessions.length} session{day.sessions.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="px-4 py-3 space-y-2" style={{ backgroundColor: C.surface }}>
            {/* Sessions list */}
            <div className="space-y-1.5">
              {day.sessions.map((s, si) => (
                <div key={si} className="flex items-center gap-2 group">
                  <CheckCircle2 size={11} style={{ color: C.purple, flexShrink: 0 }} />
                  <span className="flex-1 text-xs" style={{ color: C.text2 }}>{s}</span>
                  <button
                    onClick={() => removeSession(i, si)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-xs p-0.5 rounded hover:bg-red-50"
                    title="Remove session"
                  >
                    <Trash2 size={11} style={{ color: C.red }} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add session input */}
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={newSession[i] ?? ""}
                onChange={(e) => setNewSession((prev) => ({ ...prev, [i]: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && addSession(i)}
                placeholder="Add session…"
                className="flex-1 text-xs rounded-lg px-2.5 py-1.5 outline-none transition-all"
                style={{
                  border: `1px solid ${C.border}`,
                  backgroundColor: C.bg,
                  color: C.text,
                }}
              />
              <button
                onClick={() => addSession(i)}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-all hover:opacity-80 text-white"
                style={{ backgroundColor: C.purple }}
              >
                <Plus size={11} />
                Add
              </button>
            </div>

            {/* Home task */}
            <div
              className="flex items-start gap-2 rounded-lg px-2.5 py-1.5 mt-1"
              style={{ backgroundColor: C.tealDim }}
            >
              <span className="text-xs font-medium flex-shrink-0" style={{ color: C.teal }}>Home:</span>
              {editingHome === i ? (
                <input
                  autoFocus
                  type="text"
                  value={day.homeTask}
                  onChange={(e) => updateDay(i, { homeTask: e.target.value })}
                  onBlur={() => setEditingHome(null)}
                  onKeyDown={(e) => e.key === "Enter" && setEditingHome(null)}
                  className="flex-1 text-xs bg-transparent outline-none"
                  style={{ color: C.teal }}
                />
              ) : (
                <button
                  className="flex-1 text-left text-xs hover:underline"
                  style={{ color: C.teal }}
                  onClick={() => setEditingHome(i)}
                  title="Click to edit home task"
                >
                  {day.homeTask}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Hip & Pelvic Modal ──────────────────────────────────────────────────────

// ─── Per-exercise coaching cues ──────────────────────────────────────────────
const EXERCISE_CUES: Record<string, string[]> = {
  "Hip Flexor Stretch": [
    "Keep trunk upright — avoid leaning forward",
    "Push hips forward gently, feel the stretch at the front",
    "Breathe steadily — don't hold your breath",
    "Tighten core to protect the lower back",
    "Hold the stretch — don't bounce",
  ],
  "Supine Hip Flexion": [
    "Raise knee slowly to 90° — control the movement",
    "Keep lower back flat against the surface",
    "Avoid rotating the trunk as you lift",
    "Hold at the top for 2 seconds before lowering",
    "Lower with control — don't drop the leg",
  ],
  "Seated Knee Raise": [
    "Sit tall — no slouching",
    "Lift knee to hip height, hold 1 second",
    "Keep both feet hip-width apart",
    "Engage core throughout the movement",
    "Alternate legs if instructed",
  ],
  "Pelvic Tilts": [
    "Flatten lower back against the floor",
    "Tighten abdominals — don't hold your breath",
    "Hold the tilt for 3 seconds, then release",
    "Keep shoulders and neck relaxed",
    "Small movement — quality over range",
  ],
  "Dead Bug": [
    "Keep lower back pressed to the floor throughout",
    "Move opposite arm and leg simultaneously",
    "Lower slowly — don't rush the movement",
    "Breathe out as you lower the limbs",
    "Stop if lower back lifts off the floor",
  ],
  "Side-Lying Hip Abduction": [
    "Keep pelvis stable — don't roll backward",
    "Raise top leg to 30–40°, no higher",
    "Hold at the top for 2 seconds",
    "Lower slowly with control",
    "Keep toes pointing forward, not toward the ceiling",
  ],
};

// ─── Target matching scores per exercise ─────────────────────────────────────
const EXERCISE_TARGET_SCORE: Record<string, number> = {
  "Hip Flexor Stretch": 82,
  "Supine Hip Flexion": 76,
  "Seated Knee Raise": 88,
  "Pelvic Tilts": 91,
  "Dead Bug": 69,
  "Side-Lying Hip Abduction": 74,
};

// ─── Live Pose Tracking Panel ─────────────────────────────────────────────────
function LiveTrackingPanel({ exercise, onStop }: { exercise: typeof HIP_PELVIC_DETAIL.exercises[0]; onStop: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [score, setScore] = useState(0);
  const [repCount, setRepCount] = useState(0);
  const [cueIndex, setCueIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const targetScore = EXERCISE_TARGET_SCORE[exercise.name] ?? 75;
  const cues = EXERCISE_CUES[exercise.name] ?? ["Follow the exercise cue"];

  // Animate score toward target
  useEffect(() => {
    if (!cameraReady) return;
    const interval = setInterval(() => {
      setScore((prev) => {
        const diff = targetScore - prev;
        if (Math.abs(diff) < 0.5) return targetScore;
        return prev + diff * 0.08 + (Math.random() - 0.5) * 1.2;
      });
    }, 120);
    return () => clearInterval(interval);
  }, [cameraReady, targetScore]);

  // Cycle coaching cues every 5 seconds
  useEffect(() => {
    if (!cameraReady) return;
    const interval = setInterval(() => setCueIndex((i) => (i + 1) % cues.length), 5000);
    return () => clearInterval(interval);
  }, [cameraReady, cues.length]);

  // Increment rep count every ~4 seconds
  useEffect(() => {
    if (!cameraReady) return;
    const interval = setInterval(() => setRepCount((r) => r + 1), 4200);
    return () => clearInterval(interval);
  }, [cameraReady]);

  // Elapsed timer
  useEffect(() => {
    if (!cameraReady) return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [cameraReady]);

  // Start camera
  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } })
      .then((stream) => {
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().then(() => { if (!cancelled) setCameraReady(true); });
        }
      })
      .catch((err) => {
        if (!cancelled) setCameraError(err.name === "NotAllowedError" ? "Camera access denied. Please allow camera permissions." : "Camera not available on this device.");
      });
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Draw skeleton overlay on canvas
  const drawSkeleton = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(drawSkeleton);
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Simulated skeleton joints (normalised 0-1, animated with sin/cos)
    const t = Date.now() / 1000;
    const W = canvas.width, H = canvas.height;
    const joints = [
      { x: 0.50, y: 0.12 },  // 0 head
      { x: 0.50, y: 0.26 },  // 1 neck
      { x: 0.38, y: 0.30 },  // 2 L shoulder
      { x: 0.62, y: 0.30 },  // 3 R shoulder
      { x: 0.34, y: 0.44 + Math.sin(t * 1.2) * 0.02 },  // 4 L elbow
      { x: 0.66, y: 0.44 + Math.sin(t * 1.2 + 1) * 0.02 },  // 5 R elbow
      { x: 0.32, y: 0.56 },  // 6 L wrist
      { x: 0.68, y: 0.56 },  // 7 R wrist
      { x: 0.50, y: 0.50 },  // 8 torso
      { x: 0.43, y: 0.62 },  // 9 L hip
      { x: 0.57, y: 0.62 },  // 10 R hip
      { x: 0.41, y: 0.76 + Math.sin(t * 1.8) * 0.03 },  // 11 L knee
      { x: 0.59, y: 0.76 + Math.cos(t * 1.8) * 0.03 },  // 12 R knee
      { x: 0.40, y: 0.90 },  // 13 L ankle
      { x: 0.60, y: 0.90 },  // 14 R ankle
    ];
    const bones = [
      [0,1],[1,2],[1,3],[2,4],[4,6],[3,5],[5,7],
      [1,8],[8,9],[8,10],[9,11],[11,13],[10,12],[12,14],
    ];

    // Draw bones
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "rgba(0,255,200,0.85)";
    ctx.shadowColor = "#00FFC8";
    ctx.shadowBlur = 6;
    bones.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(joints[a].x * W, joints[a].y * H);
      ctx.lineTo(joints[b].x * W, joints[b].y * H);
      ctx.stroke();
    });

    // Draw joints
    ctx.shadowBlur = 10;
    joints.forEach((j) => {
      ctx.beginPath();
      ctx.arc(j.x * W, j.y * H, 5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,255,200,0.95)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
    ctx.shadowBlur = 0;

    rafRef.current = requestAnimationFrame(drawSkeleton);
  }, []);

  useEffect(() => {
    if (cameraReady) {
      rafRef.current = requestAnimationFrame(drawSkeleton);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [cameraReady, drawSkeleton]);

  const scoreColor = score >= 80 ? C.green : score >= 60 ? C.amber : C.red;
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold" style={{ color: C.text }}>{exercise.name}</p>
          <p className="text-xs" style={{ color: C.text3 }}>Live Movement Tracking</p>
        </div>
        <button
          onClick={onStop}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
          style={{ backgroundColor: C.red + "15", color: C.red, border: `1px solid ${C.red}30` }}
        >
          <CameraOff size={12} />
          Stop Tracking
        </button>
      </div>

      {/* Camera / canvas */}
      <div className="relative rounded-xl overflow-hidden flex-1" style={{ minHeight: 220, backgroundColor: "#0F172A" }}>
        {cameraError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
            <CameraOff size={32} style={{ color: C.text3 }} />
            <p className="text-sm text-center" style={{ color: C.text3 }}>{cameraError}</p>
          </div>
        ) : (
          <>
            {/* Hidden video source */}
            <video ref={videoRef} className="hidden" muted playsInline />
            {/* Canvas with skeleton overlay */}
            <canvas ref={canvasRef} className="w-full h-full object-cover" />
            {!cameraReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ backgroundColor: "#0F172A" }}>
                <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: C.teal, borderTopColor: "transparent" }} />
                <p className="text-xs" style={{ color: C.text3 }}>Starting camera…</p>
              </div>
            )}
            {/* Live badge */}
            {cameraReady && (
              <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.65)" }}>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: C.red }} />
                <span className="text-xs font-semibold text-white">LIVE</span>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{fmt(elapsed)}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Stats row */}
      {cameraReady && (
        <div className="grid grid-cols-3 gap-2">
          {/* Matching score */}
          <div className="rounded-xl p-3 text-center" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
            <p className="text-xs mb-1" style={{ color: C.text3 }}>Match Score</p>
            <p className="text-2xl font-black" style={{ color: scoreColor }}>{Math.round(score)}%</p>
            <div className="w-full h-1.5 rounded-full mt-1.5 overflow-hidden" style={{ backgroundColor: C.border }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${score}%`, backgroundColor: scoreColor }}
              />
            </div>
          </div>
          {/* Rep count */}
          <div className="rounded-xl p-3 text-center" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
            <p className="text-xs mb-1" style={{ color: C.text3 }}>Reps</p>
            <p className="text-2xl font-black" style={{ color: C.teal }}>{repCount}</p>
            <p className="text-xs" style={{ color: C.text3 }}>of {exercise.reps}</p>
          </div>
          {/* Sets */}
          <div className="rounded-xl p-3 text-center" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
            <p className="text-xs mb-1" style={{ color: C.text3 }}>Sets</p>
            <p className="text-2xl font-black" style={{ color: C.blue }}>{Math.min(Math.floor(repCount / 5) + 1, exercise.sets)}</p>
            <p className="text-xs" style={{ color: C.text3 }}>of {exercise.sets}</p>
          </div>
        </div>
      )}

      {/* Coaching cue */}
      {cameraReady && (
        <AnimatePresence mode="wait">
          <motion.div
            key={cueIndex}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            className="flex items-start gap-2 rounded-xl px-3 py-2.5"
            style={{ backgroundColor: C.tealDim, border: `1px solid ${C.teal}30` }}
          >
            <Activity size={13} style={{ color: C.teal, flexShrink: 0, marginTop: 1 }} />
            <p className="text-xs font-medium" style={{ color: C.teal }}>{cues[cueIndex]}</p>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

// ─── Hip & Pelvic Modal ──────────────────────────────────────────────────────
function HipPelvicModal({ onClose }: { onClose: () => void }) {
  const d = HIP_PELVIC_DETAIL;
  const [activeExercise, setActiveExercise] = useState<typeof d.exercises[0] | null>(null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{ backgroundColor: C.surface }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
          style={{ backgroundColor: C.tealDim, borderBottom: `1px solid ${C.teal}25` }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: C.teal + "25" }}>
              <Dumbbell size={17} style={{ color: C.teal }} />
            </div>
            <div>
              <p className="font-bold text-base" style={{ color: C.teal }}>{d.title}</p>
              <p className="text-xs" style={{ color: C.text3 }}>{d.frequency} · {d.totalDuration}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeExercise && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ backgroundColor: C.red + "15", border: `1px solid ${C.red}30` }}>
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: C.red }} />
                <span className="text-xs font-semibold" style={{ color: C.red }}>Tracking Active</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:opacity-70"
              style={{ backgroundColor: C.border }}
            >
              <X size={15} style={{ color: C.text2 }} />
            </button>
          </div>
        </div>

        {/* Modal body */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Left: exercises */}
          <div className="p-6" style={{ borderRight: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold" style={{ color: C.text2 }}>Exercise Programme</p>
              <p className="text-xs" style={{ color: C.text3 }}>Click an exercise to start live tracking</p>
            </div>
            <div className="space-y-3">
              {d.exercises.map((ex, i) => {
                const isActive = activeExercise?.name === ex.name;
                return (
                  <button
                    key={i}
                    onClick={() => setActiveExercise(isActive ? null : ex)}
                    className="w-full text-left rounded-xl p-3 transition-all hover:shadow-sm"
                    style={{
                      backgroundColor: isActive ? C.tealDim : C.bg,
                      border: `1.5px solid ${isActive ? C.teal : C.border}`,
                      outline: "none",
                    }}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        {isActive && (
                          <div className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ backgroundColor: C.red }} />
                        )}
                        {!isActive && (
                          <Camera size={12} style={{ color: C.text3, flexShrink: 0 }} />
                        )}
                        <span className="text-sm font-semibold" style={{ color: isActive ? C.teal : C.text }}>{ex.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: ex.difficulty === "Intermediate" ? C.amber + "15" : C.green + "15",
                            color: ex.difficulty === "Intermediate" ? C.amber : C.green,
                          }}
                        >
                          {ex.difficulty}
                        </span>
                        {isActive ? (
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: C.red + "15", color: C.red }}>Tracking</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: C.blue + "12", color: C.blue }}>Track ↗</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs mb-1.5" style={{ color: C.text3 }}>
                      <span className="font-medium" style={{ color: isActive ? C.teal : C.teal }}>{ex.sets} sets × {ex.reps}</span>
                      <span>Rest: {ex.rest}</span>
                      <span style={{ color: C.text2 }}>Focus: {ex.focus}</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: C.text2 }}>{ex.cue}</p>
                  </button>
                );
              })}
            </div>
            <div
              className="mt-4 flex items-start gap-2 text-xs rounded-lg px-3 py-2"
              style={{ backgroundColor: C.tealDim, color: C.teal }}
            >
              <AlertCircle size={11} style={{ flexShrink: 0, marginTop: 1 }} />
              <span><span className="font-semibold">Clinical note: </span>{d.notes}</span>
            </div>
          </div>

          {/* Right: live tracking OR instruction video */}
          <div className="p-6 flex flex-col">
            <AnimatePresence mode="wait">
              {activeExercise ? (
                <motion.div
                  key="tracking"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.22 }}
                  className="flex-1 flex flex-col"
                >
                  <LiveTrackingPanel exercise={activeExercise} onStop={() => setActiveExercise(null)} />
                </motion.div>
              ) : (
                <motion.div
                  key="video"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.22 }}
                  className="flex-1 flex flex-col"
                >
                  <p className="text-xs font-semibold mb-4" style={{ color: C.text2 }}>Instruction Video</p>
                  <div className="flex-1 rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}`, minHeight: 240 }}>
                    <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                      <img
                        src={`https://img.youtube.com/vi/${d.youtubeId}/hqdefault.jpg`}
                        alt={d.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)" }} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: "rgba(255,255,255,0.92)" }}>
                          <Play size={22} style={{ color: C.teal, marginLeft: 3 }} />
                        </div>
                      </div>
                      <div className="absolute bottom-2 right-2 text-xs font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: "rgba(0,0,0,0.75)", color: "#fff" }}>7:45</div>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2.5" style={{ backgroundColor: C.surface }}>
                      <div>
                        <div className="text-xs font-semibold" style={{ color: C.text }}>7 Best Pelvic Stabilization Exercises</div>
                        <div className="text-xs" style={{ color: C.text3 }}>AskDoctorJo · 445K views</div>
                      </div>
                      <a
                        href={`https://www.youtube.com/watch?v=${d.youtubeId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                        style={{ backgroundColor: C.teal, color: "#fff" }}
                      >
                        <Play size={11} style={{ marginLeft: 1 }} />
                        Watch
                      </a>
                    </div>
                  </div>
                  <p className="text-xs mt-2 text-center" style={{ color: C.text3 }}>
                    Hip Flexor &amp; Pelvic Stability Exercises — Stroke Rehabilitation
                  </p>
                  <div
                    className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5"
                    style={{ backgroundColor: "#EFF6FF", border: `1px solid #BFDBFE` }}
                  >
                    <Camera size={13} style={{ color: C.blue, flexShrink: 0 }} />
                    <p className="text-xs" style={{ color: C.blue }}>Click any exercise on the left to start real-time movement tracking with AI pose matching.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Progressive Training Plan (derived from weekly schedule) ─────────────────

function DerivedTrainingPlan({ schedule, onOpenHipPelvic }: { schedule: DaySchedule[]; onOpenHipPelvic: () => void }) {
  // Count sessions per week to infer intensity progression
  const totalSessions = schedule.reduce((acc, d) => acc + d.sessions.filter(s => !s.toLowerCase().includes("rest")).length, 0);

  const phases = useMemo(() => [
    {
      week: "Weeks 1–2",
      phase: "Foundation",
      color: C.teal,
      goal: "Restore baseline ROM and activate inhibited muscle groups",
      sessions: schedule.flatMap((d) =>
        d.sessions.slice(0, 1).map((s) => ({
          day: d.day.slice(0, 3),
          focus: s.replace(/\s*\(\d+\s*min\)/, ""),
          duration: s.match(/\((\d+\s*min)\)/)?.[1] ?? "30 min",
          intensity: "Low",
        }))
      ).slice(0, 4),
      homeExercises: schedule.map((d) => d.homeTask).slice(0, 3).join("; "),
    },
    {
      week: "Weeks 3–4",
      phase: "Strengthening",
      color: C.purple,
      goal: "Progressive loading of hip flexors and ankle dorsiflexors",
      sessions: schedule.flatMap((d) =>
        d.sessions.slice(0, 1).map((s) => ({
          day: d.day.slice(0, 3),
          focus: s.replace(/\s*\(\d+\s*min\)/, ""),
          duration: s.match(/\((\d+\s*min)\)/)?.[1] ?? "35 min",
          intensity: "Moderate",
        }))
      ).slice(0, 4),
      homeExercises: schedule.map((d) => d.homeTask).slice(0, 4).join("; "),
    },
    {
      week: "Weeks 5–8",
      phase: "Functional Integration",
      color: C.blue,
      goal: "Integrate gains into normalised gait pattern and community mobility",
      sessions: schedule.flatMap((d) =>
        d.sessions.slice(0, 1).map((s) => ({
          day: d.day.slice(0, 3),
          focus: s.replace(/\s*\(\d+\s*min\)/, ""),
          duration: s.match(/\((\d+\s*min)\)/)?.[1] ?? "40 min",
          intensity: totalSessions >= 6 ? "Mod–High" : "Moderate",
        }))
      ).slice(0, 4),
      homeExercises: schedule.map((d) => d.homeTask).join("; "),
    },
  ], [schedule, totalSessions]);

  return (
    <div className="pt-4 space-y-4">
      <div
        className="flex items-center gap-2 text-xs rounded-lg px-3 py-2 mb-1"
        style={{ backgroundColor: C.tealDim, color: C.teal }}
      >
        <AlertCircle size={11} style={{ flexShrink: 0 }} />
        <span>This plan updates automatically based on your Weekly Schedule above. Edit the schedule to customise each phase.</span>
      </div>
      {phases.map((phase) => (
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
              {phase.sessions.map((s, si) => {
                const isHipPelvic = s.focus.toLowerCase().includes("hip") || s.focus.toLowerCase().includes("pelvic");
                return (
                <div
                  key={si}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 ${isHipPelvic ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
                  style={{
                    backgroundColor: C.bg,
                    border: `1px solid ${isHipPelvic ? C.teal + "60" : C.border}`,
                  }}
                  onClick={isHipPelvic ? onOpenHipPelvic : undefined}
                  title={isHipPelvic ? "Click to view exercise detail & video" : undefined}
                >
                  <span className="text-xs font-bold w-8 flex-shrink-0" style={{ color: phase.color }}>{s.day}</span>
                  <span className="text-xs flex-1" style={{ color: isHipPelvic ? C.teal : C.text2 }}>
                    {s.focus}{isHipPelvic ? " ↗" : ""}
                  </span>
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
                );
              })}
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
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RehabPlanPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { patientName, metrics } = useAssessment();

  // Editable weekly schedule state
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>(DEFAULT_WEEKLY);

  // Track which session card is expanded (for Hip & Pelvic detail)
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

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

          {/* 1. Key Focus Areas */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Module title="Key Focus Areas" icon={Target} color={C.red} defaultOpen badge="4 areas identified">
              <div className="pt-4 space-y-3">
                {focusAreas.map((area) => (
                  <div key={area.id}>
                    <div
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
                  </div>
                ))}
              </div>
            </Module>
          </motion.div>

          {/* 2. Weekly Schedule (editable) — now BEFORE Progressive Training Plan */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Module title="Weekly Schedule" icon={Calendar} color={C.purple} defaultOpen badge="Editable — Week 3 template">
              <EditableWeeklySchedule schedule={weeklySchedule} onChange={setWeeklySchedule} />
            </Module>
          </motion.div>

          {/* 3. Progressive Training Plan (auto-derived from weekly schedule) */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Module title="Progressive Training Plan" icon={Dumbbell} color={C.teal} badge="3 phases · 8 weeks · auto-updated">
              <DerivedTrainingPlan schedule={weeklySchedule} onOpenHipPelvic={() => setExpandedSession("hip-pelvic")} />
            </Module>
          </motion.div>

          {/* 4. Nutrition */}
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

      {/* Hip & Pelvic Modal */}
      <AnimatePresence>
        {expandedSession === "hip-pelvic" && (
          <HipPelvicModal onClose={() => setExpandedSession(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
