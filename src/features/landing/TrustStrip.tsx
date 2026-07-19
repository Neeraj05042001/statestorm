import { LandingIcon } from "./landing-icons";
import { trustSignals } from "./landing-content";
import styles from "./landing.module.css";

export function TrustStrip() {
  return (
    <ul className={styles.trustStrip} aria-label="Product trust signals">
      {trustSignals.map((signal) => (
        <li key={signal.label}>
          <LandingIcon name={signal.icon} />
          <span>{signal.label}</span>
        </li>
      ))}
    </ul>
  );
}
