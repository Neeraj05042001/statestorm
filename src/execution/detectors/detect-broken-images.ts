import {
  DetectorObservationCollectionSchema,
  type DetectorObservation,
} from "../../domain";

const MAX_BROKEN_IMAGE_FINDINGS = 5;
const MAX_INSPECTED_IMAGES = 100;

export interface ImageCandidate {
  elementHint?: string;
  complete: boolean;
  naturalWidth: number;
  alt: string;
  source: string | null;
}

export function categorizeImageSource(
  source: string | null,
): "empty" | "relative" | "external" | "data" {
  const normalized = source?.trim() ?? "";
  if (!normalized) return "empty";
  if (normalized.toLowerCase().startsWith("data:")) return "data";
  if (/^(?:https?:)?\/\//i.test(normalized)) return "external";
  return "relative";
}

export function detectBrokenImages(
  candidates: readonly ImageCandidate[],
): DetectorObservation[] {
  const observations: DetectorObservation[] = [];

  for (const candidate of candidates.slice(0, MAX_INSPECTED_IMAGES)) {
    if (observations.length >= MAX_BROKEN_IMAGE_FINDINGS) break;
    if (!candidate.complete || candidate.naturalWidth !== 0) continue;

    observations.push({
      kind: "broken-image",
      evidence: {
        detector: "broken-image-v1",
        elementTag: "IMG",
        ...(candidate.elementHint
          ? { elementHint: candidate.elementHint.slice(0, 128) }
          : {}),
        imageAltPresent: candidate.alt.trim().length > 0,
        imageSourceKind: categorizeImageSource(candidate.source),
      },
    });
  }

  return DetectorObservationCollectionSchema.parse(observations);
}

export const brokenImageDetectorLimits = {
  maximumFindings: MAX_BROKEN_IMAGE_FINDINGS,
  maximumInspectedImages: MAX_INSPECTED_IMAGES,
} as const;
