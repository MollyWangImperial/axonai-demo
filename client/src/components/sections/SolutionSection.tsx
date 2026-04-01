/*
 * SolutionSection — AxonAI's three core capabilities
 * Design: Bioluminescent Dark Science
 * Audience: UK rehabilitation clinicians and healthcare managers
 */
import FadeIn from "@/components/FadeIn";

const GAIT_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663504242183/5EY2vMaeRRMxP3UJhAHQDy/axonai-gait-analysis-5qUgQTvH8orFyQREDhWwzx.webp";
const REHAB_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663504242183/5EY2vMaeRRMxP3UJhAHQDy/axonai-rehab-plan-ASedfW2WiEgqYf2WpPtCPV.webp";

const features = [
  { icon: "◈", label: "Symmetry Analysis", color: "#00D4AA" },
  { icon: "◉", label: "Stability Index", color: "#8B5CF6" },
  { icon: "◎", label: "Gait Rhythm", color: "#00A8FF" },
  { icon: "◆", label: "Joint Angles", color: "#F59E0B" },
  { icon: "▣", label: "Centre of Mass", color: "#00D4AA" },
  { icon: "◐", label: "Cadence Analysis", color: "#8B5CF6" },
];

export default function SolutionSection() {
  return (
    <section
      id="solution"
      className="relative py-28 overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, oklch(0.07 0.02 250) 0%, oklch(0.09 0.025 240) 50%, oklch(0.07 0.02 250) 100%)",
      }}
    >
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(0, 212, 170, 0.05) 0%, transparent 70%)" }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn className="mb-20 text-center">
          <p className="section-label mb-4">SOLUTION</p>
          <h2
            className="text-4xl sm:text-5xl font-bold mb-5"
            style={{ fontFamily: "'Sora', sans-serif", color: "oklch(0.93 0.005 250)" }}
          >
            From Video to Insight —
            <span
              style={{
                background: "linear-gradient(135deg, #00D4AA 0%, #00A8FF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {" "}End-to-End AI
            </span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "oklch(0.6 0.015 250)" }}>
            AxonAI deeply integrates computer vision with clinical knowledge to build a
            complete closed-loop — from data capture to personalised plan generation.
          </p>
        </FadeIn>

        {/* Feature 1: Video Gait Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">
          <FadeIn direction="left">
            <div className="relative rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0, 212, 170, 0.2)" }}>
              <img src={GAIT_IMG} alt="AI Gait Analysis" className="w-full h-auto" style={{ display: "block" }} />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to right, transparent 60%, oklch(0.07 0.02 250))" }}
              />
              <div
                className="absolute top-4 left-4 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{
                  background: "rgba(0, 212, 170, 0.15)",
                  border: "1px solid rgba(0, 212, 170, 0.4)",
                  color: "#00D4AA",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                ● LIVE ANALYSIS
              </div>
            </div>
          </FadeIn>

          <FadeIn direction="right" delay={150}>
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-5"
                style={{
                  background: "rgba(0, 212, 170, 0.1)",
                  border: "1px solid rgba(0, 212, 170, 0.25)",
                  color: "#00D4AA",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                01 / Video Gait Analysis
              </div>
              <h3
                className="text-3xl font-bold mb-4"
                style={{ fontFamily: "'Sora', sans-serif", color: "oklch(0.93 0.005 250)" }}
              >
                Clinical-Grade Assessment
                <br />with a Standard Camera
              </h3>
              <p className="text-base leading-relaxed mb-8" style={{ color: "oklch(0.62 0.015 250)" }}>
                No wearable sensors or specialist equipment required. Using standard video,
                AxonAI performs full-body joint tracking and gait analysis — automatically
                extracting 17 key skeletal landmarks and computing gait parameters in real time.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {features.map((f, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-center"
                    style={{ background: "oklch(0.11 0.018 250)", border: `1px solid ${f.color}25` }}
                  >
                    <span style={{ color: f.color, fontSize: "1.1rem" }}>{f.icon}</span>
                    <span className="text-xs font-medium" style={{ color: "oklch(0.72 0.015 250)" }}>
                      {f.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Feature 2: Personalised Rehab Plan */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <FadeIn direction="left" delay={100}>
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-5"
                style={{
                  background: "rgba(139, 92, 246, 0.1)",
                  border: "1px solid rgba(139, 92, 246, 0.25)",
                  color: "#8B5CF6",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                02 / Personalised Plan Generation
              </div>
              <h3
                className="text-3xl font-bold mb-4"
                style={{ fontFamily: "'Sora', sans-serif", color: "oklch(0.93 0.005 250)" }}
              >
                AI-Driven,
                <br />Tailored to Every Patient
              </h3>
              <p className="text-base leading-relaxed mb-8" style={{ color: "oklch(0.62 0.015 250)" }}>
                Based on assessment results and patient history, the system automatically
                generates a personalised rehabilitation plan specifying exercise type,
                intensity, and frequency — dynamically adjusting as the patient progresses.
              </p>
              <div className="space-y-3">
                {[
                  { label: "Balance Training Programme", progress: 85, color: "#00D4AA" },
                  { label: "Gait Correction Exercises", progress: 72, color: "#8B5CF6" },
                  { label: "Strength Building Plan", progress: 60, color: "#00A8FF" },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-medium" style={{ color: "oklch(0.78 0.015 250)" }}>
                        {item.label}
                      </span>
                      <span className="text-xs font-mono" style={{ color: item.color }}>
                        {item.progress}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "oklch(0.18 0.02 250)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${item.progress}%`,
                          background: `linear-gradient(90deg, ${item.color}, ${item.color}99)`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          <FadeIn direction="right" delay={200}>
            <div className="relative rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(139, 92, 246, 0.2)" }}>
              <img src={REHAB_IMG} alt="Personalised Rehab Plan" className="w-full h-auto" style={{ display: "block" }} />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to left, transparent 60%, oklch(0.07 0.02 250))" }}
              />
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
