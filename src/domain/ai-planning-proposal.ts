import { z } from "zod";

const ConciseTitleSchema = z.string().trim().min(1).max(120);
const ConciseStatementSchema = z.string().trim().min(1).max(500);
const ConciseRationaleSchema = z.string().trim().min(1).max(300);
const PropNameSchema = z.string().trim().min(1).max(128);
const JsonValueTextSchema = z.string().trim().min(1).max(2_000);

export const AiRequirementClassificationSchema = z.enum([
  "deterministic",
  "heuristic",
  "unsupported",
]);

export const AiRequirementProposalSchema = z.strictObject({
  title: ConciseTitleSchema,
  statement: ConciseStatementSchema,
  classification: AiRequirementClassificationSchema,
  rationale: ConciseRationaleSchema,
});

export const AiFixtureAssignmentSchema = z.strictObject({
  propName: PropNameSchema,
  jsonValue: JsonValueTextSchema,
});

export const AiSemanticFixtureProposalSchema = z.strictObject({
  label: ConciseTitleSchema,
  intent: ConciseStatementSchema,
  assignments: z.array(AiFixtureAssignmentSchema).max(12),
  omitOptionalProps: z.array(PropNameSchema).max(12),
});

export const AiPlanningProposalSchema = z.strictObject({
  requirements: z.array(AiRequirementProposalSchema).max(8),
  semanticFixtures: z.array(AiSemanticFixtureProposalSchema).max(4),
});

export type AiRequirementClassification = z.infer<
  typeof AiRequirementClassificationSchema
>;
export type AiRequirementProposal = z.infer<
  typeof AiRequirementProposalSchema
>;
export type AiFixtureAssignment = z.infer<typeof AiFixtureAssignmentSchema>;
export type AiSemanticFixtureProposal = z.infer<
  typeof AiSemanticFixtureProposalSchema
>;
export type AiPlanningProposal = z.infer<typeof AiPlanningProposalSchema>;
