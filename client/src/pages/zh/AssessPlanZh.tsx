/**
 * AssessPlanZh — 个性化训练方案 + 复测闭环
 * Steps 7+8: AI-generated rehab plan with retest scheduling
 * Design: Dark navy, warm patient-friendly, animated plan cards
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, CheckCircle2, Clock, Calendar, Repeat,
  AlertTriangle, ChevronDown, ChevronUp, ArrowRight,
  Zap, Shield, TrendingUp, RotateCcw, Star, Target,
} from "lucide-react";

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

const exercises = [
  {
    id: "e1",
    name: "辅助肩屈曲训练",
    target: "改善肩关节主动屈曲 ROM，目标 0–90°",
    sets: 3,
    reps: "10 次",
    hold: "3 秒",
    rest: "45 秒",
    frequency: "每日 1 次",
    priority: "高",
    color: C.red,
    progressCondition: "患侧主动屈曲达到 90° 且无代偿，连续 3 次训练",
    stopCondition: "肩部疼痛 > 4/10，或出现半脱位加重",
    safety: "避免过度用力，使用健侧辅助，不要耸肩代偿",
    phase: 1,
    icon: "💪",
  },
  {
    id: "e2",
    name: "腕背伸主动训练",
    target: "提高腕关节主动背伸控制，目标 0–45°",
    sets: 3,
    reps: "15 次",
    hold: "2 秒",
    rest: "30 秒",
    frequency: "每日 2 次",
    priority: "高",
    color: C.red,
    progressCondition: "主动腕背伸达到 45°，控制稳定，连续 5 次训练",
    stopCondition: "腕部疼痛加剧，或出现明显痉挛",
    safety: "前臂充分支撑，只活动腕关节",
    phase: 1,
    icon: "🤚",
  },
  {
    id: "e3",
    name: "前臂旋后训练",
    target: "增加前臂旋后 ROM，目标 0–60°",
    sets: 3,
    reps: "12 次",
    hold: "3 秒",
    rest: "30 秒",
    frequency: "每日 1 次",
    priority: "中",
    color: C.amber,
    progressCondition: "旋后达到 60°，速度流畅，连续 3 次训练",
    stopCondition: "前臂疼痛，或肘部不适",
    safety: "肘部贴近腰部，不要代偿",
    phase: 1,
    icon: "🔄",
  },
  {
    id: "e4",
    name: "手指伸展训练",
    target: "改善手指主动伸展和释放控制",
    sets: 4,
    reps: "10 次",
    hold: "5 秒",
    rest: "30 秒",
    frequency: "每日 2 次",
    priority: "中",
    color: C.amber,
    progressCondition: "手指能完全伸展并保持 5 秒，连续 5 次训练",
    stopCondition: "手部痉挛无法松开",
    safety: "可使用热敷预处理减少痉挛",
    phase: 1,
    icon: "🖐️",
  },
  {
    id: "e5",
    name: "任务导向训练：拿杯子",
    target: "整合上肢功能，完成日常抓握任务",
    sets: 3,
    reps: "8 次",
    hold: "—",
    rest: "45 秒",
    frequency: "每日 1 次",
    priority: "中",
    color: C.amber,
    progressCondition: "能稳定完成 8 次杯子转移，无明显代偿",
    stopCondition: "物体反复掉落超过 5 次",
    safety: "使用轻质杯子，桌面操作",
    phase: 2,
    icon: "☕",
  },
  {
    id: "e6",
    name: "肩胛稳定训练",
    target: "改善肩胛骨控制，减少代偿运动",
    sets: 3,
    reps: "12 次",
    hold: "5 秒",
    rest: "30 秒",
    frequency: "每日 1 次",
    priority: "低",
    color: C.teal,
    progressCondition: "肩胛前突代偿减少至 < 10°",
    stopCondition: "肩部疼痛加剧",
    safety: "动作缓慢，专注肩胛骨内收",
    phase: 2,
    icon: "🦴",
  },
];

const retestSchedule = [
  { week: 1, label: "基线评估", status: "done", date: "2026-05-28", score: 44 },
  { week: 2, label: "第 1 次复测", status: "upcoming", date: "2026-06-11", score: null },
  { week: 4, label: "第 2 次复测", status: "upcoming", date: "2026-06-25", score: null },
  { week: 6, label: "第 3 次复测", status: "upcoming", date: "2026-07-09", score: null },
  { week: 8, label: "阶段总结", status: "upcoming", date: "2026-07-23", score: null },
];

export default function AssessPlanZh() {
  const [, navigate] = useLocation();
  const [expandedEx, setExpandedEx] = useState<string | null>("e1");
  const [activePhase, setActivePhase] = useState(1);
  const [confirmedPlan, setConfirmedPlan] = useState(false);

  const filteredExercises = exercises.filter((e) => e.phase === activePhase);

  return (
    <div className="min-h-screen" style={{ background: C.bg, color: C.text }}>
      {/* Top bar */}
      <div
        className="fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-6 z-40"
        style={{ background: "rgba(5,13,26,0.95)", borderBottom: `1px solid ${C.border}` }}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/zh/assess/analysis")} className="flex items-center gap-1 text-sm" style={{ color: C.muted }}>
            <ChevronLeft size={16} />
            返回分析
          </button>
          <span style={{ color: C.border }}>|</span>
          <span className="text-sm font-semibold text-white">个性化训练方案</span>
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${C.teal}20`, color: C.teal }}>
            步骤 7–8 / 8
          </span>
        </div>
        {!confirmedPlan ? (
          <button
            onClick={() => setConfirmedPlan(true)}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
            style={{ background: C.teal, color: "#050d1a" }}
          >
            <CheckCircle2 size={14} />
            确认并开始训练
          </button>
        ) : (
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: C.teal }}>
            <CheckCircle2 size={16} />
            训练方案已确认
          </div>
        )}
      </div>

      <div className="pt-14 max-w-[1300px] mx-auto px-6 py-6 grid grid-cols-[1fr_300px] gap-5">
        {/* Main: exercises */}
        <div>
          {/* Phase selector */}
          <div className="flex gap-2 mb-5">
            {[1, 2].map((phase) => (
              <button
                key={phase}
                onClick={() => setActivePhase(phase)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: activePhase === phase ? `${C.teal}20` : C.panel,
                  border: `1px solid ${activePhase === phase ? C.teal : C.border}`,
                  color: activePhase === phase ? C.teal : C.muted,
                }}
              >
                第 {phase} 阶段
                <span className="text-xs opacity-70">
                  {phase === 1 ? "第 1–4 周" : "第 5–8 周"}
                </span>
              </button>
            ))}
          </div>

          <div className="text-sm mb-4" style={{ color: C.muted }}>
            {activePhase === 1
              ? "第一阶段专注于恢复基本 ROM 和主动控制，以单关节训练为主。"
              : "第二阶段引入任务导向和多关节协调训练，向功能性活动过渡。"}
          </div>

          <div className="space-y-3">
            {filteredExercises.map((ex) => (
              <motion.div
                key={ex.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl overflow-hidden"
                style={{ border: `1px solid ${ex.color}30` }}
              >
                <button
                  onClick={() => setExpandedEx(expandedEx === ex.id ? null : ex.id)}
                  className="w-full flex items-center gap-4 p-5 text-left"
                  style={{ background: `${ex.color}06` }}
                >
                  <span className="text-2xl">{ex.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-white">{ex.name}</span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: `${ex.color}20`, color: ex.color }}
                      >
                        优先级：{ex.priority}
                      </span>
                    </div>
                    <div className="text-xs" style={{ color: C.muted }}>{ex.target}</div>
                  </div>
                  <div className="flex items-center gap-4 text-xs mr-2" style={{ color: C.muted }}>
                    <span className="flex items-center gap-1"><Repeat size={12} />{ex.sets} 组 × {ex.reps}</span>
                    <span className="flex items-center gap-1"><Clock size={12} />{ex.frequency}</span>
                  </div>
                  {expandedEx === ex.id ? <ChevronUp size={16} style={{ color: C.muted }} /> : <ChevronDown size={16} style={{ color: C.muted }} />}
                </button>

                <AnimatePresence>
                  {expandedEx === ex.id && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-2 grid grid-cols-3 gap-4">
                        {/* Dose */}
                        <div className="rounded-xl p-4" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
                          <div className="text-xs font-semibold mb-2" style={{ color: C.muted }}>训练剂量</div>
                          <div className="space-y-1.5 text-xs" style={{ color: C.text }}>
                            <div className="flex justify-between"><span>组数</span><span className="font-semibold">{ex.sets} 组</span></div>
                            <div className="flex justify-between"><span>次数</span><span className="font-semibold">{ex.reps}</span></div>
                            <div className="flex justify-between"><span>保持</span><span className="font-semibold">{ex.hold}</span></div>
                            <div className="flex justify-between"><span>组间休息</span><span className="font-semibold">{ex.rest}</span></div>
                            <div className="flex justify-between"><span>频率</span><span className="font-semibold">{ex.frequency}</span></div>
                          </div>
                        </div>

                        {/* Progress condition */}
                        <div className="rounded-xl p-4" style={{ background: `${C.teal}08`, border: `1px solid ${C.teal}20` }}>
                          <div className="flex items-center gap-1.5 mb-2">
                            <TrendingUp size={12} style={{ color: C.teal }} />
                            <span className="text-xs font-semibold" style={{ color: C.teal }}>进阶条件</span>
                          </div>
                          <div className="text-xs leading-relaxed" style={{ color: C.muted }}>{ex.progressCondition}</div>
                        </div>

                        {/* Stop + safety */}
                        <div className="space-y-2">
                          <div className="rounded-xl p-3" style={{ background: `${C.red}08`, border: `1px solid ${C.red}20` }}>
                            <div className="flex items-center gap-1.5 mb-1">
                              <AlertTriangle size={11} style={{ color: C.red }} />
                              <span className="text-xs font-semibold" style={{ color: C.red }}>停止条件</span>
                            </div>
                            <div className="text-xs" style={{ color: C.muted }}>{ex.stopCondition}</div>
                          </div>
                          <div className="rounded-xl p-3" style={{ background: `${C.amber}08`, border: `1px solid ${C.amber}20` }}>
                            <div className="flex items-center gap-1.5 mb-1">
                              <Shield size={11} style={{ color: C.amber }} />
                              <span className="text-xs font-semibold" style={{ color: C.amber }}>安全提示</span>
                            </div>
                            <div className="text-xs" style={{ color: C.muted }}>{ex.safety}</div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right: retest schedule + summary */}
        <div className="flex flex-col gap-4">
          {/* Summary */}
          <div className="rounded-2xl p-5" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
            <div className="text-xs font-semibold mb-3" style={{ color: C.muted }}>方案概览</div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "训练动作", value: `${exercises.length} 个`, icon: Target },
                { label: "训练周期", value: "8 周", icon: Calendar },
                { label: "每日时长", value: "45–60 分钟", icon: Clock },
                { label: "每周频率", value: "5–6 天", icon: Repeat },
              ].map((item) => (
                <div key={item.label} className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}` }}>
                  <div className="text-lg font-black text-white">{item.value}</div>
                  <div className="text-xs mt-0.5" style={{ color: C.muted }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Retest schedule */}
          <div className="rounded-2xl p-5" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-2 mb-4">
              <RotateCcw size={14} style={{ color: C.teal }} />
              <span className="text-sm font-semibold text-white">复测闭环计划</span>
            </div>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px" style={{ background: C.border }} />
              <div className="space-y-4">
                {retestSchedule.map((item) => (
                  <div key={item.week} className="flex items-start gap-3 pl-8 relative">
                    <div
                      className="absolute left-3 top-1 w-2.5 h-2.5 rounded-full -translate-x-1/2"
                      style={{
                        background: item.status === "done" ? C.teal : "rgba(255,255,255,0.1)",
                        border: `2px solid ${item.status === "done" ? C.teal : C.border}`,
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white">{item.label}</span>
                        {item.score !== null && (
                          <span className="text-xs font-bold" style={{ color: C.teal }}>
                            {item.score}/100
                          </span>
                        )}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: C.muted }}>
                        第 {item.week} 周 · {item.date}
                      </div>
                      {item.status === "done" && (
                        <div className="text-xs mt-1" style={{ color: C.teal }}>✓ 已完成</div>
                      )}
                      {item.status === "upcoming" && (
                        <div className="text-xs mt-1" style={{ color: C.muted }}>
                          重复相同动作包，自动对比趋势
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI auto-adjust note */}
          <div className="rounded-2xl p-4" style={{ background: `${C.violet}08`, border: `1px solid ${C.violet}30` }}>
            <div className="flex items-start gap-2">
              <Zap size={14} style={{ color: C.violet, marginTop: 2 }} />
              <div className="text-xs leading-relaxed" style={{ color: C.muted }}>
                <span style={{ color: C.violet }} className="font-semibold">AI 自动调整：</span>
                每次复测后，系统将自动比较趋势，并根据进步情况调整训练难度、组数和进阶动作。
              </div>
            </div>
          </div>

          {confirmedPlan && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl p-5 text-center"
              style={{ background: `${C.teal}10`, border: `1px solid ${C.teal}40` }}
            >
              <div className="text-3xl mb-2">🎉</div>
              <div className="font-bold text-white mb-1">方案已确认！</div>
              <div className="text-xs mb-3" style={{ color: C.muted }}>
                训练方案已发送至患者 App，第一次复测已安排在 2026-06-11。
              </div>
              <button
                onClick={() => navigate("/zh/assess")}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
                style={{ background: C.teal, color: "#050d1a" }}
              >
                返回主页
                <ArrowRight size={14} />
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
