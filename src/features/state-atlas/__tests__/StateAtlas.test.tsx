import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type {
  DetectorFinding,
  ExecutionSessionResult,
  FixtureExecutionResult,
  RunPlan,
} from "../../../domain";
import {
  defaultAtlasSelectionId,
  filterAtlasEntries,
  selectionForFilter,
  StateAtlasView,
} from "../StateAtlas";
import { buildStateAtlas } from "../build-state-atlas";

const source = "export default function Card() { return <p>ok</p>; }";

function finding(
  fixtureId: string,
  kind: "layout-overflow" | "broken-image",
): DetectorFinding {
  return kind === "layout-overflow"
    ? {
        id: `detector-${fixtureId}-overflow-1`,
        fixtureId,
        kind,
        severity: "warning",
        summary: "Possible horizontal layout overflow was detected.",
        evidence: {
          detector: "overflow-v1",
          elementTag: "H2",
          axis: "horizontal",
          clientWidth: 180,
          scrollWidth: 420,
        },
      }
    : {
        id: `detector-${fixtureId}-image-1`,
        fixtureId,
        kind,
        severity: "error",
        summary: "A rendered image completed without usable image data.",
        evidence: {
          detector: "broken-image-v1",
          elementTag: "IMG",
          imageAltPresent: true,
          imageSourceKind: "relative",
        },
      };
}

function fixtureResult(
  fixtureId: string,
  status: FixtureExecutionResult["status"],
  visualFindings: DetectorFinding[] = [],
): FixtureExecutionResult {
  return {
    fixtureId,
    status,
    summary: `Recorded ${status} result.`,
    evidence: {
      sandboxCompleted: status === "passed",
      renderCommitted: status === "passed" || status === "blank-render",
      expectedDomFound: status === "passed" || status === "blank-render",
      meaningfulDomFound: status === "passed",
    },
    visualFindings,
  };
}

function atlasFixture() {
  const runPlan: RunPlan = {
    version: 1,
    submission: {
      id: "atlas-ui",
      prompt: "Render the states.",
      componentCode: source,
      language: "tsx",
    },
    component: {
      componentName: "Card",
      exportStyle: "default",
      language: "tsx",
      imports: [],
      props: [],
      warnings: [],
    },
    requirements: [],
    fixtures: [
      {
        id: "det-happy-path",
        label: "Happy product",
        origin: "deterministic",
        intent: "Render the normal product state.",
        props: {},
      },
      {
        id: "runtime",
        label: "Empty title runtime",
        origin: "deterministic",
        intent: "Exercise the contained runtime failure.",
        props: {},
      },
      {
        id: "blank",
        label: "Zero price blank",
        origin: "ai",
        intent: "Exercise the blank state.",
        props: {},
      },
      {
        id: "overflow",
        label: "Long title",
        origin: "deterministic",
        intent: "Exercise constrained title layout.",
        props: {},
      },
      {
        id: "broken",
        label: "Broken image",
        origin: "ai",
        intent: "Exercise unusable image data.",
        props: {},
      },
    ],
    issues: [],
  };
  const executionSession: ExecutionSessionResult = {
    sessionId: "session-atlas-ui",
    status: "completed",
    results: [
      fixtureResult("det-happy-path", "passed"),
      fixtureResult("runtime", "runtime-error"),
      fixtureResult("blank", "blank-render"),
      fixtureResult("overflow", "passed", [
        finding("overflow", "layout-overflow"),
      ]),
      fixtureResult("broken", "passed", [finding("broken", "broken-image")]),
    ],
  };
  return {
    runPlan,
    atlas: buildStateAtlas({ runPlan, executionSession }),
  };
}

describe("State Atlas UI", () => {
  it("renders summary counts, filters, labels, origins, and detector badges", () => {
    const { atlas, runPlan } = atlasFixture();
    const html = renderToStaticMarkup(
      <StateAtlasView
        atlas={atlas}
        runPlan={runPlan}
        filter="all"
        selectedId="runtime"
        onFilterChange={() => undefined}
        onSelect={() => undefined}
      />,
    );

    expect(html).toContain("Interactive State Atlas");
    expect(html).toContain("Total states");
    expect(html).toContain(">5<");
    expect(html).toContain("Clean");
    expect(html).toContain("Runtime failures");
    expect(html).toContain("Broken images");
    expect(html).toContain("aria-pressed=\"true\"");
    expect(html).toContain("Happy product");
    expect(html).toContain("deterministic fixture");
    expect(html).toContain("ai fixture");
    expect(html).toContain("layout-overflow");
    expect(html).toContain("broken-image");
  });

  it("selects the first issue, otherwise the deterministic happy path", () => {
    const { atlas } = atlasFixture();
    expect(defaultAtlasSelectionId(atlas.entries)).toBe("runtime");
    expect(
      defaultAtlasSelectionId(
        atlas.entries.filter((entry) => entry.category === "clean"),
      ),
    ).toBe("det-happy-path");
  });

  it("filters entries and resolves a filtered-out selection safely", () => {
    const { atlas } = atlasFixture();
    expect(
      filterAtlasEntries(atlas.entries, "issues").map(
        (entry) => entry.fixtureId,
      ),
    ).toEqual(["runtime", "blank", "overflow", "broken"]);
    expect(
      selectionForFilter({
        entries: atlas.entries,
        filter: "overflow",
        selectedId: "runtime",
      }),
    ).toBe("overflow");
  });

  it("updates the inspection panel selection without changing recorded results", () => {
    const { atlas, runPlan } = atlasFixture();
    const before = JSON.stringify(atlas);
    const runtimeHtml = renderToStaticMarkup(
      <StateAtlasView
        atlas={atlas}
        runPlan={runPlan}
        filter="all"
        selectedId="runtime"
        onFilterChange={() => undefined}
        onSelect={() => undefined}
      />,
    );
    const blankHtml = renderToStaticMarkup(
      <StateAtlasView
        atlas={atlas}
        runPlan={runPlan}
        filter="all"
        selectedId="blank"
        onFilterChange={() => undefined}
        onSelect={() => undefined}
      />,
    );

    expect(runtimeHtml).toContain(
      '<h3 class="text-xl font-semibold text-slate-950">Empty title runtime</h3>',
    );
    expect(blankHtml).toContain(
      '<h3 class="text-xl font-semibold text-slate-950">Zero price blank</h3>',
    );
    expect(runtimeHtml).toContain(
      "No visible recorded preview is available for this state.",
    );
    expect(blankHtml).toContain(
      "No visible recorded preview is available for this state.",
    );
    expect(JSON.stringify(atlas)).toBe(before);
    expect(blankHtml).not.toContain("Requirement passed");
    expect(blankHtml).not.toContain("Requirement failed");
  });
});
