"use client";

import {
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
  useSandpack,
  type SandpackPreviewRef,
} from "@codesandbox/sandpack-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  FixtureExecutionResultSchema,
  type DetectorFinding,
  type FixtureExecutionResult,
} from "../../domain";
import { normalizeDetectorEvidence } from "../detectors";
import type { FixtureSandboxExecutor } from "../execute-run-plan";
import { sanitizeExecutionMessage } from "../sanitize-execution-message";
import { createRunPlanSandboxFiles } from "./create-runplan-sandbox-files";
import {
  hasPassedRuntimeSignals,
  hasSandboxSourceMarker,
  isBlankRuntimeRender,
  isExpectedMessageSource,
  isPlainObject,
  validateRunPlanSandboxEvent,
  type RunPlanSandboxEvent,
} from "./runtime-protocol";

const FIXTURE_TIMEOUT_MS = 10_000;
const DETECTOR_WAIT_TIMEOUT_MS = 1_750;

type ExecuteFixtureInput = Parameters<FixtureSandboxExecutor["executeFixture"]>[0];

interface ActiveExecution {
  input: ExecuteFixtureInput;
  nonce: string;
  resolve: (result: FixtureExecutionResult) => void;
  abortHandler: () => void;
}

interface ActiveFixtureSandboxProps {
  execution: ActiveExecution;
  onResult: (runId: string, result: FixtureExecutionResult) => void;
}

const EMPTY_EVIDENCE = {
  sandboxCompleted: false,
  renderCommitted: false,
  expectedDomFound: false,
  meaningfulDomFound: false,
} as const;

function summarizeCompileMessage(message: unknown): {
  confirmed: boolean;
  detail: string | null;
} {
  if (!isPlainObject(message) || typeof message.type !== "string") {
    return { confirmed: false, detail: null };
  }
  if (message.type === "done" && message.compilatonError === true) {
    return {
      confirmed: true,
      detail: "Sandpack reported a compilation diagnostic for the active fixture.",
    };
  }
  if (message.type === "action" && message.action === "show-error") {
    const detail = [message.title, message.path, message.message]
      .filter((value): value is string => typeof value === "string")
      .join(" | ");
    return {
      confirmed: false,
      detail: sanitizeExecutionMessage(
        detail || "Sandpack reported an active compilation error.",
      ),
    };
  }
  return { confirmed: false, detail: null };
}

function ActiveFixtureSandbox({
  execution,
  onResult,
}: ActiveFixtureSandboxProps) {
  const { sandpack } = useSandpack();
  const previewRef = useRef<SandpackPreviewRef>(null);
  const completedRef = useRef(false);
  const sandpackCompletedRef = useRef(false);
  const renderEventRef = useRef<
    Extract<RunPlanSandboxEvent, { type: "RENDER_COMMITTED" }> | null
  >(null);
  const runtimeErrorRef = useRef<
    Extract<RunPlanSandboxEvent, { type: "RUNTIME_ERROR" }> | null
  >(null);
  const compileMessageRef = useRef<string | null>(null);
  const detectorCompletedRef = useRef(false);
  const detectorWaitStartedRef = useRef(false);
  const detectorWaitTimeoutRef = useRef<number | null>(null);
  const visualFindingsRef = useRef<DetectorFinding[]>([]);
  const detectorWarningsRef = useRef<string[]>([]);
  const correlation = useMemo(
    () => ({
      sessionId: execution.input.sessionId,
      runId: execution.input.runId,
      fixtureId: execution.input.fixture.id,
      nonce: execution.nonce,
    }),
    [execution],
  );

  const complete = useCallback(
    (result: FixtureExecutionResult) => {
      if (completedRef.current) return;
      completedRef.current = true;
      if (detectorWaitTimeoutRef.current !== null) {
        window.clearTimeout(detectorWaitTimeoutRef.current);
        detectorWaitTimeoutRef.current = null;
      }
      onResult(
        execution.input.runId,
        FixtureExecutionResultSchema.parse(result),
      );
    },
    [execution.input.runId, onResult],
  );

  const completePassed = useCallback(() => {
    const evidence = renderEventRef.current?.evidence;
    const warnings = detectorWarningsRef.current;
    complete({
      fixtureId: execution.input.fixture.id,
      status: "passed",
      summary: "The fixture compiled and produced meaningful visible DOM.",
      evidence: {
        sandboxCompleted: true,
        renderCommitted: true,
        expectedDomFound: evidence?.expectedDomFound ?? false,
        meaningfulDomFound: evidence?.meaningfulDomFound ?? false,
      },
      visualFindings: visualFindingsRef.current,
      ...(warnings.length > 0 ? { detectorWarnings: warnings } : {}),
    });
  }, [complete, execution.input.fixture.id]);

  const completeFromSignals = useCallback(() => {
    const runtimeError = runtimeErrorRef.current;
    if (runtimeError) {
      complete({
        fixtureId: execution.input.fixture.id,
        status: "runtime-error",
        summary: "The component threw while rendering this fixture.",
        sanitizedMessage: sanitizeExecutionMessage(runtimeError.error.message),
        evidence: {
          sandboxCompleted: sandpackCompletedRef.current,
          renderCommitted: false,
          expectedDomFound: false,
          meaningfulDomFound: false,
        },
      });
      return;
    }

    const signals = {
      sandboxCompleted: sandpackCompletedRef.current,
      renderEvent: renderEventRef.current,
      runtimeError,
    };
    if (hasPassedRuntimeSignals(signals)) {
      if (detectorCompletedRef.current) {
        completePassed();
      } else if (!detectorWaitStartedRef.current) {
        detectorWaitStartedRef.current = true;
        detectorWaitTimeoutRef.current = window.setTimeout(() => {
          detectorCompletedRef.current = true;
          detectorWarningsRef.current = [
            "Visual detector evidence was unavailable within the bounded collection window.",
          ];
          completePassed();
        }, DETECTOR_WAIT_TIMEOUT_MS);
      }
      return;
    }

    if (isBlankRuntimeRender(signals)) {
      const evidence = renderEventRef.current?.evidence;
      complete({
        fixtureId: execution.input.fixture.id,
        status: "blank-render",
        summary: "Rendering completed without meaningful visible DOM.",
        evidence: {
          sandboxCompleted: true,
          renderCommitted: true,
          expectedDomFound: evidence?.expectedDomFound ?? false,
          meaningfulDomFound: evidence?.meaningfulDomFound ?? false,
        },
      });
    }
  }, [complete, completePassed, execution.input.fixture.id]);

  useEffect(() => {
    const handleMessage = (messageEvent: MessageEvent<unknown>) => {
      if (!hasSandboxSourceMarker(messageEvent.data)) return;

      const validation = validateRunPlanSandboxEvent(
        messageEvent.data,
        correlation,
      );
      if (!validation.ok) return;

      const iframeWindow = previewRef.current?.getClient()?.iframe.contentWindow;
      if (!isExpectedMessageSource(messageEvent.source, iframeWindow)) return;

      if (validation.event.type === "DETECTOR_EVIDENCE") {
        try {
          visualFindingsRef.current = normalizeDetectorEvidence({
            fixtureId: execution.input.fixture.id,
            observations: validation.event.observations,
          });
          detectorWarningsRef.current = validation.event.warnings;
        } catch {
          visualFindingsRef.current = [];
          detectorWarningsRef.current = [
            "Visual detector evidence failed validation and was not accepted.",
          ];
        }
        detectorCompletedRef.current = true;
      } else if (validation.event.type === "RUNTIME_ERROR") {
        runtimeErrorRef.current = validation.event;
      } else {
        renderEventRef.current = validation.event;
      }
      completeFromSignals();
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [completeFromSignals, correlation, execution.input.fixture.id]);

  useEffect(
    () => () => {
      if (detectorWaitTimeoutRef.current !== null) {
        window.clearTimeout(detectorWaitTimeoutRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    let observedClient = previewRef.current?.getClient() ?? null;
    let unsubscribe = observedClient?.listen((message: unknown) => {
      const compilation = summarizeCompileMessage(message);
      if (compilation.detail) compileMessageRef.current = compilation.detail;
      if (compilation.confirmed) {
        complete({
          fixtureId: execution.input.fixture.id,
          status: "compile-error",
          summary: "The submitted component did not compile for this fixture.",
          sanitizedMessage:
            compileMessageRef.current ??
            "Sandpack reported an active compilation error.",
          evidence: { ...EMPTY_EVIDENCE },
        });
        return;
      }

      if (
        isPlainObject(message) &&
        message.type === "done" &&
        message.compilatonError !== true
      ) {
        sandpackCompletedRef.current = true;
        completeFromSignals();
      }
    });

    const observeCurrentClient = () => {
      const currentClient = previewRef.current?.getClient() ?? null;
      if (currentClient !== observedClient) {
        unsubscribe?.();
        observedClient = currentClient;
        unsubscribe = currentClient?.listen((message: unknown) => {
          const compilation = summarizeCompileMessage(message);
          if (compilation.detail) compileMessageRef.current = compilation.detail;
          if (compilation.confirmed) {
            complete({
              fixtureId: execution.input.fixture.id,
              status: "compile-error",
              summary:
                "The submitted component did not compile for this fixture.",
              sanitizedMessage:
                compileMessageRef.current ??
                "Sandpack reported an active compilation error.",
              evidence: { ...EMPTY_EVIDENCE },
            });
          } else if (
            isPlainObject(message) &&
            message.type === "done" &&
            message.compilatonError !== true
          ) {
            sandpackCompletedRef.current = true;
            completeFromSignals();
          }
        });
      }
    };

    observeCurrentClient();
    const intervalId = window.setInterval(observeCurrentClient, 100);
    return () => {
      window.clearInterval(intervalId);
      unsubscribe?.();
    };
  }, [complete, completeFromSignals, execution.input.fixture.id]);

  useEffect(() => {
    if (sandpack.error === null || compileMessageRef.current === null) return;
    complete({
      fixtureId: execution.input.fixture.id,
      status: "compile-error",
      summary: "The submitted component did not compile for this fixture.",
      sanitizedMessage: compileMessageRef.current,
      evidence: { ...EMPTY_EVIDENCE },
    });
  }, [complete, execution.input.fixture.id, sandpack.error]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const signals = {
        sandboxCompleted: sandpackCompletedRef.current,
        renderEvent: renderEventRef.current,
        runtimeError: runtimeErrorRef.current,
      };
      if (hasPassedRuntimeSignals(signals)) {
        detectorCompletedRef.current = true;
        detectorWarningsRef.current = [
          "Visual detector evidence was unavailable before fixture cleanup.",
        ];
        completePassed();
        return;
      }
      complete({
        fixtureId: execution.input.fixture.id,
        status: "timeout",
        summary: `The fixture exceeded the ${FIXTURE_TIMEOUT_MS / 1_000}-second execution limit.`,
        evidence: {
          sandboxCompleted: sandpackCompletedRef.current,
          renderCommitted: renderEventRef.current !== null,
          expectedDomFound:
            renderEventRef.current?.evidence.expectedDomFound ?? false,
          meaningfulDomFound:
            renderEventRef.current?.evidence.meaningfulDomFound ?? false,
        },
      });
    }, FIXTURE_TIMEOUT_MS);
    return () => window.clearTimeout(timeoutId);
  }, [complete, completePassed, execution.input.fixture.id]);

  return (
    <SandpackLayout style={{ height: 360 }}>
      <SandpackPreview
        ref={previewRef}
        showNavigator={false}
        showOpenInCodeSandbox={false}
        showOpenNewtab={false}
        showRefreshButton={false}
        showRestartButton={false}
        showSandpackErrorOverlay
        style={{ height: "100%" }}
      />
    </SandpackLayout>
  );
}

export interface RunPlanSandboxAdapterProps {
  onExecutorChange: (executor: FixtureSandboxExecutor | null) => void;
}

export default function RunPlanSandboxAdapter({
  onExecutorChange,
}: RunPlanSandboxAdapterProps) {
  const [activeExecution, setActiveExecution] =
    useState<ActiveExecution | null>(null);
  const activeRef = useRef<ActiveExecution | null>(null);
  const callbackRef = useRef(onExecutorChange);

  useEffect(() => {
    callbackRef.current = onExecutorChange;
  }, [onExecutorChange]);

  const finishActive = useCallback(
    (runId: string, result: FixtureExecutionResult) => {
      const active = activeRef.current;
      if (!active || active.input.runId !== runId) return;

      active.input.signal.removeEventListener("abort", active.abortHandler);
      activeRef.current = null;
      setActiveExecution(null);
      window.setTimeout(() => active.resolve(result), 0);
    },
    [],
  );

  const executor = useMemo<FixtureSandboxExecutor>(
    () => ({
      executeFixture(input) {
        if (input.signal.aborted) {
          return Promise.resolve({
            fixtureId: input.fixture.id,
            status: "cancelled",
            summary: "Fixture execution was cancelled.",
            evidence: { ...EMPTY_EVIDENCE },
          });
        }
        if (activeRef.current) {
          return Promise.resolve({
            fixtureId: input.fixture.id,
            status: "infrastructure-error",
            summary: "A sandbox fixture is already active.",
            sanitizedMessage:
              "StateStorm permits only one active Sandpack iframe.",
            evidence: { ...EMPTY_EVIDENCE },
          });
        }

        return new Promise<FixtureExecutionResult>((resolve) => {
          const nonce = `nonce-${crypto.randomUUID()}`;
          const abortHandler = () => {
            finishActive(input.runId, {
              fixtureId: input.fixture.id,
              status: "cancelled",
              summary: "Fixture execution was cancelled.",
              evidence: { ...EMPTY_EVIDENCE },
            });
          };
          const active = { input, nonce, resolve, abortHandler };
          activeRef.current = active;
          input.signal.addEventListener("abort", abortHandler, { once: true });
          setActiveExecution(active);
        });
      },
    }),
    [finishActive],
  );

  useEffect(() => {
    callbackRef.current(executor);
    return () => {
      callbackRef.current(null);
      const active = activeRef.current;
      if (active) {
        active.input.signal.removeEventListener("abort", active.abortHandler);
        activeRef.current = null;
        active.resolve({
          fixtureId: active.input.fixture.id,
          status: "cancelled",
          summary: "Fixture execution was cancelled.",
          evidence: { ...EMPTY_EVIDENCE },
        });
      }
    };
  }, [executor]);

  if (!activeExecution) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
        The isolated preview will appear here while a fixture is running.
      </div>
    );
  }

  const files = createRunPlanSandboxFiles({
    sessionId: activeExecution.input.sessionId,
    runId: activeExecution.input.runId,
    fixtureId: activeExecution.input.fixture.id,
    nonce: activeExecution.nonce,
    fixture: activeExecution.input.fixture,
    componentSource: activeExecution.input.componentSource,
    language: activeExecution.input.language,
  });

  return (
    <SandpackProvider
      key={activeExecution.input.runId}
      template="react-ts"
      files={files}
      options={{
        activeFile: "/src/SubmittedComponent.tsx",
        visibleFiles: [
          "/src/SubmittedComponent.tsx",
          "/src/fixture-data.ts",
          "/src/runtime-bridge.tsx",
          "/src/App.tsx",
        ],
        autorun: true,
        autoReload: true,
        initMode: "immediate",
        recompileMode: "immediate",
      }}
    >
      <ActiveFixtureSandbox
        execution={activeExecution}
        onResult={finishActive}
      />
    </SandpackProvider>
  );
}
