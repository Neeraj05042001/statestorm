import {
  ComponentContractSchema,
  ContractIssueSchema,
  FixtureSchema,
  JsonValueSchema,
  type ComponentContract,
  type ContractIssue,
  type Fixture,
  type JsonValue,
} from "../../domain";
import {
  canonicalJson,
  cloneJsonObject,
  hasExplicitDefault,
  isValueCompatibleWithProp,
} from "./baseline-values";
import { selectDeterministicCandidates } from "./candidate-deduplication";
import {
  createFixtureCandidates,
  createHappyPathProps,
} from "./fixture-candidates";
import { DeterministicFixtureIssueCode } from "./issue-codes";
import type { DeterministicFixtureGenerationResult } from "./types";

function issuePath(path: readonly PropertyKey[]): (string | number)[] {
  return path.map((segment) =>
    typeof segment === "number" || typeof segment === "string"
      ? segment
      : String(segment),
  );
}

function validatedIssues(issues: ContractIssue[]): ContractIssue[] {
  return issues.map((issue) => ContractIssueSchema.parse(issue));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function rawMetadataIssues(input: unknown): ContractIssue[] {
  if (!isRecord(input) || !Array.isArray(input.props)) {
    return [];
  }

  const issues: ContractIssue[] = [];

  input.props.forEach((rawProp, index) => {
    if (!isRecord(rawProp) || typeof rawProp.name !== "string") {
      return;
    }

    const path = ["component", "props", index];
    if (rawProp.kind === "unknown") {
      issues.push({
        code: DeterministicFixtureIssueCode.unexecutablePropKind,
        severity: "error",
        message: `Prop '${rawProp.name}' has the unexecutable kind 'unknown'`,
        path: [...path, "kind"],
        suggestion: "Resolve the prop to a JSON-executable kind before fixture planning",
      });
      return;
    }

    if (rawProp.kind === "enum") {
      const enumValues = rawProp.enumValues;
      const validValues = Array.isArray(enumValues)
        ? enumValues.filter((value) => JsonValueSchema.safeParse(value).success)
        : [];
      const distinctValues = new Set(
        validValues.map((value) => canonicalJson(value as JsonValue)),
      );

      if (
        !Array.isArray(enumValues) ||
        validValues.length !== enumValues.length ||
        distinctValues.size < 2
      ) {
        issues.push({
          code: DeterministicFixtureIssueCode.invalidEnumMetadata,
          severity: "error",
          message: `Enum prop '${rawProp.name}' requires at least two distinct JSON values`,
          path: [...path, "enumValues"],
          suggestion: "Provide ordered, distinct JSON-compatible enum metadata",
        });
        return;
      }
    }

    if (Object.prototype.hasOwnProperty.call(rawProp, "defaultValue")) {
      const parsedValue = JsonValueSchema.safeParse(rawProp.defaultValue);
      if (!parsedValue.success) {
        issues.push({
          code: DeterministicFixtureIssueCode.invalidPropDefault,
          severity: "error",
          message: `Default for prop '${rawProp.name}' is not JSON-compatible`,
          path: [...path, "defaultValue"],
          suggestion: "Use a complete JSON value compatible with the declared prop kind",
        });
      }
    }
  });

  return issues;
}

function contractValidationIssues(input: unknown): ContractIssue[] {
  const result = ComponentContractSchema.safeParse(input);
  if (result.success) {
    return [];
  }

  return result.error.issues.map((issue) => {
    const code = issue.path.includes("enumValues")
      ? DeterministicFixtureIssueCode.invalidEnumMetadata
      : issue.path.includes("defaultValue")
        ? DeterministicFixtureIssueCode.invalidPropDefault
        : DeterministicFixtureIssueCode.fixtureSchemaValidationFailed;

    return {
      code,
      severity: "error" as const,
      message: `Component contract cannot generate deterministic fixtures: ${issue.message}`,
      path: ["component", ...issuePath(issue.path)],
      suggestion: "Provide a ComponentContract that passes the accepted runtime schema",
    };
  });
}

function executableMetadataIssues(
  contract: ComponentContract,
): ContractIssue[] {
  const issues: ContractIssue[] = [];

  contract.props.forEach((prop, index) => {
    if (prop.kind === "unknown") {
      return;
    }

    if (
      hasExplicitDefault(prop) &&
      !isValueCompatibleWithProp(prop, prop.defaultValue)
    ) {
      issues.push({
        code: DeterministicFixtureIssueCode.invalidPropDefault,
        severity: "error",
        message: `Default for prop '${prop.name}' does not match kind '${prop.kind}'`,
        path: ["component", "props", index, "defaultValue"],
        suggestion: "Use a JSON default compatible with the declared prop kind",
      });
    }
  });

  return issues;
}

function collectionCoverageIssue(
  contract: ComponentContract,
): ContractIssue | undefined {
  const hasUnpopulatedCollection = contract.props.some(
    (prop) =>
      (prop.kind === "array" || prop.kind === "object") &&
      !hasExplicitDefault(prop),
  );

  if (!hasUnpopulatedCollection) {
    return undefined;
  }

  return {
    code: DeterministicFixtureIssueCode.limitedCollectionCoverage,
    severity: "warning",
    message:
      "Collection props without explicit defaults are covered only by empty containers",
    path: ["component", "props"],
    suggestion:
      "Populated nested values require richer type-shape metadata or later AI semantic generation",
  };
}

function fixtureContractIssue(
  fixture: Fixture,
  contract: ComponentContract,
  fixtureIndex: number,
): ContractIssue | undefined {
  const declaredNames = new Set(contract.props.map((prop) => prop.name));
  const missingRequired = contract.props.find(
    (prop) =>
      prop.required &&
      !Object.prototype.hasOwnProperty.call(fixture.props, prop.name),
  );
  if (missingRequired !== undefined) {
    return {
      code: DeterministicFixtureIssueCode.fixtureSchemaValidationFailed,
      severity: "error",
      message: `Generated fixture '${fixture.id}' is missing required prop '${missingRequired.name}'`,
      path: ["fixtures", fixtureIndex, "props", missingRequired.name],
      suggestion: "Preserve every required prop in each deterministic strategy",
    };
  }

  const unknownName = Object.keys(fixture.props).find(
    (name) => !declaredNames.has(name),
  );
  if (unknownName !== undefined) {
    return {
      code: DeterministicFixtureIssueCode.fixtureSchemaValidationFailed,
      severity: "error",
      message: `Generated fixture '${fixture.id}' contains undeclared prop '${unknownName}'`,
      path: ["fixtures", fixtureIndex, "props", unknownName],
      suggestion: "Generate values only for props declared by ComponentContract",
    };
  }

  return undefined;
}

function validateFixtures(
  contract: ComponentContract,
  candidates: ReturnType<typeof selectDeterministicCandidates>["candidates"],
): { fixtures: Fixture[]; issues: ContractIssue[] } {
  const fixtures: Fixture[] = [];
  const issues: ContractIssue[] = [];

  candidates.forEach((candidate, index) => {
    const result = FixtureSchema.safeParse({
      ...candidate,
      origin: "deterministic",
      props: cloneJsonObject(candidate.props),
    });

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        issues.push({
          code: DeterministicFixtureIssueCode.fixtureSchemaValidationFailed,
          severity: "error",
          message: `Generated fixture '${candidate.id}' failed validation: ${issue.message}`,
          path: ["fixtures", index, ...issuePath(issue.path)],
          suggestion: "Keep deterministic fixture output aligned with FixtureSchema",
        });
      });
      return;
    }

    const contractIssue = fixtureContractIssue(result.data, contract, index);
    if (contractIssue !== undefined) {
      issues.push(contractIssue);
      return;
    }

    fixtures.push({
      ...result.data,
      props: cloneJsonObject(result.data.props),
    });
  });

  return { fixtures, issues };
}

export function generateDeterministicFixtures(
  contract: ComponentContract,
): DeterministicFixtureGenerationResult {
  const validationResult = ComponentContractSchema.safeParse(contract);
  const metadataIssues = rawMetadataIssues(contract);
  const validationIssues = contractValidationIssues(contract);

  if (!validationResult.success || metadataIssues.length > 0) {
    const primaryIssues = metadataIssues.length > 0 ? metadataIssues : validationIssues;
    return { fixtures: [], issues: validatedIssues(primaryIssues) };
  }

  const validatedContract = validationResult.data;
  const executionIssues = executableMetadataIssues(validatedContract);
  if (executionIssues.length > 0) {
    return { fixtures: [], issues: validatedIssues(executionIssues) };
  }

  const happyPathProps = createHappyPathProps(validatedContract);
  if (happyPathProps === undefined) {
    return {
      fixtures: [],
      issues: validatedIssues([
        {
          code: DeterministicFixtureIssueCode.unexecutablePropKind,
          severity: "error",
          message: "A declared prop has no deterministic JSON representative value",
          path: ["component", "props"],
          suggestion: "Resolve every prop to an executable supported kind",
        },
      ]),
    };
  }

  const warning = collectionCoverageIssue(validatedContract);
  const candidateValidation = validateFixtures(
    validatedContract,
    createFixtureCandidates(validatedContract, happyPathProps),
  );
  if (candidateValidation.issues.length > 0) {
    return {
      fixtures: [],
      issues: validatedIssues([
        ...(warning === undefined ? [] : [warning]),
        ...candidateValidation.issues,
      ]),
    };
  }

  const selection = selectDeterministicCandidates(
    candidateValidation.fixtures.map((fixture) => ({
      id: fixture.id,
      label: fixture.label,
      intent: fixture.intent,
      props: cloneJsonObject(fixture.props),
    })),
  );
  const validated = validateFixtures(validatedContract, selection.candidates);
  const issues = [
    ...(warning === undefined ? [] : [warning]),
    ...selection.issues,
    ...validated.issues,
  ];

  if (validated.issues.some((issue) => issue.severity === "error")) {
    return { fixtures: [], issues: validatedIssues(issues) };
  }

  return {
    fixtures: validated.fixtures.map((fixture) => ({
      ...fixture,
      props: cloneJsonObject(fixture.props),
    })),
    issues: validatedIssues(issues),
  };
}
