/**
 * LoginPage — AxonAI
 * Design: Clean light app-shell — white card on #F7F8FA, teal accent
 * Flow: Step 1 — choose role (Therapist / Patient) → Step 2 — enter credentials
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  Eye, EyeOff, AlertCircle, ArrowLeft,
  Stethoscope, User, ChevronRight, Zap,
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
  tealBorder:"rgba(0,184,154,0.30)",
  blue:      "#3B82F6",
  blueDim:   "rgba(59,130,246,0.10)",
  blueBorder:"rgba(59,130,246,0.30)",
  red:       "#DC2626",
  redDim:    "rgba(220,38,38,0.08)",
};

type Role = "therapist" | "patient" | null;

const ROLE_CONFIG = {
  therapist: {
    icon: Stethoscope,
    label: "Therapist / Clinician",
    desc: "Access the clinical dashboard, patient assessments, and rehabilitation plans",
    color: C.teal,
    dim: C.tealDim,
    border: C.tealBorder,
    placeholder: "you@nhs.uk",
    redirect: "/dashboard",
  },
  patient: {
    icon: User,
    label: "Patient",
    desc: "View your daily exercises, submit assessment videos, and message your therapist",
    color: C.blue,
    dim: C.blueDim,
    border: C.blueBorder,
    placeholder: "your@email.com",
    redirect: "/patient-home",
  },
};

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const [role, setRole] = useState<Role>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cfg = role ? ROLE_CONFIG[role] : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) {
      const stored = sessionStorage.getItem("axonai_user");
      const u = stored ? JSON.parse(stored) : null;
      // Respect the role the user selected, cross-check with account role
      if (u?.role === "patient" || role === "patient") {
        navigate("/patient-home");
      } else {
        navigate("/dashboard");
      }
    } else {
      setError("Incorrect email or password. Please try again.");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ backgroundColor: C.bg }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 mb-6"
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: C.teal }}
            >
              <Zap size={16} color="#fff" />
            </div>
            <span className="text-xl font-black tracking-widest" style={{ color: C.text }}>
              AXONAI
            </span>
          </button>
          <h1 className="text-3xl font-black mb-2" style={{ color: C.text }}>
            Welcome back
          </h1>
          <p className="text-sm" style={{ color: C.text2 }}>
            {role ? `Signing in as ${ROLE_CONFIG[role].label}` : "Who are you signing in as?"}
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 overflow-hidden"
          style={{
            backgroundColor: C.surface,
            border: `1px solid ${C.border}`,
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          }}
        >
          <AnimatePresence mode="wait">

            {/* ── Step 1: Role Selection ── */}
            {!role && (
              <motion.div
                key="role-select"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: C.text3 }}>
                  Select your role to continue
                </p>

                {(["therapist", "patient"] as const).map((r) => {
                  const rc = ROLE_CONFIG[r];
                  const Icon = rc.icon;
                  return (
                    <motion.button
                      key={r}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => { setRole(r); setEmail(""); setPassword(""); setError(""); }}
                      className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all"
                      style={{
                        backgroundColor: rc.dim,
                        border: `1.5px solid ${rc.border}`,
                      }}
                    >
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: rc.color }}
                      >
                        <Icon size={20} color="#fff" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold" style={{ color: C.text }}>{rc.label}</p>
                        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: C.text2 }}>{rc.desc}</p>
                      </div>
                      <ChevronRight size={16} style={{ color: rc.color }} className="flex-shrink-0" />
                    </motion.button>
                  );
                })}
              </motion.div>
            )}

            {/* ── Step 2: Credentials ── */}
            {role && cfg && (
              <motion.div
                key="credentials"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
              >
                {/* Role badge */}
                <div
                  className="flex items-center gap-2 mb-6 px-3 py-2 rounded-xl"
                  style={{ backgroundColor: cfg.dim, border: `1px solid ${cfg.border}` }}
                >
                  <cfg.icon size={14} style={{ color: cfg.color }} />
                  <span className="text-xs font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
                  <button
                    onClick={() => { setRole(null); setError(""); }}
                    className="ml-auto text-xs underline transition-opacity hover:opacity-60"
                    style={{ color: C.text3 }}
                  >
                    Change
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: C.text2 }}>
                      Email address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={cfg.placeholder}
                      required
                      autoFocus
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                      style={{
                        backgroundColor: C.bg,
                        border: `1.5px solid ${C.border}`,
                        color: C.text,
                      }}
                      onFocus={(e) => (e.target.style.borderColor = cfg.color)}
                      onBlur={(e) => (e.target.style.borderColor = C.border)}
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: C.text2 }}>
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPw ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full rounded-xl px-4 py-3 pr-11 text-sm outline-none transition-all"
                        style={{
                          backgroundColor: C.bg,
                          border: `1.5px solid ${C.border}`,
                          color: C.text,
                        }}
                        onFocus={(e) => (e.target.style.borderColor = cfg.color)}
                        onBlur={(e) => (e.target.style.borderColor = C.border)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-60"
                        style={{ color: C.text3 }}
                      >
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-sm rounded-lg px-3 py-2"
                      style={{ backgroundColor: C.redDim, color: C.red, border: `1px solid ${C.red}20` }}
                    >
                      <AlertCircle size={14} />
                      {error}
                    </motion.div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full font-bold py-3 rounded-xl transition-all text-sm text-white flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: loading ? cfg.dim : cfg.color,
                      color: loading ? cfg.color : "#fff",
                      boxShadow: loading ? "none" : `0 4px 16px ${cfg.color}40`,
                    }}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                        Signing in…
                      </>
                    ) : (
                      `Sign In as ${cfg.label}`
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Back link */}
        <p className="text-center mt-6">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1 text-xs transition-opacity hover:opacity-60"
            style={{ color: C.text3 }}
          >
            <ArrowLeft size={11} />
            Back to AxonAI homepage
          </button>
        </p>
      </motion.div>
    </div>
  );
}
