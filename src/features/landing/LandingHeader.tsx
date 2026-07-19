import Link from "next/link";

import { BrandMark, LandingIcon } from "./landing-icons";
import { githubUrl, liveDemoUrl, navigationLinks } from "./landing-content";
import styles from "./landing.module.css";

export function LandingHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link className={styles.brand} href="/" aria-label="StateStorm home">
          <BrandMark className={styles.brandMark} />
          <span>StateStorm</span>
        </Link>

        <nav className={styles.navigation} aria-label="Homepage navigation">
          {navigationLinks.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className={styles.headerActions}>
          <a
            className={styles.githubButton}
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
          >
            <LandingIcon name="github" />
            <span>GitHub</span>
          </a>
          <Link className={styles.headerDemoButton} href={liveDemoUrl}>
            <span className={styles.headerDemoLabel}>Run live demo</span>
            <span className={styles.mobileDemoLabel}>Demo</span>
            <LandingIcon name="arrow" />
          </Link>
        </div>
      </div>
    </header>
  );
}
