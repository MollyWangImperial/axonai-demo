import NavbarZh from "@/components/NavbarZh";
import FooterZh from "@/components/FooterZh";
import HeroSectionZh from "@/components/sections/zh/HeroSectionZh";
import ProblemSectionZh from "@/components/sections/zh/ProblemSectionZh";
import SolutionSectionZh from "@/components/sections/zh/SolutionSectionZh";
import DemoSectionZh from "@/components/sections/zh/DemoSectionZh";
import SocialProofSectionZh from "@/components/sections/zh/SocialProofSectionZh";
import CredibilitySectionZh from "@/components/sections/zh/CredibilitySectionZh";
import CTASectionZh from "@/components/sections/zh/CTASectionZh";

export default function HomeZh() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavbarZh />
      <main>
        <HeroSectionZh />
        <ProblemSectionZh />
        <SolutionSectionZh />
        <DemoSectionZh />
        <SocialProofSectionZh />
        <CredibilitySectionZh />
        <CTASectionZh />
      </main>
      <FooterZh />
    </div>
  );
}
