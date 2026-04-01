/*
 * HomeEn — English version of the AxonAI landing page
 * Design: Bioluminescent Dark Science (same as Chinese version)
 */
import NavbarEn from "@/components/NavbarEn";
import FooterEn from "@/components/FooterEn";
import HeroSectionEn from "@/components/sections/en/HeroSectionEn";
import ProblemSectionEn from "@/components/sections/en/ProblemSectionEn";
import SolutionSectionEn from "@/components/sections/en/SolutionSectionEn";
import DemoSectionEn from "@/components/sections/en/DemoSectionEn";
import SocialProofSectionEn from "@/components/sections/en/SocialProofSectionEn";
import CredibilitySectionEn from "@/components/sections/en/CredibilitySectionEn";
import CTASectionEn from "@/components/sections/en/CTASectionEn";

export default function HomeEn() {
  return (
    <div className="min-h-screen" style={{ background: "oklch(0.07 0.02 250)" }}>
      <NavbarEn />
      <HeroSectionEn />
      <ProblemSectionEn />
      <SolutionSectionEn />
      <DemoSectionEn />
      <SocialProofSectionEn />
      <CredibilitySectionEn />
      <CTASectionEn />
      <FooterEn />
    </div>
  );
}
