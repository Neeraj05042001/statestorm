import { LandingIcon } from "./landing-icons";
import { evidenceCategories } from "./landing-content";
import styles from "./landing.module.css";

function getPreviewCategoryLabel(title: string) {
  return title
    .replace("Runtime crash", "Runtime")
    .replace("Blank render", "Blank")
    .replace("Possible overflow", "Overflow");
}

export function ProductEvidencePreview() {
  return (
    <aside className={styles.productPreview} aria-label="Product preview: State Atlas evidence">
      <div className={styles.previewHeader}>
        <div>
          <span className={styles.previewKicker}>Product preview</span>
          <h2>State Atlas</h2>
        </div>
        <span className={styles.previewBadge}>Recorded evidence</span>
      </div>

      <div className={styles.previewLegend} aria-label="Evidence categories">
        {evidenceCategories.map((category) => (
          <span key={category.key} data-tone={category.key}>
            <i aria-hidden="true" />
            {getPreviewCategoryLabel(category.title)}
          </span>
        ))}
      </div>

      <div className={styles.previewCards}>
        {evidenceCategories.map((category, index) => (
          <article key={category.key} className={styles.previewCard} data-tone={category.key}>
            <div className={styles.previewCardTop}>
              <span className={styles.previewIndex}>{String(index + 1).padStart(2, "0")}</span>
              <span className={styles.previewType}>
                <LandingIcon name={category.key} />
                {getPreviewCategoryLabel(category.title)}
              </span>
            </div>
            <div className={styles.previewFrame} aria-hidden="true">
              <span />
              <span />
              <span />
              <i />
            </div>
            <p>{category.preview}</p>
          </article>
        ))}
      </div>

      <div className={styles.previewFooter}>
        <span>Deterministic run</span>
        <span>Browser-derived</span>
        <span>Verdict withheld</span>
      </div>
    </aside>
  );
}
