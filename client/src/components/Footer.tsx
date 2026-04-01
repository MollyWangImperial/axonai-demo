/*
 * Footer — Minimal dark footer
 * Design: Bioluminescent Dark Science
 */
export default function Footer() {
  return (
    <footer
      className="relative py-12 overflow-hidden"
      style={{
        background: "oklch(0.06 0.018 250)",
        borderTop: "1px solid oklch(0.15 0.02 250 / 60%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #00D4AA 0%, #00A8FF 100%)",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
                    fill="oklch(0.07 0.02 250)"
                  />
                </svg>
              </div>
              <span
                className="text-lg font-bold"
                style={{
                  fontFamily: "'Sora', sans-serif",
                  background: "linear-gradient(135deg, #00D4AA 0%, #00A8FF 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                AxonAI
              </span>
            </div>
            <p
              className="text-sm leading-relaxed max-w-xs"
              style={{ color: "oklch(0.5 0.015 250)" }}
            >
              基于计算机视觉的中风康复评估与个性化康复方案生成系统。
              让每一步康复都精准可量化。
            </p>
            <p
              className="text-xs mt-4"
              style={{
                color: "oklch(0.38 0.015 250)",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              contact@axonai.cn
            </p>
          </div>

          {/* Product */}
          <div>
            <h4
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{
                color: "oklch(0.5 0.015 250)",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              产品
            </h4>
            <ul className="space-y-2.5">
              {["步态分析", "康复方案生成", "进展追踪", "数据报告"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-sm transition-colors duration-200"
                    style={{ color: "oklch(0.5 0.015 250)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#00D4AA")}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "oklch(0.5 0.015 250)")
                    }
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{
                color: "oklch(0.5 0.015 250)",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              公司
            </h4>
            <ul className="space-y-2.5">
              {["关于我们", "团队介绍", "研究成果", "加入我们"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-sm transition-colors duration-200"
                    style={{ color: "oklch(0.5 0.015 250)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#00D4AA")}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "oklch(0.5 0.015 250)")
                    }
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between pt-8 gap-4"
          style={{ borderTop: "1px solid oklch(0.14 0.018 250)" }}
        >
          <p
            className="text-xs"
            style={{ color: "oklch(0.38 0.015 250)" }}
          >
            © 2025 AxonAI Inc. 保留所有权利。
          </p>
          <div className="flex items-center gap-6">
            {["隐私政策", "服务条款", "Cookie 设置"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-xs transition-colors duration-200"
                style={{ color: "oklch(0.38 0.015 250)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "oklch(0.6 0.015 250)")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "oklch(0.38 0.015 250)")
                }
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
