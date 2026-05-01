/*
 * ProblemSection — Pain points of current rehabilitation assessment
 * Design: Bioluminescent Dark Science
 * Audience: UK rehabilitation clinicians and healthcare managers
 */
import FadeIn from "@/components/FadeIn";

const problems = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "主观评估缺乏一致性",
    description:
      "传统康复评估主要依赖临床经验和主观判断，不同评估者之间结果差异显著，无法建立可重复、可追源的客观基准。",
    accent: "#F59E0B",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "手动评估耗时耗力",
    description:
      "手动步态分析和功能评估每位患者需要 30～60 分钟。面对大量患者，治疗师无法为每个患者提供深入、个性化的评估。",
    accent: "#EF4444",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "患者依从性差，康复进展滑坡",
    description:
      "缺乏持续的量化反馈和激励，患者在院外频繁放弃康复训练，导致康复进展停滞，长期预后恶化。",
    accent: "#8B5CF6",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "数据孤岛，进展难以追踪",
    description:
      "康复数据分散在纸质记录和各孤立系统中，临床医生和管理者无法构建连续的患者档案，也无法客观评估治疗效果和科室绩效。",
    accent: "#3B82F6",
  },
];

export default function ProblemSection() {
  return (
    <section
      id="problem"
      className="relative py-28 overflow-hidden"
      style={{ background: "oklch(0.07 0.02 250)" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.15 0.02 250 / 20%) 1px, transparent 1px), linear-gradient(90deg, oklch(0.15 0.02 250 / 20%) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn className="mb-16">
          <div className="flex items-start gap-6">
            <span
              className="text-8xl font-black leading-none select-none hidden lg:block"
              style={{ fontFamily: "'Sora', sans-serif", color: "oklch(0.15 0.02 250)", lineHeight: 1 }}
            >
              01
            </span>
            <div>
              <p className="section-label mb-3">痛点分析</p>
              <h2
                className="text-4xl sm:text-5xl font-bold mb-4"
                style={{ fontFamily: "'Noto Sans SC', 'Sora', sans-serif", color: "oklch(0.93 0.005 250)" }}
              >
                康复评估面临的
                <br />
                <span
                  style={{
                    background: "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  四大核心痛点
                </span>
              </h2>
              <p className="text-lg max-w-xl" style={{ color: "oklch(0.6 0.015 250)", fontFamily: "'Noto Sans SC', sans-serif" }}>
                我国每年新发中风患者超过 200 万人，康复需求巨大——
                然而现有评估体系的局限性严重制约了康复服务的质量。
              </p>
            </div>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {problems.map((p, i) => (
            <FadeIn key={i} delay={i * 120} direction="up">
              <div
                className="group relative p-7 rounded-2xl transition-all duration-300"
                style={{
                  background: "oklch(0.10 0.018 250)",
                  border: "1px solid oklch(0.18 0.02 250 / 60%)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.border = `1px solid ${p.accent}40`;
                  e.currentTarget.style.background = "oklch(0.12 0.02 250)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.border = "1px solid oklch(0.18 0.02 250 / 60%)";
                  e.currentTarget.style.background = "oklch(0.10 0.018 250)";
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: `${p.accent}15`, color: p.accent, border: `1px solid ${p.accent}30` }}
                >
                  {p.icon}
                </div>
                <h3
                  className="text-xl font-semibold mb-3"
                  style={{ fontFamily: "'Sora', sans-serif", color: "oklch(0.90 0.005 250)" }}
                >
                  {p.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "oklch(0.58 0.015 250)" }}>
                  {p.description}
                </p>
                <div
                  className="absolute top-0 right-0 w-16 h-16 rounded-tr-2xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `radial-gradient(circle at top right, ${p.accent}20, transparent 70%)` }}
                />
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
