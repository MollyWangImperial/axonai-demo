/**
 * AssessCollectZh — 选择采集包 + 视频采集引导
 * Step 2+3: System auto-selects motion packages, guides patient through each action
 * Design: Dark navy, patient-friendly, large camera guidance, animated step transitions
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Play, RotateCcw, CheckCircle2, ChevronRight, ChevronLeft,
  AlertTriangle, Clock, Repeat, Zap, ArrowRight, Video, Upload,
  Shield, Info, Star, SkipForward,
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

// ─── Motion packages with actions ─────────────────────────────────────────
const motionPackages = [
  {
    id: "upper",
    label: "上肢包",
    icon: "💪",
    color: C.teal,
    desc: "评估肩、肘、前臂的主动运动能力",
    actions: [
      {
        id: "u1",
        name: "肩关节屈曲",
        range: "0–90°",
        position: "坐位",
        reps: 3,
        rest: "30秒",
        cameraPos: "侧面，距离1.5米",
        cameraIcon: "📷→",
        command: "「请缓慢抬起患侧手臂，向前举到最高处，再慢慢放下」",
        tips: ["保持躯干直立，不要代偿", "动作缓慢，约3秒上举，3秒放下"],
        stopConditions: ["肩部疼痛突然加剧", "出现头晕或恶心"],
        shortVersion: true,
      },
      {
        id: "u2",
        name: "肩关节外展",
        range: "0–90°",
        position: "坐位",
        reps: 3,
        rest: "30秒",
        cameraPos: "正面，距离1.5米",
        cameraIcon: "📷↑",
        command: "「请将患侧手臂向侧面抬起，举到与肩同高，再慢慢放下」",
        tips: ["手掌朝下", "不要耸肩"],
        stopConditions: ["肩部疼痛加剧", "手臂无法控制下落"],
        shortVersion: true,
      },
      {
        id: "u3",
        name: "肘关节屈伸",
        range: "0–130°",
        position: "坐位",
        reps: 5,
        rest: "20秒",
        cameraPos: "侧面，距离1.2米",
        cameraIcon: "📷→",
        command: "「请弯曲患侧手肘，将手靠近肩膀，再慢慢伸直」",
        tips: ["上臂保持贴近身体", "尽量完全伸直"],
        stopConditions: ["肘部疼痛", "痉挛突然加重"],
        shortVersion: true,
      },
      {
        id: "u4",
        name: "前臂旋后",
        range: "0–80°",
        position: "坐位，肘屈90°",
        reps: 5,
        rest: "20秒",
        cameraPos: "正面，距离1米",
        cameraIcon: "📷↑",
        command: "「请将手掌从朝下翻转到朝上，再翻回来」",
        tips: ["肘部保持贴近腰部", "动作幅度尽量大"],
        stopConditions: ["前臂疼痛"],
        shortVersion: false,
      },
      {
        id: "u5",
        name: "腕关节背伸",
        range: "0–60°",
        position: "坐位，前臂支撑",
        reps: 5,
        rest: "20秒",
        cameraPos: "侧面，距离0.8米",
        cameraIcon: "📷→",
        command: "「请将手腕向上翘起，再慢慢放平」",
        tips: ["手指自然放松", "只活动手腕"],
        stopConditions: ["腕部疼痛加剧"],
        shortVersion: false,
      },
      {
        id: "u6",
        name: "上肢协调（指鼻）",
        range: "全范围",
        position: "坐位",
        reps: 5,
        rest: "30秒",
        cameraPos: "侧面，距离1.5米",
        cameraIcon: "📷→",
        command: "「请用患侧手指尖触碰鼻尖，再伸向前方，反复进行」",
        tips: ["速度适中", "注意准确性"],
        stopConditions: ["头晕", "动作完全无法控制"],
        shortVersion: false,
      },
    ],
  },
  {
    id: "hand",
    label: "手功能包",
    icon: "🤚",
    color: C.violet,
    desc: "评估抓握、释放和精细运动控制",
    actions: [
      {
        id: "h1",
        name: "全手抓握",
        range: "最大握力",
        position: "坐位，前臂支撑",
        reps: 3,
        rest: "30秒",
        cameraPos: "正面，距离0.8米",
        cameraIcon: "📷↑",
        command: "「请用患侧手尽力握紧拳头，保持3秒，再慢慢松开」",
        tips: ["手指完全弯曲", "松开时尽量伸直"],
        stopConditions: ["手部疼痛加剧", "痉挛无法松开"],
        shortVersion: true,
      },
      {
        id: "h2",
        name: "侧捏（钥匙捏）",
        range: "精细捏力",
        position: "坐位",
        reps: 3,
        rest: "20秒",
        cameraPos: "正面，距离0.6米",
        cameraIcon: "📷↑",
        command: "「请用拇指和食指侧面捏住小物件，保持3秒再松开」",
        tips: ["使用提供的小方块", "注意拇指的主动控制"],
        stopConditions: ["无法完成捏取动作"],
        shortVersion: true,
      },
      {
        id: "h3",
        name: "对指（拇指对各指）",
        range: "精细协调",
        position: "坐位",
        reps: 1,
        rest: "30秒",
        cameraPos: "正面，距离0.6米",
        cameraIcon: "📷↑",
        command: "「请用患侧拇指依次触碰食指、中指、无名指、小指，再反向进行」",
        tips: ["尽量完成全部对指", "速度不重要，准确性更重要"],
        stopConditions: ["完全无法完成对指"],
        shortVersion: true,
      },
      {
        id: "h4",
        name: "物体转移（杯子）",
        range: "功能性抓握",
        position: "坐位，桌面操作",
        reps: 3,
        rest: "30秒",
        cameraPos: "侧面，距离1米",
        cameraIcon: "📷→",
        command: "「请用患侧手拿起桌上的杯子，移动到右侧，再放下」",
        tips: ["使用提供的轻质杯子", "注意抓握稳定性"],
        stopConditions: ["物体反复掉落", "手部疼痛"],
        shortVersion: false,
      },
      {
        id: "h5",
        name: "手指伸展释放",
        range: "伸指控制",
        position: "坐位，手悬空",
        reps: 5,
        rest: "20秒",
        cameraPos: "正面，距离0.6米",
        cameraIcon: "📷↑",
        command: "「请将患侧手握拳，然后尽力张开手指，保持2秒再握拳」",
        tips: ["重点观察手指能否完全伸展", "不要用力甩手"],
        stopConditions: ["手指完全无法伸展"],
        shortVersion: false,
      },
    ],
  },
];

type ActionStatus = "pending" | "recording" | "done" | "skipped";

export default function AssessCollectZh() {
  const [, navigate] = useLocation();
  const [activePackageIdx, setActivePackageIdx] = useState(0);
  const [activeActionIdx, setActiveActionIdx] = useState(0);
  const [actionStatuses, setActionStatuses] = useState<Record<string, ActionStatus>>({});
  const [showCameraGuide, setShowCameraGuide] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const pkg = motionPackages[activePackageIdx];
  const action = pkg.actions[activeActionIdx];
  const status = actionStatuses[action.id] || "pending";

  const totalActions = motionPackages.reduce((s, p) => s + p.actions.length, 0);
  const doneCount = Object.values(actionStatuses).filter((s) => s === "done").length;
  const allPkgDone = pkg.actions.every((a) => actionStatuses[a.id] === "done" || actionStatuses[a.id] === "skipped");

  const markDone = () => {
    setActionStatuses((prev) => ({ ...prev, [action.id]: "done" }));
    setIsRecording(false);
    setRecordingSeconds(0);
  };
  const markSkipped = () => {
    setActionStatuses((prev) => ({ ...prev, [action.id]: "skipped" }));
    setIsRecording(false);
    setRecordingSeconds(0);
  };
  const startRecording = () => {
    setIsRecording(true);
    setActionStatuses((prev) => ({ ...prev, [action.id]: "recording" }));
  };

  const goNext = () => {
    if (activeActionIdx < pkg.actions.length - 1) {
      setActiveActionIdx(activeActionIdx + 1);
      setShowCameraGuide(true);
    } else if (activePackageIdx < motionPackages.length - 1) {
      setActivePackageIdx(activePackageIdx + 1);
      setActiveActionIdx(0);
      setShowCameraGuide(true);
    }
  };

  const goPrev = () => {
    if (activeActionIdx > 0) {
      setActiveActionIdx(activeActionIdx - 1);
    } else if (activePackageIdx > 0) {
      setActivePackageIdx(activePackageIdx - 1);
      setActiveActionIdx(motionPackages[activePackageIdx - 1].actions.length - 1);
    }
  };

  // Overall progress
  const globalActionIdx = motionPackages
    .slice(0, activePackageIdx)
    .reduce((s, p) => s + p.actions.length, 0) + activeActionIdx;
  const globalTotal = totalActions;
  const progress = Math.round((doneCount / globalTotal) * 100);

  return (
    <div className="min-h-screen" style={{ background: C.bg, color: C.text }}>
      {/* Top bar */}
      <div
        className="fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-6 z-40"
        style={{ background: "rgba(5,13,26,0.95)", borderBottom: `1px solid ${C.border}` }}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/zh/assess")} className="flex items-center gap-1 text-sm" style={{ color: C.muted }}>
            <ChevronLeft size={16} />
            返回筛查
          </button>
          <span style={{ color: C.border }}>|</span>
          <span className="text-sm font-semibold text-white">视频采集引导</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: `${pkg.color}20`, color: pkg.color }}
          >
            {pkg.icon} {pkg.label}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm" style={{ color: C.muted }}>
            总进度：<span className="text-white font-bold">{doneCount}</span> / {globalTotal} 个动作
          </div>
          <div className="w-32 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="h-full rounded-full transition-all" style={{ background: C.teal, width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="pt-14 max-w-[1300px] mx-auto px-6 py-6 grid grid-cols-[220px_1fr_300px] gap-5">

        {/* Left: Package + action list */}
        <div className="flex flex-col gap-3">
          {motionPackages.map((p, pi) => (
            <div key={p.id}>
              <div
                className="rounded-xl px-3 py-2 flex items-center gap-2 mb-1 cursor-pointer"
                style={{
                  background: pi === activePackageIdx ? `${p.color}15` : "transparent",
                  border: `1px solid ${pi === activePackageIdx ? p.color + "40" : C.border}`,
                }}
                onClick={() => { setActivePackageIdx(pi); setActiveActionIdx(0); }}
              >
                <span>{p.icon}</span>
                <span className="text-sm font-semibold" style={{ color: pi === activePackageIdx ? p.color : C.muted }}>
                  {p.label}
                </span>
              </div>
              {pi === activePackageIdx && (
                <div className="ml-2 space-y-1">
                  {p.actions.map((a, ai) => {
                    const s = actionStatuses[a.id] || "pending";
                    return (
                      <button
                        key={a.id}
                        onClick={() => setActiveActionIdx(ai)}
                        className="w-full text-left rounded-lg px-3 py-2 flex items-center gap-2 text-xs transition-all"
                        style={{
                          background: ai === activeActionIdx ? "rgba(255,255,255,0.06)" : "transparent",
                          color: s === "done" ? C.teal : s === "skipped" ? C.muted : ai === activeActionIdx ? C.text : C.muted,
                        }}
                      >
                        <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px]"
                          style={{ background: s === "done" ? C.teal : s === "recording" ? C.red : "rgba(255,255,255,0.1)", color: s === "done" ? "#050d1a" : C.text }}>
                          {s === "done" ? "✓" : s === "skipped" ? "—" : ai + 1}
                        </span>
                        <span className="truncate">{a.name}</span>
                        {a.shortVersion && (
                          <span className="text-[9px] px-1 rounded" style={{ background: `${C.amber}20`, color: C.amber }}>筛查</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Centre: Action guidance */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activePackageIdx}-${activeActionIdx}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-4"
          >
            {/* Action header */}
            <div
              className="rounded-2xl p-5"
              style={{ background: C.panel, border: `1px solid ${C.border}` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: `${pkg.color}20`, color: pkg.color }}>
                      {pkg.icon} {pkg.label}
                    </span>
                    <span className="text-xs" style={{ color: C.muted }}>
                      动作 {activeActionIdx + 1} / {pkg.actions.length}
                    </span>
                    {action.shortVersion && (
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${C.amber}20`, color: C.amber }}>
                        ⚡ 短版筛查
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-black text-white">{action.name}</h2>
                  <p className="text-sm mt-0.5" style={{ color: C.muted }}>
                    活动范围：{action.range} · 体位：{action.position}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm" style={{ color: C.muted }}>
                  <Repeat size={14} />
                  <span>{action.reps} 次</span>
                  <Clock size={14} className="ml-2" />
                  <span>休息 {action.rest}</span>
                </div>
              </div>

              {/* Voice command */}
              <div
                className="rounded-xl p-4 flex items-start gap-3"
                style={{ background: `${pkg.color}10`, border: `1px solid ${pkg.color}30` }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-lg">🎙️</div>
                <div>
                  <div className="text-xs font-semibold mb-1" style={{ color: pkg.color }}>口令提示</div>
                  <div className="text-sm text-white italic leading-relaxed">{action.command}</div>
                </div>
              </div>
            </div>

            {/* Camera placement guide */}
            <AnimatePresence>
              {showCameraGuide && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-2xl p-5 overflow-hidden"
                  style={{ background: `rgba(0,212,170,0.06)`, border: `1px solid ${C.teal}30` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Camera size={16} style={{ color: C.teal }} />
                      <span className="text-sm font-semibold text-white">摄像机摆放指引</span>
                    </div>
                    <button
                      onClick={() => setShowCameraGuide(false)}
                      className="text-xs px-2 py-1 rounded" style={{ color: C.muted }}
                    >
                      收起
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Camera diagram */}
                    <div
                      className="w-32 h-24 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-3xl"
                      style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}` }}
                    >
                      <span>{action.cameraIcon}</span>
                      <span className="text-xs mt-1" style={{ color: C.muted }}>摄像位置</span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white mb-1">{action.cameraPos}</div>
                      <ul className="space-y-1">
                        <li className="text-xs flex items-start gap-1.5" style={{ color: C.muted }}>
                          <span style={{ color: C.teal }}>✓</span> 确保患者全身入镜，头顶和脚底均可见
                        </li>
                        <li className="text-xs flex items-start gap-1.5" style={{ color: C.muted }}>
                          <span style={{ color: C.teal }}>✓</span> 患侧手部清晰可见，无遮挡
                        </li>
                        <li className="text-xs flex items-start gap-1.5" style={{ color: C.muted }}>
                          <span style={{ color: C.teal }}>✓</span> 光线充足，避免逆光
                        </li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tips */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-4" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <Info size={14} style={{ color: C.teal }} />
                  <span className="text-xs font-semibold text-white">动作要点</span>
                </div>
                <ul className="space-y-1">
                  {action.tips.map((tip, i) => (
                    <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: C.muted }}>
                      <span style={{ color: C.teal }}>·</span> {tip}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl p-4" style={{ background: `${C.red}08`, border: `1px solid ${C.red}20` }}>
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={14} style={{ color: C.red }} />
                  <span className="text-xs font-semibold" style={{ color: C.red }}>停止条件</span>
                </div>
                <ul className="space-y-1">
                  {action.stopConditions.map((cond, i) => (
                    <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: C.muted }}>
                      <span style={{ color: C.red }}>!</span> {cond}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recording controls */}
            <div
              className="rounded-2xl p-5 flex items-center justify-between"
              style={{ background: C.panel, border: `1px solid ${C.border}` }}
            >
              {status === "done" ? (
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={24} style={{ color: C.teal }} />
                  <div>
                    <div className="font-semibold text-white">录制完成</div>
                    <div className="text-xs" style={{ color: C.muted }}>视频已保存，等待质量检查</div>
                  </div>
                </div>
              ) : status === "recording" ? (
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: C.red }} />
                  <div>
                    <div className="font-semibold text-white">录制中...</div>
                    <div className="text-xs" style={{ color: C.muted }}>完成 {action.reps} 次动作后点击停止</div>
                  </div>
                </div>
              ) : (
                <div className="text-sm" style={{ color: C.muted }}>准备好后开始录制</div>
              )}

              <div className="flex items-center gap-3">
                {status !== "done" && (
                  <button
                    onClick={markSkipped}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-all"
                    style={{ color: C.muted, border: `1px solid ${C.border}` }}
                  >
                    <SkipForward size={14} />
                    跳过
                  </button>
                )}
                {status === "pending" && (
                  <>
                    <button
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
                      style={{ border: `1px solid ${C.border}`, color: C.text }}
                    >
                      <Upload size={14} />
                      上传视频
                    </button>
                    <button
                      onClick={startRecording}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
                      style={{ background: C.red, color: "white" }}
                    >
                      <Video size={14} />
                      开始录制
                    </button>
                  </>
                )}
                {status === "recording" && (
                  <button
                    onClick={markDone}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
                    style={{ background: C.teal, color: "#050d1a" }}
                  >
                    <CheckCircle2 size={14} />
                    完成录制
                  </button>
                )}
                {status === "done" && (
                  <button
                    onClick={() => setActionStatuses((prev) => ({ ...prev, [action.id]: "pending" }))}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all"
                    style={{ border: `1px solid ${C.border}`, color: C.muted }}
                  >
                    <RotateCcw size={14} />
                    重拍
                  </button>
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={goPrev}
                disabled={activePackageIdx === 0 && activeActionIdx === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm disabled:opacity-30 transition-all"
                style={{ color: C.muted, border: `1px solid ${C.border}` }}
              >
                <ChevronLeft size={16} />
                上一个
              </button>

              {doneCount >= 3 && (
                <button
                  onClick={() => navigate("/zh/assess/quality")}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
                  style={{ background: C.teal, color: "#050d1a" }}
                >
                  进入质量检查
                  <ArrowRight size={16} />
                </button>
              )}

              <button
                onClick={goNext}
                disabled={activePackageIdx === motionPackages.length - 1 && activeActionIdx === pkg.actions.length - 1}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm disabled:opacity-30 transition-all"
                style={{ color: C.muted, border: `1px solid ${C.border}` }}
              >
                下一个
                <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Right: overall progress */}
        <div className="flex flex-col gap-3">
          <div className="rounded-2xl p-5" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
            <div className="text-xs font-semibold mb-3" style={{ color: C.muted }}>采集进度</div>
            <div className="text-center mb-4">
              <span className="text-4xl font-black text-white">{doneCount}</span>
              <span className="text-xl" style={{ color: C.muted }}> / {globalTotal}</span>
              <div className="text-xs mt-1" style={{ color: C.muted }}>动作已完成</div>
            </div>
            <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-full rounded-full transition-all" style={{ background: C.teal, width: `${progress}%` }} />
            </div>
            <div className="space-y-2">
              {motionPackages.map((p) => {
                const done = p.actions.filter((a) => actionStatuses[a.id] === "done").length;
                return (
                  <div key={p.id} className="flex items-center gap-2 text-xs">
                    <span>{p.icon}</span>
                    <span className="flex-1" style={{ color: C.muted }}>{p.label}</span>
                    <span style={{ color: p.color }}>{done}/{p.actions.length}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quality preview */}
          {doneCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-4"
              style={{ background: `${C.teal}08`, border: `1px solid ${C.teal}30` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Star size={14} style={{ color: C.teal }} />
                <span className="text-xs font-semibold text-white">已完成动作</span>
              </div>
              {Object.entries(actionStatuses)
                .filter(([, s]) => s === "done")
                .slice(0, 5)
                .map(([id]) => {
                  const found = motionPackages.flatMap((p) => p.actions).find((a) => a.id === id);
                  return found ? (
                    <div key={id} className="flex items-center gap-2 text-xs py-1" style={{ color: C.muted }}>
                      <CheckCircle2 size={10} style={{ color: C.teal }} />
                      {found.name}
                    </div>
                  ) : null;
                })}
            </motion.div>
          )}

          {/* Tip */}
          <div className="rounded-2xl p-4" style={{ background: `${C.amber}08`, border: `1px solid ${C.amber}20` }}>
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} style={{ color: C.amber, marginTop: 2 }} />
              <div className="text-xs leading-relaxed" style={{ color: C.muted }}>
                <span style={{ color: C.amber }} className="font-semibold">短版筛查</span>动作完成后，系统将自动判断是否需要触发深度采集。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
