import {
  ContractIssueSchema,
  RequirementSchema,
  type ContractIssue,
  type Requirement,
} from "../../domain";
import { RunPlanPlanningIssueCode } from "./issue-codes";
import type {
  MaterializeRequirementsInput,
  RequirementMaterializationResult,
} from "./types";

const MAX_REQUIREMENTS = 8;

function normalizeText(value: string): string {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim();
}

function issue(
  code: string,
  message: string,
  index: number,
  suggestion: string,
): ContractIssue {
  return ContractIssueSchema.parse({
    code,
    severity: "warning",
    message,
    path: ["aiProposal", "requirements", index],
    suggestion,
  });
}

export function materializeAiRequirements({
  prompt,
  proposals,
}: MaterializeRequirementsInput): RequirementMaterializationResult {
  const requirements: Requirement[] = [];
  const issues: ContractIssue[] = [];
  const seen = new Set<string>();

  proposals.forEach((proposal, index) => {
    const statement = normalizeText(proposal.statement);
    const deduplicationKey = statement.toLocaleLowerCase("en-US");

    if (seen.has(deduplicationKey)) {
      issues.push(
        issue(
          RunPlanPlanningIssueCode.requirementRejected,
          `AI requirement ${index + 1} duplicates an earlier normalized requirement`,
          index,
          "Keep one concise statement for each distinct requirement",
        ),
      );
      return;
    }
    seen.add(deduplicationKey);

    if (requirements.length >= MAX_REQUIREMENTS) {
      issues.push(
        issue(
          RunPlanPlanningIssueCode.requirementLimitApplied,
          `AI requirement ${index + 1} was omitted because the eight-requirement limit was reached`,
          index,
          "Prioritize the most important requirements in the original prompt",
        ),
      );
      return;
    }

    if (proposal.classification === "deterministic") {
      issues.push(
        issue(
          RunPlanPlanningIssueCode.requirementRejected,
          `AI requirement ${index + 1} requested deterministic verification without a supported deterministic assertion`,
          index,
          "Treat the requirement as heuristic or add a future trusted assertion extractor",
        ),
      );
      return;
    }

    const candidate = {
      id: `req-ai-${String(requirements.length + 1).padStart(2, "0")}`,
      statement,
      sourceQuote: prompt.trim(),
      category:
        proposal.classification === "unsupported" ? "unsupported" : "state",
      verification: proposal.classification,
    } as const;
    const parsed = RequirementSchema.safeParse(candidate);

    if (!parsed.success) {
      issues.push(
        issue(
          RunPlanPlanningIssueCode.requirementRejected,
          `AI requirement ${index + 1} failed the trusted Requirement schema`,
          index,
          "Keep the requirement concise and within the supported classifications",
        ),
      );
      return;
    }

    requirements.push(parsed.data);
  });

  return { requirements, issues };
}
