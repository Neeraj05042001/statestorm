import {
  ComponentSubmissionSchema,
  PreflightPlanApiResponseSchema,
  type ComponentSubmission,
  type ContractIssue,
  type PreflightPlanApiResponse,
} from "../../../domain";

type PlanSubmission = (
  submission: ComponentSubmission,
) => Promise<PreflightPlanApiResponse>;

const responseHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

function jsonResponse(
  body: PreflightPlanApiResponse,
  status: number,
): Response {
  return Response.json(PreflightPlanApiResponseSchema.parse(body), {
    status,
    headers: responseHeaders,
  });
}

function requestValidationIssues(error: {
  issues: readonly { message: string; path: readonly PropertyKey[] }[];
}): ContractIssue[] {
  return error.issues.map((issue) => ({
    code: "INVALID_COMPONENT_SUBMISSION",
    severity: "error" as const,
    message: issue.message,
    path: [
      "submission",
      ...issue.path.map((segment) =>
        typeof segment === "number" || typeof segment === "string"
          ? segment
          : String(segment),
      ),
    ],
    suggestion: "Correct the highlighted request field and submit again",
  }));
}

export function createPreflightPlanPostHandler(
  plan: PlanSubmission,
): (request: Request) => Promise<Response> {
  return async function preflightPlanPost(request: Request) {
    let input: unknown;

    try {
      input = await request.json();
    } catch {
      return jsonResponse(
        {
          accepted: false,
          issues: [
            {
              code: "MALFORMED_JSON",
              severity: "error",
              message: "The request body must contain valid JSON",
              path: ["request"],
              suggestion: "Send a JSON ComponentSubmission request body",
            },
          ],
        },
        400,
      );
    }

    const submission = ComponentSubmissionSchema.safeParse(input);
    if (!submission.success) {
      return jsonResponse(
        {
          accepted: false,
          issues: requestValidationIssues(submission.error),
        },
        400,
      );
    }

    try {
      return jsonResponse(await plan(submission.data), 200);
    } catch {
      return jsonResponse(
        {
          accepted: false,
          issues: [
            {
              code: "INTERNAL_PREFLIGHT_ERROR",
              severity: "error",
              message: "Preflight planning could not be completed",
              path: ["request"],
              suggestion: "Try the request again without changing its scope",
            },
          ],
        },
        500,
      );
    }
  };
}
