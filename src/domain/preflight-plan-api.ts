import { z } from "zod";

import { ComponentContractSchema } from "./component-contract";
import { ContractIssueSchema } from "./contract-issue";
import { RunPlanSchema } from "./run-plan";

export const AiPlanningStatusSchema = z.enum([
  "generated",
  "unavailable",
  "timeout",
  "refused",
  "invalid-output",
  "provider-error",
]);

export const PreflightAiSummarySchema = z.strictObject({
  status: AiPlanningStatusSchema,
  model: z.string().trim().min(1).max(128).optional(),
});

const AcceptedPreflightPlanResponseSchema = z.strictObject({
  accepted: z.literal(true),
  contract: ComponentContractSchema,
  runPlan: RunPlanSchema,
  issues: z.array(ContractIssueSchema),
  ai: PreflightAiSummarySchema,
});

const RejectedPreflightPlanResponseSchema = z.strictObject({
  accepted: z.literal(false),
  issues: z.array(ContractIssueSchema),
});

export const PreflightPlanApiResponseSchema = z.discriminatedUnion(
  "accepted",
  [AcceptedPreflightPlanResponseSchema, RejectedPreflightPlanResponseSchema],
);

export type AiPlanningStatus = z.infer<typeof AiPlanningStatusSchema>;
export type PreflightAiSummary = z.infer<typeof PreflightAiSummarySchema>;
export type PreflightPlanApiResponse = z.infer<
  typeof PreflightPlanApiResponseSchema
>;
