import "server-only";

import {
  ComponentContractSchema,
  AiPlanningProposalSchema,
  PreflightPlanApiResponseSchema,
  type AiPlanningStatus,
  type ComponentSubmission,
  type ContractIssue,
  type PreflightPlanApiResponse,
} from "../../domain";
import { generateDeterministicFixtures } from "../../planning/deterministic-fixtures";
import { cloneJsonObject } from "../../planning/deterministic-fixtures/baseline-values";
import {
  assembleRunPlan,
  materializeAiRequirements,
  materializeAiSemanticFixtures,
  mergeRunPlanFixtures,
  RunPlanPlanningIssueCode,
} from "../../planning/run-plan";
import { analyzeSubmission } from "../component-analysis";
import { createGeminiAiPlannerFromEnvironment } from "./gemini-adapter.server";
import {
  AiPlannerFailure,
  isAiPlannerFailure,
  type AiPlannerFailureKind,
  type AiPlannerInput,
  type AiPlannerProvider,
} from "./provider";

const DEFAULT_TIMEOUT_MS = 12_000;

export interface PreflightPlanningDependencies {
  provider?: AiPlannerProvider | null;
  timeoutMs?: number;
}

function plannerIssue(kind: AiPlannerFailureKind): ContractIssue {
  const details: Record<
    AiPlannerFailureKind,
    { code: string; message: string; suggestion: string }
  > = {
    unavailable: {
      code: RunPlanPlanningIssueCode.plannerUnavailable,
      message:
        "Gemini semantic planning is unavailable; deterministic planning was preserved",
      suggestion:
        "Configure available Gemini capacity to add semantic proposals",
    },
    timeout: {
      code: RunPlanPlanningIssueCode.plannerTimeout,
      message:
        "Gemini semantic planning exceeded its time limit; deterministic planning was preserved",
      suggestion: "Retry later if semantic proposals are required",
    },
    refused: {
      code: RunPlanPlanningIssueCode.plannerRefused,
      message:
        "Gemini declined the semantic-planning request; deterministic planning was preserved",
      suggestion: "Review the prompt while keeping component scope unchanged",
    },
    "invalid-output": {
      code: RunPlanPlanningIssueCode.plannerInvalidOutput,
      message:
        "Gemini returned output that failed trusted proposal validation; deterministic planning was preserved",
      suggestion: "Retry later; unvalidated provider output is never used",
    },
    "provider-error": {
      code: RunPlanPlanningIssueCode.plannerProviderError,
      message:
        "Gemini semantic planning failed; deterministic planning was preserved",
      suggestion: "Retry later if semantic proposals are required",
    },
  };
  const detail = details[kind];
  return {
    code: detail.code,
    severity: "warning",
    message: detail.message,
    path: ["aiPlanning"],
    suggestion: detail.suggestion,
  };
}

function statusForFailure(kind: AiPlannerFailureKind): AiPlanningStatus {
  return kind;
}

async function generateWithDeadline(
  provider: AiPlannerProvider,
  input: AiPlannerInput,
  timeoutMs: number,
) {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => {
      reject(new AiPlannerFailure("timeout"));
      controller.abort();
    }, timeoutMs);
  });

  try {
    return await Promise.race([
      provider.generateProposal(input, controller.signal),
      deadline,
    ]);
  } finally {
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
  }
}

function selectedProvider(
  dependencies: PreflightPlanningDependencies,
): AiPlannerProvider | undefined {
  if (Object.prototype.hasOwnProperty.call(dependencies, "provider")) {
    return dependencies.provider ?? undefined;
  }
  return createGeminiAiPlannerFromEnvironment();
}

export async function planSubmission(
  submission: ComponentSubmission,
  dependencies: PreflightPlanningDependencies = {},
): Promise<PreflightPlanApiResponse> {
  const analysis = analyzeSubmission(submission);
  if (!analysis.accepted) {
    return PreflightPlanApiResponseSchema.parse(analysis);
  }

  const deterministic = generateDeterministicFixtures(analysis.contract);
  const initialIssues = [...analysis.issues, ...deterministic.issues];
  if (
    deterministic.fixtures.length === 0 ||
    deterministic.issues.some((issue) => issue.severity === "error")
  ) {
    return PreflightPlanApiResponseSchema.parse({
      accepted: false,
      issues: initialIssues,
    });
  }

  const happyPath =
    deterministic.fixtures.find((fixture) => fixture.id === "det-happy-path") ??
    deterministic.fixtures[0];
  const provider = selectedProvider(dependencies);
  let aiStatus: AiPlanningStatus = "unavailable";
  let proposal: ReturnType<typeof AiPlanningProposalSchema.parse> | undefined;
  const planningIssues = [...initialIssues];

  if (provider === undefined) {
    planningIssues.push(plannerIssue("unavailable"));
  } else {
    try {
      console.log("Calling Gemini...");
      const rawProposal = await generateWithDeadline(
        provider,
        {
          prompt: submission.prompt,
          contract: ComponentContractSchema.parse(
            JSON.parse(JSON.stringify(analysis.contract)),
          ),
          deterministicHappyPathProps: cloneJsonObject(happyPath.props),
        },
        dependencies.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      );
      console.log("Gemini returned:");
      console.dir(rawProposal, { depth: null });
      const parsedProposal = AiPlanningProposalSchema.safeParse(rawProposal);
      if (!parsedProposal.success) {
        throw new AiPlannerFailure("invalid-output");
      }
      proposal = parsedProposal.data;
      console.log("Proposal validated successfully.");
      aiStatus = "generated";
    } catch (error) {
      // const failure = isAiPlannerFailure(error)
      //   ? error
      //   : new AiPlannerFailure("provider-error");
      // aiStatus = statusForFailure(failure.kind);
      // planningIssues.push(plannerIssue(failure.kind));
      console.log("Planner failed:");
      console.dir(error, { depth: null });

      const failure = isAiPlannerFailure(error)
        ? error
        : new AiPlannerFailure("provider-error");

      aiStatus = statusForFailure(failure.kind);
      planningIssues.push(plannerIssue(failure.kind));
    }
  }

  const requirementResult = materializeAiRequirements({
    prompt: submission.prompt,
    proposals: proposal?.requirements ?? [],
  });
  const semanticResult = materializeAiSemanticFixtures({
    contract: analysis.contract,
    happyPathProps: happyPath.props,
    proposals: proposal?.semanticFixtures ?? [],
  });
  const mergeResult = mergeRunPlanFixtures(
    deterministic.fixtures,
    semanticResult.fixtures,
  );
  const allIssues = [
    ...planningIssues,
    ...requirementResult.issues,
    ...semanticResult.issues,
    ...mergeResult.issues,
  ];
  const assembly = assembleRunPlan({
    submission,
    component: analysis.contract,
    requirements: requirementResult.requirements,
    fixtures: mergeResult.fixtures,
    issues: allIssues,
  });

  if (assembly.runPlan === undefined) {
    return PreflightPlanApiResponseSchema.parse({
      accepted: false,
      issues: [...allIssues, ...assembly.issues],
    });
  }

  return PreflightPlanApiResponseSchema.parse({
    accepted: true,
    contract: analysis.contract,
    runPlan: assembly.runPlan,
    issues: allIssues,
    ai: {
      status: aiStatus,
      ...(provider === undefined ? {} : { model: provider.model }),
    },
  });
}
