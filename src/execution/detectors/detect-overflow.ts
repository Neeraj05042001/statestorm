import {
  DetectorObservationCollectionSchema,
  type DetectorObservation,
} from "../../domain";

const OVERFLOW_TOLERANCE_PX = 2;
const MAX_OVERFLOW_FINDINGS = 5;
const MAX_INSPECTED_ELEMENTS = 200;

export interface OverflowCandidate {
  elementTag: string;
  elementHint?: string;
  clientWidth: number;
  scrollWidth: number;
  clientHeight: number;
  scrollHeight: number;
  visible: boolean;
  infrastructure: boolean;
}

function boundedDimension(value: number): number {
  return Math.min(10_000_000, Math.max(0, Math.round(value)));
}

export function detectOverflow(
  candidates: readonly OverflowCandidate[],
): DetectorObservation[] {
  const observations: DetectorObservation[] = [];

  for (const candidate of candidates.slice(0, MAX_INSPECTED_ELEMENTS)) {
    if (observations.length >= MAX_OVERFLOW_FINDINGS) break;
    if (!candidate.visible || candidate.infrastructure) continue;
    if (candidate.clientWidth <= 0 || candidate.clientHeight <= 0) continue;

    const horizontal =
      candidate.scrollWidth > candidate.clientWidth + OVERFLOW_TOLERANCE_PX;
    const vertical =
      candidate.scrollHeight > candidate.clientHeight + OVERFLOW_TOLERANCE_PX;
    if (!horizontal && !vertical) continue;

    observations.push({
      kind: "layout-overflow",
      evidence: {
        detector: "overflow-v1",
        elementTag: candidate.elementTag.slice(0, 32),
        ...(candidate.elementHint
          ? { elementHint: candidate.elementHint.slice(0, 128) }
          : {}),
        axis: horizontal && vertical ? "both" : horizontal ? "horizontal" : "vertical",
        clientWidth: boundedDimension(candidate.clientWidth),
        scrollWidth: boundedDimension(candidate.scrollWidth),
        clientHeight: boundedDimension(candidate.clientHeight),
        scrollHeight: boundedDimension(candidate.scrollHeight),
      },
    });
  }

  return DetectorObservationCollectionSchema.parse(observations);
}

export const overflowDetectorLimits = {
  tolerancePx: OVERFLOW_TOLERANCE_PX,
  maximumFindings: MAX_OVERFLOW_FINDINGS,
  maximumInspectedElements: MAX_INSPECTED_ELEMENTS,
} as const;
