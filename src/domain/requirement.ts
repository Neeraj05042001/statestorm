import { z } from "zod";

import { JsonValueSchema } from "./json-value";

const NonEmptyStringSchema = z.string().trim().min(1);

export const RequirementCategorySchema = z.enum([
  "content",
  "state",
  "layout",
  "media",
  "behavior",
  "visual",
  "unsupported",
]);

export const RequirementVerificationSchema = z.enum([
  "deterministic",
  "heuristic",
  "unsupported",
]);

export const AssertionTypeSchema = z.enum([
  "text-present",
  "text-absent",
  "element-count",
  "image-present",
  "renders",
  "no-overflow",
]);

export const ExpectedAssertionSchema = z.strictObject({
  type: AssertionTypeSchema,
  value: JsonValueSchema,
});

export const RequirementSchema = z
  .strictObject({
    id: NonEmptyStringSchema,
    statement: NonEmptyStringSchema,
    sourceQuote: NonEmptyStringSchema,
    category: RequirementCategorySchema,
    verification: RequirementVerificationSchema,
    expectedAssertion: ExpectedAssertionSchema.optional(),
  })
  .superRefine((requirement, context) => {
    if (
      requirement.verification === "deterministic" &&
      requirement.expectedAssertion === undefined
    ) {
      context.addIssue({
        code: "custom",
        path: ["expectedAssertion"],
        message: "Deterministic requirements require a supported assertion",
      });
    }

    if (
      requirement.category === "unsupported" &&
      requirement.verification !== "unsupported"
    ) {
      context.addIssue({
        code: "custom",
        path: ["verification"],
        message: "Unsupported requirements must use unsupported verification",
      });
    }
  });

export type RequirementCategory = z.infer<typeof RequirementCategorySchema>;
export type RequirementVerification = z.infer<
  typeof RequirementVerificationSchema
>;
export type AssertionType = z.infer<typeof AssertionTypeSchema>;
export type ExpectedAssertion = z.infer<typeof ExpectedAssertionSchema>;
export type Requirement = z.infer<typeof RequirementSchema>;
