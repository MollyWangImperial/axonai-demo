/**
 * DashboardPage — AxonAI Therapist Workspace
 * Design: Clean light app-shell (#F7F8FA bg, white cards, teal accent)
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  ArrowLeft, Bell, Search, User, ChevronRight, MessageSquare,
  Settings, TrendingUp, AlertTriangle, CheckCircle2, Clock,
  Activity, Users, Zap, Home, MoreHorizontal, Send,
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
  sidebar: "#FFFFFF",
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const patients = [
  { id: "p1", name: "James Thornton",  age: 68, diagnosis: "Post-stroke gait rehabilitation", status: "active",   compliance: 87, week: 3, totalWeeks: 8, sessions: 14, avgSession: 24, pain: 3, gaitScore: 58, avatar: "JT", color: C.teal },
  { id: "p2", name: "Margaret Ellis",  age: 72, diagnosis: "Hip replacement recovery",         status: "active",   compliance: 92, week: 5, totalWeeks: 8, sessions: 22, avgSession: 31, pain: 2, gaitScore: 74, avatar: "ME", color: C.purple },
  { id: "p3", name: "Robert Singh",    age: 61, diagnosis: "Knee OA gait retraining",           status: "pending",  compliance: 65, week: 2, totalWeeks: 6, sessions: 6,  avgSession: 18, pain: 5, gaitScore: 49, avatar: "RS", color: C.amber },
  { id: "p4", name: "Dorothy Osei",    age: 55, diagnosis: "Post-fracture rehabilitation",      status: "inactive", compliance: 40, week: 1, totalWeeks: 8, sessions: 3,  avgSession: 12, pain: 4, gaitScore: 38, avatar: "DO", color: "#94A3B8" },
];

const exerciseProgress = [
  { week: "Wk 1", target: 100, actual: 45 },
  { week: "Wk 2", target: 100, actual: 62 },
  { week: "Wk 3", target: 100, actual: 87 },
  { week: "Wk 4", target: 100, actual: null },
  { week: "Wk 5", target: 100, actual: null },
  { week: "Wk 6", target: 100, actual: null },
  { week: "Wk 7", target: 100, actual: null },
  { week: "Wk 8", target: 100, actual: null },
];

const gaitScoreTrend = [
  { session: "Assessment 1", score: 42, target: 80 },
  { session: "Assessment 2", score: 51, target: 80 },
  { session: "Assessment 3", score: 58, target: 80 },
];

const activityFeed = [
  { id: 1, time: "Today 9:15am",  patient: "James Thornton",  action: "completed",  detail: "Sit-to-Stand × 3 sets, 10 reps",                    type: "success" },
  { id: 2, time: "Yesterday",     patient: "James Thornton",  action: "missed",     detail: "Balance Training (patient reported fatigue)",         type: "warning" },
  { id: 3, time: "3 days ago",    patient: "James Thornton",  action: "assessment", detail: "Gait Score improved +13 pts → 58/100",               type: "info" },
  { id: 4, time: "4 days ago",    patient: "Margaret Ellis",  action: "completed",  detail: "Full lower limb circuit — 40 min session",           type: "success" },
  { id: 5, time: "5 days ago",    patient: "Robert Singh",    action: "missed",     detail: "Hip strengthening (no reason given)",                type: "warning" },
];

const complianceData = [
  { name: "James Thornton", compliance: 87, sessions: 14, color: C.teal },
  { name: "Margaret Ellis", compliance: 92, sessions: 22, color: C.purple },
  { name: "Robert Singh",   compliance: 65, sessions: 6,  color: C.amber },
  { name: "Dorothy Osei",   compliance: 40, sessions: 3,  color: "#94A3B8" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusDot({ status }: { status: string }) {
  const map: Record<string, string> = { active: C.green, pending: C.amber, inactive: "#94A3B8" };
  return <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: map[status] ?? "#94A3B8" }} />;
}

function ComplianceRing({ value, color }: { value: number; color: string }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <svg width="48" height="48" className="-rotate-90">
        <circle cx="24" cy="24" r={r} fill="none" stroke={C.border} strokeWidth="3" />
        <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="absolute text-xs font-bold" style={{ color }}>{value}%</span>
    </div>
  );
}

const LightTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl p-3 text-xs shadow-xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        <p className="font-medium mb-1.5" style={{ color: C.text2 }}>{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} className="flex items-center gap-2" style={{ color: p.color }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: p.color }} />
            {p.name}: <span className="font-bold">{p.value}%</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const [selectedPatient, setSelectedPatient] = useState(patients[0]);
  const [showMessage, setShowMessage] = useState(false);
  const [messageText, setMessageText] = useState("");

  return (
    <div className="app-shell min-h-screen flex flex-col" style={{ backgroundColor: C.bg, color: C.text }}>
      {/* Top navbar */}
      <nav
        className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 flex-shrink-0"
        style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/rehab-plan")}
            className="transition-opacity hover:opacity-60"
            style={{ color: C.text2 }}
          >
            <ArrowLeft size={16} />
          </button>
          <span className="font-black tracking-widest text-base" style={{ color: C.teal }}>AXONAI</span>
          <span className="text-sm font-medium hidden sm:block" style={{ color: C.text2 }}>Therapist Workspace</span>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="hidden md:flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm"
            style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text3 }}
          >
            <Search size={13} />
            <span>Search patients…</span>
          </div>
          <button
            className="relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-gray-100"
            style={{ border: `1px solid ${C.border}` }}
          >
            <Bell size={14} style={{ color: C.text3 }} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ backgroundColor: C.teal }} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: C.tealDim }}>
              <User size={13} style={{ color: C.teal }} />
            </div>
            <span className="hidden sm:block text-sm" style={{ color: C.text2 }}>{user?.name}</span>
          </div>
          <button
            onClick={() => { logout(); navigate("/"); }}
            className="text-xs transition-opacity hover:opacity-60"
            style={{ color: C.text3 }}
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Patient sidebar */}
        <div
          className="w-64 flex-shrink-0 overflow-y-auto"
          style={{ backgroundColor: C.sidebar, borderRight: `1px solid ${C.border}` }}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.text3 }}>My Patients</h2>
              <span className="text-xs" style={{ color: C.text3 }}>{patients.length} total</span>
            </div>
            <div className="space-y-1">
              {patients.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPatient(p)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                  style={{
                    backgroundColor: selectedPatient.id === p.id ? C.bg : "transparent",
                    border: `1px solid ${selectedPatient.id === p.id ? C.border : "transparent"}`,
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: p.color + "20", color: p.color }}
                  >
                    {p.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <StatusDot status={p.status} />
                      <span className="text-sm font-medium truncate" style={{ color: C.text }}>{p.name}</span>
                    </div>
                    <span className="text-xs capitalize" style={{ color: C.text3 }}>{p.status}</span>
                  </div>
                  <ComplianceRing value={p.compliance} color={p.color} />
                </button>
              ))}
            </div>
          </div>

          {/* Sidebar stats */}
          <div className="p-4 space-y-3" style={{ borderTop: `1px solid ${C.border}` }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.text3 }}>Core Impact</h3>
            {[
              { label: "Therapist capacity",     value: "3–5× increase",   icon: Users,     color: C.teal },
              { label: "Post-discharge follow-up", value: "<10% → >80%",   icon: TrendingUp, color: C.purple },
              { label: "Avg. compliance rate",   value: "71%",             icon: Activity,  color: C.amber },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: stat.color + "15" }}>
                  <stat.icon size={12} style={{ color: stat.color }} />
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: C.text }}>{stat.value}</p>
                  <p className="text-xs" style={{ color: C.text3 }}>{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="p-4 space-y-1" style={{ borderTop: `1px solid ${C.border}` }}>
            {[
              { label: "Back to Home",    icon: Home,     action: () => navigate("/") },
              { label: "New Assessment",  icon: Zap,      action: () => navigate("/upload") },
              { label: "Settings",        icon: Settings, action: () => {} },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors hover:bg-gray-50"
                style={{ color: C.text2 }}
              >
                <item.icon size={14} />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Patient header */}
          <motion.div
            key={selectedPatient.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div
              className="rounded-2xl p-5"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: selectedPatient.color + "20", color: selectedPatient.color }}
                  >
                    {selectedPatient.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h2 className="text-lg font-bold" style={{ color: C.text }}>{selectedPatient.name}</h2>
                      <span className="text-sm" style={{ color: C.text3 }}>Age {selectedPatient.age}</span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                        style={{
                          backgroundColor: selectedPatient.status === "active" ? "#F0FDF4" : selectedPatient.status === "pending" ? "#FFFBEB" : "#F8FAFC",
                          color: selectedPatient.status === "active" ? C.green : selectedPatient.status === "pending" ? C.amber : "#94A3B8",
                        }}
                      >
                        {selectedPatient.status}
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: C.text2 }}>Diagnosis: {selectedPatient.diagnosis}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowMessage(!showMessage)}
                    className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-all"
                    style={{ border: `1px solid ${C.teal}40`, color: C.teal, backgroundColor: C.tealDim }}
                  >
                    <MessageSquare size={12} />
                    Message Patient
                  </button>
                  <button
                    onClick={() => navigate("/rehab-plan")}
                    className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-all hover:bg-gray-50"
                    style={{ border: `1px solid ${C.border}`, color: C.text2 }}
                  >
                    <Settings size={12} />
                    Adjust Plan
                  </button>
                  <button
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-gray-50"
                    style={{ border: `1px solid ${C.border}`, color: C.text3 }}
                  >
                    <MoreHorizontal size={14} />
                  </button>
                </div>
              </div>

              {/* Message box */}
              <AnimatePresence>
                {showMessage && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 pt-4 flex gap-2" style={{ borderTop: `1px solid ${C.border}` }}>
                      <input
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder={`Send a message to ${selectedPatient.name}…`}
                        className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                        style={{ backgroundColor: C.bg, border: `1.5px solid ${C.border}`, color: C.text }}
                        onFocus={(e) => (e.target.style.borderColor = C.teal)}
                        onBlur={(e) => (e.target.style.borderColor = C.border)}
                      />
                      <button
                        onClick={() => { setMessageText(""); setShowMessage(false); }}
                        className="flex items-center gap-2 font-semibold px-4 py-2.5 rounded-xl text-sm text-white transition-all hover:opacity-90"
                        style={{ backgroundColor: C.teal }}
                      >
                        <Send size={13} />
                        Send
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
                {[
                  { label: "Programme",    value: `Week ${selectedPatient.week} of ${selectedPatient.totalWeeks}`, color: selectedPatient.color },
                  { label: "Compliance",   value: `${selectedPatient.compliance}%`, color: selectedPatient.compliance >= 80 ? C.green : selectedPatient.compliance >= 60 ? C.amber : C.red },
                  { label: "Sessions",     value: `${selectedPatient.sessions} completed`, color: C.text2 },
                  { label: "Avg. session", value: `${selectedPatient.avgSession} min`,      color: C.text2 },
                  { label: "Pain score",   value: `${selectedPatient.pain}/10`,             color: selectedPatient.pain <= 3 ? C.green : selectedPatient.pain <= 6 ? C.amber : C.red },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl px-3 py-2.5 text-center"
                    style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}
                  >
                    <p className="text-xs mb-0.5" style={{ color: C.text3 }}>{stat.label}</p>
                    <p className="text-sm font-bold" style={{ color: stat.color }}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Compliance bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span style={{ color: C.text3 }}>Overall compliance</span>
                  <span style={{ color: selectedPatient.color, fontWeight: 600 }}>{selectedPatient.compliance}%</span>
                </div>
                <div className="w-full rounded-full h-2" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${selectedPatient.compliance}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-2 rounded-full"
                    style={{ backgroundColor: selectedPatient.color }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl p-5"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}
            >
              <h3 className="text-sm font-semibold mb-0.5" style={{ color: C.text }}>Exercise Completion Rate</h3>
              <p className="text-xs mb-4" style={{ color: C.text3 }}>Weekly exercise completion vs target (100%)</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={exerciseProgress}>
                  <defs>
                    <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.teal} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={C.teal} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="week" tick={{ fill: C.text3, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: C.text3, fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip content={<LightTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: C.text3 }} />
                  <ReferenceLine y={100} stroke={C.border} strokeDasharray="4 4" label={{ value: "Target", position: "right", fill: C.text3, fontSize: 10 }} />
                  <Area type="monotone" dataKey="actual" name="Actual %" stroke={C.teal} fill="url(#actualGrad)" strokeWidth={2} dot={{ fill: C.teal, r: 4 }} connectNulls={false} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl p-5"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}
            >
              <h3 className="text-sm font-semibold mb-0.5" style={{ color: C.text }}>Gait Score Trend</h3>
              <p className="text-xs mb-4" style={{ color: C.text3 }}>Assessment-by-assessment improvement tracking</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={gaitScoreTrend} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="session" tick={{ fill: C.text3, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: C.text3, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, fontSize: 12, color: C.text }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: C.text3 }} />
                  <ReferenceLine y={80} stroke={C.teal} strokeDasharray="4 4" label={{ value: "Target 80", position: "right", fill: C.teal, fontSize: 10 }} />
                  <Bar dataKey="score" name="Gait Score" fill={C.blue} fillOpacity={0.85} radius={[4, 4, 0, 0]} label={{ position: "top", fill: C.text3, fontSize: 11 }} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Compliance + Activity feed */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl p-5"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}
            >
              <h3 className="text-sm font-semibold mb-0.5" style={{ color: C.text }}>Patient Compliance Overview</h3>
              <p className="text-xs mb-4" style={{ color: C.text3 }}>Compliance rate across all active patients</p>
              <div className="space-y-3">
                {complianceData.map((p) => (
                  <div key={p.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs" style={{ color: C.text2 }}>{p.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: C.text3 }}>{p.sessions} sessions</span>
                        <span className="text-xs font-bold" style={{ color: p.color }}>{p.compliance}%</span>
                      </div>
                    </div>
                    <div className="w-full rounded-full h-1.5" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${p.compliance}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                        className="h-1.5 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-2xl p-5"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}
            >
              <h3 className="text-sm font-semibold mb-0.5" style={{ color: C.text }}>Recent Activity Feed</h3>
              <p className="text-xs mb-4" style={{ color: C.text3 }}>Latest patient actions across your caseload</p>
              <div className="space-y-2.5">
                {activityFeed.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{
                        backgroundColor: item.type === "success" ? "#F0FDF4" : item.type === "warning" ? "#FFFBEB" : C.tealDim,
                      }}
                    >
                      {item.type === "success" ? (
                        <CheckCircle2 size={13} style={{ color: C.green }} />
                      ) : item.type === "warning" ? (
                        <AlertTriangle size={13} style={{ color: C.amber }} />
                      ) : (
                        <Activity size={13} style={{ color: C.teal }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-relaxed" style={{ color: C.text2 }}>
                        <span className="font-semibold" style={{ color: C.text }}>{item.patient}</span>
                        {" "}
                        <span style={{ color: item.type === "success" ? C.green : item.type === "warning" ? C.amber : C.teal, fontWeight: 600 }}>
                          {item.action}:
                        </span>
                        {" "}{item.detail}
                      </p>
                      <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: C.text3 }}>
                        <Clock size={9} />
                        {item.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl p-5"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: C.tealDim }}>
                <Zap size={18} style={{ color: C.teal }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: C.text }}>Start a new patient assessment</p>
                <p className="text-xs" style={{ color: C.text2 }}>Upload gait videos to generate a new report in under 3 minutes</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/upload")}
              className="flex-shrink-0 flex items-center gap-2 font-bold px-5 py-2.5 rounded-xl text-sm text-white transition-all hover:opacity-90"
              style={{ backgroundColor: C.teal, boxShadow: `0 4px 16px ${C.teal}40` }}
            >
              New Assessment
              <ChevronRight size={15} />
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
