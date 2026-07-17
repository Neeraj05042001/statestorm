import { expect } from "vitest";

import type { ComponentSubmission } from "../../../domain";
import { analyzeComponentSource } from "../index";

export function submission(
  componentCode: string,
  language: ComponentSubmission["language"] = "tsx",
): ComponentSubmission {
  return {
    id: "source-analysis-test",
    prompt: "Render the submitted product card in its supported states",
    componentCode,
    language,
  };
}

export function expectAccepted(componentCode: string, language: "tsx" | "jsx" = "tsx") {
  const result = analyzeComponentSource(submission(componentCode, language));
  expect(result.accepted, JSON.stringify(result, null, 2)).toBe(true);
  if (!result.accepted) {
    throw new Error(`Expected accepted source: ${JSON.stringify(result.issues)}`);
  }
  return result;
}

export function expectRejectedWith(
  componentCode: string,
  expectedCode: string,
  language: "tsx" | "jsx" = "tsx",
) {
  const result = analyzeComponentSource(submission(componentCode, language));
  expect(result.accepted).toBe(false);
  if (result.accepted) {
    throw new Error("Expected rejected source");
  }
  expect(result.issues.map((issue) => issue.code)).toContain(expectedCode);
  return result;
}

