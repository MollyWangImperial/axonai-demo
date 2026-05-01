/**
 * UploadPage — AxonAI
 * Upload sagittal-view videos from left and right cameras
 * Design: Dark navy, teal accent, glassmorphism panels
 */
import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useAssessment } from "@/contexts/AssessmentContext";
import {
  Upload,
  Video,
  CheckCircle2,
  ArrowLeft,
  Play,
  X,
  Loader2,
  ChevronRight,
  User,
} from "lucide-react";

function VideoDropZone({
  side,
  file,
  preview,
  onFile,
  onClear,
}: {
  side: "左侧" | "右侧";
  // Chinese labels handled below
  file: File | null;
  preview: string | null;
  onFile: (f: File, url: string) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f && f.type.startsWith("video/")) {
        onFile(f, URL.createObjectURL(f));
      }
    },
    [onFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onFile(f, URL.createObjectURL(f));
  };

  const color = side === "左侧" ? "#00D4AA" : "#8B5CF6";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: side === "左侧" ? 0.1 : 0.2 }}
      className="flex-1 min-w-0"
    >
      <div
        className={`relative rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
          dragging
            ? "border-[#00D4AA] bg-[#00D4AA]/10 scale-[1.01]"
            : file
            ? "border-white/20 bg-white/5"
            : "border-white/10 bg-white/5 hover:border-white/20"
        }`}
        style={{ borderColor: file ? color + "60" : undefined }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2 px-4 py-3 border-b border-white/10"
          style={{ borderBottomColor: color + "30" }}
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm font-semibold text-white">
            {side === "左侧" ? "左侧" : "右侧"}摄像头
          </span>
          {file && (
            <button
              onClick={onClear}
              className="ml-auto text-slate-400 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {file && preview ? (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                <video
                  src={preview}
                  className="w-full h-full object-cover"
                  controls={false}
                  muted
                  loop
                  autoPlay
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Play size={20} className="text-white ml-1" />
                  </div>
                </div>
                <div
                  className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: color + "cc" }}
                >
                  ✓ Ready
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Video size={12} />
                <span className="truncate">{file.name}</span>
                <span className="ml-auto flex-shrink-0 text-slate-500">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all hover:bg-white/5 group"
              style={{ borderColor: color + "40" }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ backgroundColor: color + "20" }}
              >
                <Upload size={24} style={{ color }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white">
                  上传{side === "左侧" ? "左侧" : "右侧"}摄像头视频
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  拖放文件或点击选择
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  支持 MP4、MOV、AVI，最大 500MB
                </p>
              </div>
            </button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleChange}
        />
      </div>
    </motion.div>
  );
}

export default function UploadPage() {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const { videos, setVideos, setReportReady, patientName, setPatientName } =
    useAssessment();
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState("");

  const bothUploaded = videos.leftFile && videos.rightFile;

  const handleGetReport = async () => {
    if (!bothUploaded) return;
    setProcessing(true);
    setProgress(0);

    const steps = [
      "提取姿态关键点…",
      "分析步态周期阶段…",
      "计算双侧对称性…",
      "计算运动学参数…",
      "AI 诊断摘要生成中…",
      "临床报告编译中…",
    ];

    for (let i = 0; i < steps.length; i++) {
      setProcessingStep(steps[i]);
      await new Promise((r) => setTimeout(r, 600));
      setProgress(Math.round(((i + 1) / steps.length) * 100));
    }

    setReportReady(true);
    navigate("/zh/report");
  };

  return (
    <div className="min-h-screen bg-[#050d1a] text-white">
      {/* Background glows */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#00D4AA]/8 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#8B5CF6]/8 rounded-full blur-[120px] pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#050d1a]/80 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/zh")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            首页
          </button>
          <div className="w-px h-4 bg-white/20" />
          <span className="text-white font-black tracking-widest text-lg">
            AXONAI
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <div className="w-7 h-7 rounded-full bg-[#00D4AA]/20 flex items-center justify-center">
              <User size={14} className="text-[#00D4AA]" />
            </div>
            <span>{user?.name}</span>
          </div>
          <button
            onClick={() => {
              logout();
              navigate("/zh");
            }}
            className="text-xs text-slate-500 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            退出
          </button>
        </div>
      </nav>

      {/* Main content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00D4AA]/10 border border-[#00D4AA]/20 text-[#00D4AA] text-xs font-medium mb-4">
            <Video size={12} />
            第 1 步 / 共 3 步 — 视频上传
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            上传矢状面步态视频
          </h1>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            分别上传左侧和右侧摄像头拍摄的行走视频，生成 AI 驱动的步态评估报告。
          </p>
        </motion.div>

        {/* Patient name */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6 bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4"
        >
          <div className="w-9 h-9 rounded-full bg-[#8B5CF6]/20 flex items-center justify-center flex-shrink-0">
            <User size={16} className="text-[#8B5CF6]" />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-xs text-slate-400 mb-1">
              患者姓名
            </label>
            <input
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="bg-transparent text-white text-sm font-medium focus:outline-none w-full"
              placeholder="请输入患者姓名"
            />
          </div>
          <div className="text-xs text-slate-500 flex-shrink-0">
            {new Date().toLocaleDateString("zh-CN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </div>
        </motion.div>

        {/* Video upload panels */}
        <div className="flex gap-4 mb-6">
          <VideoDropZone
            side="左侧"
            file={videos.leftFile}
            preview={videos.leftPreview}
            onFile={(f, url) =>
              setVideos({ ...videos, leftFile: f, leftPreview: url })
            }
            onClear={() =>
              setVideos({ ...videos, leftFile: null, leftPreview: null })
            }
          />
          <VideoDropZone
            side="右侧"
            file={videos.rightFile}
            preview={videos.rightPreview}
            onFile={(f, url) =>
              setVideos({ ...videos, rightFile: f, rightPreview: url })
            }
            onClear={() =>
              setVideos({ ...videos, rightFile: null, rightPreview: null })
            }
          />
        </div>

        {/* Status indicators */}
        <div className="flex items-center justify-center gap-6 mb-8 text-xs">
          <div
            className={`flex items-center gap-1.5 ${videos.leftFile ? "text-[#00D4AA]" : "text-slate-500"}`}
          >
            <CheckCircle2 size={13} />
            左侧摄像头 {videos.leftFile ? "已就绪" : "待上传"}
          </div>
          <div className="w-8 h-px bg-white/20" />
          <div
            className={`flex items-center gap-1.5 ${videos.rightFile ? "text-[#8B5CF6]" : "text-slate-500"}`}
          >
            <CheckCircle2 size={13} />
            右侧摄像头 {videos.rightFile ? "已就绪" : "待上传"}
          </div>
        </div>

        {/* Processing overlay */}
        <AnimatePresence>
          {processing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#050d1a]/90 backdrop-blur-sm z-50 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-10 max-w-sm w-full mx-4 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-[#00D4AA]/20 flex items-center justify-center mx-auto mb-5">
                  <Loader2 size={28} className="text-[#00D4AA] animate-spin" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">
                  步态数据分析中
                </h3>
                <p className="text-sm text-slate-400 mb-6">{processingStep}</p>

                {/* Progress bar */}
                <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                  <motion.div
                    className="h-2 rounded-full bg-gradient-to-r from-[#00D4AA] to-[#00A8FF]"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <p className="text-xs text-slate-500">{progress}% 已完成</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        <div className="text-center">
          <motion.button
            onClick={handleGetReport}
            disabled={!bothUploaded || processing}
            whileHover={bothUploaded ? { scale: 1.02 } : {}}
            whileTap={bothUploaded ? { scale: 0.98 } : {}}
            className={`inline-flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-base transition-all ${
              bothUploaded
                ? "bg-gradient-to-r from-[#00D4AA] to-[#00A8FF] text-[#050d1a] shadow-lg shadow-[#00D4AA]/20 hover:shadow-[#00D4AA]/40"
                : "bg-white/10 text-slate-500 cursor-not-allowed"
            }`}
          >
            获取功能评估报告
            <ChevronRight size={18} />
          </motion.button>
          {!bothUploaded && (
            <p className="text-xs text-slate-600 mt-3">
              请上传左侧和右侧摄像头视频后继续
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
