import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { ComponentAnalysisApiResponseSchema } from "../../../../domain";
import { analyzeSubmission } from "../../../../server/component-analysis";
import { POST, runtime } from "../route";
import { createComponentAnalysisPostHandler } from "../route-handler";

const supportedSubmission = {
  id: "submission-route-test",
  prompt: "Render a notice",
  language: "tsx" as const,
  componentCode: `
    interface NoticeProps { message: string; }
    export default function Notice({ message }: NoticeProps) {
      return <aside>{message}</aside>;
    }
  `,
};

function jsonRequest(input: unknown): Request {
  return new Request("http://localhost/api/component-analysis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

describe("POST /api/component-analysis", () => {
  it("uses the Node.js runtime and returns HTTP 200 for accepted source", async () => {
    const response = await POST(jsonRequest(supportedSubmission));
    const body = await response.json();

    expect(runtime).toBe("nodejs");
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(ComponentAnalysisApiResponseSchema.parse(body).accepted).toBe(true);
  });

  it("returns HTTP 200 with accepted false for unsupported source", async () => {
    const response = await POST(
      jsonRequest({
        ...supportedSubmission,
        componentCode: `
          import Widget from "some-widget";
          interface Props { label: string; }
          export default function Notice({ label }: Props) {
            return <Widget>{label}</Widget>;
          }
        `,
      }),
    );
    const body = ComponentAnalysisApiResponseSchema.parse(
      await response.json(),
    );

    expect(response.status).toBe(200);
    expect(body.accepted).toBe(false);
    expect(body.issues.map((issue) => issue.code)).toContain(
      "UNSUPPORTED_IMPORT",
    );
  });

  it("returns HTTP 400 for malformed JSON", async () => {
    const request = new Request("http://localhost/api/component-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not-json",
    });
    const response = await POST(request);
    const body = ComponentAnalysisApiResponseSchema.parse(
      await response.json(),
    );

    expect(response.status).toBe(400);
    expect(body.issues[0]?.code).toBe("MALFORMED_JSON");
  });

  it("returns HTTP 400 for an invalid request shape", async () => {
    const response = await POST(
      jsonRequest({ ...supportedSubmission, id: "not url safe" }),
    );
    const body = ComponentAnalysisApiResponseSchema.parse(
      await response.json(),
    );

    expect(response.status).toBe(400);
    expect(body.issues[0]).toMatchObject({
      code: "INVALID_COMPONENT_SUBMISSION",
      path: ["submission", "id"],
    });
  });

  it("sanitizes unexpected internal failures with HTTP 500", async () => {
    const post = createComponentAnalysisPostHandler(() => {
      throw new Error("private stack detail and source content");
    });
    const response = await post(jsonRequest(supportedSubmission));
    const rawBody = await response.text();
    const body = ComponentAnalysisApiResponseSchema.parse(JSON.parse(rawBody));

    expect(response.status).toBe(500);
    expect(body.issues[0]?.code).toBe("INTERNAL_ANALYSIS_ERROR");
    expect(rawBody).not.toContain("private stack detail");
    expect(rawBody).not.toContain('"stack"');
  });

  it("wires the production route to the server-only service", async () => {
    const direct = createComponentAnalysisPostHandler(analyzeSubmission);
    const response = await direct(jsonRequest(supportedSubmission));

    expect(response.status).toBe(200);
  });
});
