import {
  DetectorFindingSchema,
  DetectorObservationCollectionSchema,
  type DetectorFinding,
  type DetectorObservation,
} from "../../domain";

function findingSummary(observation: DetectorObservation): string {
  if (observation.kind === "broken-image") {
    return "A rendered image completed without usable image data.";
  }
  const axis = observation.evidence.axis ?? "layout";
  return `Possible ${axis} layout overflow was detected.`;
}

function stableFixtureKey(fixtureId: string): string {
  let hash = 2_166_136_261;
  for (let index = 0; index < fixtureId.length; index += 1) {
    hash ^= fixtureId.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return (hash >>> 0).toString(36);
}

export function normalizeDetectorEvidence(input: {
  fixtureId: string;
  observations: unknown;
}): DetectorFinding[] {
  const observations = DetectorObservationCollectionSchema.parse(
    input.observations,
  );
  const kindCounts = new Map<string, number>();

  return observations.map((observation) => {
    const kindIndex = (kindCounts.get(observation.kind) ?? 0) + 1;
    kindCounts.set(observation.kind, kindIndex);
    return DetectorFindingSchema.parse({
      id: `detector-${stableFixtureKey(input.fixtureId)}-${observation.kind}-${kindIndex}`,
      fixtureId: input.fixtureId,
      kind: observation.kind,
      severity: observation.kind === "broken-image" ? "error" : "warning",
      summary: findingSummary(observation),
      evidence: observation.evidence,
    });
  });
}
