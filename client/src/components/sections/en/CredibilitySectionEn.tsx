/*
 * CredibilitySectionEn — English team and trust signals section
 * Design: Bioluminescent Dark Science
 */
import FadeIn from "@/components/FadeIn";

const teamMembers = [
  {
    name: "Dr. Wei Zhang",
    role: "Co-founder & CEO",
    bg: "Imperial College London",
    bgShort: "ICL",
    expertise: "Neurorehabilitation · Computer Vision",
    color: "#00D4AA",
    initials: "WZ",
  },
  {
    name: "Dr. Yun Liu",
    role: "Co-founder & CTO",
    bg: "Google DeepMind",
    bgShort: "DeepMind",
    expertise: "Deep Learning · Pose Estimation",
    color: "#8B5CF6",
    initials: "YL",
  },
  {
    name: "Dr. Sarah Chen",
    role: "Chief Medical Officer",
    bg: "Boston University",
    bgShort: "BU",
    expertise: "Stroke Rehabilitation · Clinical Research",
    color: "#00A8FF",
    initials: "SC",
  },
  {
    name: "Dr. Hao Wang",
    role: "Head of Algorithms",
    bg: "Tsinghua University · MIT",
    bgShort: "THU/MIT",
    expertise: "Medical Image Analysis · AI",
    color: "#F59E0B",
    initials: "HW",
  },
];

const partners = [
  { name: "Peking Union Medical College Hospital", type: "Clinical Partner", status: "Active" },
  { name: "Ruijin Hospital, Shanghai", type: "Pilot Validation", status: "Active" },
  { name: "Sun Yat-sen University Hospital", type: "Data Partnership", status: "In Discussion" },
  { name: "Peking University Third Hospital", type: "Research Collaboration", status: "In Discussion" },
];

const institutions = [
  "Imperial College London",
  "Google DeepMind",
  "Boston University",
  "Tsinghua University",
  "MIT",
];

export default function CredibilitySectionEn() {
  return (
    <section
      id="team-en"
      className="relative py-28 overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, oklch(0.08 0.022 248) 0%, oklch(0.07 0.02 250) 100%)",
      }}
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <FadeIn className="mb-16 text-center">
          <p className="section-label mb-4">CREDIBILITY</p>
          <h2
            className="text-4xl sm:text-5xl font-bold mb-5"
            style={{ fontFamily: "'Sora', sans-serif", color: "oklch(0.93 0.005 250)" }}
          >
            World-Class Team,
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #00D4AA 0%, #8B5CF6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Clinical-Grade Validation
            </span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "oklch(0.6 0.015 250)" }}>
            Our team brings together expertise from leading global research institutions,
            with clinical validation partnerships at top-tier hospitals.
          </p>
        </FadeIn>

        {/* Institution strip */}
        <FadeIn className="mb-16">
          <div
            className="flex flex-wrap items-center justify-center gap-4 p-5 rounded-2xl"
            style={{
              background: "oklch(0.10 0.018 250)",
              border: "1px solid oklch(0.18 0.02 250 / 50%)",
            }}
          >
            <span className="text-xs mr-2" style={{ color: "oklch(0.45 0.015 250)" }}>
              TEAM BACKGROUNDS
            </span>
            {institutions.map((inst, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  background: "oklch(0.14 0.02 250)",
                  color: "oklch(0.72 0.015 250)",
                  border: "1px solid oklch(0.22 0.02 250 / 50%)",
                }}
              >
                {inst}
              </span>
            ))}
          </div>
        </FadeIn>

        {/* Team cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {teamMembers.map((m, i) => (
            <FadeIn key={i} delay={i * 100} direction="up">
              <div
                className="p-6 rounded-2xl"
                style={{
                  background: "oklch(0.10 0.018 250)",
                  border: `1px solid ${m.color}20`,
                }}
              >
                {/* Avatar */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold mb-4"
                  style={{
                    background: `${m.color}15`,
                    color: m.color,
                    border: `1px solid ${m.color}30`,
                    fontFamily: "'Sora', sans-serif",
                  }}
                >
                  {m.initials}
                </div>

                <div
                  className="inline-block px-2 py-0.5 rounded text-xs font-medium mb-3"
                  style={{
                    background: `${m.color}15`,
                    color: m.color,
                    border: `1px solid ${m.color}30`,
                  }}
                >
                  {m.bgShort}
                </div>

                <h3
                  className="text-base font-semibold mb-1"
                  style={{ fontFamily: "'Sora', sans-serif", color: "oklch(0.90 0.005 250)" }}
                >
                  {m.name}
                </h3>
                <p className="text-xs mb-3" style={{ color: m.color }}>
                  {m.role}
                </p>
                <p className="text-xs" style={{ color: "oklch(0.52 0.015 250)" }}>
                  {m.bg}
                </p>
                <p className="text-xs mt-1" style={{ color: "oklch(0.48 0.015 250)" }}>
                  {m.expertise}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Hospital partnerships */}
        <FadeIn>
          <div
            className="p-8 rounded-2xl"
            style={{
              background: "oklch(0.10 0.018 250)",
              border: "1px solid oklch(0.18 0.02 250 / 50%)",
            }}
          >
            <p className="section-label mb-6">HOSPITAL PARTNERSHIPS</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {partners.map((p, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl"
                  style={{
                    background: "oklch(0.13 0.02 250)",
                    border: "1px solid oklch(0.20 0.02 250 / 40%)",
                  }}
                >
                  <p
                    className="text-sm font-medium mb-2"
                    style={{ color: "oklch(0.82 0.005 250)" }}
                  >
                    {p.name}
                  </p>
                  <p className="text-xs mb-2" style={{ color: "oklch(0.52 0.015 250)" }}>
                    {p.type}
                  </p>
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-xs"
                    style={{
                      background: p.status === "Active" ? "rgba(0, 212, 170, 0.15)" : "rgba(139, 92, 246, 0.15)",
                      color: p.status === "Active" ? "#00D4AA" : "#8B5CF6",
                      border: `1px solid ${p.status === "Active" ? "rgba(0, 212, 170, 0.3)" : "rgba(139, 92, 246, 0.3)"}`,
                    }}
                  >
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
