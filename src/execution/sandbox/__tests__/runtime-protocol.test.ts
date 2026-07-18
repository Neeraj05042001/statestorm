import { describe, expect, it } from "vitest";

import {
  SANDBOX_EVENT_SOURCE,
  SANDBOX_PROTOCOL_VERSION,
  hasPassedRuntimeSignals,
  isBlankRuntimeRender,
  isExpectedMessageSource,
  validateRunPlanSandboxEvent,
  type RuntimeFixtureCorrelation,
} from "../runtime-protocol";

const expected: RuntimeFixtureCorrelation = {
  sessionId: "session-current",
  runId: "run-current",
  fixtureId: "fixture-current",
  nonce: "nonce-current",
};

function renderMessage(overrides: Record<string, unknown> = {}) {
  return {
    source: SANDBOX_EVENT_SOURCE,
    protocolVersion: SANDBOX_PROTOCOL_VERSION,
    ...expected,
    type: "RENDER_COMMITTED",
    evidence: {
      renderedRootChildCount: 1,
      renderedTextLength: 12,
      expectedDomFound: true,
      meaningfulDomFound: true,
    },
    ...overrides,
  };
}

describe("RunPlan sandbox runtime protocol", () => {
  it.each([
    ["nonce", "wrong-nonce"],
    ["runId", "run-prior"],
    ["fixtureId", "fixture-prior"],
    ["sessionId", "session-prior"],
  ])("rejects an incorrect %s", (field, value) => {
    expect(
      validateRunPlanSandboxEvent(renderMessage({ [field]: value }), expected)
        .ok,
    ).toBe(false);
  });

  it("rejects an unknown message type", () => {
    expect(
      validateRunPlanSandboxEvent(
        renderMessage({ type: "ARBITRARY_PARENT_COMMAND" }),
        expected,
      ).ok,
    ).toBe(false);
  });

  it("requires exact iframe source-window equality", () => {
    const expectedWindow = {} as Window;
    expect(isExpectedMessageSource(expectedWindow, expectedWindow)).toBe(true);
    expect(isExpectedMessageSource({} as Window, expectedWindow)).toBe(false);
    expect(isExpectedMessageSource(expectedWindow, null)).toBe(false);
  });

  it("does not treat render commit alone or completion alone as success", () => {
    const validation = validateRunPlanSandboxEvent(renderMessage(), expected);
    expect(validation.ok).toBe(true);
    const renderEvent = validation.ok && validation.event.type === "RENDER_COMMITTED"
      ? validation.event
      : null;

    expect(
      hasPassedRuntimeSignals({
        sandboxCompleted: false,
        renderEvent,
        runtimeError: null,
      }),
    ).toBe(false);
    expect(
      hasPassedRuntimeSignals({
        sandboxCompleted: true,
        renderEvent: null,
        runtimeError: null,
      }),
    ).toBe(false);
  });

  it("requires expected DOM and meaningful visible DOM", () => {
    const validation = validateRunPlanSandboxEvent(renderMessage(), expected);
    const renderEvent = validation.ok && validation.event.type === "RENDER_COMMITTED"
      ? validation.event
      : null;
    expect(
      hasPassedRuntimeSignals({
        sandboxCompleted: true,
        renderEvent,
        runtimeError: null,
      }),
    ).toBe(true);

    const blankValidation = validateRunPlanSandboxEvent(
      renderMessage({
        evidence: {
          renderedRootChildCount: 1,
          renderedTextLength: 0,
          expectedDomFound: true,
          meaningfulDomFound: false,
        },
      }),
      expected,
    );
    const blankEvent =
      blankValidation.ok && blankValidation.event.type === "RENDER_COMMITTED"
        ? blankValidation.event
        : null;
    expect(
      isBlankRuntimeRender({
        sandboxCompleted: true,
        renderEvent: blankEvent,
        runtimeError: null,
      }),
    ).toBe(true);
  });

  it("accepts a bounded correlated runtime error without a raw Error", () => {
    const validation = validateRunPlanSandboxEvent(
      renderMessage({
        type: "RUNTIME_ERROR",
        evidence: undefined,
        error: { name: "TypeError", message: "title[0] was unavailable" },
      }),
      expected,
    );

    expect(validation).toMatchObject({
      ok: true,
      event: { type: "RUNTIME_ERROR" },
    });
    expect(JSON.stringify(validation)).not.toContain("stack");
  });
});
