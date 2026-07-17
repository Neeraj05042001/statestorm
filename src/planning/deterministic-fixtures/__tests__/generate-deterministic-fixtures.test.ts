import { describe, expect, it } from "vitest";

import {
  ComponentContractSchema,
  FixtureSchema,
  type ComponentContract,
  type Fixture,
} from "../../../domain";
import {
  generateDeterministicFixtures,
  MAX_DETERMINISTIC_FIXTURES,
} from "..";

function contractWithProps(
  props: ComponentContract["props"],
): ComponentContract {
  return ComponentContractSchema.parse({
    componentName: "BoundaryCard",
    exportStyle: "default",
    language: "tsx",
    imports: ["react"],
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

function fullBoundaryContract(): ComponentContract {
  return contractWithProps([
    {
      name: "title",
      required: true,
      kind: "string",
      typeText: "string",
    },
    {
      name: "description",
      required: false,
      kind: "string",
      typeText: "string | undefined",
    },
    {
      name: "count",
      required: true,
      kind: "number",
      typeText: "number",
    },
    {
      name: "active",
      required: true,
      kind: "boolean",
      typeText: "boolean",
    },
    {
      name: "tone",
      required: true,
      kind: "enum",
      typeText: '"calm" | "urgent"',
      enumValues: ["calm", "urgent"],
    },
    {
      name: "tags",
      required: true,
      kind: "array",
      typeText: "string[]",
      defaultValue: ["primary"],
    },
    {
      name: "metadata",
      required: true,
      kind: "object",
      typeText: "Metadata",
      defaultValue: { mode: "full" },
    },
  ]);
}

describe("generateDeterministicFixtures", () => {
  it("produces one empty happy-path fixture for a component with no props", () => {
    const result = generateDeterministicFixtures(contractWithProps([]));

    expect(result.fixtures).toEqual([
      {
        id: "det-happy-path",
        label: "Happy path",
        origin: "deterministic",
        intent: "Render every declared prop with representative valid values.",
        props: {},
      },
    ]);
    expect(result.issues).toEqual([]);
  });

  it("uses the representative value for a required string prop", () => {
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

    expect(fixtureById(result.fixtures, "det-happy-path").props.title).toBe(
      "Sample text",
    );
  });

  it("includes optional props in happy path and omits them from minimal required", () => {
    const result = generateDeterministicFixtures(
      contractWithProps([
        {
          name: "title",
          required: true,
          kind: "string",
          typeText: "string",
        },
        {
          name: "subtitle",
          required: false,
          kind: "string",
          typeText: "string | undefined",
        },
      ]),
    );

    expect(
      Object.prototype.hasOwnProperty.call(
        fixtureById(result.fixtures, "det-happy-path").props,
        "subtitle",
      ),
    ).toBe(true);
    expect(
      Object.prototype.hasOwnProperty.call(
        fixtureById(result.fixtures, "det-minimal-required").props,
        "subtitle",
      ),
    ).toBe(false);
  });

  it("skips minimal required when it duplicates happy path", () => {
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

    expect(result.fixtures.map((fixture) => fixture.id)).not.toContain(
      "det-minimal-required",
    );
  });

  it("uses explicit JSON defaults before representative values", () => {
    const result = generateDeterministicFixtures(
      contractWithProps([
        {
          name: "title",
          required: true,
          kind: "string",
          typeText: "string",
          defaultValue: "Default title",
        },
        {
          name: "count",
          required: true,
          kind: "number",
          typeText: "number",
          defaultValue: 7,
        },
      ]),
    );

    expect(fixtureById(result.fixtures, "det-happy-path").props).toEqual({
      title: "Default title",
      count: 7,
    });
  });

  it("deep-clones defaults and never mutates the input contract", () => {
    const contract = contractWithProps([
      {
        name: "metadata",
        required: true,
        kind: "object",
        typeText: "Metadata",
        defaultValue: { nested: { values: [1, 2] } },
      },
    ]);
    const before = JSON.parse(JSON.stringify(contract));
    const result = generateDeterministicFixtures(contract);
    const metadata = fixtureById(result.fixtures, "det-happy-path").props
      .metadata as { nested: { values: number[] } };

    metadata.nested.values.push(3);

    expect(contract).toEqual(before);
    expect(
      (
        contract.props[0].defaultValue as {
          nested: { values: number[] };
        }
      ).nested.values,
    ).toEqual([1, 2]);
  });

  it("keeps every required prop in every emitted fixture", () => {
    const contract = fullBoundaryContract();
    const result = generateDeterministicFixtures(contract);
    const requiredNames = contract.props
      .filter((prop) => prop.required)
      .map((prop) => prop.name);

    result.fixtures.forEach((fixture) => {
      requiredNames.forEach((name) => {
        expect(
          Object.prototype.hasOwnProperty.call(fixture.props, name),
        ).toBe(true);
      });
    });
  });

  it("never generates undeclared props", () => {
    const contract = fullBoundaryContract();
    const declaredNames = new Set(contract.props.map((prop) => prop.name));
    const result = generateDeterministicFixtures(contract);

    result.fixtures.forEach((fixture) => {
      Object.keys(fixture.props).forEach((name) => {
        expect(declaredNames.has(name)).toBe(true);
      });
    });
  });

  it("validates every emitted fixture through FixtureSchema", () => {
    const result = generateDeterministicFixtures(fullBoundaryContract());

    expect(result.fixtures.length).toBeGreaterThan(0);
    result.fixtures.forEach((fixture) => {
      expect(FixtureSchema.safeParse(fixture).success).toBe(true);
      expect(fixture.origin).toBe("deterministic");
    });
  });

  it("returns no more than twelve fixtures", () => {
    const result = generateDeterministicFixtures(fullBoundaryContract());

    expect(result.fixtures).toHaveLength(MAX_DETERMINISTIC_FIXTURES);
  });

  it("uses unique IDs in fixed deterministic order", () => {
    const result = generateDeterministicFixtures(fullBoundaryContract());
    const ids = result.fixtures.map((fixture) => fixture.id);

    expect(ids).toEqual([
      "det-happy-path",
      "det-minimal-required",
      "det-empty-strings",
      "det-whitespace-strings",
      "det-long-strings",
      "det-zero-numbers",
      "det-negative-numbers",
      "det-large-numbers",
      "det-inverted-booleans",
      "det-last-enum-values",
      "det-empty-collections",
      "det-combined-stress",
    ]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("returns deeply identical output for identical input", () => {
    const contract = fullBoundaryContract();

    expect(generateDeterministicFixtures(contract)).toEqual(
      generateDeterministicFixtures(contract),
    );
  });

  it("preserves nested JSON defaults as valid fixture values", () => {
    const result = generateDeterministicFixtures(
      contractWithProps([
        {
          name: "metadata",
          required: true,
          kind: "object",
          typeText: "Metadata",
          defaultValue: {
            nested: { enabled: true, scores: [1, 2, null] },
          },
        },
      ]),
    );

    expect(fixtureById(result.fixtures, "det-happy-path").props.metadata).toEqual(
      { nested: { enabled: true, scores: [1, 2, null] } },
    );
  });

  it("does not share nested mutable defaults between fixtures", () => {
    const result = generateDeterministicFixtures(
      contractWithProps([
        {
          name: "title",
          required: true,
          kind: "string",
          typeText: "string",
        },
        {
          name: "metadata",
          required: true,
          kind: "object",
          typeText: "Metadata",
          defaultValue: { nested: { values: [1] } },
        },
      ]),
    );
    const happyMetadata = fixtureById(result.fixtures, "det-happy-path").props
      .metadata as { nested: { values: number[] } };
    const emptyTextMetadata = fixtureById(
      result.fixtures,
      "det-empty-strings",
    ).props.metadata as { nested: { values: number[] } };

    happyMetadata.nested.values.push(2);

    expect(emptyTextMetadata.nested.values).toEqual([1]);
  });

  it("rejects an unexecutable unknown prop kind", () => {
    const result = generateDeterministicFixtures(
      contractWithProps([
        {
          name: "value",
          required: true,
          kind: "unknown",
          typeText: "unknown",
        },
      ]),
    );

    expect(result.fixtures).toEqual([]);
    expect(result.issues.map((issue) => issue.code)).toContain(
      "UNEXECUTABLE_PROP_KIND",
    );
  });

  it("rejects a default that is incompatible with its prop kind", () => {
    const contract = contractWithProps([
      {
        name: "title",
        required: true,
        kind: "string",
        typeText: "string",
        defaultValue: 7,
      },
    ]);
    const result = generateDeterministicFixtures(contract);

    expect(result.fixtures).toEqual([]);
    expect(result.issues.map((issue) => issue.code)).toContain(
      "INVALID_PROP_DEFAULT",
    );
  });

  it("rejects invalid enum metadata", () => {
    const invalidContract = {
      ...contractWithProps([]),
      props: [
        {
          name: "tone",
          required: true,
          kind: "enum",
          typeText: '"calm"',
          enumValues: ["calm"],
        },
      ],
    } as ComponentContract;
    const result = generateDeterministicFixtures(invalidContract);

    expect(result.fixtures).toEqual([]);
    expect(result.issues.map((issue) => issue.code)).toContain(
      "INVALID_ENUM_METADATA",
    );
  });
});
