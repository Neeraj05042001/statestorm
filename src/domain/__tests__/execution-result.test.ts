import { describe, expect, it } from "vitest";

import {
  ExecutionSessionResultSchema,
  FixtureExecutionResultSchema,
} from "../execution-result";

const evidence = {
  sandboxCompleted: true,
  renderCommitted: true,
  expectedDomFound: true,
  meaningfulDomFound: true,
};

describe("execution result contracts", () => {
  it("accepts a passed fixture result", () => {
    expect(
      FixtureExecutionResultSchema.parse({
        fixtureId: "det-happy-path",
        status: "passed",
        summary: "Visible output rendered.",
        evidence,
      }),
    ).toMatchObject({ status: "passed" });
  });

  it("supplements a passed result with visual findings without changing status", () => {
    const result = FixtureExecutionResultSchema.parse({
      fixtureId: "det-long-strings",
      status: "passed",
      summary: "Visible output rendered.",
      evidence,
      visualFindings: [
        {
          id: "detector-long-overflow-1",
          fixtureId: "det-long-strings",
          kind: "layout-overflow",
          severity: "warning",
          summary: "Possible horizontal layout overflow was detected.",
          evidence: {
            detector: "overflow-v1",
            elementTag: "H2",
            axis: "horizontal",
            clientWidth: 180,
            scrollWidth: 420,
          },
        },
      ],
    });

    expect(result.status).toBe("passed");
    expect(result.visualFindings).toHaveLength(1);
  });

  it.each([
    "compile-error",
    "runtime-error",
    "blank-render",
    "timeout",
    "infrastructure-error",
    "cancelled",
  ] as const)("accepts the %s failure result", (status) => {
    expect(
      FixtureExecutionResultSchema.safeParse({
        fixtureId: "fixture-one",
        status,
        summary: "The fixture did not pass.",
        sanitizedMessage: "Bounded diagnostic",
        evidence: {
          sandboxCompleted: false,
          renderCommitted: false,
          expectedDomFound: false,
          meaningfulDomFound: false,
        },
      }).success,
    ).toBe(true);
  });

  it("rejects unknown statuses and raw Error fields", () => {
    expect(
      FixtureExecutionResultSchema.safeParse({
        fixtureId: "fixture-one",
        status: "broken",
        summary: "Unknown status.",
        evidence,
      }).success,
    ).toBe(false);
    expect(
      FixtureExecutionResultSchema.safeParse({
        fixtureId: "fixture-one",
        status: "runtime-error",
        summary: "Runtime error.",
        rawError: new Error("must not cross the result boundary"),
        evidence,
      }).success,
    ).toBe(false);
  });

  it("rejects a finding correlated to another fixture", () => {
    expect(
      FixtureExecutionResultSchema.safeParse({
        fixtureId: "fixture-current",
        status: "passed",
        summary: "Visible output rendered.",
        evidence,
        visualFindings: [
          {
            id: "detector-stale-overflow-1",
            fixtureId: "fixture-stale",
            kind: "layout-overflow",
            severity: "warning",
            summary: "Possible horizontal layout overflow was detected.",
            evidence: {
              detector: "overflow-v1",
              elementTag: "H2",
              axis: "horizontal",
              clientWidth: 180,
              scrollWidth: 420,
            },
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("validates a complete session result", () => {
    const session = ExecutionSessionResultSchema.parse({
      sessionId: "session-one",
      status: "completed",
      results: [
        {
          fixtureId: "det-happy-path",
          status: "passed",
          summary: "Visible output rendered.",
          evidence,
        },
      ],
    });

    expect(session.results).toHaveLength(1);
  });
});
