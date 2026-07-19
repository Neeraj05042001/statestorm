import Link from "next/link";

import { ProductEvidencePreview } from "./ProductEvidencePreview";
import { StormCoreVisual } from "./StormCoreVisual";
import { TrustStrip } from "./TrustStrip";
import { LandingIcon } from "./landing-icons";
import { liveDemoUrl } from "./landing-content";
import styles from "./landing.module.css";

export function HeroSection() {
  return (
    <section id="product" className={styles.hero} aria-labelledby="hero-heading">
      <div className={styles.heroAtmosphere} aria-hidden="true" />
      <div className={styles.heroInner}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>
            <LandingIcon name="storm" />
            AI preflight for React components
          </p>
          <h1 id="hero-heading" className={styles.heroTitle}>
            <span>AI builds the happy path.</span>
            <span>
              <strong>StateStorm</strong> reveals
            </span>
            <span>what it forgot.</span>
          </h1>
          <p className={styles.heroDescription}>
            Turn the original requirement and one supported React component into
            prioritized adversarial states, isolated browser runs, and an
            evidence-backed State Atlas.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryButton} href={liveDemoUrl}>
              <LandingIcon name="storm" />
              Run the live demo
              <LandingIcon name="arrow" />
            </Link>
            <a className={styles.secondaryButton} href="#workflow">
              <LandingIcon name="play" />
              See how it works
            </a>
          </div>
          <p className={styles.supportingPrinciple}>
            <span aria-hidden="true" />
            AI proposes. Deterministic browser evidence decides.
          </p>
        </div>

        <div className={styles.heroVisual}>
          <StormCoreVisual />
          <ProductEvidencePreview />
        </div>

        <TrustStrip />
      </div>
    </section>
  );
}
