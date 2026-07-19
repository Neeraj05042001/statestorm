import { AuthorityBoundarySection } from "../features/landing/AuthorityBoundarySection";
import { FailureEvidenceSection } from "../features/landing/FailureEvidenceSection";
import { FinalCtaSection } from "../features/landing/FinalCtaSection";
import { HeroSection } from "../features/landing/HeroSection";
import { LandingFooter } from "../features/landing/LandingFooter";
import { LandingHeader } from "../features/landing/LandingHeader";
import { TechnicalProofSection } from "../features/landing/TechnicalProofSection";
import { WorkflowSection } from "../features/landing/WorkflowSection";
import styles from "../features/landing/landing.module.css";

export default function Home() {
  return (
    <div className={styles.siteShell}>
      <a className={styles.skipLink} href="#main-content">
        Skip to content
      </a>
      <LandingHeader />
      <main id="main-content">
        <HeroSection />
        <FailureEvidenceSection />
        <WorkflowSection />
        <div className={styles.closingGrid}>
          <AuthorityBoundarySection />
          <TechnicalProofSection />
          <FinalCtaSection />
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
