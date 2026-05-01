/**
 * ReportPage — AxonAI 功能评估报告
 * Design: Dark navy, teal/violet accent, glassmorphism cards
 * Sections: Core Metrics, Bilateral Symmetry, Kinematic Curves, AI Summary,
 *           Gait Cycle Phases, Balance & Stability, Historical 趋势
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useAssessment } from "@/contexts/AssessmentContext";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";
import {
  ArrowLeft,
  Download,
  ChevronRight,
  Brain,
  Activity,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  User,
  Clock,
  Calendar,
} from "lucide-react";

// ─── Mock data ────────────────────────────────────────────────────────────────

const kinematics = Array.from({ length: 21 }, (_, i) => ({
  cycle: i * 5,
  pelvicRotation: 12 * Math.sin((i / 20) * Math.PI * 2) + 2 * Math.sin((i / 20) * Math.PI * 4),
  kneeFlexion: 35 * Math.sin((i / 20) * Math.PI * 2 + 0.8) + 15 + 5 * Math.sin((i / 20) * Math.PI * 4),
  ankleDF: 15 * Math.sin((i / 20) * Math.PI * 2 + 1.2) - 5,
  hipFlexion: 28 * Math.sin((i / 20) * Math.PI * 2 + 0.3) + 5,
}));

const symmetryData = [
  { joint: "髋关节", affected: 15, healthy: 30, deviation: -15, risk: "high" },
  { joint: "膝关节", affected: 55, healthy: 60, deviation: -5, risk: "medium" },
  { joint: "踝关节", affected: 30, healthy: 50, deviation: -20, risk: "high" },
  { joint: "骨盆", affected: 8, healthy: 12, deviation: -4, risk: "low" },
  { joint: "躯干", affected: 6, healthy: 8, deviation: -2, risk: "low" },
];

const radarData = [
  { metric: "速度", score: 52, normal: 100 },
  { metric: "步频", score: 70, normal: 100 },
  { metric: "对称性", score: 71, normal: 100 },
  { metric: "稳定性", score: 64, normal: 100 },
  { metric: "步幅", score: 68, normal: 100 },
  { metric: "平衡", score: 58, normal: 100 },
];

const historicalData = [
  { session: "基线", gaitScore: 42, speed: 0.48, symmetry: 61 },
  { session: "第2周", gaitScore: 51, speed: 0.55, symmetry: 65 },
  { session: "第4周", gaitScore: 58, speed: 0.65, symmetry: 71 },
];

const gaitPhases = [
  { phase: "初期接触期", left: 92, right: 100, status: "abnormal" },
  { phase: "负荷响应期", left: 78, right: 100, status: "abnormal" },
  { phase: "支撑中期", left: 85, right: 100, status: "warning" },
  { phase: "支撑末期", left: 70, right: 100, status: "abnormal" },
  { phase: "迈步前期", left: 88, right: 100, status: "warning" },
  { phase: "摆动期", left: 95, right: 100, status: "normal" },
];

const stepTimeData = Array.from({ length: 12 }, (_, i) => ({
  step: i + 1,
  left: 0.52 + (Math.random() - 0.5) * 0.12,
  right: 0.48 + (Math.random() - 0.5) * 0.08,
}));

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  unit,
  change,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  unit: string;
  change: number;
  icon: React.ElementType;
  color: string;
}) {
  const positive = change > 0;
  return (
    <div
      className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/8 transition-all"
      style={{ borderColor: color + "30" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: color + "20" }}
        >
          <Icon size={16} style={{ color }} />
        </div>
        <span
          className={`text-xs font-medium flex items-center gap-1 ${positive ? "text-emerald-400" : "text-red-400"}`}
        >
          {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {positive ? "+" : ""}
          {change}%
        </span>
      </div>
      <div className="text-2xl font-bold text-white mb-0.5">
        {value}
        <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>
      </div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    high: { bg: "bg-red-500/20", text: "text-red-400", label: "高风险" },
    medium: { bg: "bg-amber-500/20", text: "text-amber-400", label: "中等" },
    low: { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "正常" },
  };
  const s = map[risk] ?? map.low;
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0a1628] border border-white/10 rounded-xl p-3 text-xs shadow-xl">
        <p className="text-slate-400 mb-1.5 font-medium">{label}% 步态周期</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: p.color }} />
            {p.name}: <span className="font-bold">{p.value?.toFixed(1)}°</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ReportPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { metrics, patientName } = useAssessment();
  const [activeTab, setActiveTab] = useState<"overview" | "kinematics" | "balance">("overview");

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, duration: 0.4 },
    }),
  };

  return (
    <div className="min-h-screen bg-[#050d1a] text-white">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#00D4AA]/6 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#8B5CF6]/6 rounded-full blur-[120px] pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#050d1a]/80 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/zh/upload")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            上传
          </button>
          <div className="w-px h-4 bg-white/20" />
          <span className="text-white font-black tracking-widest text-lg">AXONAI</span>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <span>/</span>
            <span className="text-slate-300">评估报告</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 border border-white/10">
            <Download size={13} />
            导出 PDF
          </button>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <div className="w-7 h-7 rounded-full bg-[#00D4AA]/20 flex items-center justify-center">
              <User size={14} className="text-[#00D4AA]" />
            </div>
            <span className="hidden sm:block">{user?.name}</span>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00D4AA]/10 border border-[#00D4AA]/20 text-[#00D4AA] text-xs font-medium">
                <Activity size={11} />
                第 2 步 / 共 3 步 — 功能评估报告
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white">
              步态分析报告
            </h1>
            <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <User size={11} />
                {patientName}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={11} />
                {new Date().toLocaleDateString("zh-CN", { day: "numeric", month: "long", year: "numeric" })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={11} />
                第 3 次 / 共 8 次
              </span>
            </div>
          </div>

          {/* Overall score */}
          <div className="flex items-center gap-4">
            <div className="text-center bg-white/5 border border-white/10 rounded-xl px-5 py-3">
              <div className="text-3xl font-black text-white">{metrics.gaitScore}</div>
              <div className="text-xs text-slate-400">步态得分</div>
                  <div className="text-xs text-amber-400 mt-0.5">↑ +16 分</div>
            </div>
            <div className="text-center bg-white/5 border border-white/10 rounded-xl px-5 py-3">
              <div className="text-3xl font-black" style={{ color: "#00D4AA" }}>{metrics.symmetryIndex}%</div>
              <div className="text-xs text-slate-400">对称性</div>
                  <div className="text-xs text-amber-400 mt-0.5">↑ +10 分</div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1 w-fit border border-white/10">
          {(["overview", "kinematics", "balance"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                activeTab === tab
                  ? "bg-[#00D4AA] text-[#050d1a]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab === "overview" ? "总览" : tab === "kinematics" ? "运动学" : "平衡与步态阶段"}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Core metrics row */}
            <motion.div
              custom={0}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#00D4AA]/20 text-[#00D4AA] text-xs flex items-center justify-center font-bold">1</span>
                核心指标仪表板
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <MetricCard label="步行速度" value={metrics.speed} unit="m/s" change={metrics.speedChange} icon={Activity} color="#00D4AA" />
                <MetricCard label="步频" value={metrics.cadence} unit="步/分钟" change={metrics.cadenceChange} icon={Activity} color="#8B5CF6" />
                <MetricCard label="步幅" value={metrics.strideLength} unit="cm" change={metrics.strideLengthChange} icon={Activity} color="#00A8FF" />
                <MetricCard label="对称指数" value={metrics.symmetryIndex} unit="%" change={10} icon={Activity} color="#F59E0B" />
                <MetricCard label="稳定性得分" value={metrics.stabilityScore} unit="/100" change={8} icon={Activity} color="#10B981" />
                <MetricCard label="步态得分" value={metrics.gaitScore} unit="/100" change={16} icon={Activity} color="#EC4899" />
              </div>
            </motion.div>

            {/* Bilateral symmetry + Radar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
                <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6] text-xs flex items-center justify-center font-bold">2</span>
                  双侧对称性矩阵
                </h2>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <p className="text-xs text-slate-400 mb-4">
                    患侧与健侧多关节角度偏差对比，高风险项目颜色预警。
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-slate-500 border-b border-white/10">
                          <th className="text-left pb-2 font-medium">关节</th>
                          <th className="text-right pb-2 font-medium">患侧 (L)</th>
                          <th className="text-right pb-2 font-medium">健侧 (R)</th>
                          <th className="text-right pb-2 font-medium">偏差</th>
                          <th className="text-right pb-2 font-medium">风险</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {symmetryData.map((row) => (
                          <tr key={row.joint} className="hover:bg-white/3 transition-colors">
                            <td className="py-2.5 font-medium text-white">{row.joint}</td>
                            <td className="py-2.5 text-right text-slate-300">{row.affected}°</td>
                            <td className="py-2.5 text-right text-slate-300">{row.healthy}°</td>
                            <td className={`py-2.5 text-right font-bold ${row.risk === "high" ? "text-red-400" : row.risk === "medium" ? "text-amber-400" : "text-emerald-400"}`}>
                              {row.deviation}°
                            </td>
                            <td className="py-2.5 text-right">
                              <RiskBadge risk={row.risk} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>

              <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible">
                <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#00A8FF]/20 text-[#00A8FF] text-xs flex items-center justify-center font-bold">3</span>
                  多维度表现雷达图
                </h2>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <p className="text-xs text-slate-400 mb-3">
                    患者步态指标与正常参考值对比分析。
                  </p>
                  <ResponsiveContainer width="100%" height={240}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#475569", fontSize: 9 }} />
                      <Radar name="正常参考" dataKey="normal" stroke="#ffffff20" fill="#ffffff08" />
                      <Radar name="患者" dataKey="score" stroke="#00D4AA" fill="#00D4AA" fillOpacity={0.25} />
                      <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            {/* Historical trend */}
            <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible">
              <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] text-xs flex items-center justify-center font-bold">4</span>
                康复进展趋势分析
              </h2>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <p className="text-xs text-slate-400 mb-4">
                  多次评估中核心步态参数的纵向跟踪分析。
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={historicalData}>
                    <defs>
                      <linearGradient id="gaitGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00D4AA" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="symGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="session" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#0a1628", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
                    <Area type="monotone" dataKey="gaitScore" name="步态得分" stroke="#00D4AA" fill="url(#gaitGrad)" strokeWidth={2} dot={{ fill: "#00D4AA", r: 4 }} />
                    <Area type="monotone" dataKey="symmetry" name="对称性%" stroke="#8B5CF6" fill="url(#symGrad)" strokeWidth={2} dot={{ fill: "#8B5CF6", r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* AI Diagnostic Summary */}
            <motion.div custom={4} variants={cardVariants} initial="hidden" animate="visible">
              <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#EC4899]/20 text-[#EC4899] text-xs flex items-center justify-center font-bold">5</span>
                AI 智能诊断摘要
              </h2>
              <div className="bg-white/5 border border-[#00D4AA]/20 rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#00D4AA]/15 flex items-center justify-center flex-shrink-0">
                    <Brain size={20} className="text-[#00D4AA]" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <span className="text-[#00D4AA] font-semibold text-sm">核心缺陷：</span>
                      <span className="text-slate-300 text-sm">左侧髋关节屈曲受限（15° vs 正常值 30°）；支撑末期可观察到右侧补偿性骨盆倾斜。</span>
                    </div>
                    <div>
                      <span className="text-[#8B5CF6] font-semibold text-sm">临床摘要：</span>
                      <span className="text-slate-300 text-sm">显著步态不对称（对称指数 71%），补偿风险高。步行速度降低（0.65 m/s，低于正常值 38%）提示步态效率受损。踝关节背屈不足（-20°）增加拖步风险。</span>
                    </div>
                    <div>
                      <span className="text-amber-400 font-semibold text-sm">干预优先级：</span>
                      <span className="text-slate-300 text-sm">重点关注：（1）左侧髋屈肌力量训练；（2）骨盆稳定性训练；（3）踝关节背屈活动度训练。建议每周 3 次监督训练，配合每日居家康复方案。</span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 text-xs font-medium flex items-center gap-1">
                        <AlertTriangle size={10} /> 高代偿风险
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 text-xs font-medium flex items-center gap-1">
                        <AlertTriangle size={10} /> 踝关节功能不足
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-medium flex items-center gap-1">
                        <CheckCircle2 size={10} /> 持续改善趋势
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* ── KINEMATICS TAB ── */}
        {activeTab === "kinematics" && (
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#00D4AA]/20 text-[#00D4AA] text-xs flex items-center justify-center font-bold">1</span>
                运动学连续曲线图谱
              </h2>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <p className="text-xs text-slate-400 mb-4">
                  骨盆、下肢及脊柱关节完整步态周期波形，阴影区域标示异常阶段（支撑初期）。
                </p>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={kinematics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="cycle" label={{ value: "步态周期 (%)", position: "insideBottom", offset: -2, fill: "#64748b", fontSize: 11 }} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis label={{ value: "关节角度 (°)", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 11 }} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8", paddingTop: 16 }} />
                    <ReferenceLine x={20} stroke="rgba(239,68,68,0.3)" strokeDasharray="4 4" />
                    <ReferenceLine x={40} stroke="rgba(239,68,68,0.3)" strokeDasharray="4 4" label={{ value: "异常阶段", position: "top", fill: "#ef4444", fontSize: 10 }} />
                    <Line type="monotone" dataKey="pelvicRotation" name="骨盆旋转" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="kneeFlexion" name="膝关节屈曲" stroke="#00D4AA" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="ankleDF" name="踝关节背屈" stroke="#00A8FF" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="hipFlexion" name="髋关节屈曲" stroke="#F59E0B" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6] text-xs flex items-center justify-center font-bold">2</span>
                步时变异性 — 左侧 vs 右侧
              </h2>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <p className="text-xs text-slate-400 mb-4">
                  左右下肢逐步时间对比，变异性增大提示不稳定性增加。
                </p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stepTimeData} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="step" label={{ value: "步次编号", position: "insideBottom", offset: -2, fill: "#64748b", fontSize: 11 }} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis label={{ value: "步时 (s)", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 11 }} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0.3, 0.7]} />
                    <Tooltip contentStyle={{ background: "#0a1628", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
                    <ReferenceLine y={0.5} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" label={{ value: "目标值", position: "right", fill: "#64748b", fontSize: 10 }} />
                    <Bar dataKey="left" name="左侧下肢" fill="#00D4AA" fillOpacity={0.8} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="right" name="右侧下肢" fill="#8B5CF6" fillOpacity={0.8} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        )}

        {/* ── BALANCE & PHASES TAB ── */}
        {activeTab === "balance" && (
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#00D4AA]/20 text-[#00D4AA] text-xs flex items-center justify-center font-bold">1</span>
                步态阶段分析 — 双侧对比
              </h2>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <p className="text-xs text-slate-400 mb-4">
                  各步态阶段完成百分比与健侧参考值对比。
                </p>
                <div className="space-y-3">
                  {gaitPhases.map((phase) => (
                    <div key={phase.phase}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-300">{phase.phase}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">{phase.left}%</span>
                          <RiskBadge risk={phase.status === "abnormal" ? "high" : phase.status === "warning" ? "medium" : "low"} />
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <div className="flex-1 bg-white/10 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${phase.left}%`,
                              backgroundColor: phase.status === "abnormal" ? "#ef4444" : phase.status === "warning" ? "#f59e0b" : "#10b981",
                            }}
                          />
                        </div>
                        <div className="flex-1 bg-white/10 rounded-full h-2">
                          <div className="h-2 rounded-full bg-[#00D4AA]" style={{ width: `${phase.right}%` }} />
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600 mt-0.5">
                        <span>左侧（患侧）</span>
                        <span>右侧（参考）</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] text-xs flex items-center justify-center font-bold">2</span>
                平衡与稳定性指标
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "质心摇摆幅度", value: "18.4 mm", status: "偏高", risk: "medium", desc: "侧向摇摆幅度超出正常值 42%" },
                  { label: "单腿支撑时间", value: "4.2 s", status: "受损", risk: "high", desc: "左侧下肢支撑时间显著缩短" },
                  { label: "串行步行得分", value: "72/100", status: "中等", risk: "medium", desc: "与轻度平衡障碍表现一致" },
                ].map((item) => (
                  <div key={item.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs text-slate-400">{item.label}</span>
                      <RiskBadge risk={item.risk} />
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{item.value}</div>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-[#00D4AA]/10 to-[#8B5CF6]/10 border border-[#00D4AA]/20 rounded-2xl p-6"
        >
          <div>
            <h3 className="text-white font-bold mb-1">准备生成康复方案？</h3>
            <p className="text-sm text-slate-400">
              基于本次评估结果，AxonAI 将为 {patientName}.
            </p>
          </div>
          <button
            onClick={() => navigate("/zh/rehab-plan")}
            className="flex-shrink-0 flex items-center gap-2 bg-gradient-to-r from-[#00D4AA] to-[#00A8FF] text-[#050d1a] font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-all text-sm whitespace-nowrap"
          >
            个性化康复方案
            <ChevronRight size={16} />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
