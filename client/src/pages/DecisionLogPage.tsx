/**
 * DecisionLogPage — AxonAI Agent Decision Audit Log
 * Design: Clean light app-shell (#F7F8FA bg, white cards, teal/blue accents)
 * Shows every autonomous agent action across all patients with therapist approval status
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft, Bot, CheckCircle2, XCircle, Clock, Filter,
  TrendingUp, TrendingDown, AlertTriangle, Zap, User,
  ChevronDown, ChevronRight, LayoutGrid, Search,
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

type DecisionStatus = "approved" | "dismissed" | "pending" | "auto-applied";
type DecisionType = "plan-adapt" | "escalation" | "alert" | "milestone" | "schedule";

interface AgentDecision {
  id: string;
  timestamp: string;
  patient: string;
  patientId: string;
  type: DecisionType;
  title: string;
  rationale: string;
  dataSignal: string;
  proposedAction: string;
  impact: string;
  status: DecisionStatus;
  therapistNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

const DECISIONS: AgentDecision[] = [
  {
    id: "d001",
    timestamp: "2026-05-05 09:14",
    patient: "James Thornton",
    patientId: "PT-001",
    type: "plan-adapt",
    title: "Increase Hip Flexor Stretch intensity",
    rationale: "Gait speed improved +0.08 m/s over 7 days (0.65 → 0.73 m/s). Hip flexion ROM increased from 15° to 19°. Patient has completed 100% of prescribed sessions this week.",
    dataSignal: "Gait speed +12.3% · Hip ROM +4° · Compliance 100%",
    proposedAction: "Progress Hip Flexor Stretch from 3×30s to 4×45s hold with resistance band. Maintain all other exercises unchanged.",
    impact: "Estimated +12% additional ROM gain over next 2 weeks based on progression model.",
    status: "pending",
  },
  {
    id: "d002",
    timestamp: "2026-05-04 16:42",
    patient: "James Thornton",
    patientId: "PT-001",
    type: "alert",
    title: "Pain spike detected — reduce Balance Training load",
    rationale: "Patient reported Pain VAS 6/10 after Tuesday balance session (previous average: 2.4/10). Gait variability increased 18% in post-session recording, suggesting fatigue-related compensation.",
    dataSignal: "Pain VAS 6/10 (↑ from 2.4 avg) · Gait variability +18%",
    proposedAction: "Reduce balance sessions from 4×/week to 3×/week. Add 10-min rest period between balance and gait exercises. Flag for therapist review.",
    impact: "Reduces overload injury risk. Maintains weekly volume within safe progression threshold.",
    status: "approved",
    reviewedBy: "Dr. Erisa",
    reviewedAt: "2026-05-04 17:05",
    therapistNote: "Agreed — patient mentioned knee discomfort. Will reassess Friday.",
  },
  {
    id: "d003",
    timestamp: "2026-05-04 08:00",
    patient: "Margaret Chen",
    patientId: "PT-002",
    type: "milestone",
    title: "Week 4 milestone reached — advance to Phase 2",
    rationale: "Patient has achieved all Week 4 criteria: single-leg stance >8s (achieved: 9.2s), gait speed >0.8 m/s (achieved: 0.84 m/s), and 90% session compliance over 4 weeks.",
    dataSignal: "Single-leg stance 9.2s · Gait speed 0.84 m/s · Compliance 91%",
    proposedAction: "Automatically advance rehabilitation plan to Phase 2 (Strengthening). Introduce stair climbing and outdoor walking tasks.",
    impact: "Progresses patient toward functional independence milestone 1 week ahead of schedule.",
    status: "auto-applied",
  },
  {
    id: "d004",
    timestamp: "2026-05-03 14:22",
    patient: "Robert Okafor",
    patientId: "PT-003",
    type: "escalation",
    title: "Compliance drop — escalate to therapist",
    rationale: "Patient has completed only 2/7 scheduled sessions this week (29% compliance, down from 78% last week). No pain or adverse events reported. Pattern consistent with motivational barrier.",
    dataSignal: "Compliance 29% (↓ from 78%) · 5 missed sessions",
    proposedAction: "Send automated check-in message to patient. Flag for therapist call within 24 hours. Do not modify plan until cause is established.",
    impact: "Early intervention prevents rehabilitation regression. Each week of non-compliance at this stage estimated to delay recovery by 1.3 weeks.",
    status: "approved",
    reviewedBy: "Dr. Erisa",
    reviewedAt: "2026-05-03 15:10",
    therapistNote: "Called patient — work schedule conflict. Adjusted session times to evenings.",
  },
  {
    id: "d005",
    timestamp: "2026-05-03 09:00",
    patient: "James Thornton",
    patientId: "PT-001",
    type: "schedule",
    title: "Add Stair Climbing to Friday session",
    rationale: "Single-leg stance time improved to 7.1s (target threshold: 8s). Patient is within 12% of the functional criterion for stair training introduction per Week 4 progression protocol.",
    dataSignal: "Single-leg stance 7.1s (target: 8s) · Balance score 74/100",
    proposedAction: "Add 2×10-step stair ascent/descent to Friday Functional Movement session. Duration: +10 min.",
    impact: "Advances functional independence milestone. Prepares patient for community mobility discharge criteria.",
    status: "pending",
  },
  {
    id: "d006",
    timestamp: "2026-05-02 11:30",
    patient: "Margaret Chen",
    patientId: "PT-002",
    type: "plan-adapt",
    title: "Reduce Ankle Dorsiflexion load — plateau detected",
    rationale: "Ankle dorsiflexion ROM has not changed over 10 days (stable at 8°). Plateau pattern detected. Current exercise volume may be insufficient stimulus; alternative exercise modality recommended.",
    dataSignal: "Ankle ROM 8° (unchanged 10 days) · Plateau confidence: 87%",
    proposedAction: "Replace calf stretch with eccentric heel drop protocol (3×15 reps). Add ankle mobilisation with resistance band 3×/week.",
    impact: "Eccentric loading has 2.3× higher ROM improvement rate in plateau cases per clinical literature.",
    status: "dismissed",
    reviewedBy: "Dr. Erisa",
    reviewedAt: "2026-05-02 13:45",
    therapistNote: "Patient has history of Achilles tendinopathy — eccentric loading contraindicated. Will try manual therapy instead.",
  },
  {
    id: "d007",
    timestamp: "2026-05-01 08:00",
    patient: "Robert Okafor",
    patientId: "PT-003",
    type: "milestone",
    title: "Week 2 assessment due — request video upload",
    rationale: "Patient is 14 days into rehabilitation programme. Scheduled 2-week assessment checkpoint. Last gait analysis: 2 weeks ago.",
    dataSignal: "Days since last assessment: 14 · Scheduled checkpoint: Week 2",
    proposedAction: "Send automated notification to patient requesting new gait video upload. Schedule therapist review for 48 hours after upload.",
    impact: "Maintains assessment cadence. Enables timely plan adjustment based on objective progress data.",
    status: "auto-applied",
  },
];

const TYPE_CONFIG: Record<DecisionType, { label: string; color: string; icon: React.ElementType }> = {
  "plan-adapt": { label: "Plan Adaptation",  color: C.purple, icon: Zap },
  "escalation":  { label: "Escalation",       color: C.red,    icon: AlertTriangle },
  "alert":       { label: "Alert",            color: C.amber,  icon: AlertTriangle },
  "milestone":   { label: "Milestone",        color: C.teal,   icon: TrendingUp },
  "schedule":    { label: "Schedule Change",  color: C.blue,   icon: LayoutGrid },
};

const STATUS_CONFIG: Record<DecisionStatus, { label: string; color: string; icon: React.ElementType }> = {
  "approved":     { label: "Approved",      color: C.green,  icon: CheckCircle2 },
  "dismissed":    { label: "Dismissed",     color: C.red,    icon: XCircle },
  "pending":      { label: "Pending Review",color: C.amber,  icon: Clock },
  "auto-applied": { label: "Auto-Applied",  color: C.teal,   icon: Bot },
};

function DecisionCard({ d }: { d: AgentDecision }) {
  const [expanded, setExpanded] = useState(d.status === "pending");
  const type = TYPE_CONFIG[d.type];
  const status = STATUS_CONFIG[d.status];
  const StatusIcon = status.icon;
  const TypeIcon = type.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: C.surface,
        border: `1px solid ${d.status === "pending" ? C.amber + "50" : C.border}`,
        boxShadow: d.status === "pending" ? `0 0 0 2px ${C.amber}18` : "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      {/* Card header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        {/* Type icon */}
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ backgroundColor: type.color + "15" }}
        >
          <TypeIcon size={14} style={{ color: type.color }} />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1.5 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold" style={{ color: C.text }}>{d.title}</span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                style={{ backgroundColor: type.color + "12", color: type.color }}
              >
                {type.label}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ backgroundColor: status.color + "12", color: status.color }}
              >
                <StatusIcon size={11} />
                {status.label}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs flex-wrap" style={{ color: C.text3 }}>
            <span className="flex items-center gap-1">
              <User size={10} />
              {d.patient} ({d.patientId})
            </span>
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {d.timestamp}
            </span>
            <span className="font-medium" style={{ color: type.color }}>{d.dataSignal}</span>
          </div>
        </div>

        {/* Expand chevron */}
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 mt-1"
        >
          <ChevronDown size={15} style={{ color: C.text3 }} />
        </motion.div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-5 pb-5"
          style={{ borderTop: `1px solid ${C.border}` }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            {/* Left: rationale + proposed action */}
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: C.text2 }}>Agent Rationale</p>
                <p className="text-xs leading-relaxed" style={{ color: C.text2 }}>{d.rationale}</p>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: C.text2 }}>Proposed Action</p>
                <div
                  className="text-xs leading-relaxed rounded-lg px-3 py-2"
                  style={{ backgroundColor: type.color + "08", color: C.text2, border: `1px solid ${type.color}20` }}
                >
                  {d.proposedAction}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: C.text2 }}>Estimated Impact</p>
                <p className="text-xs font-medium" style={{ color: type.color }}>→ {d.impact}</p>
              </div>
            </div>

            {/* Right: review status */}
            <div>
              {(d.status === "approved" || d.status === "dismissed") && (
                <div
                  className="rounded-xl p-4 h-full"
                  style={{
                    backgroundColor: d.status === "approved" ? C.green + "06" : C.red + "06",
                    border: `1px solid ${d.status === "approved" ? C.green + "25" : C.red + "25"}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <StatusIcon size={13} style={{ color: status.color }} />
                    <span className="text-xs font-bold" style={{ color: status.color }}>
                      {d.status === "approved" ? "Approved" : "Dismissed"} by {d.reviewedBy}
                    </span>
                  </div>
                  <p className="text-xs mb-2" style={{ color: C.text3 }}>{d.reviewedAt}</p>
                  {d.therapistNote && (
                    <div
                      className="rounded-lg px-3 py-2 text-xs leading-relaxed italic"
                      style={{ backgroundColor: C.surface, color: C.text2, border: `1px solid ${C.border}` }}
                    >
                      "{d.therapistNote}"
                    </div>
                  )}
                </div>
              )}
              {d.status === "auto-applied" && (
                <div
                  className="rounded-xl p-4"
                  style={{ backgroundColor: C.tealDim, border: `1px solid ${C.teal}25` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Bot size={13} style={{ color: C.teal }} />
                    <span className="text-xs font-bold" style={{ color: C.teal }}>Auto-applied by AxonAI Agent</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: C.text2 }}>
                    This action was within the agent's autonomous authority scope (routine milestone progression / scheduled check-in). No therapist approval required per protocol.
                  </p>
                </div>
              )}
              {d.status === "pending" && (
                <div
                  className="rounded-xl p-4"
                  style={{ backgroundColor: C.amber + "08", border: `1px solid ${C.amber}30` }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={13} style={{ color: C.amber }} />
                    <span className="text-xs font-bold" style={{ color: C.amber }}>Awaiting therapist review</span>
                  </div>
                  <p className="text-xs mb-4 leading-relaxed" style={{ color: C.text2 }}>
                    This proposal requires your approval before the agent applies it to the patient's plan.
                  </p>
                  <div className="flex gap-2">
                    <button
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg font-semibold transition-all hover:opacity-80"
                      style={{ backgroundColor: C.green + "15", color: C.green, border: `1px solid ${C.green}30` }}
                    >
                      <CheckCircle2 size={12} /> Approve
                    </button>
                    <button
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg font-semibold transition-all hover:opacity-80"
                      style={{ backgroundColor: C.red + "10", color: C.red, border: `1px solid ${C.red}25` }}
                    >
                      <XCircle size={12} /> Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function DecisionLogPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState<DecisionStatus | "all">("all");
  const [filterPatient, setFilterPatient] = useState<string>("all");
  const [search, setSearch] = useState("");

  const patients = Array.from(new Set(DECISIONS.map((d) => d.patient)));

  const filtered = DECISIONS.filter((d) => {
    if (filterStatus !== "all" && d.status !== filterStatus) return false;
    if (filterPatient !== "all" && d.patient !== filterPatient) return false;
    if (search && !d.title.toLowerCase().includes(search.toLowerCase()) && !d.patient.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    pending: DECISIONS.filter((d) => d.status === "pending").length,
    approved: DECISIONS.filter((d) => d.status === "approved").length,
    dismissed: DECISIONS.filter((d) => d.status === "dismissed").length,
    autoApplied: DECISIONS.filter((d) => d.status === "auto-applied").length,
  };

  return (
    <div className="app-shell min-h-screen" style={{ backgroundColor: C.bg, color: C.text }}>
      {/* Navbar */}
      <nav
        className="sticky top-0 z-30 flex items-center justify-between px-6 py-3"
        style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-60"
            style={{ color: C.text2 }}
          >
            <ArrowLeft size={15} />
            Command Centre
          </button>
          <div className="w-px h-4" style={{ backgroundColor: C.border }} />
          <span className="font-black tracking-widest text-base" style={{ color: C.teal }}>AXONAI</span>
          <span className="text-xs hidden sm:block" style={{ color: C.text3 }}>/ Decision Log</span>
        </div>
        <div className="flex items-center gap-2 text-sm" style={{ color: C.text2 }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: C.tealDim }}>
            <User size={14} style={{ color: C.teal }} />
          </div>
          <span className="hidden sm:block text-xs">{user?.name}</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4"
            style={{ backgroundColor: C.purple + "12", color: C.purple }}
          >
            <Bot size={12} />
            Agent Audit Trail
          </div>
          <h1 className="text-3xl font-black mb-2" style={{ color: C.text }}>Decision Log</h1>
          <p className="text-sm max-w-2xl" style={{ color: C.text2 }}>
            Every autonomous action proposed or taken by the AxonAI agent — with full rationale, data signals, and therapist review status. All decisions are auditable and reversible.
          </p>
        </motion.div>

        {/* Summary stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
        >
          {[
            { label: "Pending Review", value: counts.pending,    color: C.amber,  icon: Clock },
            { label: "Approved",       value: counts.approved,   color: C.green,  icon: CheckCircle2 },
            { label: "Dismissed",      value: counts.dismissed,  color: C.red,    icon: XCircle },
            { label: "Auto-Applied",   value: counts.autoApplied,color: C.teal,   icon: Bot },
          ].map((stat) => (
            <button
              key={stat.label}
              onClick={() => setFilterStatus(filterStatus === stat.label.toLowerCase().replace(" ", "-") as DecisionStatus ? "all" : stat.label.toLowerCase().replace(/ /g, "-") as DecisionStatus)}
              className="rounded-2xl p-4 text-left transition-all hover:shadow-sm"
              style={{
                backgroundColor: C.surface,
                border: `1px solid ${C.border}`,
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <stat.icon size={13} style={{ color: stat.color }} />
                <span className="text-xs" style={{ color: C.text3 }}>{stat.label}</span>
              </div>
              <p className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</p>
            </button>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center gap-3 mb-6"
        >
          {/* Search */}
          <div
            className="flex items-center gap-2 flex-1 min-w-48 rounded-xl px-3 py-2"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
          >
            <Search size={13} style={{ color: C.text3 }} />
            <input
              type="text"
              placeholder="Search decisions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-xs bg-transparent outline-none"
              style={{ color: C.text }}
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <Filter size={12} style={{ color: C.text3 }} />
            {(["all", "pending", "approved", "dismissed", "auto-applied"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className="text-xs px-2.5 py-1 rounded-lg font-medium transition-all"
                style={{
                  backgroundColor: filterStatus === s ? C.purple + "15" : C.surface,
                  color: filterStatus === s ? C.purple : C.text3,
                  border: `1px solid ${filterStatus === s ? C.purple + "30" : C.border}`,
                }}
              >
                {s === "all" ? "All" : s === "auto-applied" ? "Auto" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {/* Patient filter */}
          <select
            value={filterPatient}
            onChange={(e) => setFilterPatient(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl outline-none"
            style={{
              backgroundColor: C.surface,
              border: `1px solid ${C.border}`,
              color: C.text2,
            }}
          >
            <option value="all">All patients</option>
            {patients.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </motion.div>

        {/* Decision cards */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16" style={{ color: C.text3 }}>
              <Bot size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No decisions match your filters.</p>
            </div>
          ) : (
            filtered.map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <DecisionCard d={d} />
              </motion.div>
            ))
          )}
        </div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xs text-center mt-8 px-4"
          style={{ color: C.text3 }}
        >
          All agent decisions are logged immutably for clinical governance and audit purposes. Therapist approvals and dismissals are timestamped and attributed. Auto-applied actions are limited to pre-approved protocol steps.
        </motion.p>
      </div>
    </div>
  );
}
