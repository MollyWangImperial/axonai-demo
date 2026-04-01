/*
 * CredibilitySection — Team backgrounds and trust signals
 * Design: Bioluminescent Dark Science
 * - Team member cards with institution badges
 * - Hospital partnership logos (text-based)
 * - Research validation indicators
 */
import FadeIn from "@/components/FadeIn";

const teamMembers = [
  {
    name: "Fatima Al-ani",
    role: "Co-founder & CEO",
    bg: "Google DeepMind",
    bgShort: "DeepMind",
    expertise: "Neurorehabilitation · Computer Vision",
    color: "#00D4AA",
    initials: "FA",
  },
  {
    name: "Molly Wang",
    role: "Co-founder & CTO",
    bg: "Imperial College London",
    bgShort: "Imperial",
    expertise: "Deep Learning · Pose Estimation",
    color: "#8B5CF6",
    initials: "MW",
  },
  {
    name: "Jevon Charles",
    role: "Chief Medical Officer",
    bg: "Google DeepMind",
    bgShort: "DeepMind",
    expertise: "Software Engineering",
    color: "#00A8FF",
    initials: "JC",
  },

];

const partners = [
  { name: "King's College Hospital NHS Foundation Trust", type: "Clinical Partner", status: "In Discussion" },
  { name: "Imperial College Healthcare NHS Trust", type: "Pilot Validation", status: "In Discussion" },
  { name: "University College London Hospitals", type: "Data Partnership", status: "In Discussion" },
  { name: "Oxford University Hospitals NHS Trust", type: "Research Collaboration", status: "In Discussion" },
];

const institutions = [
  "Imperial College London",
  "Google DeepMind",
  "Boston University",
  "Tsinghua University",
  "MIT",
];

export default function CredibilitySection() {
  return (
    <section
      id="credibility"
      className="relative py-28 overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, oklch(0.07 0.02 250) 0%, oklch(0.09 0.025 255) 100%)",
      }}
    >
      {/* Top gradient separator */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.4), transparent)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <FadeIn className="mb-16 text-center">
          <p className="section-label mb-4">CREDIBILITY</p>
          <h2
            className="text-4xl sm:text-5xl font-bold mb-5"
            style={{
              fontFamily: "'Sora', sans-serif",
              color: "oklch(0.93 0.005 250)",
            }}
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
          <p
            className="text-lg max-w-2xl mx-auto"
            style={{ color: "oklch(0.6 0.015 250)" }}
          >
            Our team brings together expertise from Imperial College, Google DeepMind, and Boston University,
            deeply integrating clinical medicine with cutting-edge AI technology.
          </p>
        </FadeIn>



        {/* Team cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-20">
          {teamMembers.map((member, i) => (
            <FadeIn key={i} delay={i * 100}>
              <div
                className="group p-6 rounded-2xl transition-all duration-300"
                style={{
                  background: "oklch(0.10 0.018 250)",
                  border: "1px solid oklch(0.18 0.02 250 / 60%)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.border = `1px solid ${member.color}35`;
                  e.currentTarget.style.background = "oklch(0.12 0.02 250)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.border = "1px solid oklch(0.18 0.02 250 / 60%)";
                  e.currentTarget.style.background = "oklch(0.10 0.018 250)";
                }}
              >
                {/* Avatar */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold mb-4"
                  style={{
                    background: `${member.color}18`,
                    border: `1px solid ${member.color}35`,
                    color: member.color,
                    fontFamily: "'Sora', sans-serif",
                  }}
                >
                  {member.initials}
                </div>

                <h3
                  className="text-base font-semibold mb-1"
                  style={{
                    fontFamily: "'Sora', sans-serif",
                    color: "oklch(0.90 0.005 250)",
                  }}
                >
                  {member.name}
                </h3>
                <p
                  className="text-xs mb-3"
                  style={{ color: "oklch(0.55 0.015 250)" }}
                >
                  {member.role}
                </p>

                {/* Institution badge */}
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs mb-3"
                  style={{
                    background: `${member.color}12`,
                    border: `1px solid ${member.color}25`,
                    color: member.color,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  <span className="w-1 h-1 rounded-full" style={{ background: member.color }} />
                  {member.bgShort}
                </div>

                <p
                  className="text-xs"
                  style={{ color: "oklch(0.52 0.015 250)" }}
                >
                  {member.expertise}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Hospital partnerships */}
        <FadeIn>
          <div className="mb-6">
            <p className="section-label mb-6 text-center">NHS PARTNERSHIPS</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {partners.map((partner, i) => (
              <div
                key={i}
                className="p-5 rounded-xl"
                style={{
                  background: "oklch(0.10 0.018 250)",
                  border: "1px solid oklch(0.18 0.02 250 / 60%)",
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: "rgba(0, 212, 170, 0.1)",
                      border: "1px solid rgba(0, 212, 170, 0.25)",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background:
                        partner.status === "Active"
                          ? "rgba(0, 212, 170, 0.12)"
                          : "rgba(245, 158, 11, 0.12)",
                      color:
                        partner.status === "Active" ? "#00D4AA" : "#F59E0B",
                      border: `1px solid ${partner.status === "Active" ? "rgba(0, 212, 170, 0.25)" : "rgba(245, 158, 11, 0.25)"}`,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.65rem",
                    }}
                  >
                    {partner.status}
                  </span>
                </div>
                <h4
                  className="text-sm font-semibold mb-1"
                  style={{
                    fontFamily: "'Sora', sans-serif",
                    color: "oklch(0.85 0.005 250)",
                  }}
                >
                  {partner.name}
                </h4>
                <p
                  className="text-xs"
                  style={{ color: "oklch(0.52 0.015 250)" }}
                >
                  {partner.type}
                </p>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
