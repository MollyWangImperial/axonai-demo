/*
 * Navbar — Sticky navigation with blur backdrop on scroll
 * Design: Bioluminescent Dark Science
 * - Deep navy background with blur on scroll
 * - Teal accent for logo and CTA
 */
import { useEffect, useState } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled
          ? "oklch(0.07 0.02 250 / 90%)"
          : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid oklch(0.22 0.02 250 / 40%)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #00D4AA 0%, #00A8FF 100%)",
                boxShadow: "0 0 16px rgba(0, 212, 170, 0.4)",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
                  fill="oklch(0.07 0.02 250)"
                />
              </svg>
            </div>
            <span
              className="text-xl font-bold"
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

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "产品功能", id: "solution" },
              { label: "产品演示", id: "demo" },
              { label: "关于团队", id: "credibility" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="text-sm font-medium transition-colors duration-200"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  color: "oklch(0.7 0.015 250)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#00D4AA")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "oklch(0.7 0.015 250)")
                }
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => scrollTo("cta")}
              className="text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 btn-outline-teal"
            >
              预约演示
            </button>
            <button
              onClick={() => scrollTo("cta")}
              className="text-sm font-semibold px-4 py-2 rounded-lg btn-primary-teal"
            >
              立即开始
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg"
            style={{ color: "oklch(0.7 0.015 250)" }}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div
            className="md:hidden py-4 border-t"
            style={{ borderColor: "oklch(0.22 0.02 250 / 40%)" }}
          >
            {[
              { label: "产品功能", id: "solution" },
              { label: "产品演示", id: "demo" },
              { label: "关于团队", id: "credibility" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="block w-full text-left px-4 py-3 text-sm font-medium"
                style={{ color: "oklch(0.7 0.015 250)" }}
              >
                {item.label}
              </button>
            ))}
            <div className="px-4 pt-3 flex flex-col gap-2">
              <button
                onClick={() => scrollTo("cta")}
                className="w-full text-sm font-semibold py-2.5 rounded-lg btn-primary-teal"
              >
                立即开始评估
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
