import { describe, expect, it } from "vitest";

import {
  AiPlanningProposalSchema,
  AiPlanningStatusSchema,
  PreflightPlanApiResponseSchema,
} from "..";

const proposal = {
  requirements: [
    {
      title: "Prominent featured state",
      statement: "Featured products should remain visually prominent.",
      classification: "heuristic",
      rationale: "Visual prominence requires later inspection.",
    },
  ],
  semanticFixtures: [
    {
      label: "Urgent product",
      intent: "Exercise an urgent featured product.",
      assignments: [
        { propName: "tone", jsonValue: '"urgent"' },
      ],
      omitOptionalProps: [],
    },
  ],
};

describe("AI planning boundary schemas", () => {
  it("accepts the exact intermediate proposal shape", () => {
    expect(AiPlanningProposalSchema.parse(proposal)).toEqual(proposal);
  });

  it("rejects unknown proposal properties", () => {
    expect(
      AiPlanningProposalSchema.safeParse({ ...proposal, executableCode: "x" })
        .success,
    ).toBe(false);
  });

  it("enforces proposal collection limits", () => {
    expect(
      AiPlanningProposalSchema.safeParse({
        ...proposal,
        semanticFixtures: Array.from({ length: 5 }, () =>
          proposal.semanticFixtures[0],
        ),
      }).success,
    ).toBe(false);
  });

  it("enforces requirement and assignment limits", () => {
    expect(
      AiPlanningProposalSchema.safeParse({
        ...proposal,
        requirements: Array.from({ length: 9 }, () => proposal.requirements[0]),
      }).success,
    ).toBe(false);
    expect(
      AiPlanningProposalSchema.safeParse({
        ...proposal,
        semanticFixtures: [
          {
            ...proposal.semanticFixtures[0],
            assignments: Array.from({ length: 13 }, () => ({
              propName: "title",
              jsonValue: '"value"',
            })),
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejects an unknown requirement classification", () => {
    expect(
      AiPlanningProposalSchema.safeParse({
        ...proposal,
        requirements: [
          { ...proposal.requirements[0], classification: "verified" },
        ],
      }).success,
    ).toBe(false);
  });

  it("exposes every planned public provider status", () => {
    for (const status of [
      "generated",
      "unavailable",
      "timeout",
      "refused",
      "invalid-output",
      "provider-error",
    ]) {
      expect(AiPlanningStatusSchema.safeParse(status).success).toBe(true);
    }
  });

  it("rejects an accepted API response without a validated RunPlan", () => {
    expect(
      PreflightPlanApiResponseSchema.safeParse({
        accepted: true,
        contract: {},
        issues: [],
        ai: { status: "generated" },
      }).success,
    ).toBe(false);
  });
});
