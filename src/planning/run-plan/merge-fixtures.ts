import {
  ContractIssueSchema,
  FixtureSchema,
  type ContractIssue,
  type Fixture,
} from "../../domain";
import {
  canonicalJson,
  cloneJsonObject,
} from "../deterministic-fixtures/baseline-values";
import { RunPlanPlanningIssueCode } from "./issue-codes";
import type { FixtureMergeResult } from "./types";

const MAX_RUN_PLAN_FIXTURES = 12;

function mergeWarning(
  code: string,
  message: string,
  fixture: Fixture,
  suggestion: string,
): ContractIssue {
  return ContractIssueSchema.parse({
    code,
    severity: "warning",
    message,
    path: ["fixtures", fixture.id],
    suggestion,
  });
}

function cloneFixture(fixture: Fixture): Fixture {
  return FixtureSchema.parse({
    ...fixture,
    props: cloneJsonObject(fixture.props),
  });
}

export function mergeRunPlanFixtures(
  deterministicFixtures: readonly Fixture[],
  semanticFixtures: readonly Fixture[],
): FixtureMergeResult {
  const happyPath =
    deterministicFixtures.find((fixture) => fixture.id === "det-happy-path") ??
    deterministicFixtures[0];
  const remainingDeterministic = deterministicFixtures.filter(
    (fixture) => fixture !== happyPath,
  );
  const ordered = [
    ...(happyPath === undefined ? [] : [happyPath]),
    ...semanticFixtures,
    ...remainingDeterministic,
  ];
  const fixtures: Fixture[] = [];
  const issues: ContractIssue[] = [];
  const seenProps = new Set<string>();
  const seenIds = new Set<string>();

  ordered.forEach((fixture) => {
    const propsKey = canonicalJson(fixture.props);
    if (seenProps.has(propsKey) || seenIds.has(fixture.id)) {
      issues.push(
        mergeWarning(
          RunPlanPlanningIssueCode.fixtureDuplicate,
          `Fixture '${fixture.id}' duplicates an earlier fixture and was omitted`,
          fixture,
          "Keep only fixtures with distinct props and identifiers",
        ),
      );
      return;
    }

    seenProps.add(propsKey);
    seenIds.add(fixture.id);
    if (fixtures.length >= MAX_RUN_PLAN_FIXTURES) {
      issues.push(
        mergeWarning(
          RunPlanPlanningIssueCode.fixtureLimitApplied,
          `Fixture '${fixture.id}' was omitted because the twelve-fixture RunPlan limit was reached`,
          fixture,
          "Prioritize the highest-value semantic and boundary fixtures",
        ),
      );
      return;
    }

    fixtures.push(cloneFixture(fixture));
  });

  return { fixtures, issues };
}
