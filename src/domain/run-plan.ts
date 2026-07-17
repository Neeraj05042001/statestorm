import { z } from "zod";

import { ComponentContractSchema } from "./component-contract";
import { ComponentSubmissionSchema } from "./component-submission";
import { ContractIssueSchema } from "./contract-issue";
import { FixtureSchema } from "./fixture";
import { JsonValueSchema } from "./json-value";
import { RequirementSchema } from "./requirement";

const RunPlanBaseSchema = z.strictObject({
  version: z.literal(1),
  submission: ComponentSubmissionSchema,
  component: ComponentContractSchema,
  requirements: z.array(RequirementSchema),
  fixtures: z
    .array(FixtureSchema)
    .min(1, "RunPlan requires at least one fixture")
    .max(12, "RunPlan supports at most twelve fixtures"),
  issues: z.array(ContractIssueSchema),
});

export const RunPlanSchema = RunPlanBaseSchema.superRefine((plan, context) => {
  if (plan.submission.language !== plan.component.language) {
    context.addIssue({
      code: "custom",
      path: ["component", "language"],
      message: "Component contract language must match the submission language",
    });
  }

  const firstFixtureIndexById = new Map<string, number>();
  plan.fixtures.forEach((fixture, fixtureIndex) => {
    const firstIndex = firstFixtureIndexById.get(fixture.id);
    if (firstIndex === undefined) {
      firstFixtureIndexById.set(fixture.id, fixtureIndex);
    } else {
      context.addIssue({
        code: "custom",
        path: ["fixtures", fixtureIndex, "id"],
        message: `Duplicate fixture ID '${fixture.id}' (first used at index ${firstIndex})`,
      });
    }
  });

  const firstRequirementIndexById = new Map<string, number>();
  plan.requirements.forEach((requirement, requirementIndex) => {
    const firstIndex = firstRequirementIndexById.get(requirement.id);
    if (firstIndex === undefined) {
      firstRequirementIndexById.set(requirement.id, requirementIndex);
    } else {
      context.addIssue({
        code: "custom",
        path: ["requirements", requirementIndex, "id"],
        message: `Duplicate requirement ID '${requirement.id}' (first used at index ${firstIndex})`,
      });
    }
  });

  const declaredProps = new Map(
    plan.component.props.map((prop) => [prop.name, prop]),
  );

  plan.fixtures.forEach((fixture, fixtureIndex) => {
    plan.component.props.forEach((prop) => {
      if (
        prop.required &&
        !Object.prototype.hasOwnProperty.call(fixture.props, prop.name)
      ) {
        context.addIssue({
          code: "custom",
          path: ["fixtures", fixtureIndex, "props", prop.name],
          message: `Required prop '${prop.name}' is missing from fixture '${fixture.id}'`,
        });
      }
    });

    Object.keys(fixture.props).forEach((propName) => {
      if (!declaredProps.has(propName)) {
        context.addIssue({
          code: "custom",
          path: ["fixtures", fixtureIndex, "props", propName],
          message: `Fixture prop '${propName}' is not declared by the component contract`,
        });
      }
    });
  });

  const serializableResult = JsonValueSchema.safeParse(plan);
  if (!serializableResult.success) {
    serializableResult.error.issues.forEach((issue) => {
      context.addIssue({
        code: "custom",
        path: issue.path,
        message: `RunPlan must be JSON-serializable: ${issue.message}`,
      });
    });
  }
});

export type RunPlan = z.infer<typeof RunPlanSchema>;

export function parseRunPlan(input: unknown): RunPlan {
  return RunPlanSchema.parse(input);
}

export function safeParseRunPlan(input: unknown) {
  return RunPlanSchema.safeParse(input);
}

export function isRunPlanExecutable(plan: RunPlan): boolean {
  return plan.issues.every((issue) => issue.severity !== "error");
}
