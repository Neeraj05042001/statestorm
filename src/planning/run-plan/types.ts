import type {
  ComponentContract,
  ComponentSubmission,
  ContractIssue,
  Fixture,
  JsonObject,
  Requirement,
  RunPlan,
} from "../../domain";
import type {
  AiRequirementProposal,
  AiSemanticFixtureProposal,
} from "../../domain/ai-planning-proposal";

export interface RequirementMaterializationResult {
  requirements: Requirement[];
  issues: ContractIssue[];
}

export interface SemanticFixtureMaterializationResult {
  fixtures: Fixture[];
  issues: ContractIssue[];
}

export interface FixtureMergeResult {
  fixtures: Fixture[];
  issues: ContractIssue[];
}

export interface RunPlanAssemblyResult {
  runPlan?: RunPlan;
  issues: ContractIssue[];
}

export interface MaterializeRequirementsInput {
  prompt: string;
  proposals: readonly AiRequirementProposal[];
}

export interface MaterializeSemanticFixturesInput {
  contract: ComponentContract;
  happyPathProps: JsonObject;
  proposals: readonly AiSemanticFixtureProposal[];
}

export interface AssembleRunPlanInput {
  submission: ComponentSubmission;
  component: ComponentContract;
  requirements: readonly Requirement[];
  fixtures: readonly Fixture[];
  issues: readonly ContractIssue[];
}
