export const DeterministicFixtureIssueCode = {
  unexecutablePropKind: "UNEXECUTABLE_PROP_KIND",
  invalidPropDefault: "INVALID_PROP_DEFAULT",
  invalidEnumMetadata: "INVALID_ENUM_METADATA",
  fixtureSchemaValidationFailed: "FIXTURE_SCHEMA_VALIDATION_FAILED",
  fixtureLimitApplied: "DETERMINISTIC_FIXTURE_LIMIT_APPLIED",
  limitedCollectionCoverage: "LIMITED_COLLECTION_FIXTURE_COVERAGE",
} as const;

export type DeterministicFixtureIssueCode =
  (typeof DeterministicFixtureIssueCode)[keyof typeof DeterministicFixtureIssueCode];
