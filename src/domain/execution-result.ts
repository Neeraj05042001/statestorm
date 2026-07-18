import { z } from "zod";

const NonEmptyBoundedStringSchema = z.string().trim().min(1).max(1_000);

export const FixtureExecutionStatusSchema = z.enum([
  "passed",
  "compile-error",
  "runtime-error",
  "blank-render",
  "timeout",
  "infrastructure-error",
  "cancelled",
]);

export const FixtureExecutionEvidenceSchema = z.strictObject({
  sandboxCompleted: z.boolean(),
  renderCommitted: z.boolean(),
  expectedDomFound: z.boolean(),
  meaningfulDomFound: z.boolean(),
});

export const FixtureExecutionResultSchema = z.strictObject({
  fixtureId: z.string().trim().min(1).max(256),
  status: FixtureExecutionStatusSchema,
  summary: NonEmptyBoundedStringSchema,
  sanitizedMessage: z.string().trim().min(1).max(1_000).optional(),
  evidence: FixtureExecutionEvidenceSchema,
});

export const ExecutionSessionResultSchema = z.strictObject({
  sessionId: z.string().trim().min(1).max(256),
  status: z.enum(["completed", "cancelled"]),
  results: z.array(FixtureExecutionResultSchema).max(12),
});

export type FixtureExecutionStatus = z.infer<
  typeof FixtureExecutionStatusSchema
>;
export type FixtureExecutionEvidence = z.infer<
  typeof FixtureExecutionEvidenceSchema
>;
export type FixtureExecutionResult = z.infer<
  typeof FixtureExecutionResultSchema
>;
export type ExecutionSessionResult = z.infer<
  typeof ExecutionSessionResultSchema
>;
