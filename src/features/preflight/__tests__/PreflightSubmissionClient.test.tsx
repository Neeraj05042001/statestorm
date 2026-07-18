import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { planSubmission } from "../../../server/preflight-planning";
import type { AiPlannerProvider } from "../../../server/preflight-planning/provider";
import {
  atlasExampleCode,
  atlasExamplePrompt,
  initialPreflightInputs,
  PreflightResultPanel,
  PreflightSubmissionClient,
} from "../PreflightSubmissionClient";
import { RunPlanExecutionView } from "../RunPlanExecutionPanel";
import { buildStateAtlas } from "../../state-atlas/build-state-atlas";

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

describe("/preflight product UI", () => {
  it("builds the reliable AtlasProductCard deterministic demo plan", async () => {
    const response = await planSubmission(
      {
        id: "atlas-demo-test",
        prompt: atlasExamplePrompt,
        componentCode: atlasExampleCode,
        language: "tsx",
      },
      { provider: null },
    );

    expect(response.accepted).toBe(true);
    if (!response.accepted) return;
    expect(response.contract.componentName).toBe("AtlasProductCard");
    expect(response.runPlan.fixtures[0]?.id).toBe("det-happy-path");
    expect(
      response.runPlan.fixtures.find((fixture) => fixture.id === "det-empty-strings")
        ?.props,
    ).toMatchObject({ title: "", imageUrl: "" });
    expect(
      response.runPlan.fixtures.find((fixture) => fixture.id === "det-zero-numbers")
        ?.props.price,
    ).toBe(0);
    expect(
      String(
        response.runPlan.fixtures.find(
          (fixture) => fixture.id === "det-long-strings",
        )?.props.title,
      ).length,
    ).toBeGreaterThan(100);
  });

  it("renders the three-stage workflow, clear inputs, demo action, and primary submit control", () => {
    const html = renderToStaticMarkup(<PreflightSubmissionClient />);

    expect(html).toContain("Component");
    expect(html).toContain("State plan");
    expect(html).toContain("Execute and inspect");
    expect(html).toContain("Original product requirement");
    expect(html).toContain("React component source");
    expect(html).toContain("Source language");
    expect(html).toContain("tsx");
    expect(html).toContain("jsx");
    expect(html).toContain("Load demo");
    expect(html).toContain("Generate state plan");
    expect(html).not.toContain("Gate 4 State Atlas diagnostic");
  });

  it("loads the accepted demo prompt and component through the demo input path", () => {
    const inputs = initialPreflightInputs(true);
    const html = renderToStaticMarkup(
      <PreflightSubmissionClient initialDemo />,
    );

    expect(inputs.prompt).toBe(atlasExamplePrompt);
    expect(inputs.componentCode).toBe(atlasExampleCode);
    expect(inputs.language).toBe("tsx");
    expect(html).toContain("Demo example loaded");
    expect(html).toContain(atlasExamplePrompt);
    expect(html).toContain("AtlasProductCard");
  });

  it("renders an AI-generated success with requirements and semantic fixtures", async () => {
    const response = await planSubmission(supportedSubmission, {
      provider: fakeProvider(),
    });
    const html = renderToStaticMarkup(
      <PreflightResultPanel state={{ status: "complete", response }} />,
    );

    expect(html).toContain("AI-enriched plan ready");
    expect(html).toContain("Semantic AI planning added prompt-specific states");
    expect(html).toContain("Featured products should feel prominent.");
    expect(html).toContain("Urgent featured product");
    expect(html).toContain("Run preflight");
    expect(html).toContain("AI-proposed");
    expect(html).toContain(">1<");
    expect(html).toContain("they are not pass/fail verdicts");
  });

  it("renders user-friendly deterministic fallback without claiming execution", async () => {
    const response = await planSubmission(supportedSubmission, {
      provider: null,
    });
    const html = renderToStaticMarkup(
      <PreflightResultPanel state={{ status: "complete", response }} />,
    );

    expect(html).toContain("Boundary plan ready");
    expect(html).toContain(
      "Semantic AI planning was unavailable, so StateStorm preserved deterministic boundary coverage.",
    );
    expect(html).toContain("AI_PLANNER_UNAVAILABLE");
    expect(html).toContain(">0<");
    expect(html).toContain(
      "Runtime and visual conclusions come only from recorded browser evidence",
    );
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

    expect(validationHtml).toContain("Input needs attention");
    expect(validationHtml).toContain("Prompt is required");
    expect(serverHtml).toContain("could not complete planning");
    expect(serverHtml).toContain("INTERNAL_PREFLIGHT_ERROR");
  });

  it("renders execution progress, disables conflicting starts, and previews the active fixture", async () => {
    const response = await planSubmission(supportedSubmission, {
      provider: null,
    });
    if (!response.accepted) throw new Error("Expected an accepted test plan");
    const fixture = response.runPlan.fixtures[0];
    const html = renderToStaticMarkup(
      <RunPlanExecutionView
        runPlan={response.runPlan}
        state={{
          status: "fixture-running",
          sessionId: "session-ui",
          fixture,
          completedCount: 1,
          totalCount: response.runPlan.fixtures.length,
          results: [
            {
              fixtureId: fixture.id,
              status: "passed",
              summary: "Visible output rendered.",
              evidence: {
                sandboxCompleted: true,
                renderCommitted: true,
                expectedDomFound: true,
                meaningfulDomFound: true,
              },
            },
          ],
        }}
        adapterReady
        onStart={() => undefined}
        onCancel={() => undefined}
        preview={<p>Isolated active preview</p>}
      />,
    );

    expect(html).toContain("Partially complete");
    expect(html).toContain(`1 of ${response.runPlan.fixtures.length} completed`);
    expect(html).toContain(fixture.label);
    expect(html).toContain("Isolated active preview");
    expect(html).toContain("disabled");
  });

  it("renders ordered sanitized failures, totals, rerun, and no requirement verdicts", async () => {
    const response = await planSubmission(supportedSubmission, {
      provider: null,
    });
    if (!response.accepted) throw new Error("Expected an accepted test plan");
    const [firstFixture, secondFixture] = response.runPlan.fixtures;
    const runPlan = {
      ...response.runPlan,
      fixtures: [firstFixture, secondFixture],
    };
    const session = {
      sessionId: "session-complete",
      status: "completed" as const,
      results: [
        {
          fixtureId: firstFixture.id,
          status: "passed" as const,
          summary: "Visible output rendered.",
          evidence: {
            sandboxCompleted: true,
            renderCommitted: true,
            expectedDomFound: true,
            meaningfulDomFound: true,
          },
        },
        {
          fixtureId: secondFixture.id,
          status: "runtime-error" as const,
          summary: "The component threw while rendering.",
          sanitizedMessage: "title was empty",
          evidence: {
            sandboxCompleted: true,
            renderCommitted: false,
            expectedDomFound: false,
            meaningfulDomFound: false,
          },
        },
      ],
    };
    const html = renderToStaticMarkup(
      <RunPlanExecutionView
        runPlan={runPlan}
        state={{
          status: "completed",
          totalCount: 2,
          session,
          atlas: buildStateAtlas({ runPlan, executionSession: session }),
        }}
        adapterReady
        onStart={() => undefined}
        onCancel={() => undefined}
        preview={null}
      />,
    );

    expect(html).toContain("Completed with failures");
    expect(html).toContain("1 rendered");
    expect(html).toContain("1 execution failures");
    expect(html).toContain("title was empty");
    expect(html.indexOf(firstFixture.id)).toBeLessThan(
      html.indexOf(secondFixture.id),
    );
    expect(html).toContain("Run preflight again");
    expect(html).toContain("State Atlas");
    expect(html).toContain("Raw execution evidence");
    expect(html.indexOf("State Atlas")).toBeLessThan(
      html.indexOf("Raw execution evidence"),
    );
    expect(html).not.toContain("Requirement passed");
    expect(html).not.toContain("Requirement failed");
  });
});
