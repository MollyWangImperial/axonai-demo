/**
 * PatientUploadPage — AxonAI Patient Workspace
 * Design: Clean light shell — white card on #F7F8FA, teal accent
 * Sections: Assessment Due Banner · Recording Guide · Camera/Upload · Submission
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  Video, Upload, CheckCircle2, AlertCircle, ArrowLeft,
  Camera, StopCircle, Play, RotateCcw, Send, Info,
  ChevronDown, ChevronUp, Zap, Home, MessageSquare, LogOut,
} from "lucide-react";

const C = {
  bg:        "#F7F8FA",
  surface:   "#FFFFFF",
  border:    "#E4E7ED",
  text:      "#1A1D23",
  text2:     "#5A6070",
  text3:     "#9AA0AE",
  teal:      "#00B89A",
  tealDim:   "rgba(0,184,154,0.10)",
  tealBorder:"rgba(0,184,154,0.25)",
  amber:     "#F59E0B",
  amberDim:  "rgba(245,158,11,0.10)",
  blue:      "#3B82F6",
  blueDim:   "rgba(59,130,246,0.10)",
  red:       "#EF4444",
  redDim:    "rgba(239,68,68,0.08)",
  green:     "#10B981",
};

const RECORDING_STEPS = [
  { icon: "📍", title: "Set up your space", desc: "Clear a 5-metre straight path. Place your phone on a stable surface or ask someone to hold it at waist height." },
  { icon: "👟", title: "Wear appropriate footwear", desc: "Wear your usual walking shoes. Avoid socks only or bare feet for this assessment." },
  { icon: "🚶", title: "Walk naturally", desc: "Walk at your comfortable pace from one end to the other. Do not rush or slow down for the camera." },
  { icon: "⏱️", title: "30 seconds is enough", desc: "The system needs approximately 30 seconds of walking footage. You can stop sooner if you complete the path." },
];

type Stage = "guide" | "recording" | "preview" | "submitting" | "done";

function NavBar({ onNavigate }: { onNavigate: (p: string) => void }) {
  const { logout } = useAuth();
  const [, navigate] = useLocation();
  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b"
      style={{ backgroundColor: C.surface, borderColor: C.border }}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: C.teal }}>
          <Zap size={14} color="#fff" />
        </div>
        <span className="font-bold text-sm" style={{ color: C.text }}>AxonAI</span>
        <span className="text-xs px-2 py-0.5 rounded-full font-medium ml-1" style={{ backgroundColor: C.tealDim, color: C.teal }}>Patient</span>
      </div>
      <nav className="flex items-center gap-1">
        {[
          { icon: Home, label: "Home", path: "/patient-home" },
          { icon: Video, label: "Upload", path: "/patient-upload" },
          { icon: MessageSquare, label: "Messages", path: "/patient-messages" },
        ].map(({ icon: Icon, label, path }) => (
          <button key={path} onClick={() => onNavigate(path)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-gray-50"
            style={{ color: path === "/patient-upload" ? C.teal : C.text2 }}>
            <Icon size={14} /><span className="hidden sm:inline">{label}</span>
          </button>
        ))}
        <button onClick={() => { logout(); navigate("/login"); }} className="p-2 rounded-lg hover:bg-gray-50 ml-1">
          <LogOut size={14} style={{ color: C.text3 }} />
        </button>
      </nav>
    </header>
  );
}

export default function PatientUploadPage() {
  const [, navigate] = useLocation();
  const [stage, setStage] = useState<Stage>("guide");
  const [guideExpanded, setGuideExpanded] = useState(true);
  const [useCamera, setUseCamera] = useState(true);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ANALYSIS_STEPS = [
    "Uploading video securely…",
    "Extracting skeletal keypoints…",
    "Calculating gait parameters…",
    "Comparing with your baseline…",
    "Generating assessment report…",
    "Notifying your therapist…",
  ];

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setStage("recording");
    } catch {
      alert("Camera access denied. Please allow camera access or use the file upload option.");
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current, { mimeType: "video/webm" });
    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setVideoBlob(blob);
      setVideoUrl(URL.createObjectURL(blob));
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setStage("preview");
    };
    recorder.start();
    recorderRef.current = recorder;
    setRecording(true);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(v => v + 1), 1000);
  }, []);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const retake = useCallback(() => {
    setVideoBlob(null);
    setVideoUrl(null);
    setUploadFile(null);
    setElapsed(0);
    setStage("guide");
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setStage("preview");
  };

  const handleSubmit = async () => {
    setStage("submitting");
    setSubmitProgress(0);
    setAnalysisStep(0);
    for (let i = 0; i <= 100; i += 2) {
      await new Promise(r => setTimeout(r, 60));
      setSubmitProgress(i);
      if (i % 17 === 0) setAnalysisStep(v => Math.min(v + 1, ANALYSIS_STEPS.length - 1));
    }
    setStage("done");
  };

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (stage === "preview" && previewRef.current && videoUrl) {
      previewRef.current.src = videoUrl;
    }
  }, [stage, videoUrl]);

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg }}>
      <NavBar onNavigate={navigate} />

      <main className="max-w-xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={() => navigate("/patient-home")}
            className="flex items-center gap-1.5 text-xs font-medium mb-3 transition-opacity hover:opacity-70"
            style={{ color: C.text3 }}
          >
            <ArrowLeft size={13} /> Back to Home
          </button>
          <h1 className="text-xl font-bold" style={{ color: C.text }}>Weekly Gait Assessment</h1>
          <p className="text-sm mt-1" style={{ color: C.text2 }}>
            Record a 30-second walk so your therapist can track your progress this week.
          </p>
        </motion.div>

        {/* Assessment due badge */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ backgroundColor: C.amberDim, border: `1.5px solid ${C.amber}40` }}
        >
          <AlertCircle size={16} style={{ color: C.amber }} />
          <p className="text-xs font-semibold" style={{ color: C.amber }}>
            Week 3 assessment due today — your therapist is waiting for this video
          </p>
        </motion.div>

        {/* Recording Guide */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: C.surface, border: `1.5px solid ${C.border}` }}
        >
          <button
            onClick={() => setGuideExpanded(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4"
          >
            <div className="flex items-center gap-2">
              <Info size={15} style={{ color: C.blue }} />
              <span className="text-sm font-bold" style={{ color: C.text }}>How to record correctly</span>
            </div>
            {guideExpanded ? <ChevronUp size={14} style={{ color: C.text3 }} /> : <ChevronDown size={14} style={{ color: C.text3 }} />}
          </button>
          <AnimatePresence>
            {guideExpanded && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 grid grid-cols-2 gap-3">
                  {RECORDING_STEPS.map((step, i) => (
                    <div
                      key={i}
                      className="rounded-xl p-3"
                      style={{ backgroundColor: "#F7F8FA", border: `1px solid ${C.border}` }}
                    >
                      <span className="text-lg">{step.icon}</span>
                      <p className="text-xs font-bold mt-1.5 mb-1" style={{ color: C.text }}>{step.title}</p>
                      <p className="text-xs leading-relaxed" style={{ color: C.text2 }}>{step.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Main recording/upload area */}
        <AnimatePresence mode="wait">

          {/* Stage: guide — choose method */}
          {stage === "guide" && (
            <motion.div
              key="guide"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl p-5 space-y-3"
              style={{ backgroundColor: C.surface, border: `1.5px solid ${C.border}` }}
            >
              <p className="text-sm font-bold" style={{ color: C.text }}>Choose how to submit</p>

              {/* Camera option */}
              <button
                onClick={() => { setUseCamera(true); startCamera(); }}
                className="w-full flex items-center gap-4 p-4 rounded-xl transition-all hover:shadow-sm text-left"
                style={{ backgroundColor: C.tealDim, border: `1.5px solid ${C.tealBorder}` }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: C.teal }}>
                  <Camera size={20} color="#fff" />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: C.teal }}>Record with camera</p>
                  <p className="text-xs mt-0.5" style={{ color: C.text2 }}>Use your device camera to record right now</p>
                </div>
              </button>

              {/* Upload option */}
              <label className="w-full flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all hover:shadow-sm"
                style={{ backgroundColor: "#F7F8FA", border: `1.5px solid ${C.border}` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: C.blueDim }}>
                  <Upload size={20} style={{ color: C.blue }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold" style={{ color: C.text }}>Upload existing video</p>
                  <p className="text-xs mt-0.5" style={{ color: C.text2 }}>Upload a video you've already recorded (MP4, MOV, WebM)</p>
                </div>
                <input type="file" accept="video/*" className="hidden" onChange={handleFileUpload} />
              </label>
            </motion.div>
          )}

          {/* Stage: recording — live camera */}
          {stage === "recording" && (
            <motion.div
              key="recording"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: "#000", border: `1.5px solid ${C.border}` }}
            >
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full aspect-video object-cover"
                />
                {/* Recording indicator */}
                {recording && (
                  <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: C.red }} />
                    <span className="text-white text-xs font-bold">{fmt(elapsed)}</span>
                  </div>
                )}
                {/* Guide overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-white/30 rounded-lg w-1/2 h-4/5" />
                </div>
              </div>
              <div className="p-4 flex items-center justify-between" style={{ backgroundColor: C.surface }}>
                <button
                  onClick={retake}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg"
                  style={{ color: C.text2, backgroundColor: "#F7F8FA", border: `1px solid ${C.border}` }}
                >
                  <ArrowLeft size={13} /> Cancel
                </button>
                {!recording ? (
                  <button
                    onClick={startRecording}
                    className="flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl transition-all hover:opacity-80"
                    style={{ backgroundColor: C.red, color: "#fff" }}
                  >
                    <Camera size={15} /> Start Recording
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl transition-all hover:opacity-80"
                    style={{ backgroundColor: C.teal, color: "#fff" }}
                  >
                    <StopCircle size={15} /> Stop & Review
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* Stage: preview — review before submit */}
          {stage === "preview" && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: C.surface, border: `1.5px solid ${C.border}` }}
            >
              <video
                ref={previewRef}
                controls
                className="w-full aspect-video bg-black"
              />
              <div className="p-5">
                <p className="text-sm font-bold mb-1" style={{ color: C.text }}>Review your video</p>
                <p className="text-xs mb-4" style={{ color: C.text2 }}>
                  Make sure you can see your full body walking naturally. If it looks good, submit it.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={retake}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                    style={{ backgroundColor: "#F7F8FA", color: C.text2, border: `1.5px solid ${C.border}` }}
                  >
                    <RotateCcw size={14} /> Retake
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-80"
                    style={{ backgroundColor: C.teal, color: "#fff" }}
                  >
                    <Send size={14} /> Submit Video
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Stage: submitting — progress */}
          {stage === "submitting" && (
            <motion.div
              key="submitting"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl p-8 text-center"
              style={{ backgroundColor: C.surface, border: `1.5px solid ${C.border}` }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ backgroundColor: C.tealDim }}
              >
                <Zap size={28} style={{ color: C.teal }} className="animate-pulse" />
              </div>
              <p className="text-sm font-bold mb-1" style={{ color: C.text }}>
                {ANALYSIS_STEPS[analysisStep]}
              </p>
              <p className="text-xs mb-5" style={{ color: C.text3 }}>
                Please keep this page open
              </p>
              <div className="h-2 rounded-full overflow-hidden mb-2" style={{ backgroundColor: C.tealDim }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: C.teal, width: `${submitProgress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <p className="text-xs font-bold" style={{ color: C.teal }}>{submitProgress}%</p>
            </motion.div>
          )}

          {/* Stage: done */}
          {stage === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl p-8 text-center"
              style={{ backgroundColor: C.surface, border: `1.5px solid ${C.teal}40` }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ backgroundColor: C.tealDim }}
              >
                <CheckCircle2 size={32} style={{ color: C.teal }} />
              </div>
              <p className="text-lg font-bold mb-2" style={{ color: C.text }}>Assessment Submitted!</p>
              <p className="text-sm leading-relaxed mb-6" style={{ color: C.text2 }}>
                Your video has been analysed. Dr. Erisa will review your report and you'll receive a message within 24 hours with your updated rehabilitation plan.
              </p>
              <div
                className="rounded-xl p-4 mb-5 text-left"
                style={{ backgroundColor: C.tealDim, border: `1px solid ${C.tealBorder}` }}
              >
                <p className="text-xs font-bold mb-2" style={{ color: C.teal }}>Preliminary results (AI estimate)</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Gait Speed", value: "0.89 m/s", delta: "+0.07" },
                    { label: "Step Symmetry", value: "74%", delta: "+3%" },
                    { label: "Cadence", value: "98 steps/min", delta: "+4" },
                    { label: "Gait Score", value: "65/100", delta: "+3 pts" },
                  ].map(({ label, value, delta }) => (
                    <div key={label}>
                      <p className="text-xs" style={{ color: C.text3 }}>{label}</p>
                      <p className="text-sm font-bold" style={{ color: C.text }}>{value}
                        <span className="ml-1 text-xs font-semibold" style={{ color: C.green }}>{delta}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => navigate("/patient-home")}
                className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-80"
                style={{ backgroundColor: C.teal, color: "#fff" }}
              >
                Back to Home
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-8" />
      </main>
    </div>
  );
}
