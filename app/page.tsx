import Hero from "@/components/landing/hero";
import {
  FeaturesSection,
  HowItWorksSection,
  ProblemSection,
  UseCasesSection,
} from "@/components/landing/middle-sections";
import {
  FaqSection,
  FinalCtaSection,
  PricingSection,
} from "@/components/landing/pricing-section";

/**
 * Marketing landing page composition.
 *
 * Each section lives in its own file under `components/landing/*` so the
 * page itself stays a thin manifest. Order is intentional: hook -> pain ->
 * solution -> proof -> price -> objections -> close.
 */
export default function HomePage() {
  return (
    <main className="bg-white text-black">
      <Hero />
      <ProblemSection />
      <HowItWorksSection />
      <FeaturesSection />
      <UseCasesSection />
      <PricingSection />
      <FaqSection />
      <FinalCtaSection />
    </main>
  );
}
