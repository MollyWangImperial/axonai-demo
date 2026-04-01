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
          <p className="section-label mb-4">GET STARTED · 开始合作</p>
          <h2
            className="text-4xl sm:text-5xl font-bold mb-5"
            style={{
              fontFamily: "'Sora', sans-serif",
              color: "oklch(0.93 0.005 250)",
            }}
          >
            申请试点合作，
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #00D4AA 0%, #00A8FF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              共同推动康复医疗升级
            </span>
          </h2>
          <p
            className="text-lg max-w-xl mx-auto"
            style={{ color: "oklch(0.6 0.015 250)" }}
          >
            我们正在寻找有前瞻性的医院康复科与医疗机构，共同验证并完善 AxonAI 系统。
            首批试点合作机构将享受免费使用权与优先定制服务。
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Benefits list */}
          <FadeIn direction="left" className="lg:col-span-2">
            <div className="space-y-5">
              {[
                {
                  icon: "✦",
                  title: "免费试点期",
                  desc: "首批合作机构享受 6 个月免费使用权",
                  color: "#00D4AA",
                },
                {
                  icon: "◈",
                  title: "专属技术支持",
                  desc: "核心团队驻场培训与 7×24 技术响应",
                  color: "#8B5CF6",
                },
                {
                  icon: "◉",
                  title: "联合研究发表",
                  desc: "支持合作医院开展临床研究并联名发表",
                  color: "#00A8FF",
                },
                {
                  icon: "◆",
                  title: "定制化开发",
                  desc: "根据科室需求定制评估指标与报告模板",
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
                      color: "oklch(0.93 0.005 250)",
                    }}
                  >
                    申请已提交！
                  </h3>
                  <p
                    className="text-sm"
                    style={{ color: "oklch(0.6 0.015 250)" }}
                  >
                    我们的团队将在 24 小时内与您联系，安排产品演示与合作洽谈。
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Type selector */}
                  <div className="flex gap-3 mb-6">
                    {[
                      { value: "pilot", label: "申请试点合作" },
                      { value: "demo", label: "获取产品演示" },
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
                        placeholder="您的姓名"
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
                        职位 *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.role}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, role: e.target.value }))
                        }
                        placeholder="科主任 / 治疗师 / 管理者"
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
                      医院 / 机构名称 *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.hospital}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, hospital: e.target.value }))
                      }
                      placeholder="请输入您所在的医院或机构名称"
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
                        邮箱 *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, email: e.target.value }))
                        }
                        placeholder="your@hospital.com"
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
                        联系电话
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, phone: e.target.value }))
                        }
                        placeholder="138 xxxx xxxx"
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
                    {formData.type === "pilot" ? "提交试点申请 →" : "预约产品演示 →"}
                  </button>

                  <p
                    className="text-xs text-center"
                    style={{ color: "oklch(0.45 0.015 250)" }}
                  >
                    提交即表示您同意我们的隐私政策。我们承诺不会将您的信息用于任何商业目的。
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
