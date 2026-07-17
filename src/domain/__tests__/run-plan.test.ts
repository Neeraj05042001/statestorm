import { describe, expect, it } from "vitest";

import {
  isRunPlanExecutable,
  parseRunPlan,
  RunPlanSchema,
  safeParseRunPlan,
} from "../index";

function createValidPlan() {
  return {
    version: 1 as const,
    submission: {
      id: "submission-001",
      prompt: "Render a status card",
      componentCode:
        "export default function StatusCard(props: { title: string; count?: number }) { return <article>{props.title}</article>; }",
      language: "tsx" as const,
    },
    component: {
      componentName: "StatusCard",
      exportStyle: "default" as const,
      language: "tsx" as const,
      imports: ["react"],
      props: [
        {
          name: "title",
          required: true,
          kind: "string" as const,
          typeText: "string",
        },
        {
          name: "count",
          required: false,
          kind: "number" as const,
          typeText: "number | undefined",
          defaultValue: 0,
        },
      ],
      warnings: [],
    },
    requirements: [
      {
        id: "requirement-title",
        statement: "The supplied title is visible",
        sourceQuote: "show the title",
        category: "content" as const,
        verification: "deterministic" as const,
        expectedAssertion: {
          type: "text-present" as const,
          value: "Ready",
        },
      },
    ],
    fixtures: [
      {
        id: "fixture-ready",
        label: "Ready state",
        origin: "deterministic" as const,
        intent: "Render the required title",
        props: {
          title: "Ready",
          count: 1,
        },
      },
    ],
    issues: [],
  };
}

function expectRunPlanIssuePath(input: unknown, expectedPath: PropertyKey[]) {
  const result = safeParseRunPlan(input);
  expect(result.success).toBe(false);
  if (result.success) {
    throw new Error("Expected RunPlan validation to fail");
  }

  expect(result.error.issues.map((issue) => issue.path)).toContainEqual(
    expectedPath,
  );
}

describe("RunPlanSchema", () => {
  it("accepts a valid minimal RunPlan", () => {
    const result = safeParseRunPlan(createValidPlan());

    expect(result.success).toBe(true);
    if (!result.success) {
      throw result.error;
    }
    expect(isRunPlanExecutable(result.data)).toBe(true);
  });

  it("accepts a valid nested JSON fixture", () => {
    const plan = createValidPlan();
    const result = safeParseRunPlan({
      ...plan,
      component: {
        ...plan.component,
        props: [
          ...plan.component.props,
          {
            name: "metadata",
            required: true,
            kind: "object",
            typeText: "Record<string, unknown>",
            defaultValue: {},
          },
        ],
      },
      fixtures: [
        {
          ...plan.fixtures[0],
          props: {
            ...plan.fixtures[0].props,
            metadata: {
              flags: [true, false, null],
              nested: { score: 4.5, label: "stable" },
            },
          },
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects a missing required prop", () => {
    const plan = createValidPlan();
    expectRunPlanIssuePath(
      {
        ...plan,
        fixtures: [
          {
            ...plan.fixtures[0],
            props: { count: 1 },
          },
        ],
      },
      ["fixtures", 0, "props", "title"],
    );
  });

  it("rejects an unknown fixture prop", () => {
    const plan = createValidPlan();
    expectRunPlanIssuePath(
      {
        ...plan,
        fixtures: [
          {
            ...plan.fixtures[0],
            props: { ...plan.fixtures[0].props, surprise: true },
          },
        ],
      },
      ["fixtures", 0, "props", "surprise"],
    );
  });

  it("rejects duplicate prop names", () => {
    const plan = createValidPlan();
    expectRunPlanIssuePath(
      {
        ...plan,
        component: {
          ...plan.component,
          props: [plan.component.props[0], { ...plan.component.props[0] }],
        },
      },
      ["component", "props", 1, "name"],
    );
  });

  it("rejects duplicate fixture IDs", () => {
    const plan = createValidPlan();
    expectRunPlanIssuePath(
      {
        ...plan,
        fixtures: [plan.fixtures[0], { ...plan.fixtures[0] }],
      },
      ["fixtures", 1, "id"],
    );
  });

  it("rejects duplicate requirement IDs", () => {
    const plan = createValidPlan();
    expectRunPlanIssuePath(
      {
        ...plan,
        requirements: [
          plan.requirements[0],
          { ...plan.requirements[0] },
        ],
      },
      ["requirements", 1, "id"],
    );
  });

  it("rejects more than twelve fixtures", () => {
    const plan = createValidPlan();
    expectRunPlanIssuePath(
      {
        ...plan,
        fixtures: Array.from({ length: 13 }, (_, index) => ({
          ...plan.fixtures[0],
          id: `fixture-${index + 1}`,
        })),
      },
      ["fixtures"],
    );
  });

  it("rejects a RunPlan without fixtures", () => {
    expectRunPlanIssuePath(
      {
        ...createValidPlan(),
        fixtures: [],
      },
      ["fixtures"],
    );
  });

  it("rejects a function fixture value", () => {
    const plan = createValidPlan();
    expectRunPlanIssuePath(
      {
        ...plan,
        fixtures: [
          {
            ...plan.fixtures[0],
            props: { title: "Ready", count: () => 1 },
          },
        ],
      },
      ["fixtures", 0, "props", "count"],
    );
  });

  it("rejects a Date fixture value", () => {
    const plan = createValidPlan();
    expectRunPlanIssuePath(
      {
        ...plan,
        fixtures: [
          {
            ...plan.fixtures[0],
            props: {
              title: "Ready",
              count: new Date("2026-07-18T00:00:00.000Z"),
            },
          },
        ],
      },
      ["fixtures", 0, "props", "count"],
    );
  });

  it("rejects a non-finite fixture number", () => {
    const plan = createValidPlan();
    expectRunPlanIssuePath(
      {
        ...plan,
        fixtures: [
          {
            ...plan.fixtures[0],
            props: { title: "Ready", count: Number.POSITIVE_INFINITY },
          },
        ],
      },
      ["fixtures", 0, "props", "count"],
    );
  });

  it("rejects a deterministic requirement without an assertion", () => {
    const plan = createValidPlan();
    expectRunPlanIssuePath(
      {
        ...plan,
        requirements: [
          {
            id: "requirement-title",
            statement: "The supplied title is visible",
            sourceQuote: "show the title",
            category: "content",
            verification: "deterministic",
          },
        ],
      },
      ["requirements", 0, "expectedAssertion"],
    );
  });

  it("requires unsupported-category requirements to use unsupported verification", () => {
    const plan = createValidPlan();
    expectRunPlanIssuePath(
      {
        ...plan,
        requirements: [
          {
            ...plan.requirements[0],
            category: "unsupported",
            verification: "heuristic",
          },
        ],
      },
      ["requirements", 0, "verification"],
    );
  });

  it("rejects a component language that differs from its submission", () => {
    const plan = createValidPlan();
    expectRunPlanIssuePath(
      {
        ...plan,
        component: { ...plan.component, language: "jsx" },
      },
      ["component", "language"],
    );
  });

  it("accepts an error issue as valid data but reports the plan non-executable", () => {
    const plan = parseRunPlan({
      ...createValidPlan(),
      issues: [
        {
          code: "UNSUPPORTED_BEHAVIOR",
          severity: "error",
          message: "The requested behavior is outside contract version 1",
          path: ["requirements", 0],
          suggestion: "Use a deterministic supported assertion",
        },
      ],
    });

    expect(RunPlanSchema.safeParse(plan).success).toBe(true);
    expect(isRunPlanExecutable(plan)).toBe(false);
  });

  it("preserves a RunPlan through serialize and parse", () => {
    const original = parseRunPlan(createValidPlan());
    const serialized = JSON.stringify(original);
    const reparsed = parseRunPlan(JSON.parse(serialized));

    expect(reparsed).toEqual(original);
  });
});
