import { describe, expect, it } from "vitest";

import { DetectorFindingSchema } from "../../../domain";
import { normalizeDetectorEvidence } from "../normalize-detector-evidence";

describe("normalizeDetectorEvidence", () => {
  it("assigns stable application IDs and validates every finding", () => {
    const input = {
      fixtureId: "fixture-long",
      observations: [
        {
          kind: "layout-overflow",
          evidence: {
            detector: "overflow-v1",
            elementTag: "H2",
            axis: "horizontal",
            clientWidth: 180,
            scrollWidth: 420,
          },
        },
        {
          kind: "broken-image",
          evidence: {
            detector: "broken-image-v1",
            elementTag: "IMG",
            imageAltPresent: true,
            imageSourceKind: "relative",
          },
        },
      ],
    };

    const first = normalizeDetectorEvidence(input);
    const second = normalizeDetectorEvidence(input);

    expect(first).toEqual(second);
    expect(new Set(first.map((finding) => finding.id)).size).toBe(2);
    expect(first.every((finding) => DetectorFindingSchema.safeParse(finding).success)).toBe(
      true,
    );
  });

  it("fails closed when evidence fields do not match the detector kind", () => {
    expect(() =>
      normalizeDetectorEvidence({
        fixtureId: "fixture-invalid",
        observations: [
          {
            kind: "broken-image",
            evidence: {
              detector: "broken-image-v1",
              axis: "horizontal",
            },
          },
        ],
      }),
    ).toThrow();
  });
});
