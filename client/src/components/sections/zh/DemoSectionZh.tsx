/*
 * DemoSection — Product demo showcase
 * Design: Bioluminescent Dark Science
 * Audience: UK rehabilitation clinicians and healthcare managers
 */
import FadeIn from "@/components/FadeIn";
import AnimatedCounter from "@/components/AnimatedCounter";

const DASHBOARD_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663504242183/5EY2vMaeRRMxP3UJhAHQDy/axonai-dashboard-VHqyqfeccPJxrGbtSNAzah.webp";

const steps = [
  {
    num: "01",
    title: "上传患者视频",
    desc: "支持智能手机、平板或医院摄像头拍摄的标准视频",
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
    desc: "即时生成个性化训练计划，可导出为 PDF 报告",
    color: "#00A8FF",
  },
];

const stats = [
  { value: 3, suffix: " 分钟", label: "视频到完整报告" },
  { value: 17, suffix: "+", label: "骨骼关键点跟踪" },
  { value: 92, suffix: "%", label: "临床评估一致性" },
  { value: 40, suffix: "%", label: "治疗师工作负担降低" },
];

export default function DemoSection() {
  return (
    <section
      id="demo"
      className="relative py-28 overflow-hidden"
      style={{ background: "oklch(0.07 0.02 250)" }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(0, 212, 170, 0.4), transparent)" }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn className="mb-16 text-center">
          <p className="section-label mb-4">产品演示</p>
          <h2
            className="text-4xl sm:text-5xl font-bold mb-5"
            style={{ fontFamily: "'Noto Sans SC', 'Sora', sans-serif", color: "oklch(0.93 0.005 250)" }}
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
            {" "}视频即可生成专业报告
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "oklch(0.6 0.015 250)", fontFamily: "'Noto Sans SC', sans-serif" }}>
            无需专业培训。治疗师从第一次使用起就能独立完成完整的步态评估与方案生成流程。
          </p>
        </FadeIn>

        {/* 3-step workflow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {steps.map((s, i) => (
            <FadeIn key={i} delay={i * 120}>
              <div
                className="relative p-6 rounded-2xl"
                style={{ background: "oklch(0.10 0.018 250)", border: `1px solid ${s.color}25` }}
              >
                {i < steps.length - 1 && (
                  <div
                    className="absolute top-8 -right-3 w-6 h-px hidden md:block"
                    style={{ background: `linear-gradient(90deg, ${s.color}60, transparent)` }}
                  />
                )}
                <div
                  className="text-4xl font-black mb-4 select-none"
                  style={{ fontFamily: "'Sora', sans-serif", color: `${s.color}30`, lineHeight: 1 }}
                >
                  {s.num}
                </div>
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{ fontFamily: "'Sora', sans-serif", color: "oklch(0.90 0.005 250)" }}
                >
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "oklch(0.58 0.015 250)" }}>
                  {s.desc}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Dashboard screenshot */}
        <FadeIn>
          <div
            className="relative rounded-2xl overflow-hidden mb-16"
            style={{ border: "1px solid oklch(0.22 0.03 240 / 60%)", background: "oklch(0.09 0.02 250)" }}
          >
            <div
              className="flex items-center gap-2 px-4 py-3 border-b"
              style={{ borderColor: "oklch(0.18 0.02 250)" }}
            >
              <div className="flex gap-1.5">
                {["#EF4444", "#F59E0B", "#22C55E"].map((c) => (
                  <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />
                ))}
              </div>
              <div
                className="flex-1 mx-4 px-3 py-1 rounded text-xs text-center"
                style={{
                  background: "oklch(0.13 0.02 250)",
                  color: "oklch(0.5 0.015 250)",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                app.axonai.com/dashboard
              </div>
            </div>
            <img src={DASHBOARD_IMG} alt="AxonAI Dashboard" className="w-full h-auto" style={{ display: "block" }} />
            <div
              className="absolute bottom-0 left-0 right-0 h-24"
              style={{ background: "linear-gradient(to top, oklch(0.07 0.02 250), transparent)" }}
            />
          </div>
        </FadeIn>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {stats.map((s, i) => (
            <FadeIn key={i} delay={i * 80}>
              <div
                className="p-6 rounded-2xl text-center"
                style={{ background: "oklch(0.10 0.018 250)", border: "1px solid oklch(0.18 0.02 250 / 60%)" }}
              >
                <div
                  className="text-3xl font-bold mb-1"
                  style={{ fontFamily: "'Sora', sans-serif", color: "#00D4AA" }}
                >
                  <AnimatedCounter target={s.value} suffix={s.suffix} />
                </div>
                <p className="text-xs" style={{ color: "oklch(0.55 0.015 250)" }}>
                  {s.label}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
