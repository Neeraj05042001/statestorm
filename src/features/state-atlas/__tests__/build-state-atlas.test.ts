import { describe, expect, it } from "vitest";

import {
  StateAtlasSchema,
  type DetectorFinding,
  type ExecutionSessionResult,
  type FixtureExecutionResult,
  type RunPlan,
} from "../../../domain";
import {
  buildStateAtlas,
  StateAtlasBuildError,
} from "../build-state-atlas";

const componentSource = "export default function Card() { return <p>ok</p>; }";

function makePlan(ids: string[]): RunPlan {
  return {
    version: 1,
    submission: {
      id: "atlas-test",
      prompt: "Render states.",
      componentCode: componentSource,
      language: "tsx",
    },
    component: {
      componentName: "Card",
      exportStyle: "default",
      language: "tsx",
      imports: [],
      props: [],
      warnings: [],
    },
    requirements: [],
    fixtures: ids.map((id) => ({
      id,
      label: `State ${id}`,
      origin: id.startsWith("ai-") ? ("ai" as const) : ("deterministic" as const),
      intent: `Exercise ${id}`,
      props: {},
    })),
    issues: [],
  };
}

function overflowFinding(fixtureId: string): DetectorFinding {
  return {
    id: `detector-${fixtureId}-overflow-1`,
    fixtureId,
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
  };
}

function brokenImageFinding(fixtureId: string): DetectorFinding {
  return {
    id: `detector-${fixtureId}-image-1`,
    fixtureId,
    kind: "broken-image",
    severity: "error",
    summary: "A rendered image completed without usable image data.",
    evidence: {
      detector: "broken-image-v1",
      elementTag: "IMG",
      imageAltPresent: true,
      imageSourceKind: "relative",
    },
  };
}

function result(
  fixtureId: string,
  status: FixtureExecutionResult["status"],
  visualFindings: DetectorFinding[] = [],
): FixtureExecutionResult {
  return {
    fixtureId,
    status,
    summary: `Fixture ${status}.`,
    evidence: {
      sandboxCompleted: status === "passed",
      renderCommitted: status === "passed" || status === "blank-render",
      expectedDomFound: status === "passed" || status === "blank-render",
      meaningfulDomFound: status === "passed",
    },
    visualFindings,
  };
}

function session(results: FixtureExecutionResult[]): ExecutionSessionResult {
  return { sessionId: "session-atlas", status: "completed", results };
}

describe("buildStateAtlas", () => {
  it("preserves RunPlan order and derives every required display priority", () => {
    const ids = [
      "clean",
      "runtime",
      "blank",
      "compile",
      "timeout",
      "infrastructure",
      "overflow",
      "broken",
      "cancelled",
    ];
    const atlas = buildStateAtlas({
      runPlan: makePlan(ids),
      executionSession: session([
        result("broken", "passed", [brokenImageFinding("broken")]),
        result("clean", "passed"),
        result("runtime", "runtime-error", [overflowFinding("runtime")]),
        result("blank", "blank-render"),
        result("compile", "compile-error"),
        result("timeout", "timeout"),
        result("infrastructure", "infrastructure-error"),
        result("overflow", "passed", [overflowFinding("overflow")]),
        result("cancelled", "cancelled"),
      ]),
    });

    expect(atlas.entries.map((entry) => entry.fixtureId)).toEqual(ids);
    expect(atlas.entries.map((entry) => entry.category)).toEqual([
      "clean",
      "runtime-failure",
      "blank-render",
      "compile-failure",
      "timeout",
      "infrastructure-failure",
      "overflow-warning",
      "broken-image",
      "cancelled",
    ]);
    expect(atlas.entries.find((entry) => entry.fixtureId === "runtime")?.category).toBe(
      "runtime-failure",
    );
    expect(atlas.summary).toMatchObject({
      totalStates: 9,
      cleanStates: 1,
      runtimeFailures: 1,
      blankRenders: 1,
      overflowWarnings: 2,
      brokenImages: 1,
      otherFailures: 4,
    });
    expect(StateAtlasSchema.safeParse(atlas).success).toBe(true);
  });

  it("does not display a passed fixture with a finding as clean", () => {
    const atlas = buildStateAtlas({
      runPlan: makePlan(["overflow"]),
      executionSession: session([
        result("overflow", "passed", [overflowFinding("overflow")]),
      ]),
    });

    expect(atlas.entries[0]?.category).toBe("overflow-warning");
  });

  it("rejects duplicate plan fixtures, unknown results, and missing results", () => {
    const duplicatePlan = makePlan(["duplicate", "duplicate"]);
    expect(() =>
      buildStateAtlas({
        runPlan: duplicatePlan,
        executionSession: session([result("duplicate", "passed")]),
      }),
    ).toThrow(StateAtlasBuildError);

    expect(() =>
      buildStateAtlas({
        runPlan: makePlan(["known"]),
        executionSession: session([result("unknown", "passed")]),
      }),
    ).toThrow(/unknown fixture/);

    expect(() =>
      buildStateAtlas({
        runPlan: makePlan(["one", "two"]),
        executionSession: session([result("one", "passed")]),
      }),
    ).toThrow(/missing fixture/);
  });

  it("does not mutate the plan or execution session", () => {
    const runPlan = makePlan(["clean", "ai-overflow"]);
    const executionSession = session([
      result("clean", "passed"),
      result("ai-overflow", "passed", [overflowFinding("ai-overflow")]),
    ]);
    const beforePlan = JSON.stringify(runPlan);
    const beforeSession = JSON.stringify(executionSession);

    buildStateAtlas({ runPlan, executionSession });

    expect(JSON.stringify(runPlan)).toBe(beforePlan);
    expect(JSON.stringify(executionSession)).toBe(beforeSession);
  });
});
