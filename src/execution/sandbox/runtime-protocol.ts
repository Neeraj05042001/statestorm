export const SANDBOX_EVENT_SOURCE = "statestorm-sandbox" as const;
export const SANDBOX_PROTOCOL_VERSION = 1 as const;

const MAX_IDENTIFIER_LENGTH = 256;
const MAX_ERROR_NAME_LENGTH = 120;
const MAX_ERROR_MESSAGE_LENGTH = 1_000;
const MAX_RENDERED_TEXT_LENGTH = 20_000;
const MAX_RENDERED_CHILD_COUNT = 1_000;

export interface RuntimeFixtureCorrelation {
  sessionId: string;
  runId: string;
  fixtureId: string;
  nonce: string;
}

export interface RuntimeRenderEvidence {
  renderedRootChildCount: number;
  renderedTextLength: number;
  expectedDomFound: boolean;
  meaningfulDomFound: boolean;
}

interface RuntimeEventBase extends RuntimeFixtureCorrelation {
  source: typeof SANDBOX_EVENT_SOURCE;
  protocolVersion: typeof SANDBOX_PROTOCOL_VERSION;
}

export type RunPlanSandboxEvent =
  | (RuntimeEventBase & {
      type: "RENDER_COMMITTED";
      evidence: RuntimeRenderEvidence;
    })
  | (RuntimeEventBase & {
      type: "RUNTIME_ERROR";
      error: {
        name: string;
        message: string;
      };
    });

export type RunPlanProtocolValidationResult =
  | { ok: true; event: RunPlanSandboxEvent }
  | { ok: false; reason: string };

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function isBoundedString(
  value: unknown,
  maximumLength: number,
): value is string {
  return typeof value === "string" && value.length <= maximumLength;
}

export function hasSandboxSourceMarker(value: unknown): boolean {
  return isPlainObject(value) && value.source === SANDBOX_EVENT_SOURCE;
}

export function isExpectedMessageSource(
  actualSource: MessageEventSource | null,
  expectedWindow: Window | null | undefined,
): boolean {
  return expectedWindow !== null && expectedWindow !== undefined && actualSource === expectedWindow;
}

function hasValidCorrelation(
  value: Record<string, unknown>,
  expected: RuntimeFixtureCorrelation,
): string | null {
  if (value.source !== SANDBOX_EVENT_SOURCE) {
    return "Message source marker does not match.";
  }
  if (value.protocolVersion !== SANDBOX_PROTOCOL_VERSION) {
    return "Protocol version does not match.";
  }
  if (!isBoundedString(value.nonce, MAX_IDENTIFIER_LENGTH) || value.nonce !== expected.nonce) {
    return "Sandbox nonce does not match the active fixture.";
  }
  if (!isBoundedString(value.sessionId, MAX_IDENTIFIER_LENGTH) || value.sessionId !== expected.sessionId) {
    return "Session identifier is stale or mismatched.";
  }
  if (!isBoundedString(value.runId, MAX_IDENTIFIER_LENGTH) || value.runId !== expected.runId) {
    return "Run identifier is stale or mismatched.";
  }
  if (!isBoundedString(value.fixtureId, MAX_IDENTIFIER_LENGTH) || value.fixtureId !== expected.fixtureId) {
    return "Fixture identifier is stale or mismatched.";
  }
  return null;
}

function isRuntimeRenderEvidence(value: unknown): value is RuntimeRenderEvidence {
  if (!isPlainObject(value)) return false;

  return (
    Number.isInteger(value.renderedRootChildCount) &&
    Number(value.renderedRootChildCount) >= 0 &&
    Number(value.renderedRootChildCount) <= MAX_RENDERED_CHILD_COUNT &&
    Number.isInteger(value.renderedTextLength) &&
    Number(value.renderedTextLength) >= 0 &&
    Number(value.renderedTextLength) <= MAX_RENDERED_TEXT_LENGTH &&
    typeof value.expectedDomFound === "boolean" &&
    typeof value.meaningfulDomFound === "boolean"
  );
}

function isRuntimeError(value: unknown): value is { name: string; message: string } {
  return (
    isPlainObject(value) &&
    isBoundedString(value.name, MAX_ERROR_NAME_LENGTH) &&
    isBoundedString(value.message, MAX_ERROR_MESSAGE_LENGTH)
  );
}

export function validateRunPlanSandboxEvent(
  value: unknown,
  expected: RuntimeFixtureCorrelation,
): RunPlanProtocolValidationResult {
  if (!isPlainObject(value)) {
    return { ok: false, reason: "Message data is not a plain object." };
  }

  const correlationFailure = hasValidCorrelation(value, expected);
  if (correlationFailure) {
    return { ok: false, reason: correlationFailure };
  }

  const base: RuntimeEventBase = {
    source: SANDBOX_EVENT_SOURCE,
    protocolVersion: SANDBOX_PROTOCOL_VERSION,
    sessionId: expected.sessionId,
    runId: expected.runId,
    fixtureId: expected.fixtureId,
    nonce: expected.nonce,
  };

  if (value.type === "RENDER_COMMITTED") {
    if (!isRuntimeRenderEvidence(value.evidence)) {
      return { ok: false, reason: "Render evidence is malformed." };
    }
    return {
      ok: true,
      event: { ...base, type: "RENDER_COMMITTED", evidence: value.evidence },
    };
  }

  if (value.type === "RUNTIME_ERROR") {
    if (!isRuntimeError(value.error)) {
      return { ok: false, reason: "Runtime error payload is malformed." };
    }
    return {
      ok: true,
      event: { ...base, type: "RUNTIME_ERROR", error: value.error },
    };
  }

  return { ok: false, reason: "Event type is not allowed." };
}

export function hasPassedRuntimeSignals(input: {
  sandboxCompleted: boolean;
  renderEvent: Extract<RunPlanSandboxEvent, { type: "RENDER_COMMITTED" }> | null;
  runtimeError: Extract<RunPlanSandboxEvent, { type: "RUNTIME_ERROR" }> | null;
}): boolean {
  return (
    input.sandboxCompleted &&
    input.runtimeError === null &&
    input.renderEvent !== null &&
    input.renderEvent.evidence.expectedDomFound &&
    input.renderEvent.evidence.meaningfulDomFound
  );
}

export function isBlankRuntimeRender(input: {
  sandboxCompleted: boolean;
  renderEvent: Extract<RunPlanSandboxEvent, { type: "RENDER_COMMITTED" }> | null;
  runtimeError: Extract<RunPlanSandboxEvent, { type: "RUNTIME_ERROR" }> | null;
}): boolean {
  return (
    input.sandboxCompleted &&
    input.runtimeError === null &&
    input.renderEvent !== null &&
    (!input.renderEvent.evidence.expectedDomFound ||
      !input.renderEvent.evidence.meaningfulDomFound)
  );
}
