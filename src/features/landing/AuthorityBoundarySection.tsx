import { LandingIcon } from "./landing-icons";
import styles from "./landing.module.css";

export function AuthorityBoundarySection() {
  return (
    <section
      id="architecture"
      className={`${styles.bottomPanel} ${styles.authorityPanel}`}
      aria-labelledby="authority-heading"
    >
      <div className={styles.bottomPanelHeader}>
        <p className={styles.sectionLabel}>Authority boundary</p>
        <h2 id="authority-heading">
          AI makes it relevant.
          <br />
          Evidence makes it trustworthy.
        </h2>
      </div>

      <div className={styles.authorityDiagram} aria-label="Planning and evidence authority flow">
        <div className={styles.authorityInputs}>
          <div>
            <LandingIcon name="spark" />
            <span>Gemini semantic cases</span>
          </div>
          <div>
            <LandingIcon name="cube" />
            <span>Deterministic boundary states</span>
          </div>
        </div>
        <span className={styles.diagramJoin} aria-hidden="true">+</span>
        <div className={styles.authorityStep}>
          <LandingIcon name="check" />
          <span>Validated RunPlan</span>
        </div>
        <span className={styles.diagramArrow} aria-hidden="true">→</span>
        <div className={styles.authorityStep}>
          <LandingIcon name="cube" />
          <span>Isolated browser execution</span>
        </div>
        <span className={styles.diagramArrow} aria-hidden="true">→</span>
        <div className={styles.authorityStep}>
          <LandingIcon name="atlas" />
          <span>Recorded evidence becomes the Atlas</span>
        </div>
      </div>

      <p className={styles.authorityStatement}>
        <LandingIcon name="shield" />
        AI never declares whether the component passed.
      </p>
    </section>
  );
}
