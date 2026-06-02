/**
 * AssessCollectZh — 选择采集包 + 视频采集引导
 * Step 2+3: System auto-selects motion packages, guides patient through each action
 * Real camera: getUserMedia → live <video> preview → MediaRecorder → blob saved per action
 * Design: Dark navy, patient-friendly, large camera preview, animated step transitions
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, RotateCcw, CheckCircle2, ChevronRight, ChevronLeft,
  AlertTriangle, Clock, Repeat, ArrowRight, Video, Upload,
  Shield, Info, Star, SkipForward, CameraOff, Maximize2,
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

// ─── Motion packages ───────────────────────────────────────────────────────
const motionPackages = [
  {
    id: "upper",
    label: "上肢包",
    icon: "💪",
    color: C.teal,
    desc: "评估肩、肘、前臂的主动运动能力",
    actions: [
      {
        id: "u1", name: "肩关节屈曲", range: "0–90°", position: "坐位", reps: 3, rest: "30秒",
        cameraPos: "侧面，距离1.5米", cameraIcon: "📷→",
        command: "「请缓慢抬起患侧手臂，向前举到最高处，再慢慢放下」",
        tips: ["保持躯干直立，不要代偿", "动作缓慢，约3秒上举，3秒放下"],
        stopConditions: ["肩部疼痛突然加剧", "出现头晕或恶心"],
        shortVersion: true,
      },
      {
        id: "u2", name: "肩关节外展", range: "0–90°", position: "坐位", reps: 3, rest: "30秒",
        cameraPos: "正面，距离1.5米", cameraIcon: "📷↑",
        command: "「请将患侧手臂向侧面抬起，举到与肩同高，再慢慢放下」",
        tips: ["手掌朝下", "不要耸肩"],
        stopConditions: ["肩部疼痛加剧", "手臂无法控制下落"],
        shortVersion: true,
      },
      {
        id: "u3", name: "肘关节屈伸", range: "0–130°", position: "坐位", reps: 5, rest: "20秒",
        cameraPos: "侧面，距离1.2米", cameraIcon: "📷→",
        command: "「请弯曲患侧手肘，将手靠近肩膀，再慢慢伸直」",
        tips: ["上臂保持贴近身体", "尽量完全伸直"],
        stopConditions: ["肘部疼痛", "痉挛突然加重"],
        shortVersion: true,
      },
      {
        id: "u4", name: "前臂旋后", range: "0–80°", position: "坐位，肘屈90°", reps: 5, rest: "20秒",
        cameraPos: "正面，距离1米", cameraIcon: "📷↑",
        command: "「请将手掌从朝下翻转到朝上，再翻回来」",
        tips: ["肘部保持贴近腰部", "动作幅度尽量大"],
        stopConditions: ["前臂疼痛"],
        shortVersion: false,
      },
      {
        id: "u5", name: "腕关节背伸", range: "0–60°", position: "坐位，前臂支撑", reps: 5, rest: "20秒",
        cameraPos: "侧面，距离0.8米", cameraIcon: "📷→",
        command: "「请将手腕向上翘起，再慢慢放平」",
        tips: ["手指自然放松", "只活动手腕"],
        stopConditions: ["腕部疼痛加剧"],
        shortVersion: false,
      },
      {
        id: "u6", name: "上肢协调（指鼻）", range: "全范围", position: "坐位", reps: 5, rest: "30秒",
        cameraPos: "侧面，距离1.5米", cameraIcon: "📷→",
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
        id: "h1", name: "全手抓握", range: "最大握力", position: "坐位，前臂支撑", reps: 3, rest: "30秒",
        cameraPos: "正面，距离0.8米", cameraIcon: "📷↑",
        command: "「请用患侧手尽力握紧拳头，保持3秒，再慢慢松开」",
        tips: ["手指完全弯曲", "松开时尽量伸直"],
        stopConditions: ["手部疼痛加剧", "痉挛无法松开"],
        shortVersion: true,
      },
      {
        id: "h2", name: "侧捏（钥匙捏）", range: "精细捏力", position: "坐位", reps: 3, rest: "20秒",
        cameraPos: "正面，距离0.6米", cameraIcon: "📷↑",
        command: "「请用拇指和食指侧面捏住小物件，保持3秒再松开」",
        tips: ["使用提供的小方块", "注意拇指的主动控制"],
        stopConditions: ["无法完成捏取动作"],
        shortVersion: true,
      },
      {
        id: "h3", name: "对指（拇指对各指）", range: "精细协调", position: "坐位", reps: 1, rest: "30秒",
        cameraPos: "正面，距离0.6米", cameraIcon: "📷↑",
        command: "「请用患侧拇指依次触碰食指、中指、无名指、小指，再反向进行」",
        tips: ["尽量完成全部对指", "速度不重要，准确性更重要"],
        stopConditions: ["完全无法完成对指"],
        shortVersion: true,
      },
      {
        id: "h4", name: "物体转移（杯子）", range: "功能性抓握", position: "坐位，桌面操作", reps: 3, rest: "30秒",
        cameraPos: "侧面，距离1米", cameraIcon: "📷→",
        command: "「请用患侧手拿起桌上的杯子，移动到右侧，再放下」",
        tips: ["使用提供的轻质杯子", "注意抓握稳定性"],
        stopConditions: ["物体反复掉落", "手部疼痛"],
        shortVersion: false,
      },
      {
        id: "h5", name: "手指伸展释放", range: "伸指控制", position: "坐位，手悬空", reps: 5, rest: "20秒",
        cameraPos: "正面，距离0.6米", cameraIcon: "📷↑",
        command: "「请将患侧手握拳，然后尽力张开手指，保持2秒再握拳」",
        tips: ["重点观察手指能否完全伸展", "不要用力甩手"],
        stopConditions: ["手指完全无法伸展"],
        shortVersion: false,
      },
    ],
  },
];

type ActionStatus = "pending" | "camera-ready" | "recording" | "done" | "skipped";

// ─── Camera hook ────────────────────────────────────────────────────────────
function useCameraRecorder() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlobs, setRecordedBlobs] = useState<Record<string, string>>({}); // actionId → objectURL

  const openCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsStreamActive(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Permission") || msg.includes("NotAllowed")) {
        setCameraError("摄像头权限被拒绝，请在浏览器设置中允许访问摄像头后重试。");
      } else if (msg.includes("NotFound") || msg.includes("DevicesNotFound")) {
        setCameraError("未检测到摄像头设备，请确认摄像头已连接。");
      } else {
        setCameraError(`摄像头启动失败：${msg}`);
      }
    }
  }, []);

  const startRecording = useCallback((actionId: string) => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm")
      ? "video/webm"
      : "video/mp4";
    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setRecordedBlobs((prev) => ({ ...prev, [actionId]: url }));
    };
    recorder.start(100);
    recorderRef.current = recorder;
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const closeCamera = useCallback(() => {
    stopRecording();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsStreamActive(false);
  }, [stopRecording]);

  // cleanup on unmount
  useEffect(() => () => { closeCamera(); }, [closeCamera]);

  return { videoRef, cameraError, isStreamActive, isRecording, recordedBlobs, openCamera, startRecording, stopRecording, closeCamera };
}

// ─── Recording timer ────────────────────────────────────────────────────────
function useRecordingTimer(active: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!active) { setSeconds(0); return; }
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  return fmt(seconds);
}

export default function AssessCollectZh() {
  const [, navigate] = useLocation();
  const [activePackageIdx, setActivePackageIdx] = useState(0);
  const [activeActionIdx, setActiveActionIdx] = useState(0);
  const [actionStatuses, setActionStatuses] = useState<Record<string, ActionStatus>>({});
  const [showCameraGuide, setShowCameraGuide] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  const cam = useCameraRecorder();
  const timer = useRecordingTimer(cam.isRecording);

  const pkg = motionPackages[activePackageIdx];
  const action = pkg.actions[activeActionIdx];
  const status: ActionStatus = actionStatuses[action.id] || "pending";

  const totalActions = motionPackages.reduce((s, p) => s + p.actions.length, 0);
  const doneCount = Object.values(actionStatuses).filter((s) => s === "done").length;
  const progress = Math.round((doneCount / totalActions) * 100);

  // When switching actions, stop recording but keep camera open
  useEffect(() => {
    if (cam.isRecording) cam.stopRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePackageIdx, activeActionIdx]);

  const handleOpenCamera = async () => {
    await cam.openCamera();
    setActionStatuses((prev) => ({ ...prev, [action.id]: "camera-ready" }));
  };

  const handleStartRecording = () => {
    cam.startRecording(action.id);
    setActionStatuses((prev) => ({ ...prev, [action.id]: "recording" }));
  };

  const handleStopRecording = () => {
    cam.stopRecording();
    setActionStatuses((prev) => ({ ...prev, [action.id]: "done" }));
  };

  const handleRetake = () => {
    setActionStatuses((prev) => ({ ...prev, [action.id]: cam.isStreamActive ? "camera-ready" : "pending" }));
  };

  const markSkipped = () => {
    if (cam.isRecording) cam.stopRecording();
    setActionStatuses((prev) => ({ ...prev, [action.id]: "skipped" }));
  };

  const goNext = () => {
    if (cam.isRecording) cam.stopRecording();
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
    if (cam.isRecording) cam.stopRecording();
    if (activeActionIdx > 0) setActiveActionIdx(activeActionIdx - 1);
    else if (activePackageIdx > 0) {
      setActivePackageIdx(activePackageIdx - 1);
      setActiveActionIdx(motionPackages[activePackageIdx - 1].actions.length - 1);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: C.bg, color: C.text }}>
      {/* Top bar */}
      <div
        className="fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-6 z-40"
        style={{ background: "rgba(5,13,26,0.95)", borderBottom: `1px solid ${C.border}` }}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => { cam.closeCamera(); navigate("/zh/assess"); }} className="flex items-center gap-1 text-sm" style={{ color: C.muted }}>
            <ChevronLeft size={16} />返回筛查
          </button>
          <span style={{ color: C.border }}>|</span>
          <span className="text-sm font-semibold text-white">视频采集引导</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${pkg.color}20`, color: pkg.color }}>
            {pkg.icon} {pkg.label}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm" style={{ color: C.muted }}>
            总进度：<span className="text-white font-bold">{doneCount}</span> / {totalActions} 个动作
          </div>
          <div className="w-32 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="h-full rounded-full transition-all" style={{ background: C.teal, width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="pt-14 max-w-[1400px] mx-auto px-6 py-6 grid grid-cols-[200px_1fr_280px] gap-5">

        {/* Left: action list */}
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
                <span className="text-sm font-semibold" style={{ color: pi === activePackageIdx ? p.color : C.muted }}>{p.label}</span>
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

        {/* Centre: camera + guidance */}
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
            <div className="rounded-2xl p-5" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: `${pkg.color}20`, color: pkg.color }}>
                      {pkg.icon} {pkg.label}
                    </span>
                    <span className="text-xs" style={{ color: C.muted }}>动作 {activeActionIdx + 1} / {pkg.actions.length}</span>
                    {action.shortVersion && (
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${C.amber}20`, color: C.amber }}>⚡ 短版筛查</span>
                    )}
                  </div>
                  <h2 className="text-2xl font-black text-white">{action.name}</h2>
                  <p className="text-sm mt-0.5" style={{ color: C.muted }}>{action.position} · ROM {action.range}</p>
                </div>
                <div className="flex items-center gap-2 text-sm" style={{ color: C.muted }}>
                  <Repeat size={14} /><span>{action.reps} 次</span>
                  <Clock size={14} className="ml-2" /><span>休息 {action.rest}</span>
                </div>
              </div>
              {/* Voice command */}
              <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: `${pkg.color}10`, border: `1px solid ${pkg.color}30` }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-lg">🎙️</div>
                <div>
                  <div className="text-xs font-semibold mb-1" style={{ color: pkg.color }}>口令提示</div>
                  <div className="text-sm text-white italic leading-relaxed">{action.command}</div>
                </div>
              </div>
            </div>

            {/* ── CAMERA PREVIEW AREA ── */}
            <div
              className="rounded-2xl overflow-hidden relative"
              style={{
                background: "#000",
                border: `2px solid ${status === "recording" ? C.red : cam.isStreamActive ? C.teal : C.border}`,
                aspectRatio: "16/9",
                minHeight: 320,
              }}
            >
              {/* Live video */}
              <video
                ref={cam.videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)", display: cam.isStreamActive ? "block" : "none" }}
              />

              {/* Placeholder when camera not open */}
              {!cam.isStreamActive && !cam.cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <Camera size={36} style={{ color: C.muted }} />
                  </div>
                  <div className="text-center">
                    <div className="text-white font-semibold mb-1">摄像头未开启</div>
                    <div className="text-sm" style={{ color: C.muted }}>点击下方"开启摄像头"按钮，即可看到自己的实时画面</div>
                  </div>
                  <button
                    onClick={handleOpenCamera}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
                    style={{ background: C.teal, color: "#050d1a" }}
                  >
                    <Camera size={16} />
                    开启摄像头
                  </button>
                </div>
              )}

              {/* Camera error */}
              {cam.cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
                  <CameraOff size={36} style={{ color: C.red }} />
                  <div className="text-sm" style={{ color: C.muted }}>{cam.cameraError}</div>
                  <button onClick={handleOpenCamera} className="text-xs px-4 py-2 rounded-xl" style={{ background: `${C.red}20`, color: C.red }}>
                    重试
                  </button>
                </div>
              )}

              {/* Recording indicator overlay */}
              {status === "recording" && (
                <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(0,0,0,0.7)" }}>
                  <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: C.red }} />
                  <span className="text-white text-sm font-bold">录制中 {timer}</span>
                </div>
              )}

              {/* Camera-ready badge */}
              {status === "camera-ready" && (
                <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(0,0,0,0.7)" }}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: C.teal }} />
                  <span className="text-white text-sm font-semibold">摄像头就绪</span>
                </div>
              )}

              {/* Done overlay */}
              {status === "done" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ background: "rgba(0,0,0,0.55)" }}>
                  <CheckCircle2 size={48} style={{ color: C.teal }} />
                  <div className="text-white font-bold text-lg">录制完成</div>
                  <div className="text-sm" style={{ color: C.muted }}>视频已保存，等待质量检查</div>
                </div>
              )}

              {/* Fullscreen toggle */}
              {cam.isStreamActive && (
                <button
                  onClick={() => setFullscreen(!fullscreen)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.5)" }}
                >
                  <Maximize2 size={14} className="text-white" />
                </button>
              )}

              {/* Camera position guide overlay (bottom bar) */}
              {cam.isStreamActive && status !== "recording" && status !== "done" && (
                <div className="absolute bottom-0 left-0 right-0 px-4 py-2 flex items-center gap-2"
                  style={{ background: "rgba(0,0,0,0.65)" }}>
                  <Camera size={12} style={{ color: C.teal }} />
                  <span className="text-xs text-white">{action.cameraPos}</span>
                  <span className="text-xs ml-auto" style={{ color: C.muted }}>确保全身入镜，光线充足</span>
                </div>
              )}
            </div>

            {/* Recording controls */}
            <div className="rounded-2xl p-4 flex items-center justify-between" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
              <div>
                {status === "pending" && <div className="text-sm" style={{ color: C.muted }}>请先开启摄像头，确认画面后开始录制</div>}
                {status === "camera-ready" && <div className="text-sm text-white">摄像头已就绪 — 准备好后点击"开始录制"</div>}
                {status === "recording" && (
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: C.red }} />
                    <div>
                      <div className="font-semibold text-white">录制中 {timer}</div>
                      <div className="text-xs" style={{ color: C.muted }}>完成 {action.reps} 次动作后点击停止</div>
                    </div>
                  </div>
                )}
                {status === "done" && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} style={{ color: C.teal }} />
                    <div className="text-sm text-white font-semibold">录制完成，视频已保存</div>
                  </div>
                )}
                {status === "skipped" && <div className="text-sm" style={{ color: C.muted }}>已跳过此动作</div>}
              </div>

              <div className="flex items-center gap-2">
                {status !== "done" && status !== "skipped" && (
                  <button onClick={markSkipped} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-all"
                    style={{ color: C.muted, border: `1px solid ${C.border}` }}>
                    <SkipForward size={13} />跳过
                  </button>
                )}

                {/* Open camera (if not yet open) */}
                {status === "pending" && !cam.isStreamActive && (
                  <button onClick={handleOpenCamera}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
                    style={{ background: C.teal, color: "#050d1a" }}>
                    <Camera size={14} />开启摄像头
                  </button>
                )}

                {/* Upload alternative */}
                {(status === "pending" || status === "camera-ready") && (
                  <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                    style={{ border: `1px solid ${C.border}`, color: C.text }}>
                    <Upload size={14} />上传视频
                  </button>
                )}

                {/* Start recording */}
                {status === "camera-ready" && (
                  <button onClick={handleStartRecording}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
                    style={{ background: C.red, color: "white" }}>
                    <Video size={14} />开始录制
                  </button>
                )}

                {/* Stop recording */}
                {status === "recording" && (
                  <button onClick={handleStopRecording}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
                    style={{ background: C.teal, color: "#050d1a" }}>
                    <CheckCircle2 size={14} />完成录制
                  </button>
                )}

                {/* Retake */}
                {status === "done" && (
                  <button onClick={handleRetake}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all"
                    style={{ border: `1px solid ${C.border}`, color: C.muted }}>
                    <RotateCcw size={14} />重拍
                  </button>
                )}
              </div>
            </div>

            {/* Tips + stop conditions */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-4" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <Info size={14} style={{ color: C.teal }} />
                  <span className="text-xs font-semibold text-white">动作要点</span>
                </div>
                <ul className="space-y-1">
                  {action.tips.map((tip, i) => (
                    <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: C.muted }}>
                      <span style={{ color: C.teal }}>·</span>{tip}
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
                      <span style={{ color: C.red }}>!</span>{cond}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Camera placement guide (collapsible) */}
            <AnimatePresence>
              {showCameraGuide && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-2xl p-5 overflow-hidden"
                  style={{ background: "rgba(0,212,170,0.06)", border: `1px solid ${C.teal}30` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Camera size={16} style={{ color: C.teal }} />
                      <span className="text-sm font-semibold text-white">摄像机摆放指引</span>
                    </div>
                    <button onClick={() => setShowCameraGuide(false)} className="text-xs px-2 py-1 rounded" style={{ color: C.muted }}>收起</button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-28 h-20 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-3xl"
                      style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}` }}>
                      <span>{action.cameraIcon}</span>
                      <span className="text-xs mt-1" style={{ color: C.muted }}>摄像位置</span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white mb-1">{action.cameraPos}</div>
                      <ul className="space-y-1">
                        {["确保患者全身入镜，头顶和脚底均可见", "患侧手部清晰可见，无遮挡", "光线充足，避免逆光"].map((t, i) => (
                          <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: C.muted }}>
                            <span style={{ color: C.teal }}>✓</span>{t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button onClick={goPrev} disabled={activePackageIdx === 0 && activeActionIdx === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm disabled:opacity-30 transition-all"
                style={{ color: C.muted, border: `1px solid ${C.border}` }}>
                <ChevronLeft size={16} />上一个
              </button>
              {doneCount >= 3 && (
                <button onClick={() => { cam.closeCamera(); navigate("/zh/assess/quality"); }}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
                  style={{ background: C.teal, color: "#050d1a" }}>
                  进入质量检查<ArrowRight size={16} />
                </button>
              )}
              <button onClick={goNext}
                disabled={activePackageIdx === motionPackages.length - 1 && activeActionIdx === pkg.actions.length - 1}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm disabled:opacity-30 transition-all"
                style={{ color: C.muted, border: `1px solid ${C.border}` }}>
                下一个<ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Right: progress */}
        <div className="flex flex-col gap-3">
          <div className="rounded-2xl p-5" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
            <div className="text-xs font-semibold mb-3" style={{ color: C.muted }}>采集进度</div>
            <div className="text-center mb-4">
              <span className="text-4xl font-black text-white">{doneCount}</span>
              <span className="text-xl" style={{ color: C.muted }}> / {totalActions}</span>
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

          {/* Camera status card */}
          <div className="rounded-2xl p-4" style={{
            background: cam.isStreamActive ? `${C.teal}08` : C.panel,
            border: `1px solid ${cam.isStreamActive ? C.teal + "40" : C.border}`,
          }}>
            <div className="flex items-center gap-2 mb-2">
              {cam.isStreamActive ? <Camera size={14} style={{ color: C.teal }} /> : <CameraOff size={14} style={{ color: C.muted }} />}
              <span className="text-xs font-semibold" style={{ color: cam.isStreamActive ? C.teal : C.muted }}>
                {cam.isStreamActive ? "摄像头已连接" : "摄像头未开启"}
              </span>
            </div>
            <div className="text-xs" style={{ color: C.muted }}>
              {cam.isStreamActive
                ? "实时画面已启动，患者可在屏幕上看到自己的动作。"
                : "点击【开启摄像头】后，患者将能看到自己的实时录制画面。"}
            </div>
            {cam.isStreamActive && (
              <button onClick={cam.closeCamera} className="mt-2 text-xs px-3 py-1 rounded-lg"
                style={{ background: `${C.red}15`, color: C.red }}>
                关闭摄像头
              </button>
            )}
          </div>

          {/* Completed actions */}
          {doneCount > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-4" style={{ background: `${C.teal}08`, border: `1px solid ${C.teal}30` }}>
              <div className="flex items-center gap-2 mb-2">
                <Star size={14} style={{ color: C.teal }} />
                <span className="text-xs font-semibold text-white">已完成动作</span>
              </div>
              {Object.entries(actionStatuses).filter(([, s]) => s === "done").slice(0, 5).map(([id]) => {
                const found = motionPackages.flatMap((p) => p.actions).find((a) => a.id === id);
                return found ? (
                  <div key={id} className="flex items-center gap-2 text-xs py-1" style={{ color: C.muted }}>
                    <CheckCircle2 size={10} style={{ color: C.teal }} />{found.name}
                  </div>
                ) : null;
              })}
            </motion.div>
          )}

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
