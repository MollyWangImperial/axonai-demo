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
    title: "Subjective Assessments Lack Consistency",
    description:
      "Traditional rehabilitation evaluations rely heavily on clinician experience and subjective judgment. Results vary significantly between assessors, making it impossible to establish reproducible, traceable objective baselines.",
    accent: "#F59E0B",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Manual Assessments Are Time-Consuming",
    description:
      "Manual gait analysis and functional assessments take 30–60 minutes per patient. With high patient volumes, therapists cannot provide deep, individualised evaluations for everyone on their caseload.",
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
    title: "Poor Patient Adherence Stalls Recovery",
    description:
      "Without continuous quantified feedback and motivation outside the clinic, patients frequently abandon their rehabilitation programmes — halting recovery progress and worsening long-term outcomes.",
    accent: "#8B5CF6",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Data Silos Prevent Progress Tracking",
    description:
      "Rehabilitation data is scattered across paper records and disconnected systems. Clinicians and administrators cannot form continuous patient profiles or objectively evaluate treatment efficacy and departmental performance.",
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
              <p className="section-label mb-3">PROBLEM</p>
              <h2
                className="text-4xl sm:text-5xl font-bold mb-4"
                style={{ fontFamily: "'Sora', sans-serif", color: "oklch(0.93 0.005 250)" }}
              >
                Four Critical Barriers
                <br />
                <span
                  style={{
                    background: "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  in Stroke Rehabilitation
                </span>
              </h2>
              <p className="text-lg max-w-xl" style={{ color: "oklch(0.6 0.015 250)" }}>
                Over 100,000 people have a stroke in the UK each year. Demand for
                rehabilitation is immense — yet the limitations of current assessment
                systems severely constrain the quality of care delivered.
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
