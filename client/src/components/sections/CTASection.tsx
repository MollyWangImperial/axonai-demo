/*
 * CTASection — Final conversion section
 * Design: Bioluminescent Dark Science
 * - Dark panel with teal gradient glow
 * - Two CTA forms: pilot partnership + demo request
 * - Contact form with glassmorphism styling
 */
import FadeIn from "@/components/FadeIn";
import { useState } from "react";

export default function CTASection() {
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
      id="cta"
      className="relative py-28 overflow-hidden"
      style={{ background: "oklch(0.07 0.02 250)" }}
    >
      {/* Top gradient separator */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(0, 212, 170, 0.5), transparent)",
        }}
      />

      {/* Background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, rgba(0, 212, 170, 0.07) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <FadeIn className="text-center mb-14">
          <p className="section-label mb-4">GET STARTED</p>
          <h2
            className="text-4xl sm:text-5xl font-bold mb-5"
            style={{
              fontFamily: "'Sora', sans-serif",
              color: "oklch(0.93 0.005 250)",
            }}
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
          <p
            className="text-lg max-w-xl mx-auto"
            style={{ color: "oklch(0.6 0.015 250)" }}
          >
            We are currently partnering with a select group of NHS rehabilitation departments
            for our clinical pilot. Apply now to get early access and shape the product
            alongside our team.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Benefits list */}
          <FadeIn direction="left" className="lg:col-span-2">
            <div className="space-y-5">
              {[
                {
                  icon: "◈",
                  title: "Free Pilot Period",
                  desc: "Full access to all features at no cost during the pilot phase.",
                  color: "#00D4AA",
                },
                {
                  icon: "◉",
                  title: "Dedicated Implementation Support",
                  desc: "Our clinical team provides on-site or remote onboarding and training.",
                  color: "#8B5CF6",
                },
                {
                  icon: "◎",
                  title: "Co-development Opportunity",
                  desc: "Pilot partners directly influence product roadmap and feature priorities.",
                  color: "#00A8FF",
                },
                {
                  icon: "◆",
                  title: "Research Collaboration",
                  desc: "Joint publication opportunities with our academic research team.",
                  color: "#F59E0B",
                },
              ].map((benefit, i) => (
                <div key={i} className="flex gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                    style={{
                      background: `${benefit.color}12`,
                      border: `1px solid ${benefit.color}25`,
                      color: benefit.color,
                    }}
                  >
                    {benefit.icon}
                  </div>
                  <div>
                    <h4
                      className="text-sm font-semibold mb-1"
                      style={{
                        fontFamily: "'Sora', sans-serif",
                        color: "oklch(0.88 0.005 250)",
                      }}
                    >
                      {benefit.title}
                    </h4>
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: "oklch(0.55 0.015 250)" }}
                    >
                      {benefit.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>

          {/* Contact form */}
          <FadeIn direction="right" delay={150} className="lg:col-span-3">
            <div
              className="p-8 rounded-2xl"
              style={{
                background: "oklch(0.10 0.018 250)",
                border: "1px solid oklch(0.22 0.025 250 / 60%)",
              }}
            >
              {submitted ? (
                <div className="text-center py-12">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                    style={{
                      background: "rgba(0, 212, 170, 0.15)",
                      border: "1px solid rgba(0, 212, 170, 0.4)",
                    }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3
                    className="text-xl font-bold mb-3"
                    style={{
                      fontFamily: "'Sora', sans-serif",
                      color: "#00D4AA",
                    }}
                  >
                    Application Received
                  </h3>
                  <p
                    className="text-sm"
                    style={{ color: "oklch(0.6 0.015 250)" }}
                  >
                    Thank you for your interest. Our team will be in touch within 2 business days.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Type selector */}
                  <div className="flex gap-3 mb-6">
                    {[
                      { value: "pilot", label: "Apply for Pilot" },
                      { value: "demo", label: "Book a Demo" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, type: opt.value }))
                        }
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                        style={{
                          fontFamily: "'Sora', sans-serif",
                          background:
                            formData.type === opt.value
                              ? "linear-gradient(135deg, #00D4AA 0%, #00A8FF 100%)"
                              : "oklch(0.14 0.018 250)",
                          color:
                            formData.type === opt.value
                              ? "oklch(0.07 0.02 250)"
                              : "oklch(0.6 0.015 250)",
                          border:
                            formData.type === opt.value
                              ? "none"
                              : "1px solid oklch(0.22 0.02 250 / 50%)",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        className="block text-xs font-medium mb-1.5"
                        style={{ color: "oklch(0.6 0.015 250)" }}
                      >
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, name: e.target.value }))
                        }
                        placeholder="Dr. Jane Smith"
                        className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
                        style={{
                          background: "oklch(0.13 0.018 250)",
                          border: "1px solid oklch(0.22 0.02 250 / 60%)",
                          color: "oklch(0.88 0.005 250)",
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.border = "1px solid rgba(0, 212, 170, 0.5)")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.border = "1px solid oklch(0.22 0.02 250 / 60%)")
                        }
                      />
                    </div>
                    <div>
                      <label
                        className="block text-xs font-medium mb-1.5"
                        style={{ color: "oklch(0.6 0.015 250)" }}
                      >
                        Role / Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.role}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, role: e.target.value }))
                        }
                        placeholder="Head of Rehabilitation"
                        className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
                        style={{
                          background: "oklch(0.13 0.018 250)",
                          border: "1px solid oklch(0.22 0.02 250 / 60%)",
                          color: "oklch(0.88 0.005 250)",
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.border = "1px solid rgba(0, 212, 170, 0.5)")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.border = "1px solid oklch(0.22 0.02 250 / 60%)")
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: "oklch(0.6 0.015 250)" }}
                    >
                      Hospital / NHS Trust *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.hospital}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, hospital: e.target.value }))
                      }
                      placeholder="King's College Hospital NHS Trust"
                      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
                      style={{
                        background: "oklch(0.13 0.018 250)",
                        border: "1px solid oklch(0.22 0.02 250 / 60%)",
                        color: "oklch(0.88 0.005 250)",
                      }}
                      onFocus={(e) =>
                        (e.currentTarget.style.border = "1px solid rgba(0, 212, 170, 0.5)")
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.border = "1px solid oklch(0.22 0.02 250 / 60%)")
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        className="block text-xs font-medium mb-1.5"
                        style={{ color: "oklch(0.6 0.015 250)" }}
                      >
                        Work Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, email: e.target.value }))
                        }
                        placeholder="j.smith@nhs.net"
                        className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
                        style={{
                          background: "oklch(0.13 0.018 250)",
                          border: "1px solid oklch(0.22 0.02 250 / 60%)",
                          color: "oklch(0.88 0.005 250)",
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.border = "1px solid rgba(0, 212, 170, 0.5)")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.border = "1px solid oklch(0.22 0.02 250 / 60%)")
                        }
                      />
                    </div>
                    <div>
                      <label
                        className="block text-xs font-medium mb-1.5"
                        style={{ color: "oklch(0.6 0.015 250)" }}
                      >
                        Phone (optional)
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, phone: e.target.value }))
                        }
                        placeholder="+44 20 1234 5678"
                        className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
                        style={{
                          background: "oklch(0.13 0.018 250)",
                          border: "1px solid oklch(0.22 0.02 250 / 60%)",
                          color: "oklch(0.88 0.005 250)",
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.border = "1px solid rgba(0, 212, 170, 0.5)")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.border = "1px solid oklch(0.22 0.02 250 / 60%)")
                        }
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl text-base font-semibold btn-primary-teal mt-2"
                  >
                    {formData.type === "pilot" ? "Submit Application" : "Request Demo"}
                  </button>

                  <p
                    className="text-xs text-center"
                    style={{ color: "oklch(0.45 0.015 250)" }}
                  >
                    Your information is kept strictly confidential and will not be shared with third parties.
                  </p>
                </form>
              )}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
