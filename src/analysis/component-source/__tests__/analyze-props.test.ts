import { describe, expect, it } from "vitest";

import { expectAccepted, expectRejectedWith } from "./test-helpers";

describe("analyzeComponentSource supported props", () => {
  it("infers primitive, enum, array and object prop metadata", () => {
    const result = expectAccepted(`
      interface ProductDetails {
        sku: string;
        dimensions?: { width: number; height: number };
      }

      interface ProductCardProps {
        title: string;
        rating: number;
        featured: boolean;
        size: "small" | "medium" | "large";
        priority: 1 | 2 | 3;
        tags: string[];
        scores: Array<number>;
        details: ProductDetails;
      }

      export default function ProductCard(props: ProductCardProps) {
        return <article>{props.title} {props.tags.join(", ")}</article>;
      }
    `);

    expect(result.contract.props).toEqual([
      { name: "title", required: true, kind: "string", typeText: "string" },
      { name: "rating", required: true, kind: "number", typeText: "number" },
      { name: "featured", required: true, kind: "boolean", typeText: "boolean" },
      {
        name: "size",
        required: true,
        kind: "enum",
        typeText: '"small" | "medium" | "large"',
        enumValues: ["small", "medium", "large"],
      },
      {
        name: "priority",
        required: true,
        kind: "enum",
        typeText: "1 | 2 | 3",
        enumValues: [1, 2, 3],
      },
      { name: "tags", required: true, kind: "array", typeText: "string[]" },
      { name: "scores", required: true, kind: "array", typeText: "Array<number>" },
      { name: "details", required: true, kind: "object", typeText: "ProductDetails" },
    ]);
  });

  it("extracts complete JSON-compatible destructuring defaults", () => {
    const result = expectAccepted(`
      interface ProductCardProps {
        title: string;
        count: number;
        featured: boolean;
        tags: string[];
        metadata: { tone: string; scores: number[]; nested: { active: boolean } };
      }

      export default function ProductCard({
        title = "Untitled",
        count = -1,
        featured = false,
        tags = ["new", "sale"],
        metadata = { tone: "calm", scores: [1, 2], nested: { active: true } },
      }: ProductCardProps) {
        return <article>{title} {count} {String(featured)} {tags.length} {metadata.tone}</article>;
      }
    `);

    expect(result.contract.props.map((prop) => [prop.name, prop.required, prop.defaultValue])).toEqual([
      ["title", false, "Untitled"],
      ["count", false, -1],
      ["featured", false, false],
      ["tags", false, ["new", "sale"]],
      [
        "metadata",
        false,
        { tone: "calm", scores: [1, 2], nested: { active: true } },
      ],
    ]);
  });

  it("uses optional markers independently of destructuring", () => {
    const result = expectAccepted(`
      interface ProductCardProps { title: string; subtitle?: string }
      export default function ProductCard({ title, subtitle }: ProductCardProps) {
        return <article>{title}<small>{subtitle}</small></article>;
      }
    `);

    expect(result.contract.props.map((prop) => prop.required)).toEqual([true, false]);
  });

  it("supports renamed destructured bindings", () => {
    const result = expectAccepted(`
      interface ProductCardProps { title: string }
      export default function ProductCard({ title: visibleTitle }: ProductCardProps) {
        return <article>{visibleTitle}</article>;
      }
    `);

    expect(result.contract.props[0]?.name).toBe("title");
  });
});

describe("analyzeComponentSource rejected props", () => {
  it.each([
    ["callback", "onSelect: (id: string) => void;"],
    ["ReactNode", "content: React.ReactNode;"],
    ["Date", "createdAt: Date;"],
    ["Map", "lookup: Map<string, number>;"],
    ["Set", "tags: Set<string>;"],
    ["Promise", "result: Promise<string>;"],
    ["symbol", "token: symbol;"],
    ["bigint", "count: bigint;"],
    ["any", "value: any;"],
    ["unknown", "value: unknown;"],
    ["non-literal union", "value: string | number;"],
    ["indexed access", "value: Model[\"value\"];"],
  ])("rejects %s props", (_label, propDeclaration) => {
    expectRejectedWith(
      `
        interface Model { value: string }
        interface ProductCardProps { ${propDeclaration} }
        export default function ProductCard(props: ProductCardProps) {
          return <article>{String(props)}</article>;
        }
      `,
      "UNSUPPORTED_PROP_TYPE",
    );
  });

  it("rejects imported prop types", () => {
    const result = expectRejectedWith(
      `
        import type { ProductCardProps } from "./product-card-types";
        export default function ProductCard(props: ProductCardProps) {
          return <article>{String(props)}</article>;
        }
      `,
      "UNSUPPORTED_PROP_TYPE",
    );
    expect(result.issues.map((issue) => issue.code)).toContain(
      "RELATIVE_IMPORT_NOT_ALLOWED",
    );
  });

  it("rejects intersection props declarations", () => {
    expectRejectedWith(
      `
        type ContentProps = { title: string };
        type VisualProps = { featured: boolean };
        type ProductCardProps = ContentProps & VisualProps;
        export default function ProductCard(props: ProductCardProps) {
          return <article>{props.title}</article>;
        }
      `,
      "UNSUPPORTED_PROP_TYPE",
    );
  });

  it("rejects inherited interfaces", () => {
    expectRejectedWith(
      `
        interface BaseProps { title: string }
        interface ProductCardProps extends BaseProps { featured: boolean }
        export default function ProductCard(props: ProductCardProps) {
          return <article>{String(props)}</article>;
        }
      `,
      "UNSUPPORTED_PROP_TYPE",
    );
  });

  it("rejects untyped JSX props", () => {
    expectRejectedWith(
      `
        export default function ProductCard(props) {
          return <article>{props.title}</article>;
        }
      `,
      "MISSING_PROPS_TYPE",
      "jsx",
    );
  });

  it.each([
    ["identifier", "DEFAULT_TITLE"],
    ["call", "createTitle()"],
    ["template", "`Product ${1}`"],
    ["spread", "[...DEFAULT_TAGS]"],
    ["undefined", "undefined"],
  ])("rejects an unsupported %s default", (_label, initializer) => {
    expectRejectedWith(
      `
        const DEFAULT_TITLE = "Product";
        const DEFAULT_TAGS = ["new"];
        function createTitle() { return "Product"; }
        interface ProductCardProps { title: string | "Product"; tags?: string[] }
        export default function ProductCard({ title = ${initializer} }: ProductCardProps) {
          return <article>{title}</article>;
        }
      `,
      "UNSUPPORTED_PROP_DEFAULT",
    );
  });

  it("rejects a duplicate prop name with a stable path", () => {
    const result = expectRejectedWith(
      `
        interface ProductCardProps { title: string; title: string }
        export default function ProductCard(props: ProductCardProps) {
          return <article>{props.title}</article>;
        }
      `,
      "DUPLICATE_PROP_NAME",
    );

    const issue = result.issues.find((entry) => entry.code === "DUPLICATE_PROP_NAME");
    expect(issue?.path?.[0]).toBe("componentCode");
    expect(issue?.path?.[1]).toEqual(expect.any(Number));
    expect(issue?.suggestion).toBeTruthy();
  });
});

