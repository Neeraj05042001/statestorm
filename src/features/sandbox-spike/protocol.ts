import type { FixtureId, SampleCardFixtureProps } from "./fixtures";

export const SANDBOX_EVENT_SOURCE = "statestorm-sandbox" as const;
export const SANDBOX_PROTOCOL_VERSION = 1 as const;
export const PROVISIONAL_INITIALIZATION_TIMEOUT_MS = 30_000;
export const PROVISIONAL_RUN_TIMEOUT_MS = 20_000;

const MAX_ERROR_NAME_LENGTH = 120;
const MAX_ERROR_MESSAGE_LENGTH = 1_000;
const MAX_ERROR_STACK_LENGTH = 4_000;
const MAX_EVIDENCE_VALUE_LENGTH = 500;
const MAX_RESOURCE_ORIGINS = 20;
const MAX_RENDERED_TEXT_LENGTH = 20_000;
const MAX_RENDERED_CHILD_COUNT = 100;

export type SandboxComponentMode =
  | "bootstrap"
  | "valid"
  | "recovery-bootstrap"
  | "invalid-compilation-probe";

export interface SandboxRun {
  runId: string;
  fixtureId: FixtureId;
  nonce: string;
  componentMode: SandboxComponentMode;
  props: SampleCardFixtureProps;
}

interface SandboxEventBase {
  source: typeof SANDBOX_EVENT_SOURCE;
  protocolVersion: typeof SANDBOX_PROTOCOL_VERSION;
  nonce: string;
  runId: string;
  fixtureId: FixtureId;
  componentMode: SandboxComponentMode;
}

export interface VisibleRenderEvidence {
  renderedRootChildCount: number;
  renderedTextLength: number;
  diagnosticMarkerPresent: boolean;
  expectedTitlePresent: boolean;
  expectedDescriptionPresent: boolean;
  hasLayoutBox: boolean;
}

export interface SandboxReadyEvidence extends VisibleRenderEvidence {
  parentDomAccess: "accessible" | "blocked";
  runtimeOrigin: string;
  resourceOrigins: string[];
}

export type SandboxEvent =
  | (SandboxEventBase & {
      type: "SANDBOX_READY";
      evidence: SandboxReadyEvidence;
    })
  | (SandboxEventBase & {
      type: "RENDER_COMMITTED";
      evidence: VisibleRenderEvidence;
    })
  | (SandboxEventBase & {
      type: "RENDER_EVIDENCE_MISSING";
      evidence: VisibleRenderEvidence;
      message: string;
    })
  | (SandboxEventBase & {
      type: "RUNTIME_ERROR";
      error: {
        name: string;
        message: string;
        stack?: string;
      };
    });

export type ProtocolValidationResult =
  | { ok: true; event: SandboxEvent }
  | { ok: false; reason: string };

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isBoundedString(value: unknown, maximumLength: number): value is string {
  return typeof value === "string" && value.length <= maximumLength;
}

function isFixtureId(value: unknown): value is FixtureId {
  return (
    value === "safe-short" ||
    value === "safe-long" ||
    value === "runtime-crash"
  );
}

function isComponentMode(value: unknown): value is SandboxComponentMode {
  return (
    value === "bootstrap" ||
    value === "valid" ||
    value === "recovery-bootstrap" ||
    value === "invalid-compilation-probe"
  );
}

function isVisibleRenderEvidence(value: unknown): value is VisibleRenderEvidence {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    Number.isInteger(value.renderedRootChildCount) &&
    Number(value.renderedRootChildCount) >= 0 &&
    Number(value.renderedRootChildCount) <= MAX_RENDERED_CHILD_COUNT &&
    Number.isInteger(value.renderedTextLength) &&
    Number(value.renderedTextLength) >= 0 &&
    Number(value.renderedTextLength) <= MAX_RENDERED_TEXT_LENGTH &&
    typeof value.diagnosticMarkerPresent === "boolean" &&
    typeof value.expectedTitlePresent === "boolean" &&
    typeof value.expectedDescriptionPresent === "boolean" &&
    typeof value.hasLayoutBox === "boolean"
  );
}

export function hasConfirmedVisibleRender(
  evidence: VisibleRenderEvidence,
): boolean {
  return (
    evidence.renderedRootChildCount > 0 &&
    evidence.renderedTextLength > 0 &&
    evidence.diagnosticMarkerPresent &&
    evidence.expectedTitlePresent &&
    evidence.expectedDescriptionPresent &&
    evidence.hasLayoutBox
  );
}

function isReadyEvidence(value: unknown): value is SandboxReadyEvidence {
  if (!isVisibleRenderEvidence(value)) {
    return false;
  }

  const parentDomAccess = Reflect.get(value, "parentDomAccess");
  const runtimeOrigin = Reflect.get(value, "runtimeOrigin");
  const resourceOrigins: unknown = Reflect.get(value, "resourceOrigins");

  return (
    (parentDomAccess === "accessible" || parentDomAccess === "blocked") &&
    isBoundedString(runtimeOrigin, MAX_EVIDENCE_VALUE_LENGTH) &&
    Array.isArray(resourceOrigins) &&
    resourceOrigins.length <= MAX_RESOURCE_ORIGINS &&
    resourceOrigins.every((origin: unknown) =>
      isBoundedString(origin, MAX_EVIDENCE_VALUE_LENGTH),
    )
  );
}

function isRuntimeErrorPayload(
  value: unknown,
): value is Extract<SandboxEvent, { type: "RUNTIME_ERROR" }>["error"] {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    isBoundedString(value.name, MAX_ERROR_NAME_LENGTH) &&
    isBoundedString(value.message, MAX_ERROR_MESSAGE_LENGTH) &&
    (value.stack === undefined ||
      isBoundedString(value.stack, MAX_ERROR_STACK_LENGTH))
  );
}

export function validateSandboxEvent(
  value: unknown,
  expectedRun: SandboxRun,
): ProtocolValidationResult {
  if (!isPlainObject(value)) {
    return { ok: false, reason: "Message data is not a plain object." };
  }

  if (value.source !== SANDBOX_EVENT_SOURCE) {
    return { ok: false, reason: "Message source marker does not match." };
  }

  if (value.protocolVersion !== SANDBOX_PROTOCOL_VERSION) {
    return { ok: false, reason: "Protocol version does not match." };
  }

  if (value.nonce !== expectedRun.nonce) {
    return { ok: false, reason: "Sandbox nonce does not match the current page." };
  }

  if (value.runId !== expectedRun.runId) {
    return { ok: false, reason: "Run identifier is stale or mismatched." };
  }

  if (value.fixtureId !== expectedRun.fixtureId || !isFixtureId(value.fixtureId)) {
    return { ok: false, reason: "Fixture identifier is stale or mismatched." };
  }

  if (
    value.componentMode !== expectedRun.componentMode ||
    !isComponentMode(value.componentMode)
  ) {
    return { ok: false, reason: "Component mode is stale or mismatched." };
  }

  const correlatedBase = {
    source: SANDBOX_EVENT_SOURCE,
    protocolVersion: SANDBOX_PROTOCOL_VERSION,
    nonce: expectedRun.nonce,
    runId: expectedRun.runId,
    fixtureId: expectedRun.fixtureId,
    componentMode: expectedRun.componentMode,
  };

  if (value.type === "SANDBOX_READY") {
    return isReadyEvidence(value.evidence) &&
      hasConfirmedVisibleRender(value.evidence)
      ? {
          ok: true,
          event: {
            ...correlatedBase,
            type: "SANDBOX_READY",
            evidence: value.evidence,
          },
        }
      : { ok: false, reason: "Sandbox-ready render evidence is not confirmed." };
  }

  if (value.type === "RENDER_COMMITTED") {
    return isVisibleRenderEvidence(value.evidence) &&
      hasConfirmedVisibleRender(value.evidence)
      ? {
          ok: true,
          event: {
            ...correlatedBase,
            type: "RENDER_COMMITTED",
            evidence: value.evidence,
          },
        }
      : { ok: false, reason: "Committed render lacks visible-output evidence." };
  }

  if (value.type === "RENDER_EVIDENCE_MISSING") {
    return isVisibleRenderEvidence(value.evidence) &&
      isBoundedString(value.message, MAX_ERROR_MESSAGE_LENGTH)
      ? {
          ok: true,
          event: {
            ...correlatedBase,
            type: "RENDER_EVIDENCE_MISSING",
            evidence: value.evidence,
            message: value.message,
          },
        }
      : { ok: false, reason: "Missing-render diagnostic is malformed." };
  }

  if (value.type === "RUNTIME_ERROR") {
    return isRuntimeErrorPayload(value.error)
      ? {
          ok: true,
          event: {
            ...correlatedBase,
            type: "RUNTIME_ERROR",
            error: value.error,
          },
        }
      : { ok: false, reason: "Runtime error payload is malformed." };
  }

  return { ok: false, reason: "Event type is not allowed." };
}

export function hasSandboxSourceMarker(value: unknown): boolean {
  return isPlainObject(value) && value.source === SANDBOX_EVENT_SOURCE;
}

export function sanitizeParentDiagnostic(
  value: unknown,
  maximumLength = 600,
): string {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  const safeText = text ?? String(value);
  return safeText.slice(0, maximumLength);
}
