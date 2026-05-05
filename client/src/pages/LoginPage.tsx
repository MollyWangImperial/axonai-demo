/**
 * LoginPage — AxonAI
 * Design: Clean light app-shell — white card on #F7F8FA, teal accent
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, AlertCircle, ArrowLeft } from "lucide-react";

const C = {
  bg:      "#F7F8FA",
  surface: "#FFFFFF",
  border:  "#E4E7ED",
  text:    "#1A1D23",
  text2:   "#5A6070",
  text3:   "#9AA0AE",
  teal:    "#00B89A",
  tealDim: "rgba(0,184,154,0.10)",
  red:     "#DC2626",
  redDim:  "rgba(220,38,38,0.08)",
};

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) {
      navigate("/upload");
    } else {
      setError("Invalid credentials. Use the demo account below.");
    }
  };

  const fillDemo = () => {
    setEmail("sarah.mitchell@nhs.uk");
    setPassword("demo123");
    setError("");
  };

  return (
    <div
      className="app-shell min-h-screen flex items-center justify-center px-4"
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
            className="inline-flex items-center gap-2 mb-6 group"
          >
            <span
              className="text-2xl font-black tracking-widest transition-colors"
              style={{ color: C.teal }}
            >
              AXONAI
            </span>
          </button>
          <h1 className="text-3xl font-black mb-2" style={{ color: C.text }}>
            Welcome back
          </h1>
          <p className="text-sm" style={{ color: C.text2 }}>
            Sign in to access your clinical workspace
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            backgroundColor: C.surface,
            border: `1px solid ${C.border}`,
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          }}
        >
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
                placeholder="you@nhs.uk"
                required
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{
                  backgroundColor: C.bg,
                  border: `1.5px solid ${C.border}`,
                  color: C.text,
                }}
                onFocus={(e) => (e.target.style.borderColor = C.teal)}
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
                  onFocus={(e) => (e.target.style.borderColor = C.teal)}
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
                backgroundColor: loading ? C.tealDim : C.teal,
                opacity: loading ? 0.7 : 1,
                boxShadow: loading ? "none" : `0 4px 16px ${C.teal}40`,
              }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>


        </div>

        {/* Back link */}
        <p className="text-center mt-6 text-xs" style={{ color: C.text3 }}>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1 mx-auto transition-opacity hover:opacity-60"
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
