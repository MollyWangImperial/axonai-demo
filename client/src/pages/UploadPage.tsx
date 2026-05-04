/**
 * UploadPage — AxonAI
 * Design: Clean light app-shell (#F7F8FA bg, white cards, teal/blue accents)
 */
import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useAssessment } from "@/contexts/AssessmentContext";
import {
  Upload, Video, CheckCircle2, ArrowLeft, Play, X, Loader2, ChevronRight, User,
} from "lucide-react";

const C = {
  bg:      "#F7F8FA",
  surface: "#FFFFFF",
  border:  "#E4E7ED",
  text:    "#1A1D23",
  text2:   "#5A6070",
  text3:   "#9AA0AE",
  teal:    "#00B89A",
  tealDim: "rgba(0,184,154,0.10)",
  blue:    "#2563EB",
  purple:  "#7C3AED",
};

function VideoDropZone({
  side, file, preview, onFile, onClear,
}: {
  side: "Left" | "Right";
  file: File | null;
  preview: string | null;
  onFile: (f: File, url: string) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const color = side === "Left" ? C.teal : C.blue;

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("video/")) onFile(f, URL.createObjectURL(f));
  }, [onFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onFile(f, URL.createObjectURL(f));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: side === "Left" ? 0.1 : 0.2 }}
      className="flex-1 min-w-0"
    >
      <div
        className="rounded-2xl overflow-hidden transition-all duration-200"
        style={{
          backgroundColor: C.surface,
          border: `2px solid ${dragging ? color : file ? color + "60" : C.border}`,
          boxShadow: dragging ? `0 0 0 4px ${color}20` : "0 1px 3px rgba(0,0,0,0.07)",
        }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{ borderBottom: `1px solid ${C.border}` }}
        >
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-sm font-semibold" style={{ color: C.text }}>{side} Camera</span>
          {file && (
            <button onClick={onClear} className="ml-auto transition-opacity hover:opacity-60" style={{ color: C.text3 }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {file && preview ? (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                <video src={preview} className="w-full h-full object-cover" muted loop autoPlay />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Play size={20} className="text-white ml-1" />
                  </div>
                </div>
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: color }}>
                  ✓ Ready
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: C.text3 }}>
                <Video size={12} />
                <span className="truncate">{file.name}</span>
                <span className="ml-auto flex-shrink-0">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all group"
              style={{ borderColor: color + "40", backgroundColor: color + "05" }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ backgroundColor: color + "15" }}
              >
                <Upload size={24} style={{ color }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: C.text }}>Upload {side} Camera Video</p>
                <p className="text-xs mt-1" style={{ color: C.text3 }}>Drag & drop or click to browse</p>
                <p className="text-xs mt-0.5" style={{ color: C.text3 }}>MP4, MOV, AVI — up to 500 MB</p>
              </div>
            </button>
          )}
        </div>
        <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleChange} />
      </div>
    </motion.div>
  );
}

export default function UploadPage() {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const { videos, setVideos, setReportReady, patientName, setPatientName } = useAssessment();
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState("");

  const bothUploaded = videos.leftFile && videos.rightFile;

  const handleGetReport = async () => {
    if (!bothUploaded) return;
    setProcessing(true);
    setProgress(0);
    const steps = [
      "Extracting pose keypoints…",
      "Analysing gait cycle phases…",
      "Computing bilateral symmetry…",
      "Calculating kinematic parameters…",
      "Generating AI diagnostic summary…",
      "Compiling clinical report…",
    ];
    for (let i = 0; i < steps.length; i++) {
      setProcessingStep(steps[i]);
      await new Promise((r) => setTimeout(r, 600));
      setProgress(Math.round(((i + 1) / steps.length) * 100));
    }
    setReportReady(true);
    navigate("/report");
  };

  return (
    <div className="app-shell min-h-screen" style={{ backgroundColor: C.bg, color: C.text }}>
      {/* Navbar */}
      <nav
        className="sticky top-0 z-30 flex items-center justify-between px-6 py-3"
        style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-60"
            style={{ color: C.text2 }}
          >
            <ArrowLeft size={15} />
            Home
          </button>
          <div className="w-px h-4" style={{ backgroundColor: C.border }} />
          <span className="font-black tracking-widest text-base" style={{ color: C.teal }}>AXONAI</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm" style={{ color: C.text2 }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: C.tealDim }}>
              <User size={14} style={{ color: C.teal }} />
            </div>
            <span className="text-xs">{user?.name}</span>
          </div>
          <button
            onClick={() => { logout(); navigate("/"); }}
            className="text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-70"
            style={{ color: C.text3, border: `1px solid ${C.border}` }}
          >
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4"
            style={{ backgroundColor: C.tealDim, color: C.teal }}
          >
            <Video size={12} />
            Step 1 of 3 — Video Upload
          </div>
          <h1 className="text-3xl font-black mb-2" style={{ color: C.text }}>Upload Walking Videos</h1>
          <p className="text-sm max-w-lg mx-auto" style={{ color: C.text2 }}>
            Upload sagittal-view videos from the left and right cameras to generate the AI-powered functional movement assessment.
          </p>
        </motion.div>

        {/* Patient name */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6 rounded-xl p-4 flex items-center gap-4"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: C.tealDim }}>
            <User size={16} style={{ color: C.teal }} />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-xs mb-1" style={{ color: C.text3 }}>Patient Name</label>
            <input
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="bg-transparent text-sm font-semibold focus:outline-none w-full"
              style={{ color: C.text }}
              placeholder="Enter patient name"
            />
          </div>
          <div className="text-xs flex-shrink-0" style={{ color: C.text3 }}>
            {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </div>
        </motion.div>

        {/* Video upload panels */}
        <div className="flex gap-4 mb-6">
          <VideoDropZone side="Left" file={videos.leftFile} preview={videos.leftPreview}
            onFile={(f, url) => setVideos({ ...videos, leftFile: f, leftPreview: url })}
            onClear={() => setVideos({ ...videos, leftFile: null, leftPreview: null })} />
          <VideoDropZone side="Right" file={videos.rightFile} preview={videos.rightPreview}
            onFile={(f, url) => setVideos({ ...videos, rightFile: f, rightPreview: url })}
            onClear={() => setVideos({ ...videos, rightFile: null, rightPreview: null })} />
        </div>

        {/* Status */}
        <div className="flex items-center justify-center gap-6 mb-8 text-xs">
          <div className="flex items-center gap-1.5" style={{ color: videos.leftFile ? C.teal : C.text3 }}>
            <CheckCircle2 size={13} />
            Left camera {videos.leftFile ? "ready" : "required"}
          </div>
          <div className="w-8 h-px" style={{ backgroundColor: C.border }} />
          <div className="flex items-center gap-1.5" style={{ color: videos.rightFile ? C.blue : C.text3 }}>
            <CheckCircle2 size={13} />
            Right camera {videos.rightFile ? "ready" : "required"}
          </div>
        </div>

        {/* Processing overlay */}
        <AnimatePresence>
          {processing && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center"
              style={{ backgroundColor: "rgba(247,248,250,0.92)", backdropFilter: "blur(8px)" }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="rounded-2xl p-10 max-w-sm w-full mx-4 text-center"
                style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}
              >
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: C.tealDim }}>
                  <Loader2 size={28} className="animate-spin" style={{ color: C.teal }} />
                </div>
                <h3 className="text-lg font-bold mb-1" style={{ color: C.text }}>Analysing Movement Data</h3>
                <p className="text-sm mb-6" style={{ color: C.text2 }}>{processingStep}</p>
                <div className="w-full rounded-full h-2 mb-2" style={{ backgroundColor: C.border }}>
                  <motion.div
                    className="h-2 rounded-full"
                    style={{ backgroundColor: C.teal }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <p className="text-xs" style={{ color: C.text3 }}>{progress}% complete</p>
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
            className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-base transition-all text-white"
            style={{
              backgroundColor: bothUploaded ? C.teal : C.border,
              color: bothUploaded ? "#fff" : C.text3,
              cursor: bothUploaded ? "pointer" : "not-allowed",
              boxShadow: bothUploaded ? `0 4px 20px ${C.teal}40` : "none",
            }}
          >
            Get Functional Assessment
            <ChevronRight size={18} />
          </motion.button>
          {!bothUploaded && (
            <p className="text-xs mt-3" style={{ color: C.text3 }}>
              Please upload both left and right camera videos to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
