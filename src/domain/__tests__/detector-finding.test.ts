import { describe, expect, it } from "vitest";

import {
  DetectorFindingSchema,
  DetectorObservationCollectionSchema,
} from "../detector-finding";

function overflowFinding() {
  return {
    id: "detector-overflow-1",
    fixtureId: "fixture-long",
    kind: "layout-overflow",
    severity: "warning",
    summary: "Possible horizontal layout overflow was detected.",
    evidence: {
      detector: "overflow-v1",
      elementTag: "H2",
      elementHint: '[data-testid="title"]',
      axis: "horizontal",
      clientWidth: 180,
      scrollWidth: 420,
      clientHeight: 32,
      scrollHeight: 32,
    },
  };
}

describe("DetectorFindingSchema", () => {
  it("accepts bounded overflow evidence", () => {
    expect(DetectorFindingSchema.safeParse(overflowFinding()).success).toBe(
      true,
    );
  });

  it("accepts confirmed broken-image evidence", () => {
    expect(
      DetectorFindingSchema.safeParse({
        id: "detector-image-1",
        fixtureId: "fixture-image",
        kind: "broken-image",
        severity: "error",
        summary: "A rendered image completed without usable image data.",
        evidence: {
          detector: "broken-image-v1",
          elementTag: "IMG",
          imageAltPresent: true,
          imageSourceKind: "relative",
        },
      }).success,
    ).toBe(true);
  });

  it("rejects unknown detector kinds and non-finite dimensions", () => {
    expect(
      DetectorFindingSchema.safeParse({
        ...overflowFinding(),
        kind: "pixel-diff",
      }).success,
    ).toBe(false);
    expect(
      DetectorFindingSchema.safeParse({
        ...overflowFinding(),
        evidence: { ...overflowFinding().evidence, scrollWidth: Infinity },
      }).success,
    ).toBe(false);
  });

  it("rejects excessive strings, dimensions, and detector counts", () => {
    expect(
      DetectorFindingSchema.safeParse({
        ...overflowFinding(),
        summary: "x".repeat(301),
      }).success,
    ).toBe(false);
    expect(
      DetectorFindingSchema.safeParse({
        ...overflowFinding(),
        evidence: {
          ...overflowFinding().evidence,
          scrollWidth: 10_000_001,
        },
      }).success,
    ).toBe(false);
    expect(
      DetectorFindingSchema.safeParse({
        ...overflowFinding(),
        evidence: {
          ...overflowFinding().evidence,
          elementHint: "https://images.example.test/private.png",
        },
      }).success,
    ).toBe(false);
    expect(
      DetectorObservationCollectionSchema.safeParse(
        Array.from({ length: 6 }, () => ({
          kind: "layout-overflow",
          evidence: overflowFinding().evidence,
        })),
      ).success,
    ).toBe(false);
  });

  it("rejects raw DOM-like and Error objects", () => {
    expect(
      DetectorFindingSchema.safeParse({
        ...overflowFinding(),
        evidence: {
          ...overflowFinding().evidence,
          rawNode: { nodeType: 1, innerHTML: "submitted content" },
        },
      }).success,
    ).toBe(false);
    expect(
      DetectorFindingSchema.safeParse({
        ...overflowFinding(),
        evidence: {
          ...overflowFinding().evidence,
          error: new Error("raw detector error"),
        },
      }).success,
    ).toBe(false);
  });
});
