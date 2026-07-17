"use client";

import {
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
  useSandpack,
  type SandpackPreviewRef,
} from "@codesandbox/sandpack-react";
import { useCallback, useEffect, useRef, useState } from "react";

import ParentHeartbeat from "./components/ParentHeartbeat";
import RunLog, { type RunLogEntry } from "./components/RunLog";
import {
  createCurrentFixtureFile,
  createSandboxFiles,
  INVALID_USER_COMPONENT_SOURCE,
  USER_COMPONENT_SOURCE,
} from "./create-sandbox-files";
import { getFixture, type FixtureId } from "./fixtures";
import {
  hasSandboxSourceMarker,
  isPlainObject,
  PROVISIONAL_INITIALIZATION_TIMEOUT_MS,
  PROVISIONAL_RUN_TIMEOUT_MS,
  sanitizeParentDiagnostic,
  type SandboxEvent,
  type SandboxComponentMode,
  type SandboxReadyEvidence,
  type SandboxRun,
  type VisibleRenderEvidence,
  validateSandboxEvent,
} from "./protocol";

type ValidFixtureId = "safe-short" | "safe-long";
type RunnableFixtureId = ValidFixtureId | "runtime-crash";

type GateZeroState =
  | "sandpack-initializing"
  | "sandpack-ready"
  | "compiling-current-run"
  | "restoring-valid-source"
  | "compiler-recovery-verified"
  | "component-visibly-rendered"
  | "runtime-error"
  | "compilation-diagnostic-error"
  | "timed-out"
  | "initialization-failure"
  | "run-failure";

interface IframeSnapshot {
  sourceAttribute: string | null;
  resolvedSource: string | null;
  origin: string | null;
  sandboxAttribute: string | null;
  allowAttribute: string | null;
  crossOrigin: boolean | null;
  contentWindowAvailable: boolean;
  clientStatus: string;
}

interface SandpackMessageSummary {
  eventType: string;
  outcome: RunLogEntry["outcome"];
  detail: string;
  compilationFailure: boolean;
  clientDone: boolean;
  status: string | null;
}

interface InitializationSignals {
  clientDone: boolean;
  visibleRuntimeReady: boolean;
}

interface RunSignals {
  clientDone: boolean;
  renderEvent: Extract<SandboxEvent, { type: "RENDER_COMMITTED" }> | null;
}

interface RestorationSignals {
  compileStarted: boolean;
  clientDone: boolean;
  contextErrorCleared: boolean;
  bootstrapEvent: Extract<SandboxEvent, { type: "SANDBOX_READY" }> | null;
}

const STATE_LABELS: Record<GateZeroState, string> = {
  "sandpack-initializing": "Sandpack initializing",
  "sandpack-ready": "Sandpack ready",
  "compiling-current-run": "Compiling current run",
  "restoring-valid-source": "Restoring valid source",
  "compiler-recovery-verified": "Compiler recovery verified",
  "component-visibly-rendered": "Component visibly rendered",
  "runtime-error": "Runtime error",
  "compilation-diagnostic-error": "Compilation diagnostic error",
  "timed-out": "Timed out",
  "initialization-failure": "Initialization failure",
  "run-failure": "Run failure",
};

const MAX_LOG_ENTRIES = 80;
const RESOLVED_TEMPLATE_NAME = "react-ts";
const RESOLVED_ENTRY_FILE = "/index.tsx";
const CUSTOM_SETUP_DESCRIPTION = "none";

function createIdentifier(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function createRun(
  fixtureId: FixtureId,
  nonce: string,
  componentMode: SandboxComponentMode,
): SandboxRun {
  return {
    runId: createIdentifier("run"),
    fixtureId,
    nonce,
    componentMode,
    props: getFixture(fixtureId).props,
  };
}

function describeSandpackContextError(
  error: {
    title?: string;
    path?: string;
    message: string;
    line?: number;
    column?: number;
  } | null,
): string {
  if (!error) {
    return "null";
  }

  return sanitizeParentDiagnostic(
    [
      error.title,
      error.path,
      error.message,
      error.line === undefined ? undefined : `line=${error.line}`,
      error.column === undefined ? undefined : `column=${error.column}`,
    ]
      .filter((value): value is string => typeof value === "string")
      .join(" | "),
  );
}

function summarizeSandpackMessage(message: unknown): SandpackMessageSummary | null {
  if (!isPlainObject(message) || typeof message.type !== "string") {
    return null;
  }

  if (message.type === "action" && message.action === "show-error") {
    const detail = [message.title, message.path, message.message]
      .filter((value): value is string => typeof value === "string")
      .join(" | ");

    return {
      eventType: "SANDPACK:action/show-error",
      outcome: "failure",
      detail: sanitizeParentDiagnostic(detail || "Sandpack reported an error action."),
      compilationFailure: true,
      clientDone: false,
      status: "error",
    };
  }

  if (message.type === "done") {
    const compilationFailure = message.compilatonError === true;
    return {
      eventType: "SANDPACK:done",
      outcome: compilationFailure ? "failure" : "diagnostic",
      detail: `compilatonError=${String(message.compilatonError)}`,
      compilationFailure,
      clientDone: !compilationFailure,
      status: compilationFailure ? "compile-error" : "done",
    };
  }

  if (message.type === "status" && typeof message.status === "string") {
    return {
      eventType: "SANDPACK:status",
      outcome: "diagnostic",
      detail: `status=${sanitizeParentDiagnostic(message.status)}`,
      compilationFailure: false,
      clientDone: false,
      status: message.status,
    };
  }

  if (
    message.type === "initialized" ||
    message.type === "start" ||
    message.type === "success"
  ) {
    return {
      eventType: `SANDPACK:${message.type}`,
      outcome: "diagnostic",
      detail: "Observed through the installed Sandpack listener API.",
      compilationFailure: false,
      clientDone: false,
      status: message.type,
    };
  }

  return null;
}

function describeVisibleEvidence(evidence: VisibleRenderEvidence): string {
  return [
    `children=${evidence.renderedRootChildCount}`,
    `textLength=${evidence.renderedTextLength}`,
    `marker=${evidence.diagnosticMarkerPresent}`,
    `title=${evidence.expectedTitlePresent}`,
    `description=${evidence.expectedDescriptionPresent}`,
    `layoutBox=${evidence.hasLayoutBox}`,
  ].join("; ");
}

function SandboxController({ initialRun }: { initialRun: SandboxRun }) {
  const { sandpack } = useSandpack();
  const previewRef = useRef<SandpackPreviewRef>(null);
  const activeRunRef = useRef(initialRun);
  const latestFixtureIdRef = useRef<ValidFixtureId>("safe-short");
  const sandboxReadyRef = useRef(false);
  const initializationSignalsRef = useRef<InitializationSignals>({
    clientDone: false,
    visibleRuntimeReady: false,
  });
  const runSignalsRef = useRef<RunSignals>({
    clientDone: false,
    renderEvent: null,
  });
  const restorationSignalsRef = useRef<RestorationSignals>({
    compileStarted: false,
    clientDone: false,
    contextErrorCleared: false,
    bootstrapEvent: null,
  });
  const completedRunIdRef = useRef<string | null>(null);
  const completedRestorationRunIdRef = useRef<string | null>(null);
  const sandpackErrorRef = useRef(sandpack.error);

  const [activeRun, setActiveRun] = useState(initialRun);
  const [latestFixtureId, setLatestFixtureId] =
    useState<ValidFixtureId>("safe-short");
  const [gateState, setGateState] = useState<GateZeroState>(
    "sandpack-initializing",
  );
  const [stateDetail, setStateDetail] = useState(
    "Waiting for the Sandpack client and a visibly rendered bootstrap root.",
  );
  const [sandboxReady, setSandboxReady] = useState(false);
  const [runInFlight, setRunInFlight] = useState(false);
  const [lastSandpackStatus, setLastSandpackStatus] = useState("initial");
  const [lastAcceptedRuntimeEvent, setLastAcceptedRuntimeEvent] =
    useState("none");
  const [lastRejectedStaleEvent, setLastRejectedStaleEvent] = useState("none");
  const [compilationContextBefore, setCompilationContextBefore] =
    useState("not captured");
  const [compilationListenerEvents, setCompilationListenerEvents] = useState<
    string[]
  >([]);
  const [compilationClassification, setCompilationClassification] = useState<
    "not run" | "provisional"
  >("not run");
  const [invalidRuntimeBridgeObservation, setInvalidRuntimeBridgeObservation] =
    useState("not investigated");
  const [restorationEvidence, setRestorationEvidence] = useState(
    "not started",
  );
  const [visibleEvidence, setVisibleEvidence] =
    useState<VisibleRenderEvidence | null>(null);
  const [readyEvidence, setReadyEvidence] =
    useState<SandboxReadyEvidence | null>(null);
  const [observedMessageOrigin, setObservedMessageOrigin] =
    useState<string | null>(null);
  const [sourceEqualitySucceeded, setSourceEqualitySucceeded] = useState<
    boolean | null
  >(null);
  const [iframeSnapshot, setIframeSnapshot] = useState<IframeSnapshot>({
    sourceAttribute: null,
    resolvedSource: null,
    origin: null,
    sandboxAttribute: null,
    allowAttribute: null,
    crossOrigin: null,
    contentWindowAvailable: false,
    clientStatus: "unavailable",
  });
  const [logs, setLogs] = useState<RunLogEntry[]>(() => [
    {
      id: createIdentifier("log"),
      timestamp: new Date().toISOString(),
      runId: initialRun.runId,
      fixtureId: initialRun.fixtureId,
      eventType: "INITIALIZATION_STARTED",
      outcome: "pending",
      detail: "Bootstrap is not accepted as a fixture success.",
    },
  ]);

  const appendLog = useCallback(
    (entry: Omit<RunLogEntry, "id" | "timestamp">) => {
      setLogs((currentEntries) =>
        [
          {
            ...entry,
            id: createIdentifier("log"),
            timestamp: new Date().toISOString(),
          },
          ...currentEntries,
        ].slice(0, MAX_LOG_ENTRIES),
      );
    },
    [],
  );

  const captureIframeSnapshot = useCallback(() => {
    const client = previewRef.current?.getClient();
    const iframe = client?.iframe;

    if (!iframe) {
      return;
    }

    const resolvedSource = iframe.src || null;
    let origin: string | null = null;

    if (resolvedSource) {
      try {
        origin = new URL(resolvedSource, window.location.href).origin;
      } catch {
        origin = null;
      }
    }

    const nextSnapshot: IframeSnapshot = {
      sourceAttribute: iframe.getAttribute("src"),
      resolvedSource,
      origin,
      sandboxAttribute: iframe.getAttribute("sandbox"),
      allowAttribute: iframe.getAttribute("allow"),
      crossOrigin: origin === null ? null : origin !== window.location.origin,
      contentWindowAvailable: iframe.contentWindow !== null,
      clientStatus: client?.status ?? "unavailable",
    };

    setIframeSnapshot((currentSnapshot) =>
      JSON.stringify(currentSnapshot) === JSON.stringify(nextSnapshot)
        ? currentSnapshot
        : nextSnapshot,
    );
  }, []);

  const completeInitializationIfReady = useCallback(() => {
    const signals = initializationSignalsRef.current;
    const currentClient = previewRef.current?.getClient();
    if (
      sandboxReadyRef.current ||
      !signals.clientDone ||
      !signals.visibleRuntimeReady ||
      currentClient?.status !== "done"
    ) {
      return;
    }

    sandboxReadyRef.current = true;
    setSandboxReady(true);
    setGateState("sandpack-ready");
    setStateDetail(
      "The client is done and the bootstrap root contains confirmed visible output. Fixture controls are enabled.",
    );
    appendLog({
      runId: activeRunRef.current.runId,
      fixtureId: activeRunRef.current.fixtureId,
      eventType: "INITIALIZATION_READY",
      outcome: "success",
      detail: "Sandpack done + visible runtime-ready evidence.",
    });
  }, [appendLog]);

  const completeRunIfReady = useCallback(() => {
    const signals = runSignalsRef.current;
    const currentRun = activeRunRef.current;
    const currentClient = previewRef.current?.getClient();
    if (
      currentRun.componentMode !== "valid" ||
      completedRunIdRef.current === currentRun.runId ||
      sandpackErrorRef.current !== null ||
      !signals.clientDone ||
      !signals.renderEvent ||
      currentClient?.status !== "done"
    ) {
      return;
    }

    completedRunIdRef.current = currentRun.runId;
    setVisibleEvidence(signals.renderEvent.evidence);
    setGateState("component-visibly-rendered");
    setStateDetail(
      `${currentRun.fixtureId} compiled and produced correlated visible-output evidence.`,
    );
    setRunInFlight(false);
    appendLog({
      runId: currentRun.runId,
      fixtureId: currentRun.fixtureId,
      eventType: "RUN_CONFIRMED_VISIBLE",
      outcome: "success",
      detail: describeVisibleEvidence(signals.renderEvent.evidence),
    });
  }, [appendLog]);

  const completeRestorationIfReady = useCallback(() => {
    const signals = restorationSignalsRef.current;
    const currentRun = activeRunRef.current;
    const currentClient = previewRef.current?.getClient();
    if (
      currentRun.componentMode !== "recovery-bootstrap" ||
      completedRestorationRunIdRef.current === currentRun.runId ||
      !signals.compileStarted ||
      !signals.clientDone ||
      !signals.contextErrorCleared ||
      !signals.bootstrapEvent ||
      sandpackErrorRef.current !== null ||
      currentClient?.status !== "done"
    ) {
      return;
    }

    completedRestorationRunIdRef.current = currentRun.runId;
    setVisibleEvidence(signals.bootstrapEvent.evidence);
    setReadyEvidence(signals.bootstrapEvent.evidence);
    setGateState("compiler-recovery-verified");
    setStateDetail(
      "Valid source reached the current client, its compile completed, the context error cleared, and a fresh bootstrap event was accepted.",
    );
    setRestorationEvidence(
      "verified: current-client start + successful done + null context error + fresh SANDBOX_READY",
    );
    setRunInFlight(false);
    appendLog({
      runId: currentRun.runId,
      fixtureId: currentRun.fixtureId,
      eventType: "COMPILER_RECOVERY_CONFIRMED",
      outcome: "success",
      detail:
        "Current client completed restored source with a null context error and fresh bootstrap evidence.",
    });
  }, [appendLog]);

  useEffect(() => {
    captureIframeSnapshot();
    const intervalId = window.setInterval(captureIframeSnapshot, 500);
    return () => window.clearInterval(intervalId);
  }, [captureIframeSnapshot]);

  useEffect(() => {
    const handleSandboxMessage = (messageEvent: MessageEvent<unknown>) => {
      if (!hasSandboxSourceMarker(messageEvent.data)) {
        return;
      }

      const expectedRun = activeRunRef.current;
      const validation = validateSandboxEvent(messageEvent.data, expectedRun);

      if (!validation.ok) {
        const rejectedDetail = `${validation.reason} expectedRun=${expectedRun.runId}`;
        setLastRejectedStaleEvent(rejectedDetail);
        appendLog({
          runId: expectedRun.runId,
          fixtureId: expectedRun.fixtureId,
          eventType: "REJECTED_STALE_OR_MISMATCHED_EVENT",
          outcome: "rejected",
          detail: rejectedDetail,
        });
        return;
      }

      const iframeWindow = previewRef.current?.getClient()?.iframe.contentWindow;
      if (!iframeWindow || messageEvent.source !== iframeWindow) {
        const rejectedDetail = iframeWindow
          ? "MessageEvent.source did not equal the preview iframe window."
          : "The preview iframe window was unavailable for source validation.";
        setSourceEqualitySucceeded(false);
        setLastRejectedStaleEvent(rejectedDetail);
        appendLog({
          runId: validation.event.runId,
          fixtureId: validation.event.fixtureId,
          eventType: "REJECTED_MESSAGE_SOURCE",
          outcome: "rejected",
          detail: rejectedDetail,
        });
        return;
      }

      setSourceEqualitySucceeded(true);
      setObservedMessageOrigin(messageEvent.origin);
      setLastAcceptedRuntimeEvent(
        `${validation.event.type} / ${validation.event.runId} / ${validation.event.componentMode}`,
      );
      captureIframeSnapshot();

      if (validation.event.type === "SANDBOX_READY") {
        setReadyEvidence(validation.event.evidence);
        setVisibleEvidence(validation.event.evidence);
        appendLog({
          runId: validation.event.runId,
          fixtureId: validation.event.fixtureId,
          eventType: validation.event.type,
          outcome: "diagnostic",
          detail: describeVisibleEvidence(validation.event.evidence),
        });

        if (validation.event.componentMode === "recovery-bootstrap") {
          restorationSignalsRef.current.bootstrapEvent = validation.event;
          setRestorationEvidence(
            "fresh SANDBOX_READY accepted; waiting for current-client completion and null context error",
          );
          completeRestorationIfReady();
          return;
        }

        initializationSignalsRef.current.visibleRuntimeReady = true;
        completeInitializationIfReady();
        return;
      }

      if (validation.event.type === "RENDER_COMMITTED") {
        runSignalsRef.current.renderEvent = validation.event;
        appendLog({
          runId: validation.event.runId,
          fixtureId: validation.event.fixtureId,
          eventType: validation.event.type,
          outcome: "diagnostic",
          detail: describeVisibleEvidence(validation.event.evidence),
        });
        completeRunIfReady();
        return;
      }

      if (validation.event.type === "RENDER_EVIDENCE_MISSING") {
        setVisibleEvidence(validation.event.evidence);
        setRunInFlight(false);
        if (validation.event.componentMode === "bootstrap") {
          setGateState("initialization-failure");
        } else {
          setGateState("run-failure");
        }
        setStateDetail(validation.event.message);
        appendLog({
          runId: validation.event.runId,
          fixtureId: validation.event.fixtureId,
          eventType: validation.event.type,
          outcome: "failure",
          detail: describeVisibleEvidence(validation.event.evidence),
        });
        return;
      }

      setRunInFlight(false);
      setGateState(
        validation.event.componentMode === "bootstrap"
          ? "initialization-failure"
          : "runtime-error",
      );
      setStateDetail(validation.event.error.message);
      appendLog({
        runId: validation.event.runId,
        fixtureId: validation.event.fixtureId,
        eventType: validation.event.type,
        outcome: "failure",
        detail: sanitizeParentDiagnostic(validation.event.error.message),
      });
    };

    window.addEventListener("message", handleSandboxMessage);
    return () => window.removeEventListener("message", handleSandboxMessage);
  }, [
    appendLog,
    captureIframeSnapshot,
    completeInitializationIfReady,
    completeRestorationIfReady,
    completeRunIfReady,
  ]);

  const handleSandpackMessage = useCallback(
    (message: unknown) => {
      const summary = summarizeSandpackMessage(message);
      if (!summary) {
        return;
      }

      const currentRun = activeRunRef.current;
      if (summary.status) {
        setLastSandpackStatus(summary.status);
      }
      appendLog({
        runId: currentRun.runId,
        fixtureId: currentRun.fixtureId,
        eventType: summary.eventType,
        outcome: summary.outcome,
        detail: summary.detail,
      });

      if (currentRun.componentMode === "invalid-compilation-probe") {
        setCompilationListenerEvents((currentEvents) =>
          [...currentEvents, `${summary.eventType}: ${summary.detail}`].slice(-20),
        );
      }

      if (
        currentRun.componentMode === "recovery-bootstrap" &&
        summary.eventType === "SANDPACK:start"
      ) {
        restorationSignalsRef.current.compileStarted = true;
        setRestorationEvidence(
          "current client reported start for restored source; waiting for successful done, null context error, and fresh SANDBOX_READY",
        );
      }

      if (summary.compilationFailure) {
        if (currentRun.componentMode === "invalid-compilation-probe") {
          setRunInFlight(false);
          setGateState("compilation-diagnostic-error");
          setStateDetail(summary.detail);
          setCompilationClassification("provisional");
          setInvalidRuntimeBridgeObservation(
            "No correlated runtime-bridge event was observed for the invalid source.",
          );
          return;
        }

        if (currentRun.componentMode === "bootstrap") {
          setRunInFlight(false);
          setGateState("initialization-failure");
          setStateDetail(summary.detail);
          return;
        }

        appendLog({
          runId: currentRun.runId,
          fixtureId: currentRun.fixtureId,
          eventType: "UNATTRIBUTED_COMPILATION_ERROR_IGNORED",
          outcome: "rejected",
          detail:
            "The listener error has no run correlation; the active run still requires its own completion and runtime evidence.",
        });
        if (currentRun.componentMode === "recovery-bootstrap") {
          setStateDetail(
            "An uncorrelated previous compilation error was ignored while verified source restoration continues.",
          );
          setRestorationEvidence(
            "uncorrelated listener error ignored; recovery remains serialized and in flight",
          );
        }
        return;
      }

      if (!summary.clientDone) {
        return;
      }

      if (currentRun.componentMode === "bootstrap") {
        initializationSignalsRef.current.clientDone = true;
        completeInitializationIfReady();
        return;
      }

      if (currentRun.componentMode === "recovery-bootstrap") {
        if (!restorationSignalsRef.current.compileStarted) {
          appendLog({
            runId: currentRun.runId,
            fixtureId: currentRun.fixtureId,
            eventType: "RECOVERY_DONE_BEFORE_START_REJECTED",
            outcome: "rejected",
            detail:
              "A successful done signal was not accepted without a start for restored source.",
          });
          return;
        }

        restorationSignalsRef.current.clientDone = true;
        setRestorationEvidence(
          "current client reported successful done; waiting for null context error and fresh SANDBOX_READY",
        );
        completeRestorationIfReady();
        return;
      }

      runSignalsRef.current.clientDone = true;
      completeRunIfReady();
    },
    [
      appendLog,
      completeInitializationIfReady,
      completeRestorationIfReady,
      completeRunIfReady,
    ],
  );

  useEffect(() => {
    let observedClient = previewRef.current?.getClient() ?? null;
    let unsubscribe = observedClient?.listen(handleSandpackMessage);

    const observeCurrentClient = () => {
      const currentClient = previewRef.current?.getClient() ?? null;

      if (currentClient !== observedClient) {
        unsubscribe?.();
        observedClient = currentClient;
        initializationSignalsRef.current.clientDone = false;
        runSignalsRef.current.clientDone = false;
        restorationSignalsRef.current = {
          compileStarted: false,
          clientDone: false,
          contextErrorCleared: sandpackErrorRef.current === null,
          bootstrapEvent: null,
        };
        unsubscribe = currentClient?.listen(handleSandpackMessage);
      }

      if (currentClient) {
        setLastSandpackStatus(currentClient.status);
      }

      if (currentClient?.status === "done") {
        if (activeRunRef.current.componentMode === "bootstrap") {
          initializationSignalsRef.current.clientDone = true;
          completeInitializationIfReady();
        } else if (activeRunRef.current.componentMode === "valid") {
          runSignalsRef.current.clientDone = true;
          completeRunIfReady();
        } else if (
          activeRunRef.current.componentMode === "recovery-bootstrap"
        ) {
          completeRestorationIfReady();
        }
      }
    };

    observeCurrentClient();
    const intervalId = window.setInterval(observeCurrentClient, 100);

    return () => {
      window.clearInterval(intervalId);
      unsubscribe?.();
    };
  }, [
    completeInitializationIfReady,
    completeRestorationIfReady,
    completeRunIfReady,
    handleSandpackMessage,
  ]);

  useEffect(() => {
    sandpackErrorRef.current = sandpack.error;

    if (activeRun.componentMode === "valid" && sandpack.error === null) {
      const completionCheck = window.setTimeout(completeRunIfReady, 0);

      return () => window.clearTimeout(completionCheck);
    }

    if (activeRun.componentMode !== "recovery-bootstrap") {
      return;
    }

    restorationSignalsRef.current.contextErrorCleared = sandpack.error === null;
    if (sandpack.error !== null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setRestorationEvidence(
        "Sandpack context error is null; waiting for current-client completion and fresh SANDBOX_READY",
      );
      completeRestorationIfReady();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [
    activeRun.componentMode,
    completeRestorationIfReady,
    completeRunIfReady,
    sandpack.error,
  ]);

  useEffect(() => {
    if (sandboxReady) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (sandboxReadyRef.current) {
        return;
      }

      setGateState("initialization-failure");
      setStateDetail(
        `Sandpack did not reach client-done plus visible-runtime-ready within ${PROVISIONAL_INITIALIZATION_TIMEOUT_MS} ms.`,
      );
      appendLog({
        runId: activeRunRef.current.runId,
        fixtureId: activeRunRef.current.fixtureId,
        eventType: "INITIALIZATION_TIMEOUT",
        outcome: "failure",
        detail: `Provisional timeout: ${PROVISIONAL_INITIALIZATION_TIMEOUT_MS} ms.`,
      });
    }, PROVISIONAL_INITIALIZATION_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [appendLog, sandboxReady]);

  useEffect(() => {
    if (!runInFlight) {
      return;
    }

    const timedRun = activeRun;
    const timeoutId = window.setTimeout(() => {
      if (activeRunRef.current.runId !== timedRun.runId) {
        return;
      }

      setRunInFlight(false);
      setGateState("timed-out");
      setStateDetail(
        `No correlated runtime, compilation or visible-render outcome completed within ${PROVISIONAL_RUN_TIMEOUT_MS} ms.`,
      );
      appendLog({
        runId: timedRun.runId,
        fixtureId: timedRun.fixtureId,
        eventType: "RUN_TIMEOUT",
        outcome: "failure",
        detail: `Provisional timeout: ${PROVISIONAL_RUN_TIMEOUT_MS} ms.`,
      });
    }, PROVISIONAL_RUN_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [activeRun, appendLog, runInFlight]);

  const beginValidRun = useCallback(
    (fixtureId: RunnableFixtureId) => {
      const client = previewRef.current?.getClient();
      if (
        !sandboxReadyRef.current ||
        runInFlight ||
        !client ||
        client.status !== "done" ||
        sandpack.error !== null ||
        activeRunRef.current.componentMode === "invalid-compilation-probe"
      ) {
        setGateState("run-failure");
        setStateDetail(
          "Fixture execution was blocked until the current client is done, the context error is null, and source restoration is verified.",
        );
        appendLog({
          runId: activeRunRef.current.runId,
          fixtureId: activeRunRef.current.fixtureId,
          eventType: "RUN_BLOCKED_NOT_READY",
          outcome: "rejected",
          detail: `clientStatus=${client?.status ?? "unavailable"}; contextError=${describeSandpackContextError(sandpack.error)}; componentMode=${activeRunRef.current.componentMode}`,
        });
        return;
      }

      const nextRun = createRun(fixtureId, activeRunRef.current.nonce, "valid");
      activeRunRef.current = nextRun;
      runSignalsRef.current = { clientDone: false, renderEvent: null };
      completedRunIdRef.current = null;
      setActiveRun(nextRun);
      setVisibleEvidence(null);
      setLastAcceptedRuntimeEvent("none for current run");
      setObservedMessageOrigin(null);
      setSourceEqualitySucceeded(null);
      setRunInFlight(true);
      setGateState("compiling-current-run");
      setStateDetail(`Compiling ${fixtureId} for run ${nextRun.runId}.`);
      appendLog({
        runId: nextRun.runId,
        fixtureId: nextRun.fixtureId,
        eventType: "RUN_STARTED",
        outcome: "pending",
        detail: "Client status was done before the fixture update was dispatched.",
      });

      sandpack.updateFile(
        "/current-fixture.ts",
        createCurrentFixtureFile(nextRun),
        true,
      );
    },
    [appendLog, runInFlight, sandpack],
  );

  const runFixture = (fixtureId: ValidFixtureId) => {
    latestFixtureIdRef.current = fixtureId;
    setLatestFixtureId(fixtureId);
    beginValidRun(fixtureId);
  };

  const beginInvalidCompilationProbe = () => {
    const client = previewRef.current?.getClient();
    if (
      !sandboxReadyRef.current ||
      runInFlight ||
      !client ||
      client.status !== "done"
    ) {
      setGateState("run-failure");
      setStateDetail(
        "Invalid-source injection was blocked because the Sandpack client was not in the done state.",
      );
      return;
    }

    const nextRun = createRun(
      latestFixtureIdRef.current,
      activeRunRef.current.nonce,
      "invalid-compilation-probe",
    );
    activeRunRef.current = nextRun;
    runSignalsRef.current = { clientDone: false, renderEvent: null };
    completedRunIdRef.current = null;
    setActiveRun(nextRun);
    setVisibleEvidence(null);
    setLastAcceptedRuntimeEvent("none for current run");
    setObservedMessageOrigin(null);
    setSourceEqualitySucceeded(null);
    setCompilationContextBefore(describeSandpackContextError(sandpack.error));
    setCompilationListenerEvents([]);
    setCompilationClassification("not run");
    setInvalidRuntimeBridgeObservation(
      "Waiting to determine whether invalid source starts the runtime bridge.",
    );
    setRestorationEvidence("not started for the current invalid source");
    setRunInFlight(true);
    setGateState("compiling-current-run");
    setStateDetail(
      `Injecting invalid /UserComponent.tsx for run ${nextRun.runId}.`,
    );
    appendLog({
      runId: nextRun.runId,
      fixtureId: nextRun.fixtureId,
      eventType: "INVALID_SOURCE_INJECTED",
      outcome: "pending",
      detail: `contextErrorBefore=${describeSandpackContextError(sandpack.error)}`,
    });

    sandpack.updateFile(
      {
        "/current-fixture.ts": createCurrentFixtureFile(nextRun),
        "/UserComponent.tsx": INVALID_USER_COMPONENT_SOURCE,
      },
      undefined,
      true,
    );
  };

  const restoreValidComponent = () => {
    const client = previewRef.current?.getClient();
    if (
      !client ||
      client.status !== "done" ||
      runInFlight ||
      activeRunRef.current.componentMode !== "invalid-compilation-probe"
    ) {
      setGateState("run-failure");
      setStateDetail(
        "Valid-source restoration was blocked because the Sandpack client was not in the done state.",
      );
      return;
    }

    const nextRun = createRun(
      "safe-short",
      activeRunRef.current.nonce,
      "recovery-bootstrap",
    );
    const restoredFixtureSource = createCurrentFixtureFile(nextRun);
    const restoredFiles = {
      ...sandpack.files,
      "/UserComponent.tsx": {
        ...sandpack.files["/UserComponent.tsx"],
        code: USER_COMPONENT_SOURCE,
      },
      "/current-fixture.ts": {
        ...sandpack.files["/current-fixture.ts"],
        code: restoredFixtureSource,
      },
    };
    activeRunRef.current = nextRun;
    runSignalsRef.current = { clientDone: false, renderEvent: null };
    restorationSignalsRef.current = {
      compileStarted: false,
      clientDone: false,
      contextErrorCleared: sandpack.error === null,
      bootstrapEvent: null,
    };
    completedRunIdRef.current = null;
    completedRestorationRunIdRef.current = null;
    latestFixtureIdRef.current = "safe-short";
    setActiveRun(nextRun);
    setLatestFixtureId("safe-short");
    setVisibleEvidence(null);
    setLastAcceptedRuntimeEvent("none for current run");
    setObservedMessageOrigin(null);
    setSourceEqualitySucceeded(null);
    setRunInFlight(true);
    setGateState("restoring-valid-source");
    setStateDetail(
      `Dispatching valid component source to the current Sandpack client for recovery run ${nextRun.runId}.`,
    );
    setRestorationEvidence(
      "valid files queued in provider state and dispatched directly to the current done client",
    );
    appendLog({
      runId: nextRun.runId,
      fixtureId: nextRun.fixtureId,
      eventType: "CURRENT_CLIENT_RESTORE_DISPATCHED",
      outcome: "pending",
      detail: `clientStatus=${client.status}; contextErrorBefore=${describeSandpackContextError(sandpack.error)}`,
    });

    sandpack.updateFile(
      {
        "/UserComponent.tsx": USER_COMPONENT_SOURCE,
        "/current-fixture.ts": restoredFixtureSource,
      },
      undefined,
      false,
    );
    client.updateSandbox({ files: restoredFiles });
  };

  const currentClientDone = iframeSnapshot.clientStatus === "done";
  const canRunFixture =
    sandboxReady &&
    !runInFlight &&
    currentClientDone &&
    sandpack.error === null &&
    activeRun.componentMode !== "invalid-compilation-probe";
  const canRestoreValidComponent =
    !runInFlight &&
    currentClientDone &&
    activeRun.componentMode === "invalid-compilation-probe";
  const activeFixtureFile = sandpack.files["/current-fixture.ts"]?.code ?? "";
  const validSourcePresentInProvider =
    sandpack.files["/UserComponent.tsx"]?.code === USER_COMPONENT_SOURCE;
  const fixtureFileContainsActiveRun = activeFixtureFile.includes(activeRun.runId);
  const resolvedFiles = Object.keys(sandpack.files).sort();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.25fr]">
        <div className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="font-semibold text-slate-950">Fixture controls</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Controls remain disabled until the client reports done and the
              bootstrap root proves visible output. Only one diagnostic run can
              compile at a time.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!canRunFixture}
                onClick={() => runFixture("safe-short")}
                className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:bg-slate-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
              >
                Run safe short fixture
              </button>
              <button
                type="button"
                disabled={!canRunFixture}
                onClick={() => runFixture("safe-long")}
                className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:bg-slate-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
              >
                Run safe long fixture
              </button>
              <button
                type="button"
                disabled={!canRunFixture}
                onClick={() => beginValidRun("runtime-crash")}
                className="rounded-md bg-rose-800 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:bg-slate-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
              >
                Run runtime crash fixture
              </button>
              <button
                type="button"
                disabled={!canRunFixture}
                onClick={() => beginValidRun(latestFixtureIdRef.current)}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
              >
                Rerun latest valid fixture
              </button>
              <button
                type="button"
                disabled={!canRunFixture}
                onClick={beginInvalidCompilationProbe}
                className="rounded-md border border-amber-400 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-950 hover:bg-amber-100 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
              >
                Inject invalid TSX probe
              </button>
              <button
                type="button"
                disabled={!canRestoreValidComponent}
                onClick={restoreValidComponent}
                className="rounded-md border border-sky-400 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-950 hover:bg-sky-100 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
              >
                Restore valid sample component
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Runtime and compilation failures use distinct parent outcomes.
              Restoration keeps the same Sandpack provider and parent page.
            </p>
          </section>

          <section
            aria-live="polite"
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            <h2 className="font-semibold text-slate-950">
              Current parent result
            </h2>
            <dl className="mt-3 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-2 text-sm">
              <dt className="font-medium text-slate-600">State</dt>
              <dd className="font-semibold text-slate-950">
                {STATE_LABELS[gateState]}
              </dd>
              <dt className="font-medium text-slate-600">Detail</dt>
              <dd className="break-words text-slate-800">{stateDetail}</dd>
              <dt className="font-medium text-slate-600">Run ID</dt>
              <dd className="break-all font-mono text-slate-800">
                {activeRun.runId}
              </dd>
              <dt className="font-medium text-slate-600">Fixture</dt>
              <dd className="font-mono text-slate-800">
                {activeRun.fixtureId}
              </dd>
              <dt className="font-medium text-slate-600">Component mode</dt>
              <dd className="font-mono text-slate-800">
                {activeRun.componentMode}
              </dd>
              <dt className="font-medium text-slate-600">Latest valid fixture</dt>
              <dd className="font-mono text-slate-800">{latestFixtureId}</dd>
              <dt className="font-medium text-slate-600">Controls enabled</dt>
              <dd className="font-mono text-slate-800">
                {String(canRunFixture)}
              </dd>
            </dl>
          </section>

          <ParentHeartbeat />
        </div>

        <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3">
            <h2 className="font-semibold text-slate-950">
              Sandpack preview iframe
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              A parent success now requires the current run&apos;s expected title,
              description, diagnostic marker, non-empty root and layout box.
            </p>
          </div>
          <SandpackLayout style={{ height: 460 }}>
            <SandpackPreview
              ref={previewRef}
              showNavigator
              showOpenInCodeSandbox={false}
              showOpenNewtab={false}
              showRefreshButton
              showRestartButton={false}
              showSandpackErrorOverlay
              style={{ height: "100%" }}
            />
          </SandpackLayout>
        </section>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-950">
          Minimal lifecycle diagnostics
        </h2>
        <dl className="mt-3 grid gap-2 text-sm md:grid-cols-[max-content_1fr]">
          <dt className="font-medium text-slate-600">Template</dt>
          <dd className="font-mono text-slate-800">{RESOLVED_TEMPLATE_NAME}</dd>
          <dt className="font-medium text-slate-600">Custom setup</dt>
          <dd className="font-mono text-slate-800">
            {CUSTOM_SETUP_DESCRIPTION}
          </dd>
          <dt className="font-medium text-slate-600">Executed entry</dt>
          <dd className="font-mono text-slate-800">{RESOLVED_ENTRY_FILE}</dd>
          <dt className="font-medium text-slate-600">Active editor file</dt>
          <dd className="font-mono text-slate-800">{sandpack.activeFile}</dd>
          <dt className="font-medium text-slate-600">Resolved files</dt>
          <dd className="break-all font-mono text-slate-800">
            {resolvedFiles.join(", ")}
          </dd>
          <dt className="font-medium text-slate-600">Provider status</dt>
          <dd className="font-mono text-slate-800">{sandpack.status}</dd>
          <dt className="font-medium text-slate-600">Preview client status</dt>
          <dd className="font-mono text-slate-800">
            {iframeSnapshot.clientStatus}
          </dd>
          <dt className="font-medium text-slate-600">Last listener status</dt>
          <dd className="font-mono text-slate-800">{lastSandpackStatus}</dd>
          <dt className="font-medium text-slate-600">
            Fixture file has active run
          </dt>
          <dd className="font-mono text-slate-800">
            {String(fixtureFileContainsActiveRun)}
          </dd>
          <dt className="font-medium text-slate-600">
            Last accepted runtime event
          </dt>
          <dd className="break-all font-mono text-slate-800">
            {lastAcceptedRuntimeEvent}
          </dd>
          <dt className="font-medium text-slate-600">
            Last rejected stale event
          </dt>
          <dd className="break-all font-mono text-slate-800">
            {lastRejectedStaleEvent}
          </dd>
          <dt className="font-medium text-slate-600">
            Visible render evidence
          </dt>
          <dd className="break-all font-mono text-slate-800">
            {visibleEvidence
              ? describeVisibleEvidence(visibleEvidence)
              : "not yet confirmed for the current run"}
          </dd>
        </dl>
      </section>

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <h2 className="font-semibold text-amber-950">
          Compilation observability diagnostic
        </h2>
        <dl className="mt-3 grid gap-2 text-sm md:grid-cols-[max-content_1fr]">
          <dt className="font-medium text-amber-900">Classification</dt>
          <dd className="font-mono text-amber-950">
            {compilationClassification}
          </dd>
          <dt className="font-medium text-amber-900">
            Context error before injection
          </dt>
          <dd className="break-all font-mono text-amber-950">
            {compilationContextBefore}
          </dd>
          <dt className="font-medium text-amber-900">Context error now</dt>
          <dd className="break-all font-mono text-amber-950">
            {describeSandpackContextError(sandpack.error)}
          </dd>
          <dt className="font-medium text-amber-900">Context contract</dt>
          <dd className="text-amber-950">
            Installed public context type exposes error as SandpackError | null.
          </dd>
          <dt className="font-medium text-amber-900">Listener contract</dt>
          <dd className="text-amber-950">
            Installed types include action/show-error and
            done.compilatonError, but neither message carries StateStorm run,
            fixture, nonce or mode correlation.
          </dd>
          <dt className="font-medium text-amber-900">Listener events</dt>
          <dd className="break-all font-mono text-amber-950">
            {compilationListenerEvents.join(" || ") || "none recorded"}
          </dd>
          <dt className="font-medium text-amber-900">Runtime bridge</dt>
          <dd className="text-amber-950">{invalidRuntimeBridgeObservation}</dd>
          <dt className="font-medium text-amber-900">
            Restoration lifecycle
          </dt>
          <dd className="break-all font-mono text-amber-950">
            {restorationEvidence}
          </dd>
          <dt className="font-medium text-amber-900">
            Valid source in provider
          </dt>
          <dd className="font-mono text-amber-950">
            {String(validSourcePresentInProvider)}
          </dd>
        </dl>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-950">
          Iframe and network-boundary evidence
        </h2>
        <dl className="mt-3 grid gap-2 text-sm md:grid-cols-[max-content_1fr]">
          <dt className="font-medium text-slate-600">iframe src</dt>
          <dd className="break-all font-mono text-slate-800">
            {iframeSnapshot.sourceAttribute ?? "unverified"}
          </dd>
          <dt className="font-medium text-slate-600">Resolved source</dt>
          <dd className="break-all font-mono text-slate-800">
            {iframeSnapshot.resolvedSource ?? "unverified"}
          </dd>
          <dt className="font-medium text-slate-600">Iframe origin</dt>
          <dd className="break-all font-mono text-slate-800">
            {iframeSnapshot.origin ?? "unverified"}
          </dd>
          <dt className="font-medium text-slate-600">sandbox attribute</dt>
          <dd className="break-all font-mono text-slate-800">
            {iframeSnapshot.sandboxAttribute ?? "not present or unverified"}
          </dd>
          <dt className="font-medium text-slate-600">allow attribute</dt>
          <dd className="break-all font-mono text-slate-800">
            {iframeSnapshot.allowAttribute ?? "not present or unverified"}
          </dd>
          <dt className="font-medium text-slate-600">Cross-origin</dt>
          <dd className="font-mono text-slate-800">
            {iframeSnapshot.crossOrigin === null
              ? "unverified"
              : String(iframeSnapshot.crossOrigin)}
          </dd>
          <dt className="font-medium text-slate-600">
            contentWindow available
          </dt>
          <dd className="font-mono text-slate-800">
            {String(iframeSnapshot.contentWindowAvailable)}
          </dd>
          <dt className="font-medium text-slate-600">
            Observed message origin
          </dt>
          <dd className="break-all font-mono text-slate-800">
            {observedMessageOrigin ?? "unverified for current run"}
          </dd>
          <dt className="font-medium text-slate-600">
            Source equality succeeded
          </dt>
          <dd className="font-mono text-slate-800">
            {sourceEqualitySucceeded === null
              ? "unverified for current run"
              : String(sourceEqualitySucceeded)}
          </dd>
          <dt className="font-medium text-slate-600">Parent DOM access</dt>
          <dd className="font-mono text-slate-800">
            {readyEvidence?.parentDomAccess ?? "unverified"}
          </dd>
          <dt className="font-medium text-slate-600">
            Runtime resource origins
          </dt>
          <dd className="break-all font-mono text-slate-800">
            {readyEvidence?.resourceOrigins.join(", ") || "unverified"}
          </dd>
        </dl>
      </section>

      <RunLog entries={logs} />
    </div>
  );
}

export default function SandboxSpike() {
  const [initialState] = useState(() => {
    const nonce = createIdentifier("nonce");
    const initialRun = createRun("safe-short", nonce, "bootstrap");
    return {
      initialRun,
      files: createSandboxFiles(initialRun),
    };
  });

  return (
    <SandpackProvider
      template="react-ts"
      files={initialState.files}
      options={{
        activeFile: "/UserComponent.tsx",
        visibleFiles: [
          "/UserComponent.tsx",
          "/current-fixture.ts",
          "/runtime-bridge.tsx",
          "/App.tsx",
          "/index.tsx",
        ],
        autorun: true,
        autoReload: true,
        initMode: "immediate",
        recompileMode: "immediate",
      }}
    >
      <SandboxController initialRun={initialState.initialRun} />
    </SandpackProvider>
  );
}
