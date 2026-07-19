import { LandingIcon } from "./landing-icons";
import { evidenceCategories } from "./landing-content";
import styles from "./landing.module.css";

export function FailureEvidenceSection() {
  return (
    <section id="evidence" className={styles.evidenceSection} aria-labelledby="evidence-heading">
      <div className={styles.sectionFrame}>
        <div className={styles.sectionIntro}>
          <p className={styles.sectionLabel}>Failure evidence</p>
          <h2 id="evidence-heading">The first render is the easiest state.</h2>
          <p>
            StateStorm tests the boundaries that make polished components fall apart.
          </p>
        </div>

        <div className={styles.evidenceGrid}>
          {evidenceCategories.map((category) => (
            <article key={category.key} className={styles.evidenceCard} data-tone={category.key}>
              <span className={styles.evidenceIcon}>
                <LandingIcon name={category.key} />
              </span>
              <div>
                <h3>{category.title}</h3>
                <p>{category.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
