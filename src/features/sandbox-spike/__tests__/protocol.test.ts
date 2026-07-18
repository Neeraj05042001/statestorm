import { describe, expect, it } from "vitest";

import {
  SANDBOX_EVENT_SOURCE,
  SANDBOX_PROTOCOL_VERSION,
  hasConfirmedVisibleRender,
  validateSandboxEvent,
  type SandboxRun,
} from "../protocol";

const run: SandboxRun = {
  nonce: "nonce-gate-zero",
  runId: "run-gate-zero",
  fixtureId: "safe-short",
  componentMode: "valid",
  props: {
    title: "Calm state",
    description: "The short Gate 0 fixture rendered successfully.",
  },
};

const evidence = {
  renderedRootChildCount: 1,
  renderedTextLength: 64,
  diagnosticMarkerPresent: true,
  expectedTitlePresent: true,
  expectedDescriptionPresent: true,
  hasLayoutBox: true,
};

function message(overrides: Record<string, unknown> = {}) {
  return {
    source: SANDBOX_EVENT_SOURCE,
    protocolVersion: SANDBOX_PROTOCOL_VERSION,
    nonce: run.nonce,
    runId: run.runId,
    fixtureId: run.fixtureId,
    componentMode: run.componentMode,
    type: "RENDER_COMMITTED",
    evidence,
    ...overrides,
  };
}

describe("Gate 0 protocol regression", () => {
  it("retains the accepted visible-output success gate", () => {
    expect(hasConfirmedVisibleRender(evidence)).toBe(true);
    expect(validateSandboxEvent(message(), run).ok).toBe(true);
  });

  it.each([
    ["nonce", "stale-nonce"],
    ["runId", "stale-run"],
    ["fixtureId", "safe-long"],
    ["componentMode", "bootstrap"],
  ])("rejects mismatched %s correlation", (field, value) => {
    expect(validateSandboxEvent(message({ [field]: value }), run).ok).toBe(
      false,
    );
  });

  it("rejects a wrapper commit with incomplete Gate 0 evidence", () => {
    expect(
      validateSandboxEvent(
        message({ evidence: { ...evidence, expectedTitlePresent: false } }),
        run,
      ).ok,
    ).toBe(false);
  });

  it("rejects unknown message types", () => {
    expect(
      validateSandboxEvent(message({ type: "UNKNOWN_EVENT" }), run).ok,
    ).toBe(false);
  });
});
