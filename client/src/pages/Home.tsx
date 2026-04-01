/*
 * Home — Main landing page for AxonAI
 * Design: Bioluminescent Dark Science
 * Sections: Navbar → Hero → Problem → Solution → Demo → Credibility → CTA → Footer
 */
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/sections/HeroSection";
import ProblemSection from "@/components/sections/ProblemSection";
import SolutionSection from "@/components/sections/SolutionSection";
import DemoSection from "@/components/sections/DemoSection";
import CredibilitySection from "@/components/sections/CredibilitySection";
import CTASection from "@/components/sections/CTASection";
import SocialProofSection from "@/components/sections/SocialProofSection";

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: "oklch(0.07 0.02 250)" }}>
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <DemoSection />
      <SocialProofSection />
      <CredibilitySection />
      <CTASection />
      <Footer />
    </div>
  );
}
