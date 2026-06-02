/**
 * AssessQualityZh — 质量检查
 * Step 4: Auto QC with visual pass/fail indicators
 * Design: Dark navy, animated check results, retake prompts
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, XCircle, AlertTriangle, RotateCcw,
  ArrowRight, ChevronLeft, Eye, Sun, User, Hand, Activity, Layers,
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

type CheckStatus = "checking" | "pass" | "fail" | "warn";

interface QCResult {
  id: string;
  label: string;
  icon: React.ElementType;
  status: CheckStatus;
  detail: string;
  suggestion?: string;
}

const mockVideos = [
  { id: "u1", name: "肩关节屈曲", pkg: "上肢包", duration: "18s" },
  { id: "u2", name: "肩关节外展", pkg: "上肢包", duration: "22s" },
  { id: "u3", name: "肘关节屈伸", pkg: "上肢包", duration: "25s" },
  { id: "h1", name: "全手抓握", pkg: "手功能包", duration: "15s" },
  { id: "h2", name: "侧捏（钥匙捏）", pkg: "手功能包", duration: "14s" },
  { id: "h3", name: "对指", pkg: "手功能包", duration: "20s" },
];

const qcChecks: Record<string, QCResult[]> = {
  u1: [
    { id: "framing", label: "人体入镜完整", icon: User, status: "pass", detail: "患者全身清晰可见，头顶与脚底均在画面内" },
    { id: "hand", label: "患侧手部可见", icon: Hand, status: "pass", detail: "右手全程清晰可见，无遮挡" },
    { id: "angle", label: "拍摄角度合适", icon: Eye, status: "pass", detail: "侧面拍摄，关节角度可准确测量" },
    { id: "light", label: "光线充足", icon: Sun, status: "warn", detail: "画面右侧略有阴影，建议补光", suggestion: "将台灯移至患者右侧" },
    { id: "motion", label: "动作完成度", icon: Activity, status: "pass", detail: "完成 3 次完整屈曲动作，ROM 可测量" },
    { id: "quality", label: "整体质量", icon: Layers, status: "pass", detail: "视频质量良好，可进行 AI 分析" },
  ],
  u2: [
    { id: "framing", label: "人体入镜完整", icon: User, status: "pass", detail: "患者全身清晰可见" },
    { id: "hand", label: "患侧手部可见", icon: Hand, status: "fail", detail: "第 2 次动作中右手被遮挡约 1.5 秒", suggestion: "重拍时确保手臂全程不被遮挡" },
    { id: "angle", label: "拍摄角度合适", icon: Eye, status: "pass", detail: "正面拍摄，外展角度可测量" },
    { id: "light", label: "光线充足", icon: Sun, status: "pass", detail: "光线均匀，无明显阴影" },
    { id: "motion", label: "动作完成度", icon: Activity, status: "warn", detail: "第 3 次动作幅度明显减小，建议重拍", suggestion: "休息后重新录制第 3 次" },
    { id: "quality", label: "整体质量", icon: Layers, status: "warn", detail: "部分帧质量不足，建议重拍" },
  ],
  u3: [
    { id: "framing", label: "人体入镜完整", icon: User, status: "pass", detail: "患者全身清晰可见" },
    { id: "hand", label: "患侧手部可见", icon: Hand, status: "pass", detail: "右手全程清晰可见" },
    { id: "angle", label: "拍摄角度合适", icon: Eye, status: "pass", detail: "侧面拍摄，肘关节角度可精确测量" },
    { id: "light", label: "光线充足", icon: Sun, status: "pass", detail: "光线良好" },
    { id: "motion", label: "动作完成度", icon: Activity, status: "pass", detail: "完成 5 次完整屈伸，ROM 数据完整" },
    { id: "quality", label: "整体质量", icon: Layers, status: "pass", detail: "视频质量优秀" },
  ],
  h1: [
    { id: "framing", label: "人体入镜完整", icon: User, status: "pass", detail: "上半身清晰可见" },
    { id: "hand", label: "患侧手部可见", icon: Hand, status: "pass", detail: "手部特写清晰，手指细节可见" },
    { id: "angle", label: "拍摄角度合适", icon: Eye, status: "pass", detail: "正面拍摄，握力动作可分析" },
    { id: "light", label: "光线充足", icon: Sun, status: "pass", detail: "光线充足" },
    { id: "motion", label: "动作完成度", icon: Activity, status: "pass", detail: "完成 3 次握拳-松开动作" },
    { id: "quality", label: "整体质量", icon: Layers, status: "pass", detail: "质量良好" },
  ],
  h2: [
    { id: "framing", label: "人体入镜完整", icon: User, status: "pass", detail: "手部特写清晰" },
    { id: "hand", label: "患侧手部可见", icon: Hand, status: "pass", detail: "拇指和食指侧面清晰可见" },
    { id: "angle", label: "拍摄角度合适", icon: Eye, status: "pass", detail: "正面拍摄" },
    { id: "light", label: "光线充足", icon: Sun, status: "fail", detail: "画面过暗，手指细节不清晰", suggestion: "增加环境光线或使用手机补光灯" },
    { id: "motion", label: "动作完成度", icon: Activity, status: "warn", detail: "捏取动作幅度较小，建议重拍", suggestion: "提示患者尽力捏紧物件" },
    { id: "quality", label: "整体质量", icon: Layers, status: "fail", detail: "光线不足导致质量不达标，需要重拍" },
  ],
  h3: [
    { id: "framing", label: "人体入镜完整", icon: User, status: "pass", detail: "手部清晰可见" },
    { id: "hand", label: "患侧手部可见", icon: Hand, status: "pass", detail: "所有手指清晰可见" },
    { id: "angle", label: "拍摄角度合适", icon: Eye, status: "pass", detail: "正面拍摄，对指动作可分析" },
    { id: "light", label: "光线充足", icon: Sun, status: "pass", detail: "光线良好" },
    { id: "motion", label: "动作完成度", icon: Activity, status: "pass", detail: "完成全部对指序列" },
    { id: "quality", label: "整体质量", icon: Layers, status: "pass", detail: "质量良好" },
  ],
};

function statusColor(s: CheckStatus) {
  return s === "pass" ? C.teal : s === "fail" ? C.red : s === "warn" ? C.amber : C.muted;
}
function statusIcon(s: CheckStatus) {
  if (s === "pass") return <CheckCircle2 size={16} style={{ color: C.teal }} />;
  if (s === "fail") return <XCircle size={16} style={{ color: C.red }} />;
  if (s === "warn") return <AlertTriangle size={16} style={{ color: C.amber }} />;
  return <div className="w-4 h-4 rounded-full border-2 border-slate-600 animate-spin" />;
}

export default function AssessQualityZh() {
  const [, navigate] = useLocation();
  const [selectedVideo, setSelectedVideo] = useState("u1");
  const [checkProgress, setCheckProgress] = useState(0);
  const [isChecking, setIsChecking] = useState(true);
  const [retakeList, setRetakeList] = useState<string[]>([]);

  useEffect(() => {
    setIsChecking(true);
    setCheckProgress(0);
    const interval = setInterval(() => {
      setCheckProgress((p) => {
        if (p >= 6) { clearInterval(interval); setIsChecking(false); return 6; }
        return p + 1;
      });
    }, 300);
    return () => clearInterval(interval);
  }, [selectedVideo]);

  const checks = qcChecks[selectedVideo] || [];
  const visibleChecks = checks.slice(0, checkProgress);
  const failCount = checks.filter((c) => c.status === "fail").length;
  const warnCount = checks.filter((c) => c.status === "warn").length;
  const overallPass = failCount === 0;

  const allResults = mockVideos.map((v) => {
    const c = qcChecks[v.id] || [];
    const fails = c.filter((x) => x.status === "fail").length;
    const warns = c.filter((x) => x.status === "warn").length;
    return { ...v, fails, warns, pass: fails === 0 };
  });
  const totalFails = allResults.filter((v) => !v.pass).length;

  return (
    <div className="min-h-screen" style={{ background: C.bg, color: C.text }}>
      {/* Top bar */}
      <div
        className="fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-6 z-40"
        style={{ background: "rgba(5,13,26,0.95)", borderBottom: `1px solid ${C.border}` }}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/zh/assess/collect")} className="flex items-center gap-1 text-sm" style={{ color: C.muted }}>
            <ChevronLeft size={16} />
            返回采集
          </button>
          <span style={{ color: C.border }}>|</span>
          <span className="text-sm font-semibold text-white">质量检查</span>
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${C.teal}20`, color: C.teal }}>
            步骤 4 / 8
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm" style={{ color: C.muted }}>
            {totalFails > 0 ? (
              <span style={{ color: C.amber }}>{totalFails} 个视频需要重拍</span>
            ) : (
              <span style={{ color: C.teal }}>全部通过 ✓</span>
            )}
          </span>
          <button
            onClick={() => navigate("/zh/assess/analysis")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
            style={{ background: C.teal, color: "#050d1a" }}
          >
            开始 AI 分析
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <div className="pt-14 max-w-[1300px] mx-auto px-6 py-6 grid grid-cols-[240px_1fr] gap-5">

        {/* Left: video list */}
        <div className="flex flex-col gap-2">
          <div className="text-xs font-semibold mb-1 px-1" style={{ color: C.muted }}>已采集视频</div>
          {allResults.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelectedVideo(v.id)}
              className="rounded-xl px-4 py-3 text-left transition-all hover:scale-[1.01]"
              style={{
                background: selectedVideo === v.id ? "rgba(255,255,255,0.07)" : C.panel,
                border: `1px solid ${selectedVideo === v.id ? (v.pass ? C.teal : C.red) : C.border}`,
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-white">{v.name}</span>
                {v.fails > 0 ? (
                  <XCircle size={14} style={{ color: C.red }} />
                ) : v.warns > 0 ? (
                  <AlertTriangle size={14} style={{ color: C.amber }} />
                ) : (
                  <CheckCircle2 size={14} style={{ color: C.teal }} />
                )}
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: C.muted }}>
                <span>{v.pkg}</span>
                <span>·</span>
                <span>{v.duration}</span>
              </div>
              {v.fails > 0 && (
                <div className="mt-1 text-xs" style={{ color: C.red }}>需要重拍</div>
              )}
            </button>
          ))}
        </div>

        {/* Right: QC results */}
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-white">
                {mockVideos.find((v) => v.id === selectedVideo)?.name}
              </h2>
              <p className="text-sm" style={{ color: C.muted }}>
                {mockVideos.find((v) => v.id === selectedVideo)?.pkg} · 自动质量检查
              </p>
            </div>
            {!isChecking && (
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                style={{
                  background: overallPass ? `${C.teal}15` : `${C.red}15`,
                  border: `1px solid ${overallPass ? C.teal + "40" : C.red + "40"}`,
                  color: overallPass ? C.teal : C.red,
                }}
              >
                {overallPass ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                {overallPass ? "质量通过" : "需要重拍"}
              </div>
            )}
          </div>

          {/* Check items */}
          <div className="grid grid-cols-2 gap-3">
            {checks.map((check, i) => {
              const visible = i < checkProgress;
              const isChecking_ = i === checkProgress - 1 && isChecking;
              const displayStatus: CheckStatus = isChecking_ ? "checking" : (visible ? check.status : "checking");
              return (
                <AnimatePresence key={check.id}>
                  {visible && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="rounded-xl p-4"
                      style={{
                        background: C.panel,
                        border: `1px solid ${visible && !isChecking_ ? statusColor(check.status) + "40" : C.border}`,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {statusIcon(displayStatus)}
                        <span className="text-sm font-semibold text-white">{check.label}</span>
                      </div>
                      {visible && !isChecking_ && (
                        <>
                          <p className="text-xs mb-2" style={{ color: C.muted }}>{check.detail}</p>
                          {check.suggestion && (
                            <div
                              className="rounded-lg px-3 py-2 text-xs flex items-start gap-1.5"
                              style={{ background: `${C.amber}10`, color: C.amber }}
                            >
                              <AlertTriangle size={10} className="mt-0.5 flex-shrink-0" />
                              {check.suggestion}
                            </div>
                          )}
                        </>
                      )}
                      {isChecking_ && (
                        <div className="text-xs" style={{ color: C.muted }}>检查中...</div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              );
            })}
          </div>

          {/* Retake button */}
          {!isChecking && !overallPass && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-5 flex items-center justify-between"
              style={{ background: `${C.red}08`, border: `1px solid ${C.red}30` }}
            >
              <div>
                <div className="font-semibold text-white mb-1">此视频需要重拍</div>
                <div className="text-sm" style={{ color: C.muted }}>
                  发现 {failCount} 个严重问题，{warnCount} 个警告。请按照建议重新录制。
                </div>
              </div>
              <button
                onClick={() => navigate("/zh/assess/collect")}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
                style={{ background: C.red, color: "white" }}
              >
                <RotateCcw size={14} />
                重新录制
              </button>
            </motion.div>
          )}

          {/* All pass CTA */}
          {!isChecking && overallPass && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-5 flex items-center justify-between"
              style={{ background: `${C.teal}08`, border: `1px solid ${C.teal}30` }}
            >
              <div>
                <div className="font-semibold text-white mb-1">✅ 此视频质量良好</div>
                <div className="text-sm" style={{ color: C.muted }}>
                  所有检查项目通过，可进行 AI 生物力学分析。
                </div>
              </div>
              <button
                onClick={() => navigate("/zh/assess/analysis")}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
                style={{ background: C.teal, color: "#050d1a" }}
              >
                开始分析
                <ArrowRight size={14} />
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
