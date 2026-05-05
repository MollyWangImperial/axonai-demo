/**
 * DashboardPage — AxonAI Agent Command Centre
 * Design: Clean light app-shell (#F7F8FA bg, white cards, teal accent)
 * Philosophy: Therapist as supervisor of an AI agent. The agent acts; the therapist approves.
 * Primary surface: "Needs Your Review" queue — AI proposals awaiting human sign-off.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Bell, Search, ChevronRight, CheckCircle2, Clock, AlertTriangle,
  Activity, Users, Zap, Home, TrendingUp, TrendingDown, Minus,
  ArrowRight, Check, X, MessageSquare, Eye, RefreshCw, Brain,
  Shield, BarChart2, Calendar, FileText, LogOut, ChevronDown,
  CircleDot, Flame, Star,
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
  purpleDim:"rgba(124,58,237,0.08)",
  red:      "#DC2626",
  redDim:   "rgba(220,38,38,0.08)",
  amber:    "#D97706",
  amberDim: "rgba(217,119,6,0.08)",
  green:    "#059669",
  greenDim: "rgba(5,150,105,0.08)",
  sidebar:  "#FFFFFF",
};

// ─── Rich mock data for agentic demo ─────────────────────────────────────────

const agentProposals = [
  {
    id: "ap1",
    priority: "high",
    patient: "James Thornton",
    patientId: "p1",
    avatar: "JT",
    avatarColor: C.teal,
    type: "plan_adapt",
    icon: TrendingUp,
    iconColor: C.teal,
    title: "Increase exercise intensity — Week 4 progression",
    reasoning: "Patient completed all Week 3 sessions at RPE ≤ 2/10 for 5 consecutive days. Gait Score improved +8 pts (50→58). Agent recommends advancing to Week 4 protocol: Seated Knee Raise 2×20 → 3×20, add Standing Hip Abduction 2×15.",
    confidence: 94,
    dataPoints: ["5 sessions completed", "Avg RPE 1.8/10", "Gait Score +8 pts", "Pain VAS stable at 2"],
    timestamp: "2 hours ago",
    status: "pending",
  },
  {
    id: "ap2",
    priority: "urgent",
    patient: "Robert Singh",
    patientId: "p3",
    avatar: "RS",
    avatarColor: C.amber,
    type: "escalate",
    icon: AlertTriangle,
    iconColor: C.red,
    title: "Fall risk elevated — recommend urgent review",
    reasoning: "Gait symmetry index dropped from 71% to 58% over the past 3 assessments. Step time variability increased 34%. Patient reported knee pain VAS 7/10 yesterday (baseline: 5). Agent flags possible compensatory gait pattern developing. Manual clinical review recommended.",
    confidence: 88,
    dataPoints: ["Symmetry 71% → 58%", "Step variability +34%", "Pain VAS 7/10 (↑2)", "2 missed sessions"],
    timestamp: "4 hours ago",
    status: "pending",
  },
  {
    id: "ap3",
    priority: "medium",
    patient: "Margaret Ellis",
    patientId: "p2",
    avatar: "ME",
    avatarColor: C.purple,
    type: "schedule",
    icon: Calendar,
    iconColor: C.purple,
    title: "Schedule next assessment — Week 6 checkpoint",
    reasoning: "Patient is entering Week 6 of 8. Per protocol, a mid-programme gait assessment is due. Last assessment was 14 days ago. Agent has pre-generated the assessment request and home video capture instructions. Approve to send to patient.",
    confidence: 99,
    dataPoints: ["Week 6 of 8", "Last assessment: 14 days ago", "Compliance: 92%", "On track for discharge"],
    timestamp: "6 hours ago",
    status: "pending",
  },
  {
    id: "ap4",
    priority: "low",
    patient: "Dorothy Osei",
    patientId: "p4",
    avatar: "DO",
    avatarColor: "#94A3B8",
    type: "engage",
    icon: MessageSquare,
    iconColor: C.blue,
    title: "Low compliance — automated re-engagement message",
    reasoning: "Patient has not submitted a session log in 8 days (compliance: 40%). Agent has drafted a personalised re-engagement message referencing her stated goal ('return to gardening') and offering to simplify the home programme. Approve to send via SMS.",
    confidence: 82,
    dataPoints: ["8 days no activity", "Compliance: 40%", "Last contact: 10 days ago", "Goal: return to gardening"],
    timestamp: "Yesterday",
    status: "pending",
  },
];

const activePatients = [
  {
    id: "p1", name: "James Thornton", age: 68, avatar: "JT", color: C.teal,
    diagnosis: "Post-stroke gait rehabilitation",
    week: 3, totalWeeks: 8, compliance: 87, gaitScore: 58, gaitDelta: +8,
    lastActivity: "Today 9:15am", status: "on_track",
    trend: [42, 47, 51, 55, 58],
    nextAction: "Week 4 plan pending approval",
  },
  {
    id: "p2", name: "Margaret Ellis", age: 72, avatar: "ME", color: C.purple,
    diagnosis: "Hip replacement recovery",
    week: 5, totalWeeks: 8, compliance: 92, gaitScore: 74, gaitDelta: +12,
    lastActivity: "Yesterday 4:30pm", status: "exceeding",
    trend: [55, 60, 65, 70, 74],
    nextAction: "Assessment due in 2 days",
  },
  {
    id: "p3", name: "Robert Singh", age: 61, avatar: "RS", color: C.amber,
    diagnosis: "Knee OA gait retraining",
    week: 2, totalWeeks: 6, compliance: 65, gaitScore: 49, gaitDelta: -3,
    lastActivity: "3 days ago", status: "at_risk",
    trend: [52, 54, 51, 49],
    nextAction: "Urgent review flagged",
  },
  {
    id: "p4", name: "Dorothy Osei", age: 55, avatar: "DO", color: "#94A3B8",
    diagnosis: "Post-fracture rehabilitation",
    week: 1, totalWeeks: 8, compliance: 40, gaitScore: 38, gaitDelta: 0,
    lastActivity: "8 days ago", status: "disengaged",
    trend: [38, 38, 38],
    nextAction: "Re-engagement message pending",
  },
];

const agentStats = [
  { label: "Proposals This Week", value: "12", sub: "4 pending review", icon: Brain, color: C.teal },
  { label: "Patients Monitored", value: "4", sub: "2 require attention", icon: Users, color: C.blue },
  { label: "Actions Approved", value: "8", sub: "this week", icon: CheckCircle2, color: C.green },
  { label: "Avg Response Time", value: "2.4h", sub: "therapist review lag", icon: Clock, color: C.purple },
];

const recentDecisions = [
  { id: 1, time: "Today 11:30am", patient: "James Thornton", action: "Approved", detail: "Week 3 plan progression", type: "approved" },
  { id: 2, time: "Today 9:00am",  patient: "Margaret Ellis",  action: "Approved", detail: "Assessment request sent to patient", type: "approved" },
  { id: 3, time: "Yesterday",     patient: "Robert Singh",    action: "Modified", detail: "Reduced load — therapist adjusted sets from 3 to 2", type: "modified" },
  { id: 4, time: "2 days ago",    patient: "Dorothy Osei",    action: "Rejected", detail: "Re-engagement message — therapist will call instead", type: "rejected" },
  { id: 5, time: "3 days ago",    patient: "James Thornton",  action: "Approved", detail: "Pain spike alert — patient contacted", type: "approved" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    urgent: { label: "Urgent", bg: C.redDim, color: C.red },
    high:   { label: "High",   bg: C.amberDim, color: C.amber },
    medium: { label: "Medium", bg: C.blueDim, color: C.blue },
    low:    { label: "Low",    bg: C.greenDim, color: C.green },
  };
  const s = map[priority] || map.low;
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    on_track:   { label: "On Track",   color: C.green,  bg: C.greenDim },
    exceeding:  { label: "Exceeding",  color: C.teal,   bg: C.tealDim },
    at_risk:    { label: "At Risk",    color: C.red,    bg: C.redDim },
    disengaged: { label: "Disengaged", color: "#94A3B8", bg: "#F1F5F9" },
  };
  const s = map[status] || map.on_track;
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 60, h = 24;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((v - min) / range) * (h - 4) - 2;
        return i === data.length - 1 ? (
          <circle key={i} cx={x} cy={y} r={2.5} fill={color} />
        ) : null;
      })}
    </svg>
  );
}

function AgentProposalCard({ proposal, onApprove, onReject, onModify }: {
  proposal: typeof agentProposals[0];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onModify: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = proposal.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: C.surface,
        border: `1px solid ${C.border}`,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      {/* Priority stripe */}
      <div className="h-0.5 w-full" style={{
        backgroundColor: proposal.priority === "urgent" ? C.red
          : proposal.priority === "high" ? C.amber
          : proposal.priority === "medium" ? C.blue : C.green
      }} />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3">
          {/* Patient avatar */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ backgroundColor: proposal.avatarColor }}
          >
            {proposal.avatar}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="text-xs font-semibold" style={{ color: proposal.avatarColor }}>{proposal.patient}</span>
              <PriorityBadge priority={proposal.priority} />
              <span className="text-xs" style={{ color: C.text3 }}>{proposal.timestamp}</span>
            </div>
            <div className="flex items-start gap-2">
              <Icon size={14} style={{ color: proposal.iconColor, marginTop: 2, flexShrink: 0 }} />
              <p className="text-sm font-semibold leading-snug" style={{ color: C.text }}>{proposal.title}</p>
            </div>
          </div>

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1 rounded-lg transition-colors hover:bg-gray-100 flex-shrink-0"
          >
            <ChevronDown size={15} style={{
              color: C.text3,
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }} />
          </button>
        </div>

        {/* Expandable reasoning */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 ml-12">
                {/* Agent reasoning */}
                <div
                  className="rounded-xl p-3 mb-3 text-xs leading-relaxed"
                  style={{ backgroundColor: "#F8FAFC", border: `1px solid ${C.border}`, color: C.text2 }}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Brain size={11} style={{ color: C.teal }} />
                    <span className="font-semibold text-xs" style={{ color: C.teal }}>Agent Reasoning</span>
                    <span className="ml-auto text-xs font-semibold" style={{ color: C.green }}>
                      {proposal.confidence}% confidence
                    </span>
                  </div>
                  {proposal.reasoning}
                </div>

                {/* Data points */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {proposal.dataPoints.map((dp, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: C.tealDim, color: C.teal }}
                    >
                      {dp}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-3 ml-12">
          <button
            onClick={() => onApprove(proposal.id)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
            style={{ backgroundColor: C.teal, color: "#fff" }}
          >
            <Check size={11} />
            Approve
          </button>
          <button
            onClick={() => onModify(proposal.id)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
            style={{ backgroundColor: C.blueDim, color: C.blue, border: `1px solid ${C.blue}22` }}
          >
            <FileText size={11} />
            Modify
          </button>
          <button
            onClick={() => onReject(proposal.id)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
            style={{ backgroundColor: C.redDim, color: C.red, border: `1px solid ${C.red}22` }}
          >
            <X size={11} />
            Reject
          </button>
          <button
            onClick={() => setExpanded(v => !v)}
            className="ml-auto flex items-center gap-1 text-xs"
            style={{ color: C.text3 }}
          >
            <Eye size={11} />
            {expanded ? "Less" : "View reasoning"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [proposals, setProposals] = useState(agentProposals);
  const [decisions, setDecisions] = useState(recentDecisions);
  const [activeTab, setActiveTab] = useState<"review" | "monitoring" | "log">("review");
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);

  const pendingCount = proposals.filter(p => p.status === "pending").length;
  const urgentCount = proposals.filter(p => p.priority === "urgent" && p.status === "pending").length;

  function handleApprove(id: string) {
    const p = proposals.find(x => x.id === id);
    if (!p) return;
    setProposals(prev => prev.filter(x => x.id !== id));
    setDecisions(prev => [{
      id: Date.now(), time: "Just now", patient: p.patient,
      action: "Approved", detail: p.title, type: "approved",
    }, ...prev]);
  }

  function handleReject(id: string) {
    const p = proposals.find(x => x.id === id);
    if (!p) return;
    setProposals(prev => prev.filter(x => x.id !== id));
    setDecisions(prev => [{
      id: Date.now(), time: "Just now", patient: p.patient,
      action: "Rejected", detail: p.title, type: "rejected",
    }, ...prev]);
  }

  function handleModify(id: string) {
    const p = proposals.find(x => x.id === id);
    if (!p) return;
    setProposals(prev => prev.filter(x => x.id !== id));
    setDecisions(prev => [{
      id: Date.now(), time: "Just now", patient: p.patient,
      action: "Modified", detail: p.title + " — therapist edited", type: "modified",
    }, ...prev]);
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: C.bg, fontFamily: "'Inter', sans-serif" }}>

      {/* ── Sidebar ── */}
      <aside
        className="w-56 flex-shrink-0 flex flex-col border-r"
        style={{ backgroundColor: C.sidebar, borderColor: C.border, minHeight: "100vh" }}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b" style={{ borderColor: C.border }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: C.teal }}>
              <Zap size={14} color="#fff" />
            </div>
            <span className="font-bold text-sm tracking-tight" style={{ color: C.text }}>AxonAI</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {[
            { icon: Brain,    label: "Command Centre", tab: "review",     badge: pendingCount },
            { icon: Activity, label: "Monitoring",     tab: "monitoring", badge: 0 },
            { icon: FileText, label: "Decision Log",   tab: "log",        badge: 0 },
          ].map(item => {
            const Icon = item.icon;
            const active = activeTab === item.tab;
            return (
              <button
                key={item.tab}
                onClick={() => setActiveTab(item.tab as any)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  backgroundColor: active ? C.tealDim : "transparent",
                  color: active ? C.teal : C.text2,
                }}
              >
                <Icon size={15} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge > 0 && (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: C.teal, color: "#fff" }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-3 mt-3 border-t" style={{ borderColor: C.border }}>
            {[
              { icon: Users,    label: "Patients",    onClick: () => {} },
              { icon: Calendar, label: "Schedule",    onClick: () => {} },
              { icon: BarChart2,label: "Analytics",   onClick: () => {} },
            ].map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:bg-gray-50"
                  style={{ color: C.text2 }}
                >
                  <Icon size={15} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* User */}
        <div className="px-3 pb-4 border-t pt-3" style={{ borderColor: C.border }}>
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl" style={{ backgroundColor: C.bg }}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: C.teal }}
            >
              {user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "DR"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate" style={{ color: C.text }}>{user?.name || "Dr. Erisa"}</div>
              <div className="text-xs truncate" style={{ color: C.text3 }}>Physiotherapist</div>
            </div>
            <button onClick={() => { logout(); navigate("/login"); }} className="hover:opacity-60 transition-opacity">
              <LogOut size={13} style={{ color: C.text3 }} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header
          className="flex items-center gap-4 px-6 py-3.5 border-b"
          style={{ backgroundColor: C.surface, borderColor: C.border }}
        >
          <div className="flex-1">
            <h1 className="text-base font-bold" style={{ color: C.text }}>
              {activeTab === "review"     ? "Agent Command Centre" :
               activeTab === "monitoring" ? "Patient Monitoring" :
               "Decision Log"}
            </h1>
            <p className="text-xs" style={{ color: C.text3 }}>
              {activeTab === "review"     ? `${pendingCount} proposals awaiting your review${urgentCount > 0 ? ` · ${urgentCount} urgent` : ""}` :
               activeTab === "monitoring" ? "Live status across all active patients" :
               "Full audit trail of agent decisions"}
            </p>
          </div>

          {/* Search */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm"
            style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, width: 200 }}
          >
            <Search size={13} style={{ color: C.text3 }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search patients…"
              className="flex-1 bg-transparent outline-none text-xs"
              style={{ color: C.text }}
            />
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(v => !v)}
              className="relative p-2 rounded-xl transition-colors hover:bg-gray-100"
            >
              <Bell size={16} style={{ color: C.text2 }} />
              {urgentCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ backgroundColor: C.red }} />
              )}
            </button>
          </div>

          {/* Quick nav */}
          <button
            onClick={() => navigate("/upload")}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
            style={{ backgroundColor: C.teal, color: "#fff" }}
          >
            <Zap size={11} />
            New Assessment
          </button>
        </header>

        {/* ── Agent stats bar ── */}
        <div
          className="grid grid-cols-4 gap-0 border-b"
          style={{ backgroundColor: C.surface, borderColor: C.border }}
        >
          {agentStats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                className="flex items-center gap-3 px-6 py-3.5"
                style={{ borderRight: i < 3 ? `1px solid ${C.border}` : "none" }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: stat.color + "15" }}
                >
                  <Icon size={15} style={{ color: stat.color }} />
                </div>
                <div>
                  <div className="text-lg font-bold leading-none mb-0.5" style={{ color: C.text }}>{stat.value}</div>
                  <div className="text-xs" style={{ color: C.text3 }}>{stat.label}</div>
                  <div className="text-xs font-medium" style={{ color: stat.color }}>{stat.sub}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Tab content ── */}
        <div className="flex-1 overflow-auto p-6">
          <AnimatePresence mode="wait">

            {/* ── NEEDS REVIEW TAB ── */}
            {activeTab === "review" && (
              <motion.div
                key="review"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-3 gap-6"
              >
                {/* Left: proposal queue (2/3 width) */}
                <div className="col-span-2 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-sm font-bold" style={{ color: C.text }}>
                      Needs Your Review
                      {proposals.filter(p => p.status === "pending").length > 0 && (
                        <span
                          className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: C.teal, color: "#fff" }}
                        >
                          {proposals.filter(p => p.status === "pending").length}
                        </span>
                      )}
                    </h2>
                    <button className="flex items-center gap-1 text-xs" style={{ color: C.text3 }}>
                      <RefreshCw size={11} />
                      Refresh
                    </button>
                  </div>

                  <AnimatePresence>
                    {proposals.filter(p => p.status === "pending").length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="rounded-2xl p-12 text-center"
                        style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
                      >
                        <CheckCircle2 size={32} style={{ color: C.green, margin: "0 auto 12px" }} />
                        <p className="text-sm font-semibold" style={{ color: C.text }}>All caught up</p>
                        <p className="text-xs mt-1" style={{ color: C.text3 }}>No pending proposals. The agent is monitoring your patients.</p>
                      </motion.div>
                    ) : (
                      proposals
                        .filter(p => p.status === "pending")
                        .sort((a, b) => {
                          const order = { urgent: 0, high: 1, medium: 2, low: 3 };
                          return (order[a.priority as keyof typeof order] ?? 3) - (order[b.priority as keyof typeof order] ?? 3);
                        })
                        .map(p => (
                          <AgentProposalCard
                            key={p.id}
                            proposal={p}
                            onApprove={handleApprove}
                            onReject={handleReject}
                            onModify={handleModify}
                          />
                        ))
                    )}
                  </AnimatePresence>
                </div>

                {/* Right: recent decisions + quick patient status */}
                <div className="space-y-4">
                  {/* Recent decisions */}
                  <div
                    className="rounded-2xl p-4"
                    style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
                  >
                    <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>Recent Decisions</h3>
                    <div className="space-y-2.5">
                      {decisions.slice(0, 5).map(d => (
                        <div key={d.id} className="flex items-start gap-2.5">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{
                              backgroundColor:
                                d.type === "approved" ? C.greenDim :
                                d.type === "modified" ? C.blueDim : C.redDim,
                            }}
                          >
                            {d.type === "approved" ? <Check size={9} style={{ color: C.green }} /> :
                             d.type === "modified" ? <FileText size={9} style={{ color: C.blue }} /> :
                             <X size={9} style={{ color: C.red }} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold truncate" style={{ color: C.text }}>{d.patient}</div>
                            <div className="text-xs truncate" style={{ color: C.text3 }}>{d.detail}</div>
                            <div className="text-xs" style={{ color: C.text3 }}>{d.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick patient status */}
                  <div
                    className="rounded-2xl p-4"
                    style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
                  >
                    <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>Patient Overview</h3>
                    <div className="space-y-2.5">
                      {activePatients.map(p => (
                        <div
                          key={p.id}
                          className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => navigate("/report")}
                        >
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ backgroundColor: p.color }}
                          >
                            {p.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold truncate" style={{ color: C.text }}>{p.name}</div>
                            <div className="text-xs" style={{ color: C.text3 }}>Wk {p.week}/{p.totalWeeks} · {p.compliance}% compliance</div>
                          </div>
                          <StatusBadge status={p.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── MONITORING TAB ── */}
            {activeTab === "monitoring" && (
              <motion.div
                key="monitoring"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  {activePatients.map((p, idx) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="rounded-2xl p-5 cursor-pointer hover:shadow-md transition-shadow"
                      style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
                      onClick={() => navigate("/report")}
                    >
                      {/* Patient header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                            style={{ backgroundColor: p.color }}
                          >
                            {p.avatar}
                          </div>
                          <div>
                            <div className="text-sm font-bold" style={{ color: C.text }}>{p.name}</div>
                            <div className="text-xs" style={{ color: C.text3 }}>{p.diagnosis}</div>
                          </div>
                        </div>
                        <StatusBadge status={p.status} />
                      </div>

                      {/* Metrics row */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="text-center">
                          <div className="text-lg font-bold" style={{ color: C.text }}>{p.gaitScore}</div>
                          <div className="text-xs" style={{ color: C.text3 }}>Gait Score</div>
                          <div
                            className="text-xs font-semibold flex items-center justify-center gap-0.5"
                            style={{ color: p.gaitDelta > 0 ? C.green : p.gaitDelta < 0 ? C.red : C.text3 }}
                          >
                            {p.gaitDelta > 0 ? <TrendingUp size={10} /> : p.gaitDelta < 0 ? <TrendingDown size={10} /> : <Minus size={10} />}
                            {p.gaitDelta > 0 ? "+" : ""}{p.gaitDelta}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold" style={{ color: C.text }}>{p.compliance}%</div>
                          <div className="text-xs" style={{ color: C.text3 }}>Compliance</div>
                          <div className="h-1 rounded-full mt-1 mx-2" style={{ backgroundColor: C.border }}>
                            <div className="h-full rounded-full" style={{ width: `${p.compliance}%`, backgroundColor: p.compliance >= 80 ? C.green : p.compliance >= 60 ? C.amber : C.red }} />
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold" style={{ color: C.text }}>Wk {p.week}</div>
                          <div className="text-xs" style={{ color: C.text3 }}>of {p.totalWeeks}</div>
                          <div className="h-1 rounded-full mt-1 mx-2" style={{ backgroundColor: C.border }}>
                            <div className="h-full rounded-full" style={{ width: `${(p.week / p.totalWeeks) * 100}%`, backgroundColor: p.color }} />
                          </div>
                        </div>
                      </div>

                      {/* Sparkline */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-medium mb-1" style={{ color: C.text3 }}>Gait score trend</div>
                          <MiniSparkline data={p.trend} color={p.color} />
                        </div>
                        <div className="text-right">
                          <div className="text-xs" style={{ color: C.text3 }}>Last activity</div>
                          <div className="text-xs font-semibold" style={{ color: C.text }}>{p.lastActivity}</div>
                          <div className="text-xs mt-1" style={{ color: p.color }}>{p.nextAction}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── DECISION LOG TAB ── */}
            {activeTab === "log" && (
              <motion.div
                key="log"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
                >
                  {/* Table header */}
                  <div
                    className="grid grid-cols-5 gap-4 px-5 py-3 text-xs font-semibold border-b"
                    style={{ backgroundColor: C.bg, borderColor: C.border, color: C.text3 }}
                  >
                    <div>Time</div>
                    <div>Patient</div>
                    <div>Agent Proposal</div>
                    <div>Therapist Decision</div>
                    <div>Detail</div>
                  </div>

                  {/* All decisions */}
                  {[...decisions, ...recentDecisions.slice(decisions.length)].map((d, i) => (
                    <div
                      key={d.id}
                      className="grid grid-cols-5 gap-4 px-5 py-3.5 text-xs border-b items-center"
                      style={{ borderColor: C.border, backgroundColor: i % 2 === 0 ? C.surface : "#FAFBFC" }}
                    >
                      <div style={{ color: C.text3 }}>{d.time}</div>
                      <div className="font-semibold" style={{ color: C.text }}>{d.patient}</div>
                      <div style={{ color: C.text2 }}>{d.detail}</div>
                      <div>
                        <span
                          className="px-2 py-0.5 rounded-full font-semibold"
                          style={{
                            backgroundColor:
                              d.type === "approved" ? C.greenDim :
                              d.type === "modified" ? C.blueDim : C.redDim,
                            color:
                              d.type === "approved" ? C.green :
                              d.type === "modified" ? C.blue : C.red,
                          }}
                        >
                          {d.action}
                        </span>
                      </div>
                      <div style={{ color: C.text3 }}>
                        {d.type === "approved" ? "Executed automatically" :
                         d.type === "modified" ? "Therapist edited before approval" :
                         "Agent proposal discarded"}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
