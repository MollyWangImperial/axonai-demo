/*
 * SocialProofSection — Testimonials and key workflow highlight
 * Design: Bioluminescent Dark Science
 * - Quotes from clinicians
 * - Workflow highlight bar
 */
import FadeIn from "@/components/FadeIn";

const testimonials = [
  {
    quote:
      "AxonAI 将我们的步态评估时间从 45 分钟缩短到 5 分钟以内。报告的客观性显著提升，治疗师的工作负担也明显减轻。",
    author: "某三甲医院康复科主任",
    role: "神经康复 · 主治医师",
    color: "#00D4AA",
  },
  {
    quote:
      "系统生成的个性化方案与我们的临床经验高度吸合，实时跟踪患者进展的能力对提升依从性至关重要。",
    author: "资深康复治疗师",
    role: "康复治疗师 ·  10 年临床经验",
    color: "#8B5CF6",
  },
  {
    quote:
      "作为科室管理者，AxonAI 让我首次能够用数据评估治疗效果，为资源配置和绩效考核提供了客观依据。",
    author: "康复中心主任",
    role: "医疗机构管理者",
    color: "#00A8FF",
  },
];

export default function SocialProofSection() {
  return (
    <section
      className="relative py-24 overflow-hidden"
      style={{ background: "oklch(0.08 0.022 248)" }}
    >
      {/* Background accent */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, rgba(0, 212, 170, 0.04) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(139, 92, 246, 0.04) 0%, transparent 50%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-14">
          <p className="section-label mb-4">用户反馈</p>
          <h2
            className="text-3xl sm:text-4xl font-bold"
            style={{
              fontFamily: "'Noto Sans SC', 'Sora', sans-serif",
              color: "oklch(0.93 0.005 250)",
            }}
          >
            来自临床一线的声音
          </h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <FadeIn key={i} delay={i * 120}>
              <div
                className="p-7 rounded-2xl h-full flex flex-col"
                style={{
                  background: "oklch(0.10 0.018 250)",
                  border: `1px solid ${t.color}20`,
                }}
              >
                {/* Quote mark */}
                <div
                  className="text-5xl font-black leading-none mb-4 select-none"
                  style={{
                    color: `${t.color}30`,
                    fontFamily: "'Sora', sans-serif",
                  }}
                >
                  "
                </div>

                <p
                  className="text-sm leading-relaxed flex-1 mb-6"
                  style={{ color: "oklch(0.68 0.015 250)" }}
                >
                  {t.quote}
                </p>

                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                      background: `${t.color}15`,
                      border: `1px solid ${t.color}25`,
                      color: t.color,
                      fontFamily: "'Sora', sans-serif",
                    }}
                  >
                    {t.author.charAt(0)}
                  </div>
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{
                        fontFamily: "'Sora', sans-serif",
                        color: "oklch(0.85 0.005 250)",
                      }}
                    >
                      {t.author}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "oklch(0.5 0.015 250)" }}
                    >
                      {t.role}
                    </p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
