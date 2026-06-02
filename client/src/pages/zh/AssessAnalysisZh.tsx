/**
 * AssessAnalysisZh — OpenSim 分析 + 功能问题识别
 * Steps 5+6: Biomechanics pipeline results mapped to functional problems
 * Design: Dark navy, animated pipeline, metric cards, problem mapping
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ArrowRight, Activity, Zap, Target,
  TrendingDown, AlertTriangle, CheckCircle2, BarChart2,
  Layers, Brain, Hand, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

const C = {
  bg: "#050d1a",
  panel: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  teal: "#00D4AA",
  amber: "#F59E0B",
  red: "#EF4444",
  violet: "#8B5CF6",
  text: "#F1F5F9",
  muted: "#94A3B8",
};

// ─── Pipeline stages ──────────────────────────────────────────────────────
const pipelineStages = [
  { id: "video", label: "视频输入", icon: "🎬", desc: "11 个视频，共 3.2 分钟" },
  { id: "keypoints", label: "关键点提取", icon: "🦴", desc: "33 个关键点，MediaPipe" },
  { id: "ik", label: "逆向运动学 (IK)", icon: "⚙️", desc: "OpenSim 上肢模型" },
  { id: "metrics", label: "关节指标", icon: "📐", desc: "角度、ROM、速度、平滑性" },
  { id: "id", label: "逆向动力学 (ID)", icon: "💪", desc: "关节力矩、肌肉力估计" },
  { id: "mapping", label: "功能问题映射", icon: "🎯", desc: "指标 → 临床功能问题" },
];

// ─── Joint metrics ────────────────────────────────────────────────────────
const jointMetrics = [
  { joint: "肩屈曲", affected: 72, healthy: 165, unit: "°", deficit: 56, severity: "severe" },
  { joint: "肩外展", affected: 58, healthy: 170, unit: "°", deficit: 66, severity: "severe" },
  { joint: "肘屈曲", affected: 118, healthy: 140, unit: "°", deficit: 16, severity: "mild" },
  { joint: "前臂旋后", affected: 42, healthy: 85, unit: "°", deficit: 51, severity: "moderate" },
  { joint: "腕背伸", affected: 28, healthy: 65, unit: "°", deficit: 57, severity: "severe" },
];

const radarData = [
  { metric: "肩屈曲", value: 44, full: 100 },
  { metric: "肩外展", value: 34, full: 100 },
  { metric: "肘屈曲", value: 84, full: 100 },
  { metric: "前臂旋后", value: 49, full: 100 },
  { metric: "腕背伸", value: 43, full: 100 },
  { metric: "握力", value: 38, full: 100 },
];

// ─── Functional problems ──────────────────────────────────────────────────
const functionalProblems = [
  {
    id: "shoulder_flex",
    label: "肩屈曲不足",
    severity: "severe",
    metrics: ["肩屈曲 ROM 72°（参考 165°）", "肩屈曲速度降低 68%"],
    impact: "无法完成过头动作，日常穿衣、取高处物品受限",
    muscles: ["三角肌前束", "喙肱肌"],
    icon: "💪",
  },
  {
    id: "wrist_ext",
    label: "腕伸不足",
    severity: "severe",
    metrics: ["腕背伸 ROM 28°（参考 65°）", "腕伸控制平滑性差"],
    impact: "抓握功能受限，书写、打字、持物困难",
    muscles: ["桡侧腕长伸肌", "桡侧腕短伸肌"],
    icon: "🤚",
  },
  {
    id: "forearm_sup",
    label: "前臂旋后不足",
    severity: "moderate",
    metrics: ["旋后 ROM 42°（参考 85°）", "旋后速度降低 52%"],
    impact: "翻转手掌困难，影响进食、洗脸等日常活动",
    muscles: ["旋后肌", "肱二头肌"],
    icon: "🔄",
  },
  {
    id: "finger_ext",
    label: "指伸释放困难",
    severity: "moderate",
    metrics: ["手指伸展 ROM 减少 45%", "释放时间延长 3.2 倍"],
    impact: "无法主动松开抓握的物体，影响放置和释放动作",
    muscles: ["指伸肌", "拇长伸肌"],
    icon: "🖐️",
  },
  {
    id: "scapular",
    label: "肩胛稳定差",
    severity: "mild",
    metrics: ["肩胛前突代偿 +18°", "肩胛上回旋不足"],
    impact: "肩关节运动效率降低，增加肩峰撞击风险",
    muscles: ["前锯肌", "斜方肌中下束"],
    icon: "🦴",
  },
  {
    id: "synergy",
    label: "协同模式",
    severity: "mild",
    metrics: ["屈曲协同模式检出", "肩-肘-腕联动异常"],
    impact: "上肢运动不独立，难以完成精细分离动作",
    muscles: ["多肌群协调"],
    icon: "🔗",
  },
];

function severityColor(s: string) {
  return s === "severe" ? C.red : s === "moderate" ? C.amber : C.teal;
}
function severityLabel(s: string) {
  return s === "severe" ? "重度" : s === "moderate" ? "中度" : "轻度";
}

export default function AssessAnalysisZh() {
  const [, navigate] = useLocation();
  const [pipelineStep, setPipelineStep] = useState(0);
  const [expandedProblem, setExpandedProblem] = useState<string | null>("shoulder_flex");
  const [activeTab, setActiveTab] = useState<"pipeline" | "metrics" | "problems">("pipeline");

  useEffect(() => {
    if (pipelineStep < pipelineStages.length) {
      const t = setTimeout(() => setPipelineStep((p) => p + 1), 600);
      return () => clearTimeout(t);
    }
  }, [pipelineStep]);

  return (
    <div className="min-h-screen" style={{ background: C.bg, color: C.text }}>
      {/* Top bar */}
      <div
        className="fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-6 z-40"
        style={{ background: "rgba(5,13,26,0.95)", borderBottom: `1px solid ${C.border}` }}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/zh/assess/quality")} className="flex items-center gap-1 text-sm" style={{ color: C.muted }}>
            <ChevronLeft size={16} />
            返回质量检查
          </button>
          <span style={{ color: C.border }}>|</span>
          <span className="text-sm font-semibold text-white">AI 生物力学分析</span>
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${C.violet}20`, color: C.violet }}>
            步骤 5–6 / 8
          </span>
        </div>
        <button
          onClick={() => navigate("/zh/assess/plan")}
          className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
          style={{ background: C.teal, color: "#050d1a" }}
        >
          生成训练方案
          <ArrowRight size={14} />
        </button>
      </div>

      <div className="pt-14 max-w-[1300px] mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {[
            { id: "pipeline", label: "分析流程", icon: Layers },
            { id: "metrics", label: "关节指标", icon: BarChart2 },
            { id: "problems", label: "功能问题识别", icon: Target },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: activeTab === tab.id ? `${C.teal}20` : C.panel,
                border: `1px solid ${activeTab === tab.id ? C.teal : C.border}`,
                color: activeTab === tab.id ? C.teal : C.muted,
              }}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Pipeline tab */}
          {activeTab === "pipeline" && (
            <motion.div key="pipeline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {pipelineStages.map((stage, i) => (
                  <motion.div
                    key={stage.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: i < pipelineStep ? 1 : 0.3, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="rounded-2xl p-5"
                    style={{
                      background: i < pipelineStep ? C.panel : "transparent",
                      border: `1px solid ${i < pipelineStep ? C.teal + "40" : C.border}`,
                    }}
                  >
                    <div className="text-3xl mb-3">{stage.icon}</div>
                    <div className="font-semibold text-white mb-1">{stage.label}</div>
                    <div className="text-xs" style={{ color: C.muted }}>{stage.desc}</div>
                    {i < pipelineStep && (
                      <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: C.teal }}>
                        <CheckCircle2 size={12} />
                        完成
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {pipelineStep >= pipelineStages.length && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-6 text-center"
                  style={{ background: `${C.teal}08`, border: `1px solid ${C.teal}30` }}
                >
                  <div className="text-4xl mb-3">🎉</div>
                  <div className="text-xl font-black text-white mb-2">分析完成！</div>
                  <div className="text-sm mb-4" style={{ color: C.muted }}>
                    识别出 <span style={{ color: C.red }}>2 个重度</span>、
                    <span style={{ color: C.amber }}> 2 个中度</span>、
                    <span style={{ color: C.teal }}> 2 个轻度</span>功能问题
                  </div>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => setActiveTab("metrics")}
                      className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                      style={{ border: `1px solid ${C.border}`, color: C.text }}
                    >
                      查看关节指标
                    </button>
                    <button
                      onClick={() => setActiveTab("problems")}
                      className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
                      style={{ background: C.teal, color: "#050d1a" }}
                    >
                      查看功能问题
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Metrics tab */}
          {activeTab === "metrics" && (
            <motion.div key="metrics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-[1fr_1fr] gap-5">
              {/* Radar */}
              <div className="rounded-2xl p-5" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
                <div className="font-semibold text-white mb-4">上肢功能雷达图（患侧 vs 参考值）</div>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: C.muted, fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="参考值" dataKey="full" stroke="rgba(255,255,255,0.15)" fill="rgba(255,255,255,0.05)" />
                    <Radar name="患侧" dataKey="value" stroke={C.teal} fill={C.teal} fillOpacity={0.25} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Bar chart */}
              <div className="rounded-2xl p-5" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
                <div className="font-semibold text-white mb-4">关节 ROM 对比（患侧 vs 健侧，单位：°）</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={jointMetrics} layout="vertical" margin={{ left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: C.muted, fontSize: 10 }} />
                    <YAxis type="category" dataKey="joint" tick={{ fill: C.muted, fontSize: 11 }} width={60} />
                    <Tooltip
                      contentStyle={{ background: "#0d1f35", border: `1px solid ${C.border}`, borderRadius: 8 }}
                      labelStyle={{ color: C.text }}
                    />
                    <Bar dataKey="healthy" name="健侧参考" fill="rgba(255,255,255,0.15)" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="affected" name="患侧" fill={C.teal} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Metric cards */}
              <div className="col-span-2 grid grid-cols-5 gap-3">
                {jointMetrics.map((m) => (
                  <div key={m.joint} className="rounded-xl p-4 text-center" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
                    <div className="text-xs mb-1" style={{ color: C.muted }}>{m.joint}</div>
                    <div className="text-2xl font-black" style={{ color: severityColor(m.severity) }}>
                      {m.affected}{m.unit}
                    </div>
                    <div className="text-xs mt-1" style={{ color: C.muted }}>参考 {m.healthy}{m.unit}</div>
                    <div className="mt-2 text-xs px-2 py-0.5 rounded-full inline-block"
                      style={{ background: `${severityColor(m.severity)}20`, color: severityColor(m.severity) }}>
                      缺损 {m.deficit}%
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Problems tab */}
          {activeTab === "problems" && (
            <motion.div key="problems" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-[1fr_320px] gap-5">
              <div className="space-y-3">
                <div className="text-sm mb-2" style={{ color: C.muted }}>
                  系统从关节指标中识别出以下 <span className="text-white font-semibold">6 个功能问题</span>，按严重程度排序：
                </div>
                {functionalProblems.map((prob) => (
                  <motion.div
                    key={prob.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-2xl overflow-hidden"
                    style={{ border: `1px solid ${severityColor(prob.severity)}40` }}
                  >
                    <button
                      onClick={() => setExpandedProblem(expandedProblem === prob.id ? null : prob.id)}
                      className="w-full flex items-center gap-3 p-4 text-left"
                      style={{ background: `${severityColor(prob.severity)}08` }}
                    >
                      <span className="text-2xl">{prob.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{prob.label}</span>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: `${severityColor(prob.severity)}20`, color: severityColor(prob.severity) }}
                          >
                            {severityLabel(prob.severity)}
                          </span>
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: C.muted }}>{prob.impact}</div>
                      </div>
                      {expandedProblem === prob.id ? <ChevronUp size={16} style={{ color: C.muted }} /> : <ChevronDown size={16} style={{ color: C.muted }} />}
                    </button>
                    <AnimatePresence>
                      {expandedProblem === prob.id && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-2 grid grid-cols-2 gap-3">
                            <div>
                              <div className="text-xs font-semibold mb-2" style={{ color: C.muted }}>支持指标</div>
                              {prob.metrics.map((m, i) => (
                                <div key={i} className="text-xs flex items-start gap-1.5 mb-1" style={{ color: C.text }}>
                                  <TrendingDown size={10} className="mt-0.5 flex-shrink-0" style={{ color: severityColor(prob.severity) }} />
                                  {m}
                                </div>
                              ))}
                            </div>
                            <div>
                              <div className="text-xs font-semibold mb-2" style={{ color: C.muted }}>相关肌群</div>
                              <div className="flex flex-wrap gap-1">
                                {prob.muscles.map((m) => (
                                  <span key={m} className="text-xs px-2 py-0.5 rounded-full"
                                    style={{ background: "rgba(255,255,255,0.06)", color: C.muted }}>
                                    {m}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>

              {/* Summary sidebar */}
              <div className="flex flex-col gap-3">
                <div className="rounded-2xl p-5" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
                  <div className="text-xs font-semibold mb-3" style={{ color: C.muted }}>问题严重程度分布</div>
                  {[
                    { label: "重度", count: 2, color: C.red },
                    { label: "中度", count: 2, color: C.amber },
                    { label: "轻度", count: 2, color: C.teal },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3 mb-3">
                      <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                      <span className="text-sm flex-1" style={{ color: C.text }}>{item.label}</span>
                      <span className="font-bold text-white">{item.count}</span>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl p-5" style={{ background: `${C.violet}08`, border: `1px solid ${C.violet}30` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Brain size={14} style={{ color: C.violet }} />
                    <span className="text-xs font-semibold text-white">AI 临床建议</span>
                  </div>
                  <div className="text-xs leading-relaxed" style={{ color: C.muted }}>
                    优先处理<span style={{ color: C.red }}> 肩屈曲不足</span>和<span style={{ color: C.red }}> 腕伸不足</span>，
                    这两项对日常生活功能影响最大。建议以任务导向训练为主，结合神经肌肉促进技术。
                  </div>
                </div>

                <button
                  onClick={() => navigate("/zh/assess/plan")}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105"
                  style={{ background: C.teal, color: "#050d1a" }}
                >
                  <Zap size={16} />
                  生成个性化训练方案
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
