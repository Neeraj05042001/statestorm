import { z } from "zod";

const UrlSafeSubmissionIdSchema = z
  .string()
  .trim()
  .min(1, "Submission ID is required")
  .max(128, "Submission ID must be 128 characters or fewer")
  .regex(
    /^[A-Za-z0-9][A-Za-z0-9._~-]*$/,
    "Submission ID must use only URL-safe unreserved characters",
  );

export const ComponentLanguageSchema = z.enum(["tsx", "jsx"]);

export const ComponentSubmissionSchema = z.strictObject({
  id: UrlSafeSubmissionIdSchema,
  prompt: z
    .string()
    .trim()
    .min(1, "Prompt is required")
    .max(10_000, "Prompt must be 10,000 characters or fewer"),
  componentCode: z
    .string()
    .trim()
    .min(1, "Component code is required")
    .max(60_000, "Component code must be 60,000 characters or fewer"),
  language: ComponentLanguageSchema,
});

export type ComponentLanguage = z.infer<typeof ComponentLanguageSchema>;
export type ComponentSubmission = z.infer<typeof ComponentSubmissionSchema>;
