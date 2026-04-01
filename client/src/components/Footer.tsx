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
              Computer vision-powered stroke rehabilitation assessment and
              personalised rehabilitation plan generation. Every step of
              recovery, precisely measured.
            </p>
            <p
              className="text-xs mt-4"
              style={{
                color: "oklch(0.38 0.015 250)",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              contact@axonai.com
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
              Product
            </h4>
            <ul className="space-y-2.5">
              {["Gait Analysis", "Rehab Plan Generation", "Progress Tracking", "Clinical Reports"].map((item) => (
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
              Company
            </h4>
            <ul className="space-y-2.5">
              {["About Us", "Our Team", "Research", "Careers"].map((item) => (
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
            © 2025 AxonAI Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {["Privacy Policy", "Terms of Service", "Cookie Settings"].map((item) => (
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
