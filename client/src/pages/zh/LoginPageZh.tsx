/**
 * LoginPage — AxonAI
 * Design: Dark navy background, teal/violet accent, Sora font
 * Glassmorphism card, animated entrance, demo credentials shown
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, Zap, AlertCircle } from "lucide-react";

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
      navigate("/zh/upload");
    } else {
      setError("登录凭证无效，请检查您的邮箱和密码。");
    }
  };

  const fillDemo = () => {
    setEmail("sarah.mitchell@nhs.uk");
    setPassword("demo123");
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#050d1a] flex items-center justify-center relative overflow-hidden px-4">
      {/* Background glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#00D4AA]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#8B5CF6]/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate("/zh")}
            className="inline-flex items-center gap-2 mb-6 group"
          >
            <span className="text-2xl font-black tracking-widest text-white group-hover:text-[#00D4AA] transition-colors">
              AXONAI
            </span>
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">欢迎回来</h1>
          <p className="text-slate-400 text-sm">
            登录您的临床工作台
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                邮箱地址
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="您的邮箱@医院.com"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#00D4AA]/60 focus:ring-1 focus:ring-[#00D4AA]/30 transition-all text-sm"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                密码
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-11 text-white placeholder-slate-500 focus:outline-none focus:border-[#00D4AA]/60 focus:ring-1 focus:ring-[#00D4AA]/30 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
              >
                <AlertCircle size={14} />
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#00D4AA] to-[#00A8FF] text-[#050d1a] font-bold py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#050d1a]/30 border-t-[#050d1a] rounded-full animate-spin" />
                  登录中…
                </>
              ) : (
                "登录"
              )}
            </button>
          </form>

          {/* Demo credentials — visually hidden, functionality preserved */}
          <button
            onClick={fillDemo}
            aria-hidden="true"
            tabIndex={-1}
            className="sr-only"
          >
            使用演示账号
          </button>
        </div>

        {/* Back link */}
        <p className="text-center mt-6 text-xs text-slate-500">
          <button
            onClick={() => navigate("/zh")}
            className="hover:text-[#00D4AA] transition-colors"
          >
            ← 返回 AxonAI 首页
          </button>
        </p>
      </motion.div>
    </div>
  );
}
