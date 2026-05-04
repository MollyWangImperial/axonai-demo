/**
 * DashboardPage — AxonAI Therapist Workspace
 * Design: Dark navy, teal/violet accent, glassmorphism
 * Sections: Patient list, Exercise progress chart, Gait score trend, Activity feed
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  ArrowLeft,
  Bell,
  Search,
  User,
  ChevronRight,
  MessageSquare,
  Settings,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  Activity,
  Users,
  Zap,
  Home,
  MoreHorizontal,
  Send,
} from "lucide-react";

// ─── Mock data ────────────────────────────────────────────────────────────────

const patients = [
  {
    id: "p1",
    name: "James Thornton",
    age: 68,
    diagnosis: "脑卒中后步态康复",
    status: "active",
    compliance: 87,
    week: 3,
    totalWeeks: 8,
    sessions: 14,
    avgSession: 24,
    pain: 3,
    gaitScore: 58,
    avatar: "JT",
    color: "#00D4AA",
  },
  {
    id: "p2",
    name: "Margaret Ellis",
    age: 72,
    diagnosis: "迫肧关节置换术后康复",
    status: "active",
    compliance: 92,
    week: 5,
    totalWeeks: 8,
    sessions: 22,
    avgSession: 31,
    pain: 2,
    gaitScore: 74,
    avatar: "ME",
    color: "#8B5CF6",
  },
  {
    id: "p3",
    name: "Robert Singh",
    age: 61,
    diagnosis: "膝关节骨性关节炎步态再训练",
    status: "pending",
    compliance: 65,
    week: 2,
    totalWeeks: 6,
    sessions: 6,
    avgSession: 18,
    pain: 5,
    gaitScore: 49,
    avatar: "RS",
    color: "#F59E0B",
  },
  {
    id: "p4",
    name: "Dorothy Osei",
    age: 55,
    diagnosis: "骨折后康复",
    status: "inactive",
    compliance: 40,
    week: 1,
    totalWeeks: 8,
    sessions: 3,
    avgSession: 12,
    pain: 4,
    gaitScore: 38,
    avatar: "DO",
    color: "#64748b",
  },
];

const exerciseProgress = [
  { week: "第1周", target: 100, actual: 45 },
  { week: "第2周", target: 100, actual: 62 },
  { week: "第3周", target: 100, actual: 87 },
  { week: "第4周", target: 100, actual: null },
  { week: "第5周", target: 100, actual: null },
  { week: "第6周", target: 100, actual: null },
  { week: "第7周", target: 100, actual: null },
  { week: "第8周", target: 100, actual: null },
];

const gaitScoreTrend = [
  { session: "评估 1", score: 42, target: 80 },
  { session: "评估 2", score: 51, target: 80 },
  { session: "评估 3", score: 58, target: 80 },
];

const activityFeed = [
  {
    id: 1,
    time: "今日 09:15",
    patient: "James Thornton",
    action: "完成",
    detail: "坐立转换训练 × 3组，每练 10 次",
    type: "success",
  },
  {
    id: 2,
    time: "昨日",
    patient: "James Thornton",
    action: "未完成",
    detail: "平衡训练（患者反映疲劳）",
    type: "warning",
  },
  {
    id: 3,
    time: "3 天前",
    patient: "James Thornton",
    action: "评估",
    detail: "步态得分提升 +13 分 → 58/100",
    type: "info",
  },
  {
    id: 4,
    time: "4 天前",
    patient: "Margaret Ellis",
    action: "完成",
    detail: "全下肢循环训练 — 40 分钟训练",
    type: "success",
  },
  {
    id: 5,
    time: "5 天前",
    patient: "Robert Singh",
    action: "未完成",
    detail: "髀屈肌力量训练（未说明原因）",
    type: "warning",
  },
];

const complianceData = [
  { name: "James Thornton", compliance: 87, sessions: 14, color: "#00D4AA" },
  { name: "Margaret Ellis", compliance: 92, sessions: 22, color: "#8B5CF6" },
  { name: "Robert Singh", compliance: 65, sessions: 6, color: "#F59E0B" },
  { name: "Dorothy Osei", compliance: 40, sessions: 3, color: "#64748b" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusDot({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "#10b981",
    pending: "#f59e0b",
    inactive: "#64748b",
  };
  return (
    <span
      className="w-2 h-2 rounded-full inline-block flex-shrink-0"
      style={{ backgroundColor: map[status] ?? "#64748b" }}
    />
  );
}

function ComplianceRing({ value, color }: { value: number; color: string }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <svg width="48" height="48" className="-rotate-90">
        <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-xs font-bold text-white">{value}%</span>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0a1628] border border-white/10 rounded-xl p-3 text-xs shadow-xl">
        <p className="text-slate-400 mb-1.5 font-medium">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }} className="flex items-center gap-2">
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
    <div className="min-h-screen bg-[#050d1a] text-white flex flex-col">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#8B5CF6]/6 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#00D4AA]/6 rounded-full blur-[120px] pointer-events-none" />

      {/* Top navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#050d1a]/90 backdrop-blur-xl flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/zh/rehab-plan")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-white font-black tracking-widest">AXONAI</span>
            <span className="text-slate-500 text-sm">|</span>
            <span className="text-slate-300 text-sm font-medium">治疗师工作台</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-400">
            <Search size={13} />
            <span>搜索患者…</span>
          </div>
          {/* Notifications */}
          <button className="relative w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
            <Bell size={14} className="text-slate-400" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#00D4AA]" />
          </button>
          {/* User */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#00D4AA]/20 flex items-center justify-center">
              <User size={13} className="text-[#00D4AA]" />
            </div>
            <span className="hidden sm:block text-sm text-slate-300">{user?.name}</span>
          </div>
          <button
            onClick={() => { logout(); navigate("/zh"); }}
            className="text-xs text-slate-500 hover:text-white transition-colors"
          >
            退出登录
          </button>
        </div>
      </nav>

      {/* Main layout */}
      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* Patient sidebar */}
        <div className="w-64 flex-shrink-0 border-r border-white/10 bg-[#050d1a]/60 backdrop-blur-xl overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">我的患者</h2>
              <span className="text-xs text-slate-500">{patients.length} 位患者</span>
            </div>
            <div className="space-y-1.5">
              {patients.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPatient(p)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                    selectedPatient.id === p.id
                      ? "bg-white/10 border border-white/15"
                      : "hover:bg-white/5"
                  }`}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: p.color + "25", color: p.color }}
                  >
                    {p.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <StatusDot status={p.status} />
                      <span className="text-sm text-white truncate font-medium">{p.name}</span>
                    </div>
                    <span className="text-xs text-slate-500">{p.status === "active" ? "在诊" : p.status === "pending" ? "待处理" : "已停诊"}</span>
                  </div>
                  <ComplianceRing value={p.compliance} color={p.color} />
                </button>
              ))}
            </div>
          </div>

          {/* Sidebar stats */}
          <div className="p-4 border-t border-white/10 space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">核心影响</h3>
            {[
              { label: "治疗师接诊能力", value: "提升 3–5 倍", icon: Users, color: "#00D4AA" },
              { label: "出院后随访率", value: "<10% → >80%", icon: TrendingUp, color: "#8B5CF6" },
              { label: "平均依从率", value: "71%", icon: Activity, color: "#F59E0B" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: stat.color + "20" }}>
                  <stat.icon size={12} style={{ color: stat.color }} />
                </div>
                <div>
                  <p className="text-xs text-white font-medium">{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="p-4 border-t border-white/10 space-y-1">
            {[
              { label: "返回首页", icon: Home, action: () => navigate("/zh") },
              { label: "新建评估", icon: Zap, action: () => navigate("/zh/upload") },
              { label: "设置", icon: Settings, action: () => {} },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all text-left"
              >
                <item.icon size={14} />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Patient header */}
          <motion.div
            key={selectedPatient.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: selectedPatient.color + "25", color: selectedPatient.color }}
                  >
                    {selectedPatient.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h2 className="text-lg font-bold text-white">{selectedPatient.name}</h2>
                      <span className="text-sm text-slate-400">年龄 {selectedPatient.age}</span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                        style={{
                          backgroundColor: selectedPatient.status === "active" ? "#10b98120" : selectedPatient.status === "pending" ? "#f59e0b20" : "#64748b20",
                          color: selectedPatient.status === "active" ? "#10b981" : selectedPatient.status === "pending" ? "#f59e0b" : "#64748b",
                        }}
                      >
                        {selectedPatient.status === "active" ? "在诊" : selectedPatient.status === "pending" ? "待处理" : "已停诊"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">诊断：{selectedPatient.diagnosis}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowMessage(!showMessage)}
                    className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-[#00D4AA]/30 text-[#00D4AA] hover:bg-[#00D4AA]/10 transition-all"
                  >
                    <MessageSquare size={12} />
                    发送消息
                  </button>
                  <button
                    onClick={() => navigate("/zh/rehab-plan")}
                    className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-white/15 text-slate-300 hover:bg-white/5 transition-all"
                  >
                    <Settings size={12} />
                    调整方案
                  </button>
                  <button className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all">
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
                    <div className="mt-4 pt-4 border-t border-white/10 flex gap-2">
                      <input
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder={`发消息给 ${selectedPatient.name}…`}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00D4AA]/40 transition-all"
                      />
                      <button
                        onClick={() => { setMessageText(""); setShowMessage(false); }}
                        className="flex items-center gap-2 bg-[#00D4AA] text-[#050d1a] font-semibold px-4 py-2.5 rounded-xl text-sm hover:opacity-90 transition-all"
                      >
                        <Send size={13} />
                        发送
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
                {[
                  { label: "训练进度", value: `第 ${selectedPatient.week} 周 / 共 ${selectedPatient.totalWeeks} 周`, color: selectedPatient.color },
                  { label: "依从率", value: `${selectedPatient.compliance}%`, color: selectedPatient.compliance >= 80 ? "#10b981" : selectedPatient.compliance >= 60 ? "#f59e0b" : "#ef4444" },
                  { label: "训练次数", value: `已完成 ${selectedPatient.sessions} 次`, color: "#94a3b8" },
                  { label: "平均时长", value: `${selectedPatient.avgSession} 分钟`, color: "#94a3b8" },
                  { label: "疼痛评分", value: `${selectedPatient.pain}/10`, color: selectedPatient.pain <= 3 ? "#10b981" : selectedPatient.pain <= 6 ? "#f59e0b" : "#ef4444" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/5 rounded-xl px-3 py-2.5 text-center">
                    <p className="text-xs text-slate-400 mb-0.5">{stat.label}</p>
                    <p className="text-sm font-bold" style={{ color: stat.color }}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Compliance bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span>整体依从率</span>
                  <span style={{ color: selectedPatient.color }}>{selectedPatient.compliance}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Exercise progress */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-5"
            >
              <h3 className="text-sm font-semibold text-white mb-1">训练完成率</h3>
              <p className="text-xs text-slate-400 mb-4">每周训练完成情况与目标（100%）对比</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={exerciseProgress}>
                  <defs>
                    <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00D4AA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="week" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
                  <ReferenceLine y={100} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" label={{ value: "目标", position: "right", fill: "#64748b", fontSize: 10 }} />
                  <Area type="monotone" dataKey="actual" name="实际 %" stroke="#00D4AA" fill="url(#actualGrad)" strokeWidth={2} dot={{ fill: "#00D4AA", r: 4 }} connectNulls={false} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Gait score trend */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-5"
            >
              <h3 className="text-sm font-semibold text-white mb-1">步态得分趋势</h3>
              <p className="text-xs text-slate-400 mb-4">逐次评估改善跟踪分析</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={gaitScoreTrend} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="session" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0a1628", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
                  <ReferenceLine y={80} stroke="#00D4AA" strokeDasharray="4 4" label={{ value: "目标 80", position: "right", fill: "#00D4AA", fontSize: 10 }} />
                  <Bar dataKey="score" name="步态得分" fill="#00A8FF" fillOpacity={0.85} radius={[4, 4, 0, 0]} label={{ position: "top", fill: "#94a3b8", fontSize: 11 }} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Compliance comparison + Activity feed */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* All-patient compliance */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-5"
            >
              <h3 className="text-sm font-semibold text-white mb-1">患者依从概况</h3>
              <p className="text-xs text-slate-400 mb-4">所有在诊患者依从率概览</p>
              <div className="space-y-3">
                {complianceData.map((p) => (
                  <div key={p.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-300">{p.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">{p.sessions} 次训练</span>
                        <span className="text-xs font-bold" style={{ color: p.color }}>{p.compliance}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5">
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

            {/* Activity feed */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-5"
            >
              <h3 className="text-sm font-semibold text-white mb-1">近期活动记录</h3>
              <p className="text-xs text-slate-400 mb-4">患者最新训练动态汇总</p>
              <div className="space-y-2.5">
                {activityFeed.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        item.type === "success" ? "bg-emerald-500/20" :
                        item.type === "warning" ? "bg-amber-500/20" : "bg-[#00D4AA]/20"
                      }`}
                    >
                      {item.type === "success" ? (
                        <CheckCircle2 size={13} className="text-emerald-400" />
                      ) : item.type === "warning" ? (
                        <AlertTriangle size={13} className="text-amber-400" />
                      ) : (
                        <Activity size={13} className="text-[#00D4AA]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-300 leading-relaxed">
                        <span className="text-white font-medium">{item.patient}</span>
                        {" "}
                        <span className={item.action === '完成' ? 'text-emerald-400' : item.action === '未完成' ? 'text-amber-400' : 'text-[#00D4AA]'}>
                          {item.action}:
                        </span>
                        {" "}{item.detail}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
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
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-[#00D4AA]/8 to-[#8B5CF6]/8 border border-white/10 rounded-2xl p-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00D4AA]/15 flex items-center justify-center">
                <Zap size={18} className="text-[#00D4AA]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">开始新患者评估</p>
                <p className="text-xs text-slate-400">上传步态视频，3 分钟内生成新评估报告</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/zh/upload")}
              className="flex-shrink-0 flex items-center gap-2 bg-gradient-to-r from-[#00D4AA] to-[#00A8FF] text-[#050d1a] font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition-all text-sm"
            >
              新建评估
              <ChevronRight size={15} />
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
