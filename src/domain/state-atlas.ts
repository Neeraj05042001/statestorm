import { z } from "zod";

import {
  DetectorFindingSchema,
  type DetectorFinding,
} from "./detector-finding";
import {
  FixtureExecutionResultSchema,
  type FixtureExecutionResult,
} from "./execution-result";
import { FixtureOriginSchema } from "./fixture";
import { JsonObjectSchema } from "./json-value";

export const StateAtlasCategorySchema = z.enum([
  "clean",
  "runtime-failure",
  "blank-render",
  "compile-failure",
  "timeout",
  "infrastructure-failure",
  "overflow-warning",
  "broken-image",
  "cancelled",
]);

export function deriveStateAtlasCategory(
  result: FixtureExecutionResult,
  findings: readonly DetectorFinding[],
): z.infer<typeof StateAtlasCategorySchema> {
  if (result.status === "runtime-error") return "runtime-failure";
  if (result.status === "blank-render") return "blank-render";
  if (result.status === "compile-error") return "compile-failure";
  if (result.status === "timeout") return "timeout";
  if (result.status === "infrastructure-error") {
    return "infrastructure-failure";
  }
  if (result.status === "cancelled") return "cancelled";
  if (findings.some((finding) => finding.kind === "broken-image")) {
    return "broken-image";
  }
  if (findings.some((finding) => finding.kind === "layout-overflow")) {
    return "overflow-warning";
  }
  return "clean";
}

export const StateAtlasSummarySchema = z.strictObject({
  totalStates: z.number().int().min(0).max(12),
  cleanStates: z.number().int().min(0).max(12),
  runtimeFailures: z.number().int().min(0).max(12),
  blankRenders: z.number().int().min(0).max(12),
  overflowWarnings: z.number().int().min(0).max(12),
  brokenImages: z.number().int().min(0).max(12),
  otherFailures: z.number().int().min(0).max(12),
});

export const StateAtlasEntrySchema = z
  .strictObject({
    fixtureId: z.string().trim().min(1).max(256),
    fixtureLabel: z.string().trim().min(1),
    fixtureOrigin: FixtureOriginSchema,
    fixtureIntent: z.string().trim().min(1),
    fixtureProps: JsonObjectSchema,
    executionResult: FixtureExecutionResultSchema,
    visualFindings: z.array(DetectorFindingSchema).max(10),
    category: StateAtlasCategorySchema,
  })
  .superRefine((entry, context) => {
    if (entry.executionResult.fixtureId !== entry.fixtureId) {
      context.addIssue({
        code: "custom",
        path: ["executionResult", "fixtureId"],
        message: "Execution result must match the atlas fixture.",
      });
    }
    entry.visualFindings.forEach((finding, index) => {
      if (finding.fixtureId !== entry.fixtureId) {
        context.addIssue({
          code: "custom",
          path: ["visualFindings", index, "fixtureId"],
          message: "Visual finding must match the atlas fixture.",
        });
      }
    });
    if (
      JSON.stringify(entry.executionResult.visualFindings ?? []) !==
      JSON.stringify(entry.visualFindings)
    ) {
      context.addIssue({
        code: "custom",
        path: ["visualFindings"],
        message: "Atlas findings must match the recorded execution result.",
      });
    }
    const expectedCategory = deriveStateAtlasCategory(
      entry.executionResult,
      entry.visualFindings,
    );
    if (entry.category !== expectedCategory) {
      context.addIssue({
        code: "custom",
        path: ["category"],
        message: `Atlas category must be '${expectedCategory}'.`,
      });
    }
  });

export const StateAtlasSchema = z
  .strictObject({
    sessionId: z.string().trim().min(1).max(256),
    summary: StateAtlasSummarySchema,
    entries: z.array(StateAtlasEntrySchema).min(1).max(12),
  })
  .superRefine((atlas, context) => {
    const fixtureIds = new Set<string>();
    atlas.entries.forEach((entry, index) => {
      if (fixtureIds.has(entry.fixtureId)) {
        context.addIssue({
          code: "custom",
          path: ["entries", index, "fixtureId"],
          message: "State Atlas fixture IDs must be unique.",
        });
      }
      fixtureIds.add(entry.fixtureId);
    });
    const expectedSummary = {
      totalStates: atlas.entries.length,
      cleanStates: atlas.entries.filter((entry) => entry.category === "clean")
        .length,
      runtimeFailures: atlas.entries.filter(
        (entry) => entry.executionResult.status === "runtime-error",
      ).length,
      blankRenders: atlas.entries.filter(
        (entry) => entry.executionResult.status === "blank-render",
      ).length,
      overflowWarnings: atlas.entries.filter((entry) =>
        entry.visualFindings.some(
          (finding) => finding.kind === "layout-overflow",
        ),
      ).length,
      brokenImages: atlas.entries.filter((entry) =>
        entry.visualFindings.some(
          (finding) => finding.kind === "broken-image",
        ),
      ).length,
      otherFailures: atlas.entries.filter((entry) =>
        [
          "compile-error",
          "timeout",
          "infrastructure-error",
          "cancelled",
        ].includes(entry.executionResult.status),
      ).length,
    };
    if (JSON.stringify(atlas.summary) !== JSON.stringify(expectedSummary)) {
      context.addIssue({
        code: "custom",
        path: ["summary"],
        message: "State Atlas summary must match its entries.",
      });
    }
  });

export type StateAtlasCategory = z.infer<typeof StateAtlasCategorySchema>;
export type StateAtlasSummary = z.infer<typeof StateAtlasSummarySchema>;
export type StateAtlasEntry = z.infer<typeof StateAtlasEntrySchema>;
export type StateAtlas = z.infer<typeof StateAtlasSchema>;
