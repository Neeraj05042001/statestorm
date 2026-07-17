import {
  ComponentAnalysisApiResponseSchema,
  ComponentSubmissionSchema,
  type ComponentAnalysisApiResponse,
  type ComponentSubmission,
  type ContractIssue,
} from "../../../domain";

type AnalyzeSubmission = (
  submission: ComponentSubmission,
) => ComponentAnalysisApiResponse;

const responseHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

function jsonResponse(
  body: ComponentAnalysisApiResponse,
  status: number,
): Response {
  return Response.json(ComponentAnalysisApiResponseSchema.parse(body), {
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

export function createComponentAnalysisPostHandler(
  analyze: AnalyzeSubmission,
): (request: Request) => Promise<Response> {
  return async function componentAnalysisPost(request: Request) {
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
      const result = analyze(submission.data);
      return jsonResponse(result, 200);
    } catch {
      return jsonResponse(
        {
          accepted: false,
          issues: [
            {
              code: "INTERNAL_ANALYSIS_ERROR",
              severity: "error",
              message: "Component analysis could not be completed",
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
