import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { PreflightPlanApiResponseSchema } from "../../../../domain";
import { planSubmission } from "../../../../server/preflight-planning";
import type { AiPlannerProvider } from "../../../../server/preflight-planning/provider";
import { runtime } from "../route";
import { createPreflightPlanPostHandler } from "../route-handler";

const supportedSubmission = {
  id: "preflight-route-test",
  prompt: "Render a clear notice",
  language: "tsx" as const,
  componentCode: `
    interface NoticeProps { message: string; }
    export default function Notice({ message }: NoticeProps) {
      return <aside>{message}</aside>;
    }
  `,
};

function jsonRequest(input: unknown): Request {
  return new Request("http://localhost/api/preflight-plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

const deterministicPost = createPreflightPlanPostHandler((submission) =>
  planSubmission(submission, { provider: null }),
);

describe("POST /api/preflight-plan", () => {
  it("uses the Node.js runtime and returns an accepted fallback plan", async () => {
    const response = await deterministicPost(jsonRequest(supportedSubmission));
    const body = PreflightPlanApiResponseSchema.parse(await response.json());

    expect(runtime).toBe("nodejs");
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(body.accepted).toBe(true);
    if (body.accepted) expect(body.ai.status).toBe("unavailable");
  });

  it("returns HTTP 200 with accepted false for unsupported source", async () => {
    const response = await deterministicPost(
      jsonRequest({
        ...supportedSubmission,
        componentCode:
          'import Widget from "widget"; export default function Notice() { return <Widget />; }',
      }),
    );
    const body = PreflightPlanApiResponseSchema.parse(await response.json());

    expect(response.status).toBe(200);
    expect(body.accepted).toBe(false);
    expect(body.issues.map((issue) => issue.code)).toContain(
      "UNSUPPORTED_IMPORT",
    );
  });

  it("returns HTTP 400 for malformed JSON", async () => {
    const response = await deterministicPost(
      new Request("http://localhost/api/preflight-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{not-json",
      }),
    );
    const body = PreflightPlanApiResponseSchema.parse(await response.json());

    expect(response.status).toBe(400);
    expect(body.issues[0]?.code).toBe("MALFORMED_JSON");
  });

  it("returns HTTP 400 for an invalid request shape", async () => {
    const response = await deterministicPost(
      jsonRequest({ ...supportedSubmission, prompt: "" }),
    );
    const body = PreflightPlanApiResponseSchema.parse(await response.json());

    expect(response.status).toBe(400);
    expect(body.issues[0]).toMatchObject({
      code: "INVALID_COMPONENT_SUBMISSION",
      path: ["submission", "prompt"],
    });
  });

  it("sanitizes unexpected failures with HTTP 500", async () => {
    const post = createPreflightPlanPostHandler(async () => {
      throw new Error("private stack and secret-key-value");
    });
    const response = await post(jsonRequest(supportedSubmission));
    const raw = await response.text();
    const body = PreflightPlanApiResponseSchema.parse(JSON.parse(raw));

    expect(response.status).toBe(500);
    expect(body.issues[0]?.code).toBe("INTERNAL_PREFLIGHT_ERROR");
    expect(raw).not.toContain("secret-key-value");
    expect(raw).not.toContain("stack");
  });

  it("returns HTTP 200 accepted fallback when the provider times out", async () => {
    const hangingProvider: AiPlannerProvider = {
      model: "fake-gemini-model",
      generateProposal: (_input, signal) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () => reject(new Error("aborted")));
        }),
    };
    const post = createPreflightPlanPostHandler((submission) =>
      planSubmission(submission, {
        provider: hangingProvider,
        timeoutMs: 5,
      }),
    );
    const response = await post(jsonRequest(supportedSubmission));
    const body = PreflightPlanApiResponseSchema.parse(await response.json());

    expect(response.status).toBe(200);
    expect(body.accepted).toBe(true);
    if (body.accepted) expect(body.ai.status).toBe("timeout");
  });
});
