import { z } from "zod";

import { ComponentContractSchema } from "./component-contract";
import { ContractIssueSchema } from "./contract-issue";

const AcceptedComponentAnalysisResponseSchema = z.strictObject({
  accepted: z.literal(true),
  contract: ComponentContractSchema,
  issues: z.array(ContractIssueSchema),
});

const RejectedComponentAnalysisResponseSchema = z.strictObject({
  accepted: z.literal(false),
  issues: z.array(ContractIssueSchema),
});

export const ComponentAnalysisApiResponseSchema = z.discriminatedUnion(
  "accepted",
  [
    AcceptedComponentAnalysisResponseSchema,
    RejectedComponentAnalysisResponseSchema,
  ],
);

export type ComponentAnalysisApiResponse = z.infer<
  typeof ComponentAnalysisApiResponseSchema
>;
