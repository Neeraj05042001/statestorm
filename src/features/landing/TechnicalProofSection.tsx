import { LandingIcon } from "./landing-icons";
import { technicalLabels, technicalMetrics } from "./landing-content";
import styles from "./landing.module.css";

export function TechnicalProofSection() {
  return (
    <section className={`${styles.bottomPanel} ${styles.proofPanel}`} aria-labelledby="proof-heading">
      <div className={styles.bottomPanelHeader}>
        <p className={styles.sectionLabel}>Technical proof</p>
        <h2 id="proof-heading">Built for the moment between generation and integration.</h2>
      </div>

      <dl className={styles.metricsGrid}>
        {technicalMetrics.map((metric) => (
          <div key={metric.label} data-tone={metric.tone}>
            <dt>{metric.value}</dt>
            <dd>{metric.label}</dd>
          </div>
        ))}
      </dl>

      <ul className={styles.technicalLabels} aria-label="Technical proof points">
        {technicalLabels.map((label) => (
          <li key={label}>
            <LandingIcon name="contract" />
            {label}
          </li>
        ))}
      </ul>
    </section>
  );
}
