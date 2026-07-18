import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { planSubmission } from "../../../server/preflight-planning";
import type { AiPlannerProvider } from "../../../server/preflight-planning/provider";
import {
  PreflightResultPanel,
  PreflightSubmissionClient,
} from "../PreflightSubmissionClient";

const supportedSubmission = {
  id: "preflight-ui-test",
  prompt: "Featured products should feel prominent.",
  language: "tsx" as const,
  componentCode: `
    interface ProductCardProps {
      title: string;
      featured: boolean;
      tone?: "calm" | "urgent";
    }
    export default function ProductCard({ title, featured, tone = "calm" }: ProductCardProps) {
      return <article data-tone={tone}><h2>{title}</h2>{featured ? <b>Featured</b> : null}</article>;
    }
  `,
};

function fakeProvider(): AiPlannerProvider {
  return {
    model: "fake-gemini-model",
    async generateProposal() {
      return {
        requirements: [
          {
            title: "Featured prominence",
            statement: "Featured products should feel prominent.",
            classification: "heuristic",
            rationale: "Prominence requires visual review.",
          },
        ],
        semanticFixtures: [
          {
            label: "Urgent featured product",
            intent: "Exercise a meaningful urgent state.",
            assignments: [
              { propName: "tone", jsonValue: '"urgent"' },
              { propName: "featured", jsonValue: "true" },
            ],
            omitOptionalProps: [],
          },
        ],
      };
    },
  };
}

describe("/preflight diagnostic UI", () => {
  it("renders the prompt, source, language, example and submit controls", () => {
    const html = renderToStaticMarkup(<PreflightSubmissionClient />);

    expect(html).toContain("Product requirement prompt");
    expect(html).toContain("React TypeScript component");
    expect(html).toContain("Source language");
    expect(html).toContain("TSX");
    expect(html).toContain("JSX");
    expect(html).toContain("Load example");
    expect(html).toContain("Create preflight plan");
  });

  it("renders an AI-generated success with requirements and semantic fixtures", async () => {
    const response = await planSubmission(supportedSubmission, {
      provider: fakeProvider(),
    });
    const html = renderToStaticMarkup(
      <PreflightResultPanel state={{ status: "complete", response }} />,
    );

    expect(html).toContain("AI-generated success");
    expect(html).toContain("Featured products should feel prominent.");
    expect(html).toContain("Urgent featured product");
    expect(html).toContain("Planned, not executed");
  });

  it("renders deterministic fallback without claiming execution", async () => {
    const response = await planSubmission(supportedSubmission, {
      provider: null,
    });
    const html = renderToStaticMarkup(
      <PreflightResultPanel state={{ status: "complete", response }} />,
    );

    expect(html).toContain("Deterministic fallback");
    expect(html).toContain("AI_PLANNER_UNAVAILABLE");
    expect(html).toContain("Gemini did not verify runtime behavior");
  });

  it("renders the unsupported component state", async () => {
    const response = await planSubmission(
      {
        ...supportedSubmission,
        componentCode:
          'import Widget from "widget"; export default function ProductCard() { return <Widget />; }',
      },
      { provider: fakeProvider() },
    );
    const html = renderToStaticMarkup(
      <PreflightResultPanel state={{ status: "complete", response }} />,
    );

    expect(html).toContain("Unsupported component");
    expect(html).toContain("UNSUPPORTED_IMPORT");
  });

  it("renders request-validation and sanitized server-error states", () => {
    const validationHtml = renderToStaticMarkup(
      <PreflightResultPanel
        state={{
          status: "request-validation",
          response: {
            accepted: false,
            issues: [
              {
                code: "INVALID_COMPONENT_SUBMISSION",
                severity: "error",
                message: "Prompt is required",
                path: ["submission", "prompt"],
              },
            ],
          },
        }}
      />,
    );
    const serverHtml = renderToStaticMarkup(
      <PreflightResultPanel
        state={{
          status: "server-error",
          issues: [
            {
              code: "INTERNAL_PREFLIGHT_ERROR",
              severity: "error",
              message: "Preflight planning could not be completed",
              path: ["request"],
            },
          ],
        }}
      />,
    );

    expect(validationHtml).toContain("Request validation");
    expect(validationHtml).toContain("Prompt is required");
    expect(serverHtml).toContain("sanitized unexpected failure");
    expect(serverHtml).toContain("INTERNAL_PREFLIGHT_ERROR");
  });
});
