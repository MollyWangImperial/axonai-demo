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
          <p className="section-label mb-4">开始使用</p>
          <h2
            className="text-4xl sm:text-5xl font-bold mb-5"
            style={{
              fontFamily: "'Noto Sans SC', 'Sora', sans-serif",
              color: "oklch(0.93 0.005 250)",
            }}
          >
            加入 AxonAI
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #00D4AA 0%, #8B5CF6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              试点合作计划
            </span>
          </h2>
          <p
            className="text-lg max-w-xl mx-auto"
            style={{ color: "oklch(0.6 0.015 250)", fontFamily: "'Noto Sans SC', sans-serif" }}
          >
            我们正在与精选的医院康复科室开展临床试点合作。立即申请，率先体验并参与产品共建。
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Benefits list */}
          <FadeIn direction="left" className="lg:col-span-2">
            <div className="space-y-5">
              {[
                {
                  icon: "◈",
                  title: "免费试点期",
                  desc: "试点阶段内全功能免费开放，无任何隐性费用。",
                  color: "#00D4AA",
                },
                {
                  icon: "◉",
                  title: "专属实施支持",
                  desc: "临床团队提供现场或远程入驻培训服务。",
                  color: "#8B5CF6",
                },
                {
                  icon: "◎",
                  title: "共同开发机会",
                  desc: "试点合作方可直接影响产品路线图和功能优先级。",
                  color: "#00A8FF",
                },
                {
                  icon: "◆",
                  title: "科研合作",
                  desc: "与学术团队共同发表研究成果的机会。",
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
                    申请已收到
                  </h3>
                  <p
                    className="text-sm"
                    style={{ color: "oklch(0.6 0.015 250)" }}
                  >
                    感谢您的兴趣！我们的团队将在 2 个工作日内与您联系。
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Type selector */}
                  <div className="flex gap-3 mb-6">
                    {[
                      { value: "pilot", label: "申请试点" },
                      { value: "demo", label: "预约演示" },
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
                        姓名 *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, name: e.target.value }))
                        }
                        placeholder="张医生"
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
                        职务 / 职称 *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.role}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, role: e.target.value }))
                        }
                        placeholder="康复科主任"
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
                      医院 / 机构 *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.hospital}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, hospital: e.target.value }))
                      }
                      placeholder="北京协和医院"
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
                        工作邮筱 *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, email: e.target.value }))
                        }
                        placeholder="zhangyi@hospital.com"
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
                        手机号码（可选）
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, phone: e.target.value }))
                        }
                        placeholder="+86 138 0000 0000"
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
                    {formData.type === "pilot" ? "提交申请" : "预约演示"}
                  </button>

                  <p
                    className="text-xs text-center"
                    style={{ color: "oklch(0.45 0.015 250)" }}
                  >
                    您的信息将严格保密，不会共享给任何第三方。
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
