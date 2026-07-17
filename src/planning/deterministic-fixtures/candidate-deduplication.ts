import type { ContractIssue } from "../../domain";
import { canonicalJson, cloneJsonObject } from "./baseline-values";
import { DeterministicFixtureIssueCode } from "./issue-codes";
import type {
  CandidateSelectionResult,
  FixtureCandidate,
} from "./types";

export const MAX_DETERMINISTIC_FIXTURES = 12;

export function selectDeterministicCandidates(
  candidates: readonly FixtureCandidate[],
): CandidateSelectionResult {
  const uniqueCandidates: FixtureCandidate[] = [];
  const seenProps = new Set<string>();
  const seenIds = new Set<string>();

  for (const entry of candidates) {
    const propsKey = canonicalJson(entry.props);
    if (seenProps.has(propsKey) || seenIds.has(entry.id)) {
      continue;
    }

    seenProps.add(propsKey);
    seenIds.add(entry.id);
    uniqueCandidates.push({
      ...entry,
      props: cloneJsonObject(entry.props),
    });
  }

  const issues: ContractIssue[] = [];
  if (uniqueCandidates.length > MAX_DETERMINISTIC_FIXTURES) {
    issues.push({
      code: DeterministicFixtureIssueCode.fixtureLimitApplied,
      severity: "warning",
      message: `Deterministic fixture generation kept the first ${MAX_DETERMINISTIC_FIXTURES} unique boundary fixtures`,
      path: ["fixtures"],
      suggestion: "Use later semantic planning only when additional states are justified",
    });
  }

  return {
    candidates: uniqueCandidates
      .slice(0, MAX_DETERMINISTIC_FIXTURES)
      .map((entry) => ({ ...entry, props: cloneJsonObject(entry.props) })),
    issues,
  };
}
