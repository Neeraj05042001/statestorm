import Link from "next/link";

import { BrandMark } from "./landing-icons";
import { githubUrl, liveDemoUrl } from "./landing-content";
import styles from "./landing.module.css";

const documentationUrl = `${githubUrl}/tree/main/docs`;

const productLinks = [
  { label: "Run live demo", href: liveDemoUrl },
  { label: "How it works", href: "#workflow" },
  { label: "Evidence", href: "#evidence" },
  { label: "Architecture", href: "#architecture" },
] as const;

const resourceLinks = [
  { label: "Documentation", href: documentationUrl },
  { label: "GitHub", href: githubUrl },
  {
    label: "Known limitations",
    href: `${githubUrl}/blob/main/docs/KNOWN_LIMITATIONS.md`,
  },
  {
    label: "Acknowledgements",
    href: `${githubUrl}/blob/main/docs/submission/THIRD_PARTY_ACKNOWLEDGEMENTS.md`,
  },
] as const;

export function LandingFooter() {
  return (
    <footer className={styles.footer} aria-label="StateStorm footer">
      <div className={styles.footerInner}>
        <div className={styles.footerGrid}>
          <div className={styles.footerBrandColumn}>
            <Link className={styles.footerBrand} href="/" aria-label="StateStorm home">
              <BrandMark className={styles.footerMark} />
              <span>StateStorm</span>
            </Link>
            <p>Adversarial preflight for supported React components.</p>
          </div>

          <nav className={styles.footerNav} aria-label="Footer product links">
            <h2>Product</h2>
            <ul>
              {productLinks.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith("/") ? (
                    <Link href={link.href}>{link.label}</Link>
                  ) : (
                    <a href={link.href}>{link.label}</a>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <nav className={styles.footerNav} aria-label="Footer resource links">
            <h2>Resources</h2>
            <ul>
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <a
                    className={styles.externalLink}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${link.label} (opens in a new tab)`}
                  >
                    {link.label}
                    <span aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <p className={styles.footerTrust}>
          <span>No sign-up</span>
          <span>Inputs are not persisted</span>
          <span>Deterministic fallback</span>
        </p>

        <div className={styles.footerBottom}>
          <p>© 2026 StateStorm · Built by Neeraj Kumar</p>
          <p>AI proposes. Deterministic browser evidence decides.</p>
        </div>
      </div>
    </footer>
  );
}
