import Link from "next/link";

import { BrandMark, LandingIcon } from "./landing-icons";
import { githubUrl, liveDemoUrl } from "./landing-content";
import styles from "./landing.module.css";

export function FinalCtaSection() {
  return (
    <section className={`${styles.bottomPanel} ${styles.ctaPanel}`} aria-labelledby="cta-heading">
      <div className={styles.ctaMark} aria-hidden="true">
        <BrandMark />
      </div>
      <div>
        <p className={styles.sectionLabel}>Verified demo</p>
        <h2 id="cta-heading">Find the states your component forgot.</h2>
        <p className={styles.ctaDescription}>
          Load the verified AtlasProductCard demo and watch StateStorm turn one
          requirement into browser-backed evidence.
        </p>
      </div>
      <div className={styles.ctaActions}>
        <Link className={styles.primaryButton} href={liveDemoUrl}>
          <LandingIcon name="storm" />
          Load live demo
          <LandingIcon name="arrow" />
        </Link>
        <a className={styles.secondaryButton} href={githubUrl} target="_blank" rel="noreferrer">
          <LandingIcon name="github" />
          View source on GitHub
        </a>
      </div>
      <p className={styles.scopeLine}>
        Supports self-contained TSX/JSX with locally declared, JSON-serializable props.
      </p>
    </section>
  );
}
