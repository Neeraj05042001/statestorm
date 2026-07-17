import { z } from "zod";

/**
 * The executable data boundary. Zod's recursive JSON schema accepts only JSON
 * primitives, arrays and records, and rejects non-finite numbers and non-plain
 * object instances such as Date, Map, Set and user-defined classes.
 */
export const JsonValueSchema = z.json();

export const JsonObjectSchema = z.record(z.string(), JsonValueSchema);

export type JsonValue = z.infer<typeof JsonValueSchema>;
export type JsonObject = z.infer<typeof JsonObjectSchema>;
