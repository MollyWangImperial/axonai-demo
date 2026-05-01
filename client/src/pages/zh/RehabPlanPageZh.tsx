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
    title: "左侧髋屈肌强化训练",
    priority: "关键",
    priorityColor: "#ef4444",
    rationale: "髋关节屈曲活动度受限至 15°（正常值：30°），是步幅缩短和步态不对称的主要原因。",
    exercises: ["髋屈肌牵伸 — 3×30秒保持", "仰卧髋关节屈曲 — 3×15次", "坐位抬膝 — 2×20次"],
    frequency: "每日",
    duration: "20 min",
  },
  {
    id: "pelvic",
    title: "骨盆稳定性与核心控制",
    priority: "较高",
    priorityColor: "#f59e0b",
    rationale: "支撑末期可见补偿性骨盆倾斜，核心肌群无力导致躯干侧移。",
    exercises: ["骨盆倾斜训练 — 3×15次", "死虫式 — 3×10次（每侧）", "侧卧髋外展 — 3×15次"],
    frequency: "每周5次",
    duration: "15 min",
  },
  {
    id: "ankle",
    title: "踝关节背屈活动度训练",
    priority: "较高",
    priorityColor: "#f59e0b",
    rationale: "踝关节背屈不足20°，增加拖步风险，并降低迈步前期的推进力。",
    exercises: ["靠墙小腿牵伸 — 3×30秒", "踝关节字母操 — 每脚2组", "弹力带背屈训练 — 3×20次"],
    frequency: "每日",
    duration: "10 min",
  },
  {
    id: "balance",
    title: "平衡与本体感觉训练",
    priority: "中等",
    priorityColor: "#8B5CF6",
    rationale: "单腿支撑时间缩短至4.2秒（正常值：>10秒），质心摇摆幅度超出阈值42%。",
    exercises: ["单腿站立 — 3×30秒（每侧）", "串行步行 — 2×10米", "平衡板站立 — 3×45秒"],
    frequency: "每周4次",
    duration: "15 min",
  },
];

const trainingPlan = [
  {
    week: "第1–2周",
    phase: "基础期",
    color: "#00D4AA",
    goal: "恢复基础活动度，激活抑制的肌肉群",
    sessions: [
      { day: "周一", focus: "髋关节与骨盆", duration: "35 min", intensity: "低强度" },
      { day: "周三", focus: "踝关节与平衡", duration: "30 min", intensity: "低强度" },
      { day: "周五", focus: "全下肢综合", duration: "40 min", intensity: "低-中强度" },
    ],
    homeExercises: "每日：髋屈肌牵伸、踝关节活动度训练（15分钟）",
  },
  {
    week: "第3–4周",
    phase: "强化期",
    color: "#8B5CF6",
    goal: "髋屈肌和踝背屈肌的渐进性负荷训练",
    sessions: [
      { day: "周一", focus: "髋关节力量", duration: "40 min", intensity: "中等" },
      { day: "周二", focus: "平衡训练", duration: "30 min", intensity: "中等" },
      { day: "周四", focus: "步态再训练", duration: "45 min", intensity: "中等" },
      { day: "周六", focus: "功能性动作", duration: "35 min", intensity: "中等" },
    ],
    homeExercises: "每日：弹力带训练、平衡板训练（20分钟）",
  },
  {
    week: "第5–8周",
    phase: "功能整合期",
    color: "#00A8FF",
    goal: "将训练成果整合至正常步态模式及社区活动能力",
    sessions: [
      { day: "周一", focus: "步态与速度", duration: "45 min", intensity: "中-高强度" },
      { day: "周三", focus: "耐力步行", duration: "50 min", intensity: "中等" },
      { day: "周五", focus: "功能性任务", duration: "45 min", intensity: "中-高强度" },
      { day: "周日", focus: "主动恢复", duration: "30 min", intensity: "低强度" },
    ],
    homeExercises: "每日：20分钟社区步行、居家康复方案（25分钟）",
  },
];

const weeklySchedule = [
  { day: "周一", sessions: ["髋屈肌强化训练（30分钟）", "骨盆稳定性训练（15分钟）"], homeTask: "踝关节牵伸 × 3组" },
  { day: "周二", sessions: ["平衡训练（30分钟）"], homeTask: "髋屈肌牵伸 × 3组" },
  { day: "周三", sessions: ["步态再训练（45分钟）", "踝关节活动度训练（15分钟）"], homeTask: "弹力带训练" },
  { day: "周四", sessions: ["休息 / 轻度步行（20分钟）"], homeTask: "平衡板训练 × 3组" },
  { day: "周五", sessions: ["全下肢综合训练（40分钟）"], homeTask: "踝关节字母操 × 2组" },
  { day: "周六", sessions: ["功能性动作训练（35分钟）"], homeTask: "社区步行15分钟" },
  { day: "周日", sessions: ["主动恢复 / 拉伸（30分钟）"], homeTask: "放松与轻度拉伸" },
];

const nutritionAdvice = [
  {
    category: "蛋白质摄入",
    icon: Dumbbell,
    color: "#00D4AA",
    recommendation: "每日每千克体重摄入1.4–1.6克蛋白质，支持康复期间的肌肉修复与增长。",
    foods: ["鸡胸肉、三文鱼、鸡蛋", "希腊酸奶、茅屋奶酪", "豆类、豆腐、藜麦"],
    timing: "分散于3–4餐摄入；训练后30分钟内补充20–30克",
  },
  {
    category: "抗炎饮食",
    icon: Heart,
    color: "#EC4899",
    recommendation: "降低全身炎症反应，支持神经恢复，减少运动中的关节疼痛。",
    foods: ["富脂鱼类（Omega-3）", "浆果类、深绿色蔬菜", "姜黄、生姜、橄榄油"],
    timing: "每餐均应包含；避免加工食品和精制糖",
  },
  {
    category: "骨骼与关节健康",
    icon: Zap,
    color: "#F59E0B",
    recommendation: "充足的钙和维生素D支持骨骼完整性，对脑卒中后患者尤为重要。",
    foods: ["乳制品或强化植物奶", "富脂鱼类、蛋黄", "深绿色蔬菜（羽衣甘蓝、西兰花）"],
    timing: "维生素D补充剂1000–2000 IU/天（请咨询医生）；钙与餐同服",
  },
  {
    category: "水分补充",
    icon: Flame,
    color: "#00A8FF",
    recommendation: "充足水分支持肌肉功能、认知表现和运动耐受性。",
    foods: ["水（首选）", "草本茶、稀释果汁", "运动后电解质饮料"],
    timing: "每日2–2.5升；每次训练前2小时内补充500毫升",
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
          <span className="text-xs text-slate-500">{open ? "收起" : "展开"}</span>
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
            onClick={() => navigate("/zh/report")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            报告
          </button>
          <div className="w-px h-4 bg-white/20" />
          <span className="text-white font-black tracking-widest text-lg">AXONAI</span>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <span>/</span>
            <span className="text-slate-300">康复方案</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 border border-white/10">
            <Download size={13} />
            导出方案
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
            第 3 步 / 共 3 步 — 个性化康复方案
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            AI 驱动的个性化康复方案
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl">
            系统已通过深度学习算法分析运动学缺陷，自动生成完整的居家康复处方，包括重点训练区域、运动库和营养指导。
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
              <p className="text-xs text-slate-400 mb-0.5">患者</p>
              <p className="text-white font-semibold">{patientName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">诊断</p>
              <p className="text-white font-semibold">脑卒中后步态康复</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">步态得分</p>
              <p className="font-semibold" style={{ color: "#00D4AA" }}>{metrics.gaitScore}/100</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">步行速度</p>
              <p className="font-semibold text-amber-400">{metrics.speed} m/s （受损）</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">方案周期</p>
              <p className="text-white font-semibold flex items-center gap-1.5">
                <Clock size={13} className="text-[#8B5CF6]" />
                8 周
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4 pt-3 border-t border-white/10">
            基于当前步态数据，最突出的异常特征为步行速度降低（0.65 m/s），提示步态效率和稳定性受损。可观察到显著的代偿策略，可能导致异常步态模式和关节磨损。以下渐进式方案重点关注恢复步态节律、下肢控制、平衡能力和行走能力。
          </p>
        </motion.div>

        {/* Expandable modules */}
        <div className="space-y-3">
          {/* 1. Key Focus Areas */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Module title="重点训练区域" icon={Target} color="#ef4444" defaultOpen badge="已识别4个重点区域">
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
                      训练频率：<span className="text-slate-300">{area.frequency}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Module>
          </motion.div>

          {/* 2. Training Plan */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Module title="渐进式训练计划" icon={Dumbbell} color="#00D4AA" badge="3个阶段 · 8周">
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
                        <span className="text-slate-300 font-medium">目标：</span>{phase.goal}
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
                                  s.intensity.includes("高") ? "#ef444420" :
                                  s.intensity.includes("中") ? "#f59e0b20" : "#10b98120",
                                color:
                                  s.intensity.includes("高") ? "#ef4444" :
                                  s.intensity.includes("中") ? "#f59e0b" : "#10b981",
                              }}
                            >
                              {s.intensity}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-start gap-2 text-xs text-slate-400 bg-white/3 rounded-lg px-3 py-2">
                        <AlertCircle size={11} className="text-[#00D4AA] flex-shrink-0 mt-0.5" />
                        <span><span className="text-[#00D4AA] font-medium">居家训练：</span>{phase.homeExercises}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Module>
          </motion.div>

          {/* 3. Weekly Schedule */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Module title="每周训练计划" icon={Calendar} color="#8B5CF6" badge="第3周模板">
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
                      <p className="text-xs text-slate-500">居家：</p>
                      <p className="text-xs text-slate-400">{day.homeTask}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Module>
          </motion.div>

          {/* 4. Nutrition Advice */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Module title="营养与恢复指导" icon={Apple} color="#10B981" badge="4个类别">
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
                      <span style={{ color: item.color }} className="font-medium">服用时间：</span>
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
          本方案仅基于所提供的步态指标和静态康复表现，作为康复参考，不构成医疗诊断。开始任何康复计划前，请务必咨询合格的物理治疗师。
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-[#8B5CF6]/10 to-[#00D4AA]/10 border border-[#8B5CF6]/20 rounded-2xl p-6"
        >
          <div>
            <h3 className="text-white font-bold mb-1">实时监测患者进展</h3>
            <p className="text-sm text-slate-400">
              进入治疗师工作台，跟踪 {patientName}的依从性，调整方案并进行远程沟通。
            </p>
          </div>
          <button
            onClick={() => navigate("/zh/dashboard")}
            className="flex-shrink-0 flex items-center gap-2 bg-gradient-to-r from-[#8B5CF6] to-[#00A8FF] text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-all text-sm whitespace-nowrap"
          >
            <Users size={15} />
            治疗师工作台
            <ChevronRight size={16} />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
