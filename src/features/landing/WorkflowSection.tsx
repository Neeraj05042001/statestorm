import { LandingIcon } from "./landing-icons";
import { workflowStages } from "./landing-content";
import styles from "./landing.module.css";

const workflowNotes = [
  "Gemini makes the plan requirement-aware.",
  "Deterministic boundaries preserve baseline coverage.",
  "The browser decides what actually rendered.",
] as const;

export function WorkflowSection() {
  return (
    <section id="workflow" className={styles.workflowSection} aria-labelledby="workflow-heading">
      <div className={styles.sectionFrame}>
        <div className={styles.workflowIntro}>
          <p className={styles.sectionLabel}>Workflow</p>
          <h2 id="workflow-heading">From requirement to browser evidence.</h2>
          <ul>
            {workflowNotes.map((note) => (
              <li key={note}>
                <LandingIcon name="check" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>

        <ol className={styles.workflowRail} aria-label="Six-stage StateStorm workflow">
          {workflowStages.map((stage) => (
            <li key={stage.number}>
              <div className={styles.workflowIcon}>
                <LandingIcon name={stage.icon} />
              </div>
              <span className={styles.workflowNumber}>{stage.number}</span>
              <h3>{stage.title}</h3>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
