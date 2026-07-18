import {
  ContractIssueSchema,
  FixtureSchema,
  JsonValueSchema,
  type ContractIssue,
  type Fixture,
  type JsonObject,
  type JsonValue,
} from "../../domain";
import {
  cloneJsonObject,
  cloneJsonValue,
  isValueCompatibleWithProp,
} from "../deterministic-fixtures/baseline-values";
import { RunPlanPlanningIssueCode } from "./issue-codes";
import type {
  MaterializeSemanticFixturesInput,
  SemanticFixtureMaterializationResult,
} from "./types";

const MAX_SEMANTIC_FIXTURES = 4;

function warning(
  code: string,
  message: string,
  fixtureIndex: number,
  path: (string | number)[],
  suggestion: string,
): ContractIssue {
  return ContractIssueSchema.parse({
    code,
    severity: "warning",
    message,
    path: ["aiProposal", "semanticFixtures", fixtureIndex, ...path],
    suggestion,
  });
}

function setJsonProperty(
  target: JsonObject,
  key: string,
  value: JsonValue,
): void {
  Object.defineProperty(target, key, {
    value,
    enumerable: true,
    configurable: true,
    writable: true,
  });
}

export function materializeAiSemanticFixtures({
  contract,
  happyPathProps,
  proposals,
}: MaterializeSemanticFixturesInput): SemanticFixtureMaterializationResult {
  const fixtures: Fixture[] = [];
  const issues: ContractIssue[] = [];
  const propsByName = new Map(contract.props.map((prop) => [prop.name, prop]));

  proposals.forEach((proposal, proposalIndex) => {
    const candidateIssues: ContractIssue[] = [];
    const props = cloneJsonObject(happyPathProps);
    const assignedNames = new Set<string>();

    proposal.assignments.forEach((assignment, assignmentIndex) => {
      const prop = propsByName.get(assignment.propName);
      if (prop === undefined) {
        candidateIssues.push(
          warning(
            RunPlanPlanningIssueCode.fixtureUnknownProp,
            `Semantic fixture references undeclared prop '${assignment.propName}'`,
            proposalIndex,
            ["assignments", assignmentIndex, "propName"],
            "Use only prop names from ComponentContract",
          ),
        );
        return;
      }

      if (assignedNames.has(assignment.propName)) {
        candidateIssues.push(
          warning(
            RunPlanPlanningIssueCode.fixtureSchemaValidationFailed,
            `Semantic fixture assigns prop '${assignment.propName}' more than once`,
            proposalIndex,
            ["assignments", assignmentIndex, "propName"],
            "Assign each prop at most once per semantic fixture",
          ),
        );
        return;
      }
      assignedNames.add(assignment.propName);

      let rawValue: unknown;
      try {
        rawValue = JSON.parse(assignment.jsonValue);
      } catch {
        candidateIssues.push(
          warning(
            RunPlanPlanningIssueCode.fixtureInvalidJson,
            `Semantic fixture value for '${assignment.propName}' is not valid JSON`,
            proposalIndex,
            ["assignments", assignmentIndex, "jsonValue"],
            "Provide one complete JSON value encoded as text",
          ),
        );
        return;
      }

      const jsonValue = JsonValueSchema.safeParse(rawValue);
      if (
        !jsonValue.success ||
        !isValueCompatibleWithProp(prop, jsonValue.data)
      ) {
        candidateIssues.push(
          warning(
            RunPlanPlanningIssueCode.fixtureTypeMismatch,
            `Semantic fixture value for '${assignment.propName}' does not match kind '${prop.kind}'`,
            proposalIndex,
            ["assignments", assignmentIndex, "jsonValue"],
            "Use a JSON value compatible with the declared prop kind and enum values",
          ),
        );
        return;
      }

      setJsonProperty(props, prop.name, cloneJsonValue(jsonValue.data));
    });

    new Set(proposal.omitOptionalProps).forEach((propName) => {
      const prop = propsByName.get(propName);
      if (prop === undefined) {
        candidateIssues.push(
          warning(
            RunPlanPlanningIssueCode.fixtureUnknownProp,
            `Semantic fixture attempts to omit undeclared prop '${propName}'`,
            proposalIndex,
            ["omitOptionalProps"],
            "Use only optional prop names from ComponentContract",
          ),
        );
      } else if (prop.required) {
        candidateIssues.push(
          warning(
            RunPlanPlanningIssueCode.fixtureRequiredPropOmission,
            `Semantic fixture cannot omit required prop '${propName}'`,
            proposalIndex,
            ["omitOptionalProps"],
            "Omit only props marked optional in ComponentContract",
          ),
        );
      } else {
        delete props[propName];
      }
    });

    if (candidateIssues.length > 0) {
      issues.push(...candidateIssues);
      return;
    }

    if (fixtures.length >= MAX_SEMANTIC_FIXTURES) {
      issues.push(
        warning(
          RunPlanPlanningIssueCode.fixtureLimitApplied,
          `Semantic fixture ${proposalIndex + 1} was omitted because the four-fixture AI limit was reached`,
          proposalIndex,
          [],
          "Prioritize the most meaningful semantic states",
        ),
      );
      return;
    }

    const parsed = FixtureSchema.safeParse({
      id: `ai-semantic-${String(fixtures.length + 1).padStart(2, "0")}`,
      label: proposal.label,
      origin: "ai",
      intent: proposal.intent,
      props,
    });
    if (!parsed.success) {
      issues.push(
        warning(
          RunPlanPlanningIssueCode.fixtureSchemaValidationFailed,
          `Semantic fixture ${proposalIndex + 1} failed the trusted Fixture schema`,
          proposalIndex,
          [],
          "Keep the fixture label, intent and props within the accepted contract",
        ),
      );
      return;
    }

    fixtures.push({ ...parsed.data, props: cloneJsonObject(parsed.data.props) });
  });

  return { fixtures, issues };
}
