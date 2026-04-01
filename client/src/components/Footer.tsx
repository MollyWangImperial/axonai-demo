/*
 * Footer — Minimal dark footer
 * Design: Bioluminescent Dark Science
 */
import AxonAILogo from "@/components/AxonAILogo";

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
            <div className="mb-4">
              <AxonAILogo height={34} />
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
