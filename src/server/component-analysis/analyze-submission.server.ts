import "server-only";

import { analyzeComponentSource } from "../../analysis/component-source";
import {
  ComponentAnalysisApiResponseSchema,
  ComponentSubmissionSchema,
  type ComponentAnalysisApiResponse,
  type ContractIssue,
} from "../../domain";

function submissionIssues(input: unknown): ContractIssue[] | undefined {
  const result = ComponentSubmissionSchema.safeParse(input);
  if (result.success) {
    return undefined;
  }

  return result.error.issues.map((issue) => ({
    code: "CONTRACT_VALIDATION_FAILED",
    severity: "error" as const,
    message: `Invalid component submission: ${issue.message}`,
    path: [
      "submission",
      ...issue.path.map((segment) =>
        typeof segment === "number" || typeof segment === "string"
          ? segment
          : String(segment),
      ),
    ],
    suggestion: "Provide a valid ComponentSubmission value",
  }));
}

export function analyzeSubmission(input: unknown): ComponentAnalysisApiResponse {
  const invalidSubmissionIssues = submissionIssues(input);
  if (invalidSubmissionIssues !== undefined) {
    return ComponentAnalysisApiResponseSchema.parse({
      accepted: false,
      issues: invalidSubmissionIssues,
    });
  }

  const submission = ComponentSubmissionSchema.parse(input);
  const result = analyzeComponentSource(submission);

  return ComponentAnalysisApiResponseSchema.parse(result);
}
