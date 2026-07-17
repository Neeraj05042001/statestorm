import type {
  ContractIssue,
  Fixture,
  JsonObject,
} from "../../domain";

export interface DeterministicFixtureGenerationResult {
  fixtures: Fixture[];
  issues: ContractIssue[];
}

export interface FixtureCandidate {
  id: string;
  label: string;
  intent: string;
  props: JsonObject;
}

export interface CandidateSelectionResult {
  candidates: FixtureCandidate[];
  issues: ContractIssue[];
}
