import { describe, expect, it } from "vitest";

import {
  ComponentContractSchema,
  FixtureSchema,
  RunPlanSchema,
  type AiRequirementProposal,
  type ComponentContract,
  type ComponentSubmission,
  type Fixture,
} from "../../../domain";
import { generateDeterministicFixtures } from "../../deterministic-fixtures";
import {
  assembleRunPlan,
  materializeAiRequirements,
  materializeAiSemanticFixtures,
  mergeRunPlanFixtures,
} from "..";

const contract: ComponentContract = ComponentContractSchema.parse({
  componentName: "ProductCard",
  exportStyle: "default",
  language: "tsx",
  imports: [],
  props: [
    { name: "title", required: true, kind: "string", typeText: "string" },
    { name: "price", required: true, kind: "number", typeText: "number" },
    {
      name: "featured",
      required: true,
      kind: "boolean",
      typeText: "boolean",
    },
    {
      name: "tone",
      required: false,
      kind: "enum",
      typeText: '"calm" | "urgent" | undefined',
      enumValues: ["calm", "urgent"],
      defaultValue: "calm",
    },
  ],
  warnings: [],
});

const submission: ComponentSubmission = {
  id: "planning-test",
  prompt: "Featured products should feel prominent.",
  componentCode: "export default function ProductCard() { return <div />; }",
  language: "tsx",
};

function happyPath() {
  const fixture = generateDeterministicFixtures(contract).fixtures.find(
    (entry) => entry.id === "det-happy-path",
  );
  if (fixture === undefined) throw new Error("Missing happy fixture");
  return fixture;
}

function semanticProposal(overrides: Record<string, unknown> = {}) {
  return {
    label: "Urgent featured product",
    intent: "Exercise a meaningful urgent state.",
    assignments: [
      { propName: "tone", jsonValue: '"urgent"' },
      { propName: "featured", jsonValue: "true" },
    ],
    omitOptionalProps: [],
    ...overrides,
  };
}

describe("AI requirement materialization", () => {
  it("maps heuristic and unsupported requirements through RequirementSchema", () => {
    const result = materializeAiRequirements({
      prompt: submission.prompt,
      proposals: [
        {
          title: "Prominent",
          statement: "  Featured   products should feel prominent. ",
          classification: "heuristic",
          rationale: "Visual judgement",
        },
        {
          title: "Animation timing",
          statement: "Animation timing should feel natural.",
          classification: "unsupported",
          rationale: "No timing detector",
        },
      ],
    });

    expect(result.requirements).toMatchObject([
      { id: "req-ai-01", verification: "heuristic", category: "state" },
      {
        id: "req-ai-02",
        verification: "unsupported",
        category: "unsupported",
      },
    ]);
    expect(result.requirements[0].statement).toBe(
      "Featured products should feel prominent.",
    );
  });

  it("rejects deterministic claims that have no trusted assertion", () => {
    const result = materializeAiRequirements({
      prompt: submission.prompt,
      proposals: [
        {
          title: "Title",
          statement: "The title should render.",
          classification: "deterministic",
          rationale: "Text exists",
        },
      ],
    });

    expect(result.requirements).toEqual([]);
    expect(result.issues[0]?.code).toBe("AI_REQUIREMENT_REJECTED");
  });

  it("normalizes and removes duplicate requirements deterministically", () => {
    const base: AiRequirementProposal = {
      title: "Title",
      statement: "Featured products should feel prominent.",
      classification: "heuristic",
      rationale: "Visual judgement",
    };
    const result = materializeAiRequirements({
      prompt: submission.prompt,
      proposals: [base, { ...base, statement: " featured  products should feel prominent. " }],
    });

    expect(result.requirements).toHaveLength(1);
    expect(result.issues[0]?.code).toBe("AI_REQUIREMENT_REJECTED");
  });

  it("keeps the first normalized statement even when a duplicate changes classification", () => {
    const result = materializeAiRequirements({
      prompt: submission.prompt,
      proposals: [
        {
          title: "First",
          statement: "The state needs review.",
          classification: "heuristic",
          rationale: "Review",
        },
        {
          title: "Second",
          statement: " the state  needs review. ",
          classification: "unsupported",
          rationale: "Unavailable",
        },
      ],
    });

    expect(result.requirements).toHaveLength(1);
    expect(result.requirements[0].verification).toBe("heuristic");
  });

  it("applies the eight-requirement limit with stable IDs", () => {
    const result = materializeAiRequirements({
      prompt: submission.prompt,
      proposals: Array.from({ length: 9 }, (_, index) => ({
        title: `Requirement ${index}`,
        statement: `Distinct requirement ${index}`,
        classification: "heuristic" as const,
        rationale: "Planning rationale",
      })),
    });

    expect(result.requirements).toHaveLength(8);
    expect(result.requirements.at(-1)?.id).toBe("req-ai-08");
    expect(result.issues.at(-1)?.code).toBe("AI_REQUIREMENT_LIMIT_APPLIED");
  });
});

describe("semantic fixture materialization", () => {
  it("clones happy props, applies valid assignments and optional omissions", () => {
    const baseline = happyPath().props;
    const before = JSON.stringify(baseline);
    const result = materializeAiSemanticFixtures({
      contract,
      happyPathProps: baseline,
      proposals: [semanticProposal({ omitOptionalProps: ["tone"] })],
    });

    expect(result.fixtures).toHaveLength(1);
    expect(result.fixtures[0]).toMatchObject({
      id: "ai-semantic-01",
      origin: "ai",
      props: { featured: true },
    });
    expect(result.fixtures[0].props).not.toHaveProperty("tone");
    expect(JSON.stringify(baseline)).toBe(before);
  });

  it("drops malformed JSON without blocking a later valid candidate", () => {
    const result = materializeAiSemanticFixtures({
      contract,
      happyPathProps: happyPath().props,
      proposals: [
        semanticProposal({
          assignments: [{ propName: "price", jsonValue: "not-json" }],
        }),
        semanticProposal(),
      ],
    });

    expect(result.issues[0]?.code).toBe("AI_FIXTURE_INVALID_JSON");
    expect(result.fixtures).toHaveLength(1);
    expect(result.fixtures[0].id).toBe("ai-semantic-01");
  });

  it("rejects unknown props and incompatible values", () => {
    const result = materializeAiSemanticFixtures({
      contract,
      happyPathProps: happyPath().props,
      proposals: [
        semanticProposal({
          assignments: [
            { propName: "missing", jsonValue: "1" },
            { propName: "price", jsonValue: '"free"' },
          ],
        }),
      ],
    });

    expect(result.fixtures).toEqual([]);
    expect(result.issues.map((issue) => issue.code)).toEqual([
      "AI_FIXTURE_UNKNOWN_PROP",
      "AI_FIXTURE_TYPE_MISMATCH",
    ]);
  });

  it("rejects required omissions", () => {
    const result = materializeAiSemanticFixtures({
      contract,
      happyPathProps: happyPath().props,
      proposals: [semanticProposal({ omitOptionalProps: ["title"] })],
    });

    expect(result.fixtures).toEqual([]);
    expect(result.issues[0]?.code).toBe("AI_FIXTURE_REQUIRED_PROP_OMISSION");
  });

  it("rejects enum assignments outside accepted metadata", () => {
    const result = materializeAiSemanticFixtures({
      contract,
      happyPathProps: happyPath().props,
      proposals: [
        semanticProposal({
          assignments: [{ propName: "tone", jsonValue: '"danger"' }],
        }),
      ],
    });

    expect(result.fixtures).toEqual([]);
    expect(result.issues[0]?.code).toBe("AI_FIXTURE_TYPE_MISMATCH");
  });

  it("caps accepted semantic fixtures at four", () => {
    const result = materializeAiSemanticFixtures({
      contract,
      happyPathProps: happyPath().props,
      proposals: Array.from({ length: 5 }, (_, index) =>
        semanticProposal({
          label: `Semantic ${index}`,
          assignments: [
            { propName: "title", jsonValue: JSON.stringify(`Title ${index}`) },
          ],
        }),
      ),
    });

    expect(result.fixtures).toHaveLength(4);
    expect(result.issues.at(-1)?.code).toBe("AI_FIXTURE_LIMIT_APPLIED");
  });

  it("does not share mutable prop references between semantic fixtures", () => {
    const collectionContract = ComponentContractSchema.parse({
      ...contract,
      props: [
        ...contract.props,
        {
          name: "metadata",
          required: true,
          kind: "object",
          typeText: "object",
          defaultValue: { nested: { value: 1 } },
        },
      ],
    });
    const baseline = generateDeterministicFixtures(collectionContract).fixtures[0];
    const result = materializeAiSemanticFixtures({
      contract: collectionContract,
      happyPathProps: baseline.props,
      proposals: [
        semanticProposal({
          label: "First",
          assignments: [{ propName: "title", jsonValue: '"First"' }],
        }),
        semanticProposal({
          label: "Second",
          assignments: [{ propName: "title", jsonValue: '"Second"' }],
        }),
      ],
    });
    const firstMetadata = result.fixtures[0].props.metadata as {
      nested: { value: number };
    };
    const secondMetadata = result.fixtures[1].props.metadata as {
      nested: { value: number };
    };
    firstMetadata.nested.value = 9;

    expect(secondMetadata.nested.value).toBe(1);
    expect(
      (baseline.props.metadata as { nested: { value: number } }).nested.value,
    ).toBe(1);
  });

  it("validates every emitted fixture through FixtureSchema", () => {
    const result = materializeAiSemanticFixtures({
      contract,
      happyPathProps: happyPath().props,
      proposals: [semanticProposal()],
    });

    expect(result.fixtures.every((fixture) => FixtureSchema.safeParse(fixture).success)).toBe(true);
  });
});

describe("fixture merging and RunPlan assembly", () => {
  it("orders happy path, semantic fixtures, then remaining boundaries", () => {
    const deterministic = generateDeterministicFixtures(contract).fixtures;
    const semantic = materializeAiSemanticFixtures({
      contract,
      happyPathProps: happyPath().props,
      proposals: [semanticProposal()],
    }).fixtures;
    const result = mergeRunPlanFixtures(deterministic, semantic);

    expect(result.fixtures[0].id).toBe("det-happy-path");
    expect(result.fixtures[1].id).toBe("ai-semantic-01");
  });

  it("deduplicates canonical props without mutating inputs", () => {
    const deterministic = generateDeterministicFixtures(contract).fixtures;
    const duplicate: Fixture = FixtureSchema.parse({
      ...happyPath(),
      id: "ai-semantic-01",
      origin: "ai",
    });
    const before = JSON.stringify(deterministic);
    const result = mergeRunPlanFixtures(deterministic, [duplicate]);

    expect(result.issues.map((issue) => issue.code)).toContain(
      "AI_FIXTURE_DUPLICATE",
    );
    expect(JSON.stringify(deterministic)).toBe(before);
  });

  it("retains happy path when the twelve-fixture cap is applied", () => {
    const semantic = Array.from({ length: 12 }, (_, index) =>
      FixtureSchema.parse({
        id: `ai-${index}`,
        label: `Fixture ${index}`,
        origin: "ai",
        intent: "Cap test",
        props: {
          title: `Title ${index}`,
          price: index,
          featured: true,
          tone: "calm",
        },
      }),
    );
    const result = mergeRunPlanFixtures(
      generateDeterministicFixtures(contract).fixtures,
      semantic,
    );

    expect(result.fixtures).toHaveLength(12);
    expect(result.fixtures[0].id).toBe("det-happy-path");
    expect(result.issues.map((issue) => issue.code)).toContain(
      "AI_FIXTURE_LIMIT_APPLIED",
    );
  });

  it("assembles stable, schema-valid RunPlan version 1 output", () => {
    const fixtures = generateDeterministicFixtures(contract).fixtures;
    const first = assembleRunPlan({
      submission,
      component: contract,
      requirements: [],
      fixtures,
      issues: [],
    });
    const second = assembleRunPlan({
      submission,
      component: contract,
      requirements: [],
      fixtures,
      issues: [],
    });

    expect(first.runPlan).toEqual(second.runPlan);
    expect(RunPlanSchema.safeParse(first.runPlan).success).toBe(true);
  });

  it("fails closed when assembly cannot satisfy RunPlanSchema", () => {
    const result = assembleRunPlan({
      submission: { ...submission, language: "jsx" },
      component: contract,
      requirements: [],
      fixtures: [happyPath()],
      issues: [],
    });

    expect(result.runPlan).toBeUndefined();
    expect(result.issues[0]?.code).toBe("RUN_PLAN_SCHEMA_VALIDATION_FAILED");
  });
});
