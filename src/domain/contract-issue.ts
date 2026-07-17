import { z } from "zod";

const NonEmptyStringSchema = z.string().trim().min(1);

export const ContractIssueSeveritySchema = z.enum(["error", "warning"]);

export const ContractIssuePathSegmentSchema = z.union([
  NonEmptyStringSchema,
  z.number().int().nonnegative(),
]);

export const ContractIssueSchema = z.strictObject({
  code: NonEmptyStringSchema.regex(
    /^[A-Z][A-Z0-9_]*$/,
    "Issue code must be stable uppercase snake case",
  ),
  severity: ContractIssueSeveritySchema,
  message: NonEmptyStringSchema,
  path: z.array(ContractIssuePathSegmentSchema).min(1).optional(),
  suggestion: NonEmptyStringSchema.optional(),
});

export type ContractIssueSeverity = z.infer<
  typeof ContractIssueSeveritySchema
>;
export type ContractIssuePathSegment = z.infer<
  typeof ContractIssuePathSegmentSchema
>;
export type ContractIssue = z.infer<typeof ContractIssueSchema>;
