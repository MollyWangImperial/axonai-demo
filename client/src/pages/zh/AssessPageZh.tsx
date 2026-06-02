/**
 * AssessPageZh — AxonAI 中文评估工作台
 * Design: Warm dark navy + teal/amber, patient-friendly, animated, 3-column layout
 * Step 1: 入站筛查 (Intake Screening)
 * Left: Patient profile card
 * Centre: Step-by-step screening form
 * Right: Assessment status + auto-selected packages
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Calendar, Activity, AlertTriangle, CheckCircle2,
  ChevronRight, ChevronLeft, Brain, Eye, MessageSquare,
  Users, Stethoscope, Heart, Shield, ArrowRight, Zap,
  Home, Bell, Settings, LogOut, BarChart2, ClipboardList,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// ─── Colour tokens ─────────────────────────────────────────────────────────
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

// ─── Mock patient data ─────────────────────────────────────────────────────
const patient = {
  name: "张伟",
  id: "PAT-000312",
  age: 64,
  gender: "男",
  dob: "1960年3月12日",
  diagnosis: "缺血性脑卒中",
  onsetDate: "2024年10月8日（约7周）",
  affectedSide: "右侧",
  dominantHand: "右手",
  therapist: "李慧敏 治疗师",
  nextSession: "2024年12月3日 14:00",
};

// ─── Screening questions ───────────────────────────────────────────────────
type ScreeningState = {
  stage: string;
  pain: number;
  subluxation: string;
  spasticity: string;
  fallRisk: string;
  cognitive: string[];
  accompanied: string;
  therapistNote: string;
};

const cognitiveOptions = [
  { id: "vision", label: "视野缺损", icon: Eye },
  { id: "aphasia", label: "失语症", icon: MessageSquare },
  { id: "cognitive", label: "认知障碍", icon: Brain },
  { id: "none", label: "无明显问题", icon: CheckCircle2 },
];

// ─── Package definitions ──────────────────────────────────────────────────
const packages = [
  {
    id: "upper",
    label: "上肢包",
    icon: "💪",
    desc: "肩、肘、前臂运动评估",
    actions: 6,
    duration: "约12分钟",
    color: C.teal,
    selected: true,
  },
  {
    id: "hand",
    label: "手功能包",
    icon: "🤚",
    desc: "抓握、释放、精细动作",
    actions: 5,
    duration: "约10分钟",
    color: C.violet,
    selected: true,
  },
  {
    id: "gait",
    label: "步态包",
    icon: "🚶",
    desc: "步速、步长、对称性",
    actions: 4,
    duration: "约8分钟",
    color: C.amber,
    selected: false,
  },
  {
    id: "balance",
    label: "平衡包",
    icon: "⚖️",
    desc: "静态/动态平衡控制",
    actions: 3,
    duration: "约6分钟",
    color: "#EC4899",
    selected: false,
  },
  {
    id: "trunk",
    label: "躯干包",
    icon: "🏋️",
    desc: "核心稳定与躯干控制",
    actions: 3,
    duration: "约6分钟",
    color: "#06B6D4",
    selected: false,
  },
];

// ─── Nav sidebar ──────────────────────────────────────────────────────────
function Sidebar({ active }: { active: string }) {
  const [, navigate] = useLocation();
  const { logout } = useAuth();
  const navItems = [
    { icon: Home, label: "首页", path: "/zh/dashboard" },
    { icon: ClipboardList, label: "评估", path: "/zh/assess", active: true },
    { icon: BarChart2, label: "报告", path: "/zh/report" },
    { icon: Users, label: "患者", path: "/zh/dashboard" },
    { icon: Settings, label: "设置", path: "/zh/dashboard" },
  ];
  return (
    <div
      className="fixed left-0 top-0 h-full w-16 flex flex-col items-center py-4 gap-2 z-50"
      style={{ background: "rgba(5,13,26,0.95)", borderRight: `1px solid ${C.border}` }}
    >
      <button
        onClick={() => navigate("/zh")}
        className="mb-4 w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: C.teal }}
      >
        <Zap size={18} color="#050d1a" />
      </button>
      {navItems.map((item) => (
        <button
          key={item.label}
          onClick={() => navigate(item.path)}
          title={item.label}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110"
          style={{
            background: item.active ? `${C.teal}20` : "transparent",
            color: item.active ? C.teal : C.muted,
          }}
        >
          <item.icon size={18} />
        </button>
      ))}
      <div className="flex-1" />
      <button
        onClick={() => { logout(); navigate("/zh/login"); }}
        title="退出登录"
        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110"
        style={{ color: C.muted }}
      >
        <LogOut size={18} />
      </button>
    </div>
  );
}

// ─── Patient card (left column) ───────────────────────────────────────────
function PatientCard({ screening }: { screening: ScreeningState }) {
  return (
    <div className="flex flex-col gap-3">
      {/* Avatar + name */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="rounded-2xl p-5"
        style={{ background: C.panel, border: `1px solid ${C.border}` }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold"
            style={{ background: `${C.teal}20`, color: C.teal }}
          >
            {patient.name[0]}
          </div>
          <div>
            <div className="font-bold text-white text-lg">{patient.name}</div>
            <div className="text-xs" style={{ color: C.muted }}>{patient.id}</div>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          {[
            { label: "年龄", value: `${patient.age}岁 · ${patient.gender}` },
            { label: "诊断", value: patient.diagnosis },
            { label: "发病时间", value: patient.onsetDate },
            { label: "患侧", value: patient.affectedSide },
            { label: "惯用手", value: patient.dominantHand },
          ].map((row) => (
            <div key={row.label} className="flex justify-between">
              <span style={{ color: C.muted }}>{row.label}</span>
              <span className="text-white font-medium">{row.value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Therapist */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl p-4"
        style={{ background: C.panel, border: `1px solid ${C.border}` }}
      >
        <div className="text-xs font-semibold mb-2" style={{ color: C.muted }}>主治治疗师</div>
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${C.violet}20`, color: C.violet }}
          >
            <Stethoscope size={14} />
          </div>
          <span className="text-white text-sm font-medium">{patient.therapist}</span>
        </div>
      </motion.div>

      {/* Screening summary (fills as user completes) */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl p-4"
        style={{ background: C.panel, border: `1px solid ${C.border}` }}
      >
        <div className="text-xs font-semibold mb-3" style={{ color: C.muted }}>筛查摘要</div>
        <div className="space-y-2 text-sm">
          {screening.stage && (
            <div className="flex justify-between">
              <span style={{ color: C.muted }}>病程阶段</span>
              <span className="text-white">{screening.stage}</span>
            </div>
          )}
          {screening.pain > 0 && (
            <div className="flex justify-between">
              <span style={{ color: C.muted }}>疼痛评分</span>
              <span style={{ color: screening.pain >= 7 ? C.red : screening.pain >= 4 ? C.amber : C.teal }}>
                {screening.pain}/10
              </span>
            </div>
          )}
          {screening.fallRisk && (
            <div className="flex justify-between">
              <span style={{ color: C.muted }}>跌倒风险</span>
              <span style={{ color: screening.fallRisk === "高" ? C.red : screening.fallRisk === "中" ? C.amber : C.teal }}>
                {screening.fallRisk}风险
              </span>
            </div>
          )}
          {screening.cognitive.length > 0 && !screening.cognitive.includes("none") && (
            <div className="flex justify-between">
              <span style={{ color: C.muted }}>认知/感知</span>
              <span className="text-white text-right text-xs">{screening.cognitive.join("、")}</span>
            </div>
          )}
          {screening.accompanied && (
            <div className="flex justify-between">
              <span style={{ color: C.muted }}>陪同人员</span>
              <span className="text-white">{screening.accompanied}</span>
            </div>
          )}
        </div>
        {!screening.stage && (
          <div className="text-xs text-center py-2" style={{ color: C.muted }}>
            完成筛查后显示摘要
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Assessment status (right column) ────────────────────────────────────
function AssessmentStatus({ pkgs }: { pkgs: typeof packages }) {
  const selected = pkgs.filter((p) => p.selected);
  const totalActions = selected.reduce((s, p) => s + p.actions, 0);
  const totalMins = selected.reduce((s, p) => s + (parseInt(p.duration.replace(/[^0-9]/g, "")) || 0), 0);
  return (
    <div className="flex flex-col gap-3">
      {/* Progress ring */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="rounded-2xl p-5 text-center"
        style={{ background: C.panel, border: `1px solid ${C.border}` }}
      >
        <div className="text-xs font-semibold mb-3" style={{ color: C.muted }}>评估状态</div>
        <div className="relative w-24 h-24 mx-auto mb-3">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="40" fill="none"
              stroke={C.teal} strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 40 * 0.1} ${2 * Math.PI * 40 * 0.9}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-white">10%</span>
          </div>
        </div>
        <div className="text-sm text-white font-semibold">入站筛查中</div>
        <div className="text-xs mt-1" style={{ color: C.muted }}>第 1 步，共 8 步</div>
      </motion.div>

      {/* Auto-selected packages */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl p-4"
        style={{ background: C.panel, border: `1px solid ${C.border}` }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Zap size={14} style={{ color: C.teal }} />
          <span className="text-xs font-semibold text-white">系统推荐采集包</span>
        </div>
        <div className="space-y-2">
          {pkgs.map((pkg) => (
            <div
              key={pkg.id}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
              style={{
                background: pkg.selected ? `${pkg.color}15` : "transparent",
                border: `1px solid ${pkg.selected ? pkg.color + "40" : C.border}`,
                opacity: pkg.selected ? 1 : 0.4,
              }}
            >
              <span>{pkg.icon}</span>
              <span className="flex-1 font-medium" style={{ color: pkg.selected ? pkg.color : C.muted }}>
                {pkg.label}
              </span>
              {pkg.selected && (
                <CheckCircle2 size={12} style={{ color: pkg.color }} />
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t text-xs" style={{ borderColor: C.border }}>
          <div className="flex justify-between" style={{ color: C.muted }}>
            <span>预计动作数</span>
            <span className="text-white font-semibold">{totalActions} 个</span>
          </div>
          <div className="flex justify-between mt-1" style={{ color: C.muted }}>
            <span>预计时长</span>
            <span className="text-white font-semibold">约 {totalMins} 分钟</span>
          </div>
        </div>
      </motion.div>

      {/* Safety note */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl p-4"
        style={{ background: `${C.amber}10`, border: `1px solid ${C.amber}30` }}
      >
        <div className="flex items-start gap-2">
          <Shield size={14} style={{ color: C.amber, marginTop: 2 }} />
          <div>
            <div className="text-xs font-semibold mb-1" style={{ color: C.amber }}>安全提示</div>
            <div className="text-xs leading-relaxed" style={{ color: C.muted }}>
              如患者在任何动作中出现疼痛加剧、头晕或不适，请立即停止并告知治疗师。
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Screening form (centre column) ──────────────────────────────────────
function ScreeningForm({
  screening,
  setScreening,
  onComplete,
}: {
  screening: ScreeningState;
  setScreening: (s: ScreeningState) => void;
  onComplete: () => void;
}) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      id: "stage",
      title: "病程阶段",
      subtitle: "请选择患者目前所处的康复阶段",
      content: (
        <div className="grid grid-cols-2 gap-3">
          {["急性期（≤2周）", "亚急性期（2-12周）", "慢性期（>12周）", "稳定维持期"].map((s) => (
            <button
              key={s}
              onClick={() => setScreening({ ...screening, stage: s })}
              className="rounded-xl p-4 text-sm font-medium text-left transition-all hover:scale-[1.02]"
              style={{
                background: screening.stage === s ? `${C.teal}20` : C.panel,
                border: `1px solid ${screening.stage === s ? C.teal : C.border}`,
                color: screening.stage === s ? C.teal : C.text,
              }}
            >
              {s}
            </button>
          ))}
        </div>
      ),
    },
    {
      id: "pain",
      title: "疼痛评估",
      subtitle: "患者当前静息状态下的疼痛程度（0 = 无痛，10 = 最剧烈）",
      content: (
        <div>
          <div className="flex justify-between mb-2 text-xs" style={{ color: C.muted }}>
            <span>😊 无痛</span>
            <span>😣 轻度</span>
            <span>😫 中度</span>
            <span>😭 重度</span>
          </div>
          <input
            type="range" min={0} max={10} step={1}
            value={screening.pain}
            onChange={(e) => setScreening({ ...screening, pain: +e.target.value })}
            className="w-full accent-teal-400 h-2 rounded-full cursor-pointer"
            style={{ accentColor: C.teal }}
          />
          <div className="text-center mt-4">
            <span
              className="text-5xl font-black"
              style={{ color: screening.pain >= 7 ? C.red : screening.pain >= 4 ? C.amber : C.teal }}
            >
              {screening.pain}
            </span>
            <span className="text-xl text-white"> / 10</span>
          </div>
          <div className="text-center text-sm mt-2" style={{ color: C.muted }}>
            {screening.pain === 0 ? "无疼痛" : screening.pain <= 3 ? "轻度疼痛" : screening.pain <= 6 ? "中度疼痛，注意监控" : "重度疼痛，建议暂缓评估"}
          </div>
        </div>
      ),
    },
    {
      id: "subluxation",
      title: "肩关节半脱位",
      subtitle: "是否存在患侧肩关节半脱位？",
      content: (
        <div className="grid grid-cols-3 gap-3">
          {["无", "轻度（<1指）", "明显（≥1指）"].map((s) => (
            <button
              key={s}
              onClick={() => setScreening({ ...screening, subluxation: s })}
              className="rounded-xl p-4 text-sm font-medium text-center transition-all hover:scale-[1.02]"
              style={{
                background: screening.subluxation === s ? `${C.violet}20` : C.panel,
                border: `1px solid ${screening.subluxation === s ? C.violet : C.border}`,
                color: screening.subluxation === s ? C.violet : C.text,
              }}
            >
              {s}
            </button>
          ))}
        </div>
      ),
    },
    {
      id: "spasticity",
      title: "痉挛程度",
      subtitle: "患侧肢体痉挛等级（改良 Ashworth 量表）",
      content: (
        <div className="space-y-2">
          {[
            { val: "0级", desc: "无肌张力增加" },
            { val: "1级", desc: "轻微增加，被动活动末端有阻力" },
            { val: "1+级", desc: "轻微增加，ROM 1/2 以下有阻力" },
            { val: "2级", desc: "明显增加，全 ROM 均有阻力但可被动活动" },
            { val: "3级", desc: "肌张力显著增加，被动活动困难" },
            { val: "4级", desc: "患侧肢体僵硬，屈曲或伸展位固定" },
          ].map((item) => (
            <button
              key={item.val}
              onClick={() => setScreening({ ...screening, spasticity: item.val })}
              className="w-full rounded-xl px-4 py-3 text-sm text-left flex items-center gap-3 transition-all hover:scale-[1.01]"
              style={{
                background: screening.spasticity === item.val ? `${C.amber}15` : C.panel,
                border: `1px solid ${screening.spasticity === item.val ? C.amber : C.border}`,
              }}
            >
              <span className="font-bold w-10" style={{ color: C.amber }}>{item.val}</span>
              <span style={{ color: C.muted }}>{item.desc}</span>
            </button>
          ))}
        </div>
      ),
    },
    {
      id: "fallRisk",
      title: "跌倒风险",
      subtitle: "根据近期跌倒史和平衡能力评估跌倒风险",
      content: (
        <div className="grid grid-cols-3 gap-3">
          {[
            { val: "低", color: C.teal, desc: "无近期跌倒史，平衡良好" },
            { val: "中", color: C.amber, desc: "偶有跌倒，需辅助工具" },
            { val: "高", color: C.red, desc: "频繁跌倒，需持续监护" },
          ].map((item) => (
            <button
              key={item.val}
              onClick={() => setScreening({ ...screening, fallRisk: item.val })}
              className="rounded-xl p-4 text-sm font-medium text-center transition-all hover:scale-[1.02]"
              style={{
                background: screening.fallRisk === item.val ? `${item.color}20` : C.panel,
                border: `1px solid ${screening.fallRisk === item.val ? item.color : C.border}`,
              }}
            >
              <div className="text-2xl mb-1">{item.val === "低" ? "🟢" : item.val === "中" ? "🟡" : "🔴"}</div>
              <div style={{ color: item.color }} className="font-bold">{item.val}风险</div>
              <div className="text-xs mt-1" style={{ color: C.muted }}>{item.desc}</div>
            </button>
          ))}
        </div>
      ),
    },
    {
      id: "cognitive",
      title: "认知 / 视野 / 失语",
      subtitle: "请选择所有适用的认知或感知问题（可多选）",
      content: (
        <div className="grid grid-cols-2 gap-3">
          {cognitiveOptions.map((opt) => {
            const isSelected = screening.cognitive.includes(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => {
                  if (opt.id === "none") {
                    setScreening({ ...screening, cognitive: ["none"] });
                  } else {
                    const filtered = screening.cognitive.filter((c) => c !== "none");
                    setScreening({
                      ...screening,
                      cognitive: isSelected
                        ? filtered.filter((c) => c !== opt.id)
                        : [...filtered, opt.id],
                    });
                  }
                }}
                className="rounded-xl p-4 text-sm font-medium text-left flex items-center gap-3 transition-all hover:scale-[1.02]"
                style={{
                  background: isSelected ? `${C.violet}20` : C.panel,
                  border: `1px solid ${isSelected ? C.violet : C.border}`,
                  color: isSelected ? C.violet : C.text,
                }}
              >
                <opt.icon size={18} />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      ),
    },
    {
      id: "accompanied",
      title: "陪同人员",
      subtitle: "患者今日是否有家属或护工陪同？",
      content: (
        <div className="grid grid-cols-2 gap-3">
          {[
            { val: "有家属陪同", icon: "👨‍👩‍👦" },
            { val: "有护工陪同", icon: "👩‍⚕️" },
            { val: "独自前来", icon: "🧍" },
            { val: "视频远程", icon: "📱" },
          ].map((item) => (
            <button
              key={item.val}
              onClick={() => setScreening({ ...screening, accompanied: item.val })}
              className="rounded-xl p-4 text-sm font-medium text-center transition-all hover:scale-[1.02]"
              style={{
                background: screening.accompanied === item.val ? `${C.teal}20` : C.panel,
                border: `1px solid ${screening.accompanied === item.val ? C.teal : C.border}`,
                color: screening.accompanied === item.val ? C.teal : C.text,
              }}
            >
              <div className="text-3xl mb-2">{item.icon}</div>
              <div>{item.val}</div>
            </button>
          ))}
        </div>
      ),
    },
    {
      id: "therapistNote",
      title: "治疗师建议",
      subtitle: "当前治疗师的特别注意事项或训练建议（可选）",
      content: (
        <textarea
          value={screening.therapistNote}
          onChange={(e) => setScreening({ ...screening, therapistNote: e.target.value })}
          placeholder="例如：避免过度肩外展，注意右肩疼痛弧，优先改善肘伸展控制..."
          rows={5}
          className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none transition-all"
          style={{
            background: C.panel,
            border: `1px solid ${C.border}`,
            color: C.text,
          }}
          onFocus={(e) => (e.target.style.borderColor = C.teal)}
          onBlur={(e) => (e.target.style.borderColor = C.border)}
        />
      ),
    },
  ];

  const currentStep = steps[step];
  const canProceed = (() => {
    if (step === 0) return !!screening.stage;
    if (step === 2) return !!screening.subluxation;
    if (step === 3) return !!screening.spasticity;
    if (step === 4) return !!screening.fallRisk;
    if (step === 5) return screening.cognitive.length > 0;
    if (step === 6) return !!screening.accompanied;
    return true;
  })();

  return (
    <div
      className="rounded-2xl p-6 flex flex-col gap-5"
      style={{ background: C.panel, border: `1px solid ${C.border}` }}
    >
      {/* Step progress bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold" style={{ color: C.muted }}>
            入站筛查 · 第 {step + 1} / {steps.length} 项
          </span>
          <span className="text-xs" style={{ color: C.teal }}>
            {Math.round(((step) / steps.length) * 100)}% 完成
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: C.teal }}
            animate={{ width: `${(step / steps.length) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        {/* Step dots */}
        <div className="flex gap-1.5 mt-2">
          {steps.map((s, i) => (
            <div
              key={s.id}
              className="h-1 rounded-full flex-1 transition-all duration-300"
              style={{ background: i < step ? C.teal : i === step ? C.teal : "rgba(255,255,255,0.1)" }}
            />
          ))}
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="flex-1"
        >
          <h2 className="text-xl font-bold text-white mb-1">{currentStep.title}</h2>
          <p className="text-sm mb-5" style={{ color: C.muted }}>{currentStep.subtitle}</p>
          {currentStep.content}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-30"
          style={{ color: C.muted, border: `1px solid ${C.border}` }}
        >
          <ChevronLeft size={16} />
          上一步
        </button>
        {step < steps.length - 1 ? (
          <button
            onClick={() => canProceed && setStep(step + 1)}
            disabled={!canProceed}
            className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-30 hover:scale-105"
            style={{ background: canProceed ? C.teal : "rgba(255,255,255,0.1)", color: canProceed ? "#050d1a" : C.muted }}
          >
            下一步
            <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={onComplete}
            className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
            style={{ background: C.teal, color: "#050d1a" }}
          >
            完成筛查，开始采集
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────
export default function AssessPageZh() {
  const [, navigate] = useLocation();
  const [screening, setScreening] = useState<ScreeningState>({
    stage: "",
    pain: 0,
    subluxation: "",
    spasticity: "",
    fallRisk: "",
    cognitive: [],
    accompanied: "",
    therapistNote: "",
  });

  return (
    <div className="min-h-screen" style={{ background: C.bg, color: C.text }}>
      <Sidebar active="assess" />

      {/* Top bar */}
      <div
        className="fixed top-0 left-16 right-0 h-14 flex items-center justify-between px-6 z-40"
        style={{ background: "rgba(5,13,26,0.95)", borderBottom: `1px solid ${C.border}` }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-2 py-1 rounded-md" style={{ background: `${C.teal}20`, color: C.teal }}>
            AXONAI
          </span>
          <span style={{ color: C.border }}>/</span>
          <span className="text-sm font-semibold text-white">上肢功能评估</span>
          <span style={{ color: C.border }}>/</span>
          <span className="text-sm" style={{ color: C.muted }}>入站筛查</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: C.muted }}>
            <Bell size={16} />
          </button>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{ background: `${C.teal}20`, color: C.teal }}
          >
            李
          </div>
        </div>
      </div>

      {/* Main 3-column layout */}
      <div className="pt-14 pl-16">
        <div className="max-w-[1400px] mx-auto px-6 py-6 grid grid-cols-[260px_1fr_260px] gap-5">
          {/* Left: patient card */}
          <PatientCard screening={screening} />

          {/* Centre: screening form */}
          <div>
            {/* Page header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: `${C.teal}20`, color: C.teal }}>
                  步骤 1 / 8
                </span>
                <span className="text-xs" style={{ color: C.muted }}>上肢功能评估流程</span>
              </div>
              <h1 className="text-2xl font-black text-white">入站筛查</h1>
              <p className="text-sm mt-1" style={{ color: C.muted }}>
                在开始视频采集前，请先完成以下安全筛查，确保评估方案适合患者当前状态。
              </p>
            </motion.div>

            <ScreeningForm
              screening={screening}
              setScreening={setScreening}
              onComplete={() => navigate("/zh/assess/collect")}
            />
          </div>

          {/* Right: status + packages */}
          <AssessmentStatus pkgs={packages} />
        </div>
      </div>
    </div>
  );
}
