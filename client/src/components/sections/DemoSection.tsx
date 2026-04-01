/*
 * DemoSection — Product demo showcase
 * Design: Bioluminescent Dark Science
 * - Full-width dark panel with dashboard screenshot
 * - Floating metric cards around the screenshot
 * - "From video to report in 3 minutes" emphasis
 */
import FadeIn from "@/components/FadeIn";
import AnimatedCounter from "@/components/AnimatedCounter";

const DASHBOARD_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663504242183/5EY2vMaeRRMxP3UJhAHQDy/axonai-dashboard-VHqyqfeccPJxrGbtSNAzah.webp";

const steps = [
  {
    num: "01",
    title: "上传患者视频",
    desc: "支持手机、平板或医院摄像头录制的标准视频",
    color: "#00D4AA",
  },
  {
    num: "02",
    title: "AI 自动分析",
    desc: "计算机视觉模型提取步态参数，生成量化评估报告",
    color: "#8B5CF6",
  },
  {
    num: "03",
    title: "获取康复方案",
    desc: "个性化训练计划即时生成，可直接导出 PDF 报告",
    color: "#00A8FF",
  },
];

const stats = [
  { value: 3, suffix: "分钟", label: "从视频到完整报告" },
  { value: 17, suffix: "+", label: "关键骨骼节点追踪" },
  { value: 92, suffix: "%", label: "临床评估一致性" },
  { value: 40, suffix: "%", label: "治疗师工作量减少" },
];

export default function DemoSection() {
  return (
    <section
      id="demo"
      className="relative py-28 overflow-hidden"
      style={{ background: "oklch(0.07 0.02 250)" }}
    >
      {/* Top gradient separator */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(0, 212, 170, 0.4), transparent)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <FadeIn className="mb-16 text-center">
          <p className="section-label mb-4">PRODUCT DEMO · 产品展示</p>
          <h2
            className="text-4xl sm:text-5xl font-bold mb-5"
            style={{
              fontFamily: "'Sora', sans-serif",
              color: "oklch(0.93 0.005 250)",
            }}
          >
            <span
              style={{
                background: "linear-gradient(135deg, #00D4AA 0%, #00A8FF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              3 分钟
            </span>
            ，从视频到专业报告
          </h2>
          <p
            className="text-lg max-w-xl mx-auto"
            style={{ color: "oklch(0.6 0.015 250)" }}
          >
            无需专业培训，治疗师即可独立完成完整的步态评估与方案生成全流程。
          </p>
        </FadeIn>

        {/* 3-step workflow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
          {steps.map((step, i) => (
            <FadeIn key={i} delay={i * 150}>
              <div
                className="relative p-6 rounded-2xl"
                style={{
                  background: "oklch(0.10 0.018 250)",
                  border: `1px solid ${step.color}25`,
                }}
              >
                <div
                  className="text-4xl font-black mb-4 leading-none"
                  style={{
                    fontFamily: "'Sora', sans-serif",
                    color: `${step.color}30`,
                  }}
                >
                  {step.num}
                </div>
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{
                    fontFamily: "'Sora', sans-serif",
                    color: "oklch(0.90 0.005 250)",
                  }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "oklch(0.58 0.015 250)" }}
                >
                  {step.desc}
                </p>
                {/* Step connector */}
                {i < steps.length - 1 && (
                  <div
                    className="hidden md:block absolute top-1/2 -right-3 w-6 h-px"
                    style={{ background: `${step.color}40` }}
                  />
                )}
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Dashboard screenshot */}
        <FadeIn delay={100}>
          <div
            className="relative rounded-2xl overflow-hidden mb-16"
            style={{
              border: "1px solid oklch(0.22 0.025 250 / 60%)",
              boxShadow:
                "0 0 60px rgba(0, 212, 170, 0.08), 0 40px 80px rgba(0, 0, 0, 0.4)",
            }}
          >
            {/* Browser chrome mockup */}
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{
                background: "oklch(0.10 0.018 250)",
                borderBottom: "1px solid oklch(0.18 0.02 250)",
              }}
            >
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: "#EF4444" }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "#F59E0B" }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "#22C55E" }} />
              </div>
              <div
                className="flex-1 mx-4 px-3 py-1 rounded-md text-xs text-center"
                style={{
                  background: "oklch(0.14 0.018 250)",
                  color: "oklch(0.5 0.015 250)",
                  fontFamily: "'JetBrains Mono', monospace",
                  maxWidth: "300px",
                  margin: "0 auto",
                }}
              >
                app.axonai.cn/dashboard
              </div>
            </div>

            <img
              src={DASHBOARD_IMG}
              alt="AxonAI 评估报告界面"
              className="w-full h-auto block"
            />

            {/* Glow overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to bottom, transparent 70%, oklch(0.07 0.02 250) 100%)",
              }}
            />
          </div>
        </FadeIn>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {stats.map((stat, i) => (
            <FadeIn key={i} delay={i * 100}>
              <div
                className="text-center p-6 rounded-2xl"
                style={{
                  background: "oklch(0.10 0.018 250)",
                  border: "1px solid oklch(0.18 0.02 250 / 60%)",
                }}
              >
                <div
                  className="text-4xl font-extrabold mb-2"
                  style={{
                    fontFamily: "'Sora', sans-serif",
                    background: "linear-gradient(135deg, #00D4AA 0%, #00A8FF 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <p
                  className="text-sm"
                  style={{ color: "oklch(0.58 0.015 250)" }}
                >
                  {stat.label}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
