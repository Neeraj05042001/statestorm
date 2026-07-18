"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  type ExecutionSessionResult,
  type Fixture,
  type FixtureExecutionResult,
  type RunPlan,
  type StateAtlas as StateAtlasModel,
} from "../../domain";
import {
  executeRunPlan,
  type ExecutionProgress,
  type FixtureSandboxExecutor,
} from "../../execution/execute-run-plan";
import { createLatestExecutionGuard } from "../../execution/latest-execution-guard";
import { sanitizeExecutionMessage } from "../../execution/sanitize-execution-message";
import { RunPlanSandboxAdapterClient } from "../../execution/sandbox/RunPlanSandboxAdapterClient";
import { StateAtlas } from "../state-atlas/StateAtlas";
import { buildStateAtlas } from "../state-atlas/build-state-atlas";

export type ExecutionPanelState =
  | { status: "plan-ready" }
  | {
      status: "execution-starting";
      sessionId: string;
      completedCount: number;
      totalCount: number;
      results: readonly FixtureExecutionResult[];
    }
  | {
      status: "fixture-running";
      sessionId: string;
      fixture: Fixture;
      completedCount: number;
      totalCount: number;
      results: readonly FixtureExecutionResult[];
    }
  | {
      status: "completed";
      session: ExecutionSessionResult;
      atlas: StateAtlasModel;
      totalCount: number;
    }
  | {
      status: "cancelled";
      completedCount: number;
      totalCount: number;
      results: readonly FixtureExecutionResult[];
    }
  | { status: "infrastructure-failure"; sanitizedMessage: string };

function statusBadgeClass(status: FixtureExecutionResult["status"]): string {
  if (status === "passed") return "bg-emerald-100 text-emerald-900";
  if (status === "cancelled") return "bg-slate-200 text-slate-800";
  if (status === "timeout") return "bg-amber-100 text-amber-950";
  return "bg-rose-100 text-rose-950";
}

function panelLabel(state: ExecutionPanelState): string {
  if (state.status === "plan-ready") return "Plan ready";
  if (state.status === "execution-starting") return "Execution starting";
  if (state.status === "fixture-running") {
    return state.completedCount > 0 ? "Partially complete" : "Fixture running";
  }
  if (state.status === "cancelled") return "Cancelled";
  if (state.status === "infrastructure-failure") {
    return "Infrastructure failure";
  }
  if (!state.session.results.every((result) => result.status === "passed")) {
    return "Completed with failures";
  }
  return state.atlas.summary.overflowWarnings > 0 ||
    state.atlas.summary.brokenImages > 0
    ? "Completed with visual issues"
    : "Completed with all passing";
}

function stateResults(state: ExecutionPanelState) {
  if (
    state.status === "execution-starting" ||
    state.status === "fixture-running" ||
    state.status === "cancelled"
  ) {
    return state.results;
  }
  return state.status === "completed" ? state.session.results : [];
}

export function RunPlanExecutionView({
  runPlan,
  state,
  adapterReady,
  onStart,
  onCancel,
  preview,
}: {
  runPlan: RunPlan;
  state: ExecutionPanelState;
  adapterReady: boolean;
  onStart: () => void;
  onCancel: () => void;
  preview: ReactNode;
}) {
  const running =
    state.status === "execution-starting" || state.status === "fixture-running";
  const results = stateResults(state);
  const passedCount = results.filter((result) => result.status === "passed").length;
  const failureCount = results.filter(
    (result) => result.status !== "passed" && result.status !== "cancelled",
  ).length;
  const completedCount =
    state.status === "execution-starting" ||
    state.status === "fixture-running" ||
    state.status === "cancelled"
      ? state.completedCount
      : state.status === "completed"
        ? state.session.results.length
        : 0;
  const totalCount =
    state.status === "execution-starting" ||
    state.status === "fixture-running" ||
    state.status === "cancelled" ||
    state.status === "completed"
      ? state.totalCount
      : runPlan.fixtures.length;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">RunPlan execution</h3>
          <p className="mt-1 text-sm text-slate-600">
            {completedCount} of {totalCount} completed
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
          {panelLabel(state)}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onStart}
          disabled={running || !adapterReady}
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:bg-slate-300"
        >
          {state.status === "completed" || state.status === "cancelled"
            ? "Run again"
            : "Run planned states"}
        </button>
        {running ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800"
          >
            Cancel execution
          </button>
        ) : null}
      </div>

      {state.status === "fixture-running" ? (
        <p className="mt-4 text-sm text-slate-700">
          Current fixture: <strong>{state.fixture.label}</strong> (
          <code>{state.fixture.id}</code>)
        </p>
      ) : null}
      {state.status === "completed" ? (
        <p className="mt-4 text-sm font-medium text-slate-800">
          {passedCount} passed, {failureCount} failed
        </p>
      ) : null}
      {state.status === "infrastructure-failure" ? (
        <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-950">
          {state.sanitizedMessage}
        </p>
      ) : null}

      <div className={state.status === "completed" ? "hidden" : "mt-5"}>
        <h4 className="text-sm font-semibold">Active fixture preview</h4>
        <div className="mt-2">{preview}</div>
      </div>

      {state.status === "completed" ? (
        <div className="mt-6">
          <StateAtlas
            key={state.session.sessionId}
            atlas={state.atlas}
            runPlan={runPlan}
          />
        </div>
      ) : null}

      {results.length > 0 && state.status !== "completed" ? (
        <ol className="mt-5 space-y-2">
          {results.map((result) => (
            <li
              key={result.fixtureId}
              className="rounded-lg border border-slate-200 p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <code className="text-xs text-slate-700">
                  {result.fixtureId}
                </code>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${statusBadgeClass(result.status)}`}
                >
                  {result.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-700">{result.summary}</p>
              {result.sanitizedMessage ? (
                <p className="mt-1 text-sm text-rose-800">
                  {result.sanitizedMessage}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}

      {state.status === "completed" ? (
        <details className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-sky-600">
            Detailed execution evidence
          </summary>
          <ol className="mt-4 space-y-2">
            {results.map((result) => (
              <li
                key={result.fixtureId}
                className="rounded-lg border border-slate-200 bg-white p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <code className="text-xs text-slate-700">
                    {result.fixtureId}
                  </code>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${statusBadgeClass(result.status)}`}
                  >
                    {result.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-700">{result.summary}</p>
                {result.sanitizedMessage ? (
                  <p className="mt-1 text-sm text-rose-800">
                    {result.sanitizedMessage}
                  </p>
                ) : null}
                {result.detectorWarnings?.map((warning) => (
                  <p key={warning} className="mt-1 text-sm text-amber-800">
                    {warning}
                  </p>
                ))}
              </li>
            ))}
          </ol>
        </details>
      ) : null}

      <p className="mt-5 rounded-lg bg-sky-50 p-3 text-sm font-medium text-sky-950">
        Planned requirements are not automatically verified by execution yet.
      </p>
    </section>
  );
}

function progressToState(progress: ExecutionProgress): ExecutionPanelState {
  if (progress.phase === "starting") {
    return {
      status: "execution-starting",
      sessionId: progress.sessionId,
      completedCount: 0,
      totalCount: progress.totalCount,
      results: progress.results,
    };
  }
  if (progress.phase === "fixture-running") {
    return {
      status: "fixture-running",
      sessionId: progress.sessionId,
      fixture: progress.fixture,
      completedCount: progress.completedCount,
      totalCount: progress.totalCount,
      results: progress.results,
    };
  }
  if (progress.phase === "fixture-completed") {
    return {
      status: "fixture-running",
      sessionId: progress.sessionId,
      fixture: progress.fixture,
      completedCount: progress.completedCount,
      totalCount: progress.totalCount,
      results: progress.results,
    };
  }
  return {
    status: "cancelled",
    completedCount: progress.completedCount,
    totalCount: progress.totalCount,
    results: progress.results,
  };
}

export function RunPlanExecutionPanel({
  runPlan,
  onExecutionActiveChange,
}: {
  runPlan: RunPlan;
  onExecutionActiveChange?: (active: boolean) => void;
}) {
  const [state, setState] = useState<ExecutionPanelState>({
    status: "plan-ready",
  });
  const [executor, setExecutor] = useState<FixtureSandboxExecutor | null>(null);
  const [guard] = useState(createLatestExecutionGuard);

  useEffect(
    () => () => {
      guard.cancelCurrent();
      onExecutionActiveChange?.(false);
    },
    [guard, onExecutionActiveChange],
  );

  const handleExecutorChange = useCallback(
    (nextExecutor: FixtureSandboxExecutor | null) => {
      setExecutor(nextExecutor);
    },
    [],
  );

  const startExecution = useCallback(() => {
    if (!executor) return;
    const lease = guard.begin();
    onExecutionActiveChange?.(true);

    void executeRunPlan({
      runPlan,
      componentSource: runPlan.submission.componentCode,
      signal: lease.signal,
      executor,
      onProgress(progress) {
        if (!lease.isCurrent()) return;
        if (progress.phase !== "completed" && progress.phase !== "cancelled") {
          setState(progressToState(progress));
        }
      },
    })
      .then((session) => {
        if (!lease.isCurrent()) return;
        if (session.status === "completed") {
          setState({
            status: "completed",
            session,
            atlas: buildStateAtlas({ runPlan, executionSession: session }),
            totalCount: runPlan.fixtures.length,
          });
        } else {
          setState({
            status: "cancelled",
            completedCount: session.results.length,
            totalCount: runPlan.fixtures.length,
            results: session.results,
          });
        }
        onExecutionActiveChange?.(false);
      })
      .catch((error: unknown) => {
        if (!lease.isCurrent()) return;
        setState({
          status: "infrastructure-failure",
          sanitizedMessage: sanitizeExecutionMessage(error),
        });
        onExecutionActiveChange?.(false);
      });
  }, [executor, guard, onExecutionActiveChange, runPlan]);

  const cancelExecution = useCallback(() => {
    guard.cancelCurrent();
    setState((current) => {
      const results = stateResults(current);
      return {
        status: "cancelled",
        completedCount: results.length,
        totalCount: runPlan.fixtures.length,
        results,
      };
    });
    onExecutionActiveChange?.(false);
  }, [guard, onExecutionActiveChange, runPlan.fixtures.length]);

  return (
    <RunPlanExecutionView
      runPlan={runPlan}
      state={state}
      adapterReady={executor !== null}
      onStart={startExecution}
      onCancel={cancelExecution}
      preview={
        <RunPlanSandboxAdapterClient
          onExecutorChange={handleExecutorChange}
        />
      }
    />
  );
}
