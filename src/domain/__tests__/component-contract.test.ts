import { describe, expect, it } from "vitest";

import {
  ComponentContractSchema,
  ComponentSubmissionSchema,
  JsonValueSchema,
  PropDefinitionSchema,
} from "../index";

function createComponentContract() {
  return {
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
    ],
    warnings: [],
  };
}

function expectIssuePath(
  result: ReturnType<typeof ComponentContractSchema.safeParse>,
  expectedPath: PropertyKey[],
) {
  expect(result.success).toBe(false);
  if (result.success) {
    throw new Error("Expected component contract validation to fail");
  }

  expect(result.error.issues.map((issue) => issue.path)).toContainEqual(
    expectedPath,
  );
}

describe("ComponentContractSchema", () => {
  it("accepts the React import allowlist", () => {
    const contract = createComponentContract();
    contract.imports = ["react", "react/jsx-runtime"];

    expect(ComponentContractSchema.safeParse(contract).success).toBe(true);
  });

  it("rejects duplicate prop names with a useful path", () => {
    const contract = createComponentContract();
    contract.props.push({ ...contract.props[0] });

    expectIssuePath(ComponentContractSchema.safeParse(contract), [
      "props",
      1,
      "name",
    ]);
  });

  it("rejects unsupported package imports", () => {
    const contract = createComponentContract();
    contract.imports = ["lodash"];

    expectIssuePath(ComponentContractSchema.safeParse(contract), ["imports", 0]);
  });

  it("rejects relative imports", () => {
    const contract = createComponentContract();
    contract.imports = ["./StatusBadge"];

    expectIssuePath(ComponentContractSchema.safeParse(contract), ["imports", 0]);
  });

  it("rejects alias imports", () => {
    const contract = createComponentContract();
    contract.imports = ["@/components/StatusBadge"];

    expectIssuePath(ComponentContractSchema.safeParse(contract), ["imports", 0]);
  });

  it("requires at least two JSON enum values", () => {
    const result = PropDefinitionSchema.safeParse({
      name: "tone",
      required: false,
      kind: "enum",
      typeText: '"calm" | "urgent"',
      enumValues: ["calm"],
    });

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error("Expected enum prop validation to fail");
    }
    expect(result.error.issues.map((issue) => issue.path)).toContainEqual([
      "enumValues",
    ]);
  });

  it("rejects a non-JSON default value", () => {
    const result = PropDefinitionSchema.safeParse({
      name: "createdAt",
      required: false,
      kind: "unknown",
      typeText: "Date",
      defaultValue: new Date("2026-07-18T00:00:00.000Z"),
    });

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error("Expected default value validation to fail");
    }
    expect(result.error.issues[0]?.path).toEqual(["defaultValue"]);
  });
});

describe("ComponentSubmissionSchema", () => {
  it("accepts a URL-safe submission ID", () => {
    expect(
      ComponentSubmissionSchema.safeParse({
        id: "submission_01-safe",
        prompt: "Render the status card",
        componentCode: "export default function StatusCard() { return null; }",
        language: "tsx",
      }).success,
    ).toBe(true);
  });

  it("rejects a submission ID containing spaces", () => {
    const result = ComponentSubmissionSchema.safeParse({
      id: "submission 01",
      prompt: "Render the status card",
      componentCode: "export default function StatusCard() { return null; }",
      language: "tsx",
    });

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error("Expected submission validation to fail");
    }
    expect(result.error.issues[0]?.path).toEqual(["id"]);
  });
});

describe("JsonValueSchema", () => {
  class UnsupportedClassInstance {
    value = "not plain JSON";
  }

  it.each([
    ["undefined", undefined],
    ["symbol", Symbol("value")],
    ["bigint", BigInt(1)],
    ["Map", new Map([["value", 1]])],
    ["Set", new Set([1])],
    ["class instance", new UnsupportedClassInstance()],
  ])("rejects %s", (_label, value) => {
    expect(JsonValueSchema.safeParse(value).success).toBe(false);
  });
});
