import { describe, expect, it } from "vitest";

import {
  ComponentContractSchema,
  type ComponentContract,
  type Fixture,
} from "../../../domain";
import {
  DETERMINISTIC_LONG_STRING,
  generateDeterministicFixtures,
  MAX_DETERMINISTIC_FIXTURES,
  selectDeterministicCandidates,
  type FixtureCandidate,
} from "..";

function contractWithProps(
  props: ComponentContract["props"],
): ComponentContract {
  return ComponentContractSchema.parse({
    componentName: "BoundaryCard",
    exportStyle: "default",
    language: "tsx",
    imports: [],
    props,
    warnings: [],
  });
}

function fixtureById(fixtures: Fixture[], id: string): Fixture {
  const fixture = fixtures.find((entry) => entry.id === id);
  if (fixture === undefined) {
    throw new Error(`Expected fixture '${id}'`);
  }
  return fixture;
}

describe("deterministic boundary strategies", () => {
  it("generates empty and whitespace string fixtures", () => {
    const result = generateDeterministicFixtures(
      contractWithProps([
        {
          name: "title",
          required: true,
          kind: "string",
          typeText: "string",
        },
      ]),
    );

    expect(fixtureById(result.fixtures, "det-empty-strings").props.title).toBe(
      "",
    );
    expect(
      fixtureById(result.fixtures, "det-whitespace-strings").props.title,
    ).toBe(" ");
  });

  it("uses one deterministic readable long string in the required length range", () => {
    const result = generateDeterministicFixtures(
      contractWithProps([
        {
          name: "title",
          required: true,
          kind: "string",
          typeText: "string",
        },
      ]),
    );
    const value = fixtureById(result.fixtures, "det-long-strings").props.title;

    expect(value).toBe(DETERMINISTIC_LONG_STRING);
    expect(DETERMINISTIC_LONG_STRING.length).toBeGreaterThanOrEqual(240);
    expect(DETERMINISTIC_LONG_STRING.length).toBeLessThanOrEqual(320);
    expect(DETERMINISTIC_LONG_STRING).toContain("StateStorm");
  });

  it("generates zero, negative and large-number fixtures", () => {
    const result = generateDeterministicFixtures(
      contractWithProps([
        {
          name: "count",
          required: true,
          kind: "number",
          typeText: "number",
        },
      ]),
    );

    expect(fixtureById(result.fixtures, "det-zero-numbers").props.count).toBe(
      0,
    );
    expect(
      fixtureById(result.fixtures, "det-negative-numbers").props.count,
    ).toBe(-1);
    expect(fixtureById(result.fixtures, "det-large-numbers").props.count).toBe(
      999999,
    );
  });

  it("inverts every boolean from its happy-path value", () => {
    const result = generateDeterministicFixtures(
      contractWithProps([
        {
          name: "visible",
          required: true,
          kind: "boolean",
          typeText: "boolean",
          defaultValue: false,
        },
      ]),
    );

    expect(fixtureById(result.fixtures, "det-happy-path").props.visible).toBe(
      false,
    );
    expect(
      fixtureById(result.fixtures, "det-inverted-booleans").props.visible,
    ).toBe(true);
  });

  it("uses the final declared string enum value", () => {
    const result = generateDeterministicFixtures(
      contractWithProps([
        {
          name: "tone",
          required: true,
          kind: "enum",
          typeText: '"calm" | "urgent"',
          enumValues: ["calm", "urgent"],
        },
      ]),
    );

    expect(
      fixtureById(result.fixtures, "det-last-enum-values").props.tone,
    ).toBe("urgent");
  });

  it("uses the final declared numeric enum value", () => {
    const result = generateDeterministicFixtures(
      contractWithProps([
        {
          name: "level",
          required: true,
          kind: "enum",
          typeText: "1 | 2 | 3",
          enumValues: [1, 2, 3],
        },
      ]),
    );

    expect(
      fixtureById(result.fixtures, "det-last-enum-values").props.level,
    ).toBe(3);
  });

  it("generates an empty-array boundary from a populated default", () => {
    const result = generateDeterministicFixtures(
      contractWithProps([
        {
          name: "items",
          required: true,
          kind: "array",
          typeText: "string[]",
          defaultValue: ["one"],
        },
      ]),
    );

    expect(
      fixtureById(result.fixtures, "det-empty-collections").props.items,
    ).toEqual([]);
  });

  it("generates an empty-object boundary from a populated default", () => {
    const result = generateDeterministicFixtures(
      contractWithProps([
        {
          name: "metadata",
          required: true,
          kind: "object",
          typeText: "Metadata",
          defaultValue: { state: "ready" },
        },
      ]),
    );

    expect(
      fixtureById(result.fixtures, "det-empty-collections").props.metadata,
    ).toEqual({});
  });

  it("combines every supported boundary group in the stress fixture", () => {
    const result = generateDeterministicFixtures(
      contractWithProps([
        { name: "title", required: true, kind: "string", typeText: "string" },
        { name: "count", required: true, kind: "number", typeText: "number" },
        { name: "active", required: true, kind: "boolean", typeText: "boolean" },
        {
          name: "tone",
          required: true,
          kind: "enum",
          typeText: '"calm" | "urgent"',
          enumValues: ["calm", "urgent"],
        },
        {
          name: "items",
          required: true,
          kind: "array",
          typeText: "string[]",
          defaultValue: ["one"],
        },
        {
          name: "metadata",
          required: true,
          kind: "object",
          typeText: "Metadata",
          defaultValue: { state: "ready" },
        },
      ]),
    );

    expect(fixtureById(result.fixtures, "det-combined-stress").props).toEqual({
      title: "",
      count: 0,
      active: false,
      tone: "urgent",
      items: [],
      metadata: {},
    });
  });

  it("deduplicates canonically equal props regardless of object property order", () => {
    const candidates: FixtureCandidate[] = [
      {
        id: "first",
        label: "First",
        intent: "First canonical value",
        props: { title: "same", metadata: { alpha: 1, beta: 2 } },
      },
      {
        id: "second",
        label: "Second",
        intent: "Same value with another property order",
        props: { metadata: { beta: 2, alpha: 1 }, title: "same" },
      },
    ];

    expect(selectDeterministicCandidates(candidates).candidates).toHaveLength(1);
    expect(selectDeterministicCandidates(candidates).candidates[0].id).toBe(
      "first",
    );
  });

  it("applies the fixture limit with one stable warning when necessary", () => {
    const candidates: FixtureCandidate[] = Array.from(
      { length: MAX_DETERMINISTIC_FIXTURES + 1 },
      (_, index) => ({
        id: `candidate-${index}`,
        label: `Candidate ${index}`,
        intent: `Exercise value ${index}`,
        props: { value: index },
      }),
    );
    const result = selectDeterministicCandidates(candidates);

    expect(result.candidates).toHaveLength(MAX_DETERMINISTIC_FIXTURES);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].code).toBe(
      "DETERMINISTIC_FIXTURE_LIMIT_APPLIED",
    );
  });

  it("returns one collection-coverage warning for collections without defaults", () => {
    const result = generateDeterministicFixtures(
      contractWithProps([
        {
          name: "items",
          required: true,
          kind: "array",
          typeText: "string[]",
        },
        {
          name: "metadata",
          required: true,
          kind: "object",
          typeText: "Metadata",
        },
      ]),
    );

    expect(
      result.issues.filter(
        (issue) => issue.code === "LIMITED_COLLECTION_FIXTURE_COVERAGE",
      ),
    ).toHaveLength(1);
  });
});
