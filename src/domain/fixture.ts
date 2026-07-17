import { z } from "zod";

import { JsonObjectSchema } from "./json-value";

const NonEmptyStringSchema = z.string().trim().min(1);

export const FixtureOriginSchema = z.enum([
  "deterministic",
  "ai",
  "manual",
]);

export const FixtureSchema = z.strictObject({
  id: NonEmptyStringSchema,
  label: NonEmptyStringSchema,
  origin: FixtureOriginSchema,
  intent: NonEmptyStringSchema,
  props: JsonObjectSchema,
});

export type FixtureOrigin = z.infer<typeof FixtureOriginSchema>;
export type Fixture = z.infer<typeof FixtureSchema>;
