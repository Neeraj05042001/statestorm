import { describe, expect, it } from "vitest";

import { ComponentAnalysisApiResponseSchema } from "../component-analysis-api";

const contract = {
  componentName: "StatusCard",
  exportStyle: "default" as const,
  language: "tsx" as const,
  imports: ["react"],
  props: [
    {
      name: "title",
      required: true,
      kind: "string" as const,
      typeText: "string",
    },
  ],
  warnings: [],
};

describe("ComponentAnalysisApiResponseSchema", () => {
  it("accepts a validated contract response", () => {
    expect(
      ComponentAnalysisApiResponseSchema.parse({
        accepted: true,
        contract,
        issues: [],
      }),
    ).toEqual({ accepted: true, contract, issues: [] });
  });

  it("accepts a rejected analysis response", () => {
    expect(
      ComponentAnalysisApiResponseSchema.parse({
        accepted: false,
        issues: [
          {
            code: "UNSUPPORTED_IMPORT",
            severity: "error",
            message: "Unsupported package import",
            path: ["componentCode", 1, 1],
          },
        ],
      }),
    ).toMatchObject({ accepted: false });
  });

  it("rejects an accepted response without a complete contract", () => {
    expect(() =>
      ComponentAnalysisApiResponseSchema.parse({
        accepted: true,
        issues: [],
      }),
    ).toThrow();
  });
});
