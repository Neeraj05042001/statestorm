import type {
  AiPlanningProposal,
  ComponentContract,
  JsonObject,
} from "../../domain";

export interface AiPlannerInput {
  prompt: string;
  contract: ComponentContract;
  deterministicHappyPathProps: JsonObject;
}

export interface AiPlannerProvider {
  readonly model: string;
  generateProposal(
    input: AiPlannerInput,
    signal: AbortSignal,
  ): Promise<AiPlanningProposal>;
}

export type AiPlannerFailureKind =
  | "unavailable"
  | "timeout"
  | "refused"
  | "invalid-output"
  | "provider-error";

export class AiPlannerFailure extends Error {
  readonly kind: AiPlannerFailureKind;

  constructor(kind: AiPlannerFailureKind) {
    super("AI planning provider did not return an accepted proposal");
    this.name = "AiPlannerFailure";
    this.kind = kind;
  }
}

export function isAiPlannerFailure(error: unknown): error is AiPlannerFailure {
  return error instanceof AiPlannerFailure;
}
