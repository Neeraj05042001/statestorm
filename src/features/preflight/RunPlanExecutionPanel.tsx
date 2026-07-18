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

export type ExecutionWorkflowPhase = "ready" | "running" | "finished";

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
  const progressPercent =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const resultLabel = (fixtureId: string) =>
    runPlan.fixtures.find((fixture) => fixture.id === fixtureId)?.label ??
    "Recorded state";

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-950 p-5 text-white sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
              Execute and inspect
            </p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight">
              Run states in the isolated browser sandbox
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              StateStorm executes exactly one planned state at a time. Each sandbox
              lifecycle is removed before the next begins.
            </p>
          </div>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-100">
            {panelLabel(state)}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onStart}
            disabled={running || !adapterReady}
            className="rounded-lg bg-sky-400 px-5 py-2.5 text-sm font-semibold text-slate-950 outline-none transition-colors hover:bg-sky-300 focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:bg-slate-700 disabled:text-slate-400"
          >
            {state.status === "completed" || state.status === "cancelled"
              ? "Run preflight again"
              : "Run preflight"}
          </button>
          {running ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-white/25 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white outline-none transition-colors hover:border-rose-300 hover:text-rose-200 focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Cancel execution
            </button>
          ) : null}
          {!adapterReady ? (
            <span className="text-sm text-slate-400" role="status">
              Preparing the isolated runner…
            </span>
          ) : null}
        </div>
      </div>

      <div className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">Execution progress</p>
          <p className="mt-1 text-sm text-slate-600" aria-live="polite">
            {completedCount} of {totalCount} completed
          </p>
        </div>
        {state.status === "fixture-running" ? (
          <p className="text-sm text-slate-700">
            Current state: <strong>{state.fixture.label}</strong>
          </p>
        ) : null}
      </div>

      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-label="State execution progress"
        aria-valuemin={0}
        aria-valuemax={totalCount}
        aria-valuenow={completedCount}
      >
        <div
          className="h-full rounded-full bg-sky-600 transition-[width]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {state.status === "completed" ? (
        <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-900">
            {passedCount} rendered
          </span>
          <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-900">
            {failureCount} execution failures
          </span>
        </div>
      ) : null}
      {state.status === "infrastructure-failure" ? (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-950">
          {state.sanitizedMessage}
        </p>
      ) : null}

      <div className={state.status === "completed" ? "hidden" : "mt-5"}>
        <h4 className="text-sm font-semibold text-slate-950">Active isolated preview</h4>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          This preview belongs only to the current serialized state and is removed on completion or cancellation.
        </p>
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">{preview}</div>
      </div>

      {state.status === "completed" ? (
        <div className="mt-8 border-t border-slate-200 pt-8">
          <StateAtlas
            key={state.session.sessionId}
            atlas={state.atlas}
            runPlan={runPlan}
          />
        </div>
      ) : null}

      {results.length > 0 && state.status !== "completed" ? (
        <ol className="mt-5 grid gap-2 sm:grid-cols-2">
          {results.map((result) => (
            <li
              key={result.fixtureId}
              className="rounded-xl border border-slate-200 p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-800">
                  {resultLabel(result.fixtureId)}
                </span>
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
          <summary className="cursor-pointer rounded text-sm font-semibold text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2">
            Raw execution evidence ({results.length} states)
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
        Execution findings describe observed runtime and visual behavior. They do not verify prompt requirements.
      </p>
      </div>
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
  onExecutionPhaseChange,
}: {
  runPlan: RunPlan;
  onExecutionActiveChange?: (active: boolean) => void;
  onExecutionPhaseChange?: (phase: ExecutionWorkflowPhase) => void;
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
    onExecutionPhaseChange?.("running");

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
        onExecutionPhaseChange?.("finished");
      })
      .catch((error: unknown) => {
        if (!lease.isCurrent()) return;
        setState({
          status: "infrastructure-failure",
          sanitizedMessage: sanitizeExecutionMessage(error),
        });
        onExecutionActiveChange?.(false);
        onExecutionPhaseChange?.("finished");
      });
  }, [
    executor,
    guard,
    onExecutionActiveChange,
    onExecutionPhaseChange,
    runPlan,
  ]);

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
    onExecutionPhaseChange?.("finished");
  }, [
    guard,
    onExecutionActiveChange,
    onExecutionPhaseChange,
    runPlan.fixtures.length,
  ]);

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
