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
import { stateAtlasConclusion } from "../StateAtlasSummary";
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

    expect(html).toContain("State Atlas");
    expect(html).toContain("Developer conclusion");
    expect(html).toContain("4 of 5 states showed issues");
    expect(html).toContain(
      "A state may contain more than one recorded finding.",
    );
    expect(html).toContain("Total states");
    expect(html).toContain(">5<");
    expect(html).toContain("Clean");
    expect(html).toContain("Runtime failures");
    expect(html).toContain("Broken images");
    expect(html).toContain("aria-pressed=\"true\"");
    expect(html).toContain("Happy product");
    expect(html).toContain("Deterministic state");
    expect(html).toContain("AI-planned state");
    expect(html).toContain("Possible overflow");
    expect(html).toContain("Broken image");
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
      filterAtlasEntries(atlas.entries, "all").map((entry) => entry.fixtureId),
    ).toEqual(["det-happy-path", "runtime", "blank", "overflow", "broken"]);
    expect(
      filterAtlasEntries(atlas.entries, "issues").map(
        (entry) => entry.fixtureId,
      ),
    ).toEqual(["runtime", "blank", "overflow", "broken"]);
    expect(
      filterAtlasEntries(atlas.entries, "clean").map(
        (entry) => entry.fixtureId,
      ),
    ).toEqual(["det-happy-path"]);
    expect(
      filterAtlasEntries(atlas.entries, "runtime").map(
        (entry) => entry.fixtureId,
      ),
    ).toEqual(["runtime"]);
    expect(
      filterAtlasEntries(atlas.entries, "blank").map(
        (entry) => entry.fixtureId,
      ),
    ).toEqual(["blank"]);
    expect(
      filterAtlasEntries(atlas.entries, "overflow").map(
        (entry) => entry.fixtureId,
      ),
    ).toEqual(["overflow"]);
    expect(
      filterAtlasEntries(atlas.entries, "broken-images").map(
        (entry) => entry.fixtureId,
      ),
    ).toEqual(["broken"]);
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
      '<h5 class="text-xl font-semibold">Empty title runtime</h5>',
    );
    expect(blankHtml).toContain(
      '<h5 class="text-xl font-semibold">Zero price blank</h5>',
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

  it("creates a deterministic no-issue developer conclusion", () => {
    expect(
      stateAtlasConclusion({
        totalStates: 4,
        cleanStates: 4,
        runtimeFailures: 0,
        blankRenders: 0,
        overflowWarnings: 0,
        brokenImages: 0,
        otherFailures: 0,
      }),
    ).toEqual({
      headline: "No runtime or visual issues found",
      detail:
        "All 4 tested states completed without a recorded failure or detector finding.",
    });
  });

  it("counts issue states and describes mixed recorded evidence without AI", () => {
    expect(
      stateAtlasConclusion({
        totalStates: 12,
        cleanStates: 8,
        runtimeFailures: 1,
        blankRenders: 1,
        overflowWarnings: 2,
        brokenImages: 1,
        otherFailures: 0,
      }),
    ).toEqual({
      headline: "4 of 12 states showed issues",
      detail:
        "The component crashed in one state, rendered blank in one state, showed possible overflow in 2 states, and contained broken images in one state.",
    });
  });
});
