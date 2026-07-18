import {
  ExecutionSessionResultSchema,
  FixtureExecutionResultSchema,
  FixtureSchema,
  RunPlanSchema,
  isRunPlanExecutable,
  type ExecutionSessionResult,
  type Fixture,
  type FixtureExecutionResult,
  type RunPlan,
} from "../domain";
import { sanitizeExecutionMessage } from "./sanitize-execution-message";

const EMPTY_EVIDENCE = {
  sandboxCompleted: false,
  renderCommitted: false,
  expectedDomFound: false,
  meaningfulDomFound: false,
} as const;

export interface FixtureSandboxExecutor {
  executeFixture(input: {
    sessionId: string;
    runId: string;
    fixture: Fixture;
    componentSource: string;
    language: "tsx" | "jsx";
    signal: AbortSignal;
  }): Promise<FixtureExecutionResult>;
}

export type ExecutionProgress =
  | {
      phase: "starting";
      sessionId: string;
      completedCount: 0;
      totalCount: number;
      results: readonly FixtureExecutionResult[];
    }
  | {
      phase: "fixture-running";
      sessionId: string;
      fixture: Fixture;
      completedCount: number;
      totalCount: number;
      results: readonly FixtureExecutionResult[];
    }
  | {
      phase: "fixture-completed";
      sessionId: string;
      fixture: Fixture;
      completedCount: number;
      totalCount: number;
      results: readonly FixtureExecutionResult[];
    }
  | {
      phase: "completed" | "cancelled";
      sessionId: string;
      completedCount: number;
      totalCount: number;
      results: readonly FixtureExecutionResult[];
    };

export interface ExecuteRunPlanInput {
  runPlan: RunPlan;
  componentSource: string;
  signal: AbortSignal;
  executor: FixtureSandboxExecutor;
  onProgress?: (progress: ExecutionProgress) => void;
  createId?: (prefix: "session" | "run") => string;
}

export class RunPlanExecutionInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RunPlanExecutionInputError";
  }
}

function createIdentifier(prefix: "session" | "run"): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function cancelledFixtureResult(fixtureId: string): FixtureExecutionResult {
  return {
    fixtureId,
    status: "cancelled",
    summary: "Fixture execution was cancelled.",
    evidence: { ...EMPTY_EVIDENCE },
  };
}

function infrastructureResult(
  fixtureId: string,
  error: unknown,
): FixtureExecutionResult {
  return {
    fixtureId,
    status: "infrastructure-error",
    summary: "StateStorm could not complete this sandbox fixture.",
    sanitizedMessage: sanitizeExecutionMessage(error),
    evidence: { ...EMPTY_EVIDENCE },
  };
}

function emitProgress(
  callback: ExecuteRunPlanInput["onProgress"],
  progress: ExecutionProgress,
): void {
  try {
    callback?.(progress);
  } catch {
    // A diagnostic UI callback cannot change execution ownership or outcomes.
  }
}

export async function executeRunPlan({
  runPlan,
  componentSource,
  signal,
  executor,
  onProgress,
  createId = createIdentifier,
}: ExecuteRunPlanInput): Promise<ExecutionSessionResult> {
  const parsedPlan = RunPlanSchema.safeParse(runPlan);
  if (!parsedPlan.success) {
    throw new RunPlanExecutionInputError("RunPlan input failed validation.");
  }
  if (!isRunPlanExecutable(parsedPlan.data)) {
    throw new RunPlanExecutionInputError(
      "RunPlan contains an error-severity contract issue and is not executable.",
    );
  }
  if (componentSource !== parsedPlan.data.submission.componentCode) {
    throw new RunPlanExecutionInputError(
      "Component source does not match the validated RunPlan submission.",
    );
  }

  const sessionId = createId("session");
  const results: FixtureExecutionResult[] = [];
  const totalCount = parsedPlan.data.fixtures.length;
  emitProgress(onProgress, {
    phase: "starting",
    sessionId,
    completedCount: 0,
    totalCount,
    results: [],
  });

  for (const plannedFixture of parsedPlan.data.fixtures) {
    if (signal.aborted) break;

    const fixture = FixtureSchema.parse(plannedFixture);
    emitProgress(onProgress, {
      phase: "fixture-running",
      sessionId,
      fixture,
      completedCount: results.length,
      totalCount,
      results: [...results],
    });

    let result: FixtureExecutionResult;
    try {
      const candidate = await executor.executeFixture({
        sessionId,
        runId: createId("run"),
        fixture,
        componentSource,
        language: parsedPlan.data.submission.language,
        signal,
      });

      if (signal.aborted) {
        result = cancelledFixtureResult(fixture.id);
      } else {
        const parsedResult = FixtureExecutionResultSchema.safeParse(candidate);
        result =
          parsedResult.success && parsedResult.data.fixtureId === fixture.id
            ? parsedResult.data
            : infrastructureResult(
                fixture.id,
                "The sandbox returned an invalid or mismatched fixture result.",
              );
      }
    } catch (error) {
      result = signal.aborted
        ? cancelledFixtureResult(fixture.id)
        : infrastructureResult(fixture.id, error);
    }

    results.push(result);
    emitProgress(onProgress, {
      phase: "fixture-completed",
      sessionId,
      fixture,
      completedCount: results.length,
      totalCount,
      results: [...results],
    });

    if (signal.aborted) break;
  }

  const status = signal.aborted ? "cancelled" : "completed";
  const sessionResult = ExecutionSessionResultSchema.parse({
    sessionId,
    status,
    results,
  });
  emitProgress(onProgress, {
    phase: status,
    sessionId,
    completedCount: results.length,
    totalCount,
    results: [...results],
  });
  return sessionResult;
}
