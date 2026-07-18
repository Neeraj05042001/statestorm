import {
  ContractIssueSchema,
  RunPlanSchema,
} from "../../domain";
import { cloneJsonObject } from "../deterministic-fixtures/baseline-values";
import { RunPlanPlanningIssueCode } from "./issue-codes";
import type { AssembleRunPlanInput, RunPlanAssemblyResult } from "./types";

export function assembleRunPlan({
  submission,
  component,
  requirements,
  fixtures,
  issues,
}: AssembleRunPlanInput): RunPlanAssemblyResult {
  const parsed = RunPlanSchema.safeParse({
    version: 1,
    submission: { ...submission },
    component: {
      ...component,
      imports: [...component.imports],
      props: component.props.map((prop) => ({
        ...prop,
        ...(prop.enumValues === undefined
          ? {}
          : { enumValues: [...prop.enumValues] }),
      })),
      warnings: [...component.warnings],
    },
    requirements: requirements.map((requirement) => ({ ...requirement })),
    fixtures: fixtures.map((fixture) => ({
      ...fixture,
      props: cloneJsonObject(fixture.props),
    })),
    issues: issues.map((entry) => ({
      ...entry,
      ...(entry.path === undefined ? {} : { path: [...entry.path] }),
    })),
  });

  if (parsed.success) {
    return { runPlan: parsed.data, issues: [] };
  }

  const validationIssue = ContractIssueSchema.parse({
    code: RunPlanPlanningIssueCode.runPlanSchemaValidationFailed,
    severity: "error",
    message: "The assembled RunPlan failed the accepted version 1 schema",
    path: ["runPlan"],
    suggestion: "Correct trusted planning output before attempting execution",
  });
  return { issues: [validationIssue] };
}
