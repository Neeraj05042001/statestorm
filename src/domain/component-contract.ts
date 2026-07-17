import { z } from "zod";

import { ComponentLanguageSchema } from "./component-submission";
import { JsonValueSchema } from "./json-value";

const NonEmptyStringSchema = z.string().trim().min(1);

export const PropKindSchema = z.enum([
  "string",
  "number",
  "boolean",
  "enum",
  "array",
  "object",
  "unknown",
]);

export const PropDefinitionSchema = z
  .strictObject({
    name: NonEmptyStringSchema,
    required: z.boolean(),
    kind: PropKindSchema,
    typeText: NonEmptyStringSchema,
    description: NonEmptyStringSchema.optional(),
    defaultValue: JsonValueSchema.optional(),
    enumValues: z.array(JsonValueSchema).optional(),
  })
  .superRefine((prop, context) => {
    if (
      Object.prototype.hasOwnProperty.call(prop, "defaultValue") &&
      prop.defaultValue === undefined
    ) {
      context.addIssue({
        code: "custom",
        path: ["defaultValue"],
        message: "Default value must be JSON-compatible when present",
      });
    }

    if (prop.kind === "enum" && (prop.enumValues?.length ?? 0) < 2) {
      context.addIssue({
        code: "custom",
        path: ["enumValues"],
        message: "Enum props require at least two JSON-compatible values",
      });
    }
  });

export const SupportedImportSchema = NonEmptyStringSchema.superRefine(
  (specifier, context) => {
    if (specifier.startsWith(".")) {
      context.addIssue({
        code: "custom",
        message: "Relative imports are unsupported",
      });
      return;
    }

    if (specifier !== "react" && specifier !== "react/jsx-runtime") {
      context.addIssue({
        code: "custom",
        message: `Unsupported import: ${specifier}`,
      });
    }
  },
);

export const ComponentContractSchema = z
  .strictObject({
    componentName: NonEmptyStringSchema,
    exportStyle: z.literal("default"),
    language: ComponentLanguageSchema,
    imports: z.array(SupportedImportSchema),
    props: z.array(PropDefinitionSchema),
    warnings: z.array(NonEmptyStringSchema),
  })
  .superRefine((contract, context) => {
    const firstIndexByName = new Map<string, number>();

    contract.props.forEach((prop, index) => {
      const firstIndex = firstIndexByName.get(prop.name);
      if (firstIndex === undefined) {
        firstIndexByName.set(prop.name, index);
        return;
      }

      context.addIssue({
        code: "custom",
        path: ["props", index, "name"],
        message: `Duplicate prop name '${prop.name}' (first declared at index ${firstIndex})`,
      });
    });
  });

export type PropKind = z.infer<typeof PropKindSchema>;
export type PropDefinition = z.infer<typeof PropDefinitionSchema>;
export type ComponentContract = z.infer<typeof ComponentContractSchema>;
