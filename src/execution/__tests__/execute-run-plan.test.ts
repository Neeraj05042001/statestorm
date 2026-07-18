import { describe, expect, it } from "vitest";

import {
  ExecutionSessionResultSchema,
  type FixtureExecutionResult,
  type RunPlan,
} from "../../domain";
import {
  executeRunPlan,
  RunPlanExecutionInputError,
  type FixtureSandboxExecutor,
} from "../execute-run-plan";
import { createLatestExecutionGuard } from "../latest-execution-guard";

const componentSource = "export default function Card() { return <p>ok</p>; }";

function makePlan(ids: string[]): RunPlan {
  return {
    version: 1,
    submission: {
      id: "execution-test",
      prompt: "Render the component.",
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
      label: `Fixture ${id}`,
      origin: "deterministic" as const,
      intent: `Exercise ${id}`,
      props: {},
    })),
    issues: [],
  };
}

function result(
  fixtureId: string,
  status: FixtureExecutionResult["status"] = "passed",
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
  };
}

function idFactory() {
  let value = 0;
  return (prefix: "session" | "run") => `${prefix}-${++value}`;
}

describe("executeRunPlan", () => {
  it("executes fixtures strictly in source order with one active call", async () => {
    const order: string[] = [];
    let active = 0;
    let maximumActive = 0;
    const executor: FixtureSandboxExecutor = {
      async executeFixture({ fixture }) {
        active += 1;
        maximumActive = Math.max(maximumActive, active);
        order.push(fixture.id);
        await Promise.resolve();
        active -= 1;
        return result(fixture.id);
      },
    };

    const session = await executeRunPlan({
      runPlan: makePlan(["happy", "runtime", "later"]),
      componentSource,
      signal: new AbortController().signal,
      executor,
      createId: idFactory(),
    });

    expect(order).toEqual(["happy", "runtime", "later"]);
    expect(maximumActive).toBe(1);
    expect(session.results.map((entry) => entry.fixtureId)).toEqual(order);
  });

  it("records every classification and continues after failures", async () => {
    const statuses: FixtureExecutionResult["status"][] = [
      "passed",
      "runtime-error",
      "blank-render",
      "compile-error",
      "timeout",
      "infrastructure-error",
    ];
    const plan = makePlan(statuses.map((status) => `fixture-${status}`));
    const executor: FixtureSandboxExecutor = {
      async executeFixture({ fixture }) {
        const status = fixture.id.replace(
          "fixture-",
          "",
        ) as FixtureExecutionResult["status"];
        return result(fixture.id, status);
      },
    };

    const session = await executeRunPlan({
      runPlan: plan,
      componentSource,
      signal: new AbortController().signal,
      executor,
      createId: idFactory(),
    });

    expect(session.results.map((entry) => entry.status)).toEqual(statuses);
    expect(session.status).toBe("completed");
  });

  it("accepts twelve fixtures and rejects a thirteenth", async () => {
    let calls = 0;
    const executor: FixtureSandboxExecutor = {
      async executeFixture({ fixture }) {
        calls += 1;
        return result(fixture.id);
      },
    };
    await executeRunPlan({
      runPlan: makePlan(Array.from({ length: 12 }, (_, index) => `f-${index}`)),
      componentSource,
      signal: new AbortController().signal,
      executor,
      createId: idFactory(),
    });
    expect(calls).toBe(12);

    await expect(
      executeRunPlan({
        runPlan: makePlan(
          Array.from({ length: 13 }, (_, index) => `f-${index}`),
        ),
        componentSource,
        signal: new AbortController().signal,
        executor,
        createId: idFactory(),
      }),
    ).rejects.toBeInstanceOf(RunPlanExecutionInputError);
  });

  it("does not mutate the RunPlan or its fixtures", async () => {
    const plan = makePlan(["happy", "later"]);
    const before = JSON.stringify(plan);
    const executor: FixtureSandboxExecutor = {
      async executeFixture({ fixture }) {
        return result(fixture.id);
      },
    };
    await executeRunPlan({
      runPlan: plan,
      componentSource,
      signal: new AbortController().signal,
      executor,
      createId: idFactory(),
    });
    expect(JSON.stringify(plan)).toBe(before);
  });

  it("stops later fixtures when cancellation owns the active run", async () => {
    const controller = new AbortController();
    const calls: string[] = [];
    const executor: FixtureSandboxExecutor = {
      async executeFixture({ fixture }) {
        calls.push(fixture.id);
        controller.abort();
        return result(fixture.id);
      },
    };
    const session = await executeRunPlan({
      runPlan: makePlan(["first", "second"]),
      componentSource,
      signal: controller.signal,
      executor,
      createId: idFactory(),
    });

    expect(calls).toEqual(["first"]);
    expect(session.status).toBe("cancelled");
    expect(session.results[0]?.status).toBe("cancelled");
  });

  it("invalidates a replaced lease and ignores its stale completion", () => {
    const guard = createLatestExecutionGuard();
    const first = guard.begin();
    const second = guard.begin();

    expect(first.signal.aborted).toBe(true);
    expect(first.isCurrent()).toBe(false);
    expect(second.isCurrent()).toBe(true);
  });

  it("cancels the active lease when a new plan replaces its owner", () => {
    const guard = createLatestExecutionGuard();
    const active = guard.begin();

    guard.cancelCurrent();

    expect(active.signal.aborted).toBe(true);
    expect(active.isCurrent()).toBe(false);
  });

  it("creates a fresh session when the same plan runs again", async () => {
    const createId = idFactory();
    const executor: FixtureSandboxExecutor = {
      async executeFixture({ fixture }) {
        return result(fixture.id);
      },
    };
    const input = {
      runPlan: makePlan(["happy"]),
      componentSource,
      executor,
      createId,
    };

    const first = await executeRunPlan({
      ...input,
      signal: new AbortController().signal,
    });
    const second = await executeRunPlan({
      ...input,
      signal: new AbortController().signal,
    });

    expect(first.sessionId).not.toBe(second.sessionId);
  });

  it("sanitizes executor exceptions without exposing a stack", async () => {
    const executor: FixtureSandboxExecutor = {
      async executeFixture() {
        throw new Error("bounded failure");
      },
    };
    const session = await executeRunPlan({
      runPlan: makePlan(["failure"]),
      componentSource,
      signal: new AbortController().signal,
      executor,
      createId: idFactory(),
    });

    expect(session.results[0]).toMatchObject({
      status: "infrastructure-error",
      sanitizedMessage: "bounded failure",
    });
    expect(JSON.stringify(session)).not.toContain("execute-run-plan.test");
  });

  it("rejects a duplicate or mismatched fixture completion", async () => {
    let firstFixtureId = "";
    const executor: FixtureSandboxExecutor = {
      async executeFixture({ fixture }) {
        firstFixtureId ||= fixture.id;
        return result(firstFixtureId);
      },
    };
    const session = await executeRunPlan({
      runPlan: makePlan(["first", "second"]),
      componentSource,
      signal: new AbortController().signal,
      executor,
      createId: idFactory(),
    });

    expect(session.results[1]).toMatchObject({
      fixtureId: "second",
      status: "infrastructure-error",
    });
    expect(ExecutionSessionResultSchema.safeParse(session).success).toBe(true);
  });

  it("does not attach another fixture's visual finding", async () => {
    const executor: FixtureSandboxExecutor = {
      async executeFixture({ fixture }) {
        return {
          ...result(fixture.id),
          visualFindings: [
            {
              id: "detector-stale-overflow-1",
              fixtureId: "stale-fixture",
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
        } as FixtureExecutionResult;
      },
    };
    const session = await executeRunPlan({
      runPlan: makePlan(["current-fixture"]),
      componentSource,
      signal: new AbortController().signal,
      executor,
      createId: idFactory(),
    });

    expect(session.results[0]).toMatchObject({
      fixtureId: "current-fixture",
      status: "infrastructure-error",
    });
    expect(session.results[0]?.visualFindings).toBeUndefined();
  });

  it("requires the retained source from the validated plan", async () => {
    await expect(
      executeRunPlan({
        runPlan: makePlan(["first"]),
        componentSource: "export default function Other() { return null; }",
        signal: new AbortController().signal,
        executor: { executeFixture: async () => result("first") },
      }),
    ).rejects.toBeInstanceOf(RunPlanExecutionInputError);
  });
});
