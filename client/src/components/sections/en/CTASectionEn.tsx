/*
 * CTASectionEn — English final conversion section
 * Design: Bioluminescent Dark Science
 */
import FadeIn from "@/components/FadeIn";
import { useState } from "react";

export default function CTASectionEn() {
  const [formData, setFormData] = useState({
    name: "",
    hospital: "",
    role: "",
    email: "",
    phone: "",
    type: "pilot",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section
      id="cta-en"
      className="relative py-28 overflow-hidden"
      style={{ background: "oklch(0.07 0.02 250)" }}
    >
      {/* Top gradient separator */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(0, 212, 170, 0.5), transparent)" }}
      />
      {/* Background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(0, 212, 170, 0.07) 0%, transparent 70%)" }}
      />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <FadeIn className="text-center mb-14">
          <p className="section-label mb-4">GET STARTED</p>
          <h2
            className="text-4xl sm:text-5xl font-bold mb-5"
            style={{ fontFamily: "'Sora', sans-serif", color: "oklch(0.93 0.005 250)" }}
          >
            Join the AxonAI
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #00D4AA 0%, #8B5CF6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Pilot Programme
            </span>
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "oklch(0.6 0.015 250)" }}>
            We are currently partnering with a select group of rehabilitation departments
            for our clinical pilot. Apply now to get early access and shape the product
            alongside our team.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Benefits */}
          <FadeIn direction="left">
            <div className="space-y-5">
              {[
                {
                  title: "Free Pilot Period",
                  desc: "Full access to all features at no cost during the pilot phase.",
                  color: "#00D4AA",
                  icon: "◈",
                },
                {
                  title: "Dedicated Implementation Support",
                  desc: "Our clinical team provides on-site or remote onboarding and training.",
                  color: "#8B5CF6",
                  icon: "◉",
                },
                {
                  title: "Co-development Opportunity",
                  desc: "Pilot partners directly influence product roadmap and feature priorities.",
                  color: "#00A8FF",
                  icon: "◎",
                },
                {
                  title: "Research Collaboration",
                  desc: "Joint publication opportunities with our academic research team.",
                  color: "#F59E0B",
                  icon: "◆",
                },
              ].map((b, i) => (
                <div
                  key={i}
                  className="flex gap-4 p-5 rounded-xl"
                  style={{
                    background: "oklch(0.10 0.018 250)",
                    border: `1px solid ${b.color}20`,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-lg"
                    style={{ background: `${b.color}15`, color: b.color }}
                  >
                    {b.icon}
                  </div>
                  <div>
                    <h4
                      className="text-sm font-semibold mb-1"
                      style={{ color: "oklch(0.88 0.005 250)" }}
                    >
                      {b.title}
                    </h4>
                    <p className="text-xs leading-relaxed" style={{ color: "oklch(0.55 0.015 250)" }}>
                      {b.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>

          {/* Form */}
          <FadeIn direction="right" delay={150}>
            <div
              className="p-8 rounded-2xl"
              style={{
                background: "oklch(0.10 0.018 250)",
                border: "1px solid oklch(0.20 0.025 240 / 60%)",
              }}
            >
              {submitted ? (
                <div className="text-center py-8">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl"
                    style={{ background: "rgba(0, 212, 170, 0.15)", border: "1px solid rgba(0, 212, 170, 0.4)" }}
                  >
                    ✓
                  </div>
                  <h3
                    className="text-xl font-bold mb-3"
                    style={{ fontFamily: "'Sora', sans-serif", color: "#00D4AA" }}
                  >
                    Application Received
                  </h3>
                  <p className="text-sm" style={{ color: "oklch(0.6 0.015 250)" }}>
                    Thank you for your interest. Our team will be in touch within 2 business days.
                  </p>
                </div>
              ) : (
                <>
                  {/* Type selector */}
                  <div className="flex gap-2 mb-6">
                    {[
                      { value: "pilot", label: "Apply for Pilot" },
                      { value: "demo", label: "Book a Demo" },
                    ].map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setFormData({ ...formData, type: t.value })}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                        style={
                          formData.type === t.value
                            ? {
                                background: "rgba(0, 212, 170, 0.15)",
                                border: "1px solid rgba(0, 212, 170, 0.5)",
                                color: "#00D4AA",
                              }
                            : {
                                background: "oklch(0.13 0.02 250)",
                                border: "1px solid oklch(0.20 0.02 250 / 50%)",
                                color: "oklch(0.55 0.015 250)",
                              }
                        }
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {[
                      { key: "name", label: "Full Name", placeholder: "Dr. Jane Smith", type: "text" },
                      { key: "hospital", label: "Hospital / Institution", placeholder: "St. Mary's Hospital", type: "text" },
                      { key: "role", label: "Role / Title", placeholder: "Head of Rehabilitation", type: "text" },
                      { key: "email", label: "Work Email", placeholder: "j.smith@hospital.org", type: "email" },
                      { key: "phone", label: "Phone (optional)", placeholder: "+44 20 1234 5678", type: "tel" },
                    ].map((field) => (
                      <div key={field.key}>
                        <label
                          className="block text-xs font-medium mb-1.5"
                          style={{ color: "oklch(0.65 0.015 250)" }}
                        >
                          {field.label}
                        </label>
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          value={formData[field.key as keyof typeof formData]}
                          onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                          style={{
                            background: "oklch(0.13 0.02 250)",
                            border: "1px solid oklch(0.22 0.02 250 / 50%)",
                            color: "oklch(0.88 0.005 250)",
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.border = "1px solid rgba(0, 212, 170, 0.5)";
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.border = "1px solid oklch(0.22 0.02 250 / 50%)";
                          }}
                        />
                      </div>
                    ))}

                    <button
                      type="submit"
                      className="w-full py-4 rounded-xl text-base font-semibold btn-primary-teal mt-2"
                    >
                      {formData.type === "pilot" ? "Submit Application" : "Request Demo"}
                    </button>

                    <p className="text-xs text-center" style={{ color: "oklch(0.42 0.015 250)" }}>
                      Your information is kept strictly confidential and will not be shared with third parties.
                    </p>
                  </form>
                </>
              )}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
