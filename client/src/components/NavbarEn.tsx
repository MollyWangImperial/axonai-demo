/*
 * NavbarEn — English sticky navigation with language switcher
 * Design: Bioluminescent Dark Science
 */
import { useEffect, useState } from "react";
import AxonAILogo from "@/components/AxonAILogo";
import { useLocation } from "wouter";

export default function NavbarEn() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [, setLocation] = useLocation();

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
        background: scrolled ? "oklch(0.07 0.02 250 / 90%)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid oklch(0.22 0.02 250 / 40%)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <AxonAILogo height={38} />
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "Features", id: "solution-en" },
              { label: "Demo", id: "demo-en" },
              { label: "Team", id: "team-en" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="text-sm font-medium transition-colors duration-200"
                style={{ fontFamily: "'DM Sans', sans-serif", color: "oklch(0.7 0.015 250)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#00D4AA")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "oklch(0.7 0.015 250)")}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* CTA + Language switcher */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language toggle */}
            <button
              onClick={() => setLocation("/")}
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200"
              style={{
                background: "oklch(0.13 0.02 250)",
                border: "1px solid oklch(0.22 0.02 250 / 50%)",
                color: "oklch(0.6 0.015 250)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#00D4AA";
                e.currentTarget.style.borderColor = "rgba(0, 212, 170, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "oklch(0.6 0.015 250)";
                e.currentTarget.style.borderColor = "oklch(0.22 0.02 250 / 50%)";
              }}
            >
              中文
            </button>
            <button
              onClick={() => scrollTo("cta-en")}
              className="text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 btn-outline-teal"
            >
              Book Demo
            </button>
            <button
              onClick={() => scrollTo("cta-en")}
              className="text-sm font-semibold px-4 py-2 rounded-lg btn-primary-teal"
            >
              Get Started
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
              { label: "Features", id: "solution-en" },
              { label: "Demo", id: "demo-en" },
              { label: "Team", id: "team-en" },
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
                onClick={() => setLocation("/")}
                className="w-full text-sm font-medium py-2.5 rounded-lg"
                style={{
                  background: "oklch(0.13 0.02 250)",
                  border: "1px solid oklch(0.22 0.02 250 / 50%)",
                  color: "oklch(0.6 0.015 250)",
                }}
              >
                切换中文
              </button>
              <button
                onClick={() => scrollTo("cta-en")}
                className="w-full text-sm font-semibold py-2.5 rounded-lg btn-primary-teal"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
