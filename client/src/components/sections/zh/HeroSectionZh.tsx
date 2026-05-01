/*
 * HeroSection — Full-screen hero with neural network background
 * Design: Bioluminescent Dark Science
 * Audience: UK rehabilitation clinicians, hospital departments, healthcare managers
 */
import NeuralNetworkBg from "@/components/NeuralNetworkBg";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663504242183/5EY2vMaeRRMxP3UJhAHQDy/axonai-hero-bg-N7Z8ECEjTYY9uXpa8ZeLHK.webp";

const metrics = [
  { value: "92%", label: "评估准确率", color: "#00D4AA" },
  { value: "3 分钟", label: "完整报告生成", color: "#8B5CF6" },
  { value: "40%", label: "治疗师效率提升", color: "#00A8FF" },
];

export default function HeroSection() {
  const [visible, setVisible] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "oklch(0.07 0.02 250)" }}
    >
      {/* Hero background image at low opacity */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${HERO_BG})`, opacity: 0.12 }}
      />

      {/* Radial gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, oklch(0.12 0.04 210 / 40%) 0%, transparent 70%)",
        }}
      />

      {/* Neural network canvas */}
      <NeuralNetworkBg />

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, oklch(0.07 0.02 250))" }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">

        {/* Main headline */}
        <h1
          className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-6"
          style={{
            fontFamily: "'Noto Sans SC', 'Sora', sans-serif",
            color: "oklch(0.95 0.005 250)",
            opacity: visible ? 1 : 0,
            transform: visible ? "none" : "translateY(24px)",
            transition: "opacity 0.7s ease 0.25s, transform 0.7s ease 0.25s",
          }}
        >
          个性化康复，
          <br />
          <span
            style={{
              background: "linear-gradient(135deg, #00D4AA 0%, #00A8FF 60%, #8B5CF6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            从医院延伸到家庭
          </span>
        </h1>

        {/* Sub-headline */}
        <p
          className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{
            color: "oklch(0.65 0.015 250)",
            fontFamily: "'Noto Sans SC', 'DM Sans', sans-serif",
            opacity: visible ? 1 : 0,
            transform: visible ? "none" : "translateY(20px)",
            transition: "opacity 0.7s ease 0.4s, transform 0.7s ease 0.4s",
          }}
        >
          AxonAI 利用计算机视觉技术，为中风患者提供客观、量化的步态与运动功能评估，
          自动生成个性化康复训练方案，显著改善临床预后。
        </p>

        {/* CTA Buttons */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "none" : "translateY(16px)",
            transition: "opacity 0.7s ease 0.55s, transform 0.7s ease 0.55s",
          }}
        >
          <button
            onClick={() => navigate("/login")}
            className="px-8 py-4 rounded-xl text-base font-semibold btn-primary-teal"
            style={{ minWidth: "180px" }}
          >
            立即开始评估
          </button>
          <button
            onClick={() => scrollTo("demo")}
            className="px-8 py-4 rounded-xl text-base font-medium btn-outline-teal"
            style={{ minWidth: "160px", fontFamily: "'Noto Sans SC', sans-serif" }}
          >
            预约演示 →
          </button>
        </div>

        {/* Floating metric badges */}
        <div
          className="flex flex-wrap items-center justify-center gap-4"
          style={{ opacity: visible ? 1 : 0, transition: "opacity 0.7s ease 0.7s" }}
        >
          {metrics.map((m, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-5 py-3 rounded-xl glass-card"
              style={{ border: `1px solid ${m.color}30` }}
            >
              <span
                className="text-2xl font-bold"
                style={{ fontFamily: "'Sora', sans-serif", color: m.color }}
              >
                {m.value}
              </span>
              <span className="text-sm" style={{ color: "oklch(0.6 0.015 250)", fontFamily: "'Noto Sans SC', sans-serif" }}>
                {m.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{ opacity: visible ? 0.5 : 0, transition: "opacity 1s ease 1.2s" }}
      >
        <span
          className="text-xs"
          style={{
            color: "oklch(0.5 0.015 250)",
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.1em",
          }}
        >
          向下滚动
        </span>
        <div
          className="w-px h-8"
          style={{ background: "linear-gradient(to bottom, oklch(0.5 0.015 250), transparent)" }}
        />
      </div>
    </section>
  );
}
