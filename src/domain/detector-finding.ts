import { z } from "zod";

const BoundedIdentifierSchema = z.string().trim().min(1).max(256);
const BoundedSummarySchema = z.string().trim().min(1).max(300);
const BoundedDetectorSchema = z.string().trim().min(1).max(64);
const BoundedElementTagSchema = z.string().trim().min(1).max(32);
const BoundedElementHintSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .refine(
    (value) => !/[\s\/:?&]/.test(value),
    "Element hints cannot contain URL or whitespace characters.",
  );
const BoundedDimensionSchema = z.number().finite().min(0).max(10_000_000);

export const DetectorKindSchema = z.enum([
  "layout-overflow",
  "broken-image",
]);

export const DetectorSeveritySchema = z.enum(["warning", "error"]);

export const DetectorEvidenceSchema = z.strictObject({
  detector: BoundedDetectorSchema,
  elementTag: BoundedElementTagSchema.optional(),
  elementHint: BoundedElementHintSchema.optional(),
  axis: z.enum(["horizontal", "vertical", "both"]).optional(),
  clientWidth: BoundedDimensionSchema.optional(),
  scrollWidth: BoundedDimensionSchema.optional(),
  clientHeight: BoundedDimensionSchema.optional(),
  scrollHeight: BoundedDimensionSchema.optional(),
  imageAltPresent: z.boolean().optional(),
  imageSourceKind: z
    .enum(["empty", "relative", "external", "data"])
    .optional(),
});

export const DetectorFindingSchema = z
  .strictObject({
    id: BoundedIdentifierSchema,
    fixtureId: BoundedIdentifierSchema,
    kind: DetectorKindSchema,
    severity: DetectorSeveritySchema,
    summary: BoundedSummarySchema,
    evidence: DetectorEvidenceSchema,
  })
  .superRefine((finding, context) => {
    if (finding.kind === "layout-overflow") {
      if (finding.evidence.detector !== "overflow-v1") {
        context.addIssue({
          code: "custom",
          path: ["evidence", "detector"],
          message: "Overflow findings require the accepted detector name.",
        });
      }
      if (finding.severity !== "warning") {
        context.addIssue({
          code: "custom",
          path: ["severity"],
          message: "Overflow findings use warning severity.",
        });
      }
      if (!finding.evidence.axis) {
        context.addIssue({
          code: "custom",
          path: ["evidence", "axis"],
          message: "Overflow evidence requires a bounded axis.",
        });
      }
      if (
        finding.evidence.imageAltPresent !== undefined ||
        finding.evidence.imageSourceKind !== undefined
      ) {
        context.addIssue({
          code: "custom",
          path: ["evidence"],
          message: "Overflow evidence cannot contain image evidence.",
        });
      }
    }

    if (finding.kind === "broken-image") {
      if (finding.evidence.detector !== "broken-image-v1") {
        context.addIssue({
          code: "custom",
          path: ["evidence", "detector"],
          message: "Broken-image findings require the accepted detector name.",
        });
      }
      if (finding.severity !== "error") {
        context.addIssue({
          code: "custom",
          path: ["severity"],
          message: "Confirmed broken-image findings use error severity.",
        });
      }
      if (
        finding.evidence.imageAltPresent === undefined ||
        finding.evidence.imageSourceKind === undefined
      ) {
        context.addIssue({
          code: "custom",
          path: ["evidence"],
          message: "Broken-image evidence requires alt and source metadata.",
        });
      }
      if (
        finding.evidence.axis !== undefined ||
        finding.evidence.clientWidth !== undefined ||
        finding.evidence.scrollWidth !== undefined ||
        finding.evidence.clientHeight !== undefined ||
        finding.evidence.scrollHeight !== undefined
      ) {
        context.addIssue({
          code: "custom",
          path: ["evidence"],
          message: "Broken-image evidence cannot contain layout dimensions.",
        });
      }
    }
  });

export const DetectorObservationSchema = z.strictObject({
  kind: DetectorKindSchema,
  evidence: DetectorEvidenceSchema,
});

export const DetectorObservationCollectionSchema = z
  .array(DetectorObservationSchema)
  .max(10)
  .superRefine((observations, context) => {
    for (const kind of DetectorKindSchema.options) {
      if (observations.filter((observation) => observation.kind === kind).length > 5) {
        context.addIssue({
          code: "custom",
          message: `Detector evidence contains more than five ${kind} observations.`,
        });
      }
    }
  });

export type DetectorKind = z.infer<typeof DetectorKindSchema>;
export type DetectorSeverity = z.infer<typeof DetectorSeveritySchema>;
export type DetectorEvidence = z.infer<typeof DetectorEvidenceSchema>;
export type DetectorFinding = z.infer<typeof DetectorFindingSchema>;
export type DetectorObservation = z.infer<typeof DetectorObservationSchema>;
