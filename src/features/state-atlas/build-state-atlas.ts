import {
  ExecutionSessionResultSchema,
  RunPlanSchema,
  StateAtlasSchema,
  deriveStateAtlasCategory,
  type ExecutionSessionResult,
  type FixtureExecutionResult,
  type RunPlan,
  type StateAtlas,
} from "../../domain";

export class StateAtlasBuildError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StateAtlasBuildError";
  }
}

export function buildStateAtlas({
  runPlan,
  executionSession,
}: {
  runPlan: RunPlan;
  executionSession: ExecutionSessionResult;
}): StateAtlas {
  const parsedPlan = RunPlanSchema.safeParse(runPlan);
  if (!parsedPlan.success) {
    throw new StateAtlasBuildError("RunPlan input failed validation.");
  }
  const parsedSession = ExecutionSessionResultSchema.safeParse(executionSession);
  if (!parsedSession.success) {
    throw new StateAtlasBuildError("Execution session input failed validation.");
  }
  if (parsedSession.data.status !== "completed") {
    throw new StateAtlasBuildError(
      "A State Atlas requires a completed execution session.",
    );
  }

  const fixtureIds = new Set(
    parsedPlan.data.fixtures.map((fixture) => fixture.id),
  );
  const resultsByFixtureId = new Map<string, FixtureExecutionResult>();
  for (const result of parsedSession.data.results) {
    if (!fixtureIds.has(result.fixtureId)) {
      throw new StateAtlasBuildError(
        `Execution result references unknown fixture '${result.fixtureId}'.`,
      );
    }
    if (resultsByFixtureId.has(result.fixtureId)) {
      throw new StateAtlasBuildError(
        `Execution session contains duplicate fixture '${result.fixtureId}'.`,
      );
    }
    resultsByFixtureId.set(result.fixtureId, result);
  }

  const entries = parsedPlan.data.fixtures.map((fixture) => {
    const result = resultsByFixtureId.get(fixture.id);
    if (!result) {
      throw new StateAtlasBuildError(
        `Execution session is missing fixture '${fixture.id}'.`,
      );
    }
    const visualFindings = result.visualFindings ?? [];
    return {
      fixtureId: fixture.id,
      fixtureLabel: fixture.label,
      fixtureOrigin: fixture.origin,
      fixtureIntent: fixture.intent,
      fixtureProps: fixture.props,
      executionResult: result,
      visualFindings,
      category: deriveStateAtlasCategory(result, visualFindings),
    };
  });

  const atlas = {
    sessionId: parsedSession.data.sessionId,
    summary: {
      totalStates: entries.length,
      cleanStates: entries.filter((entry) => entry.category === "clean").length,
      runtimeFailures: entries.filter(
        (entry) => entry.executionResult.status === "runtime-error",
      ).length,
      blankRenders: entries.filter(
        (entry) => entry.executionResult.status === "blank-render",
      ).length,
      overflowWarnings: entries.filter((entry) =>
        entry.visualFindings.some(
          (finding) => finding.kind === "layout-overflow",
        ),
      ).length,
      brokenImages: entries.filter((entry) =>
        entry.visualFindings.some(
          (finding) => finding.kind === "broken-image",
        ),
      ).length,
      otherFailures: entries.filter((entry) =>
        [
          "compile-error",
          "timeout",
          "infrastructure-error",
          "cancelled",
        ].includes(entry.executionResult.status),
      ).length,
    },
    entries,
  };

  const parsedAtlas = StateAtlasSchema.safeParse(atlas);
  if (!parsedAtlas.success) {
    throw new StateAtlasBuildError("The final State Atlas failed validation.");
  }
  return parsedAtlas.data;
}
