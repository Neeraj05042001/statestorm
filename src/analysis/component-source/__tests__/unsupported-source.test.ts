import { describe, expect, it } from "vitest";

import { analyzeComponentSource } from "../index";
import { expectRejectedWith, submission } from "./test-helpers";

describe("analyzeComponentSource syntax and imports", () => {
  it("rejects source syntax errors without exposing TypeScript diagnostics", () => {
    const result = expectRejectedWith(
      `
        export default function ProductCard() {
          return <article>Broken</div>;
        }
      `,
      "SOURCE_SYNTAX_ERROR",
    );

    const issue = result.issues[0];
    expect(issue?.path?.[0]).toBe("componentCode");
    expect(issue).not.toHaveProperty("file");
    expect(issue).not.toHaveProperty("start");
  });

  it.each([
    ["package", 'import lodash from "lodash";', "UNSUPPORTED_IMPORT"],
    ["relative", 'import Badge from "./Badge";', "RELATIVE_IMPORT_NOT_ALLOWED"],
    ["alias", 'import Badge from "@/components/Badge";', "ALIAS_IMPORT_NOT_ALLOWED"],
    ["side effect", 'import "react";', "UNSUPPORTED_IMPORT"],
  ])("rejects a %s import", (_label, importSource, issueCode) => {
    expectRejectedWith(
      `
        ${importSource}
        export default function ProductCard() {
          return <article>Product</article>;
        }
      `,
      issueCode,
    );
  });

  it("rejects dynamic import()", () => {
    expectRejectedWith(
      `
        export default function ProductCard() {
          void import("react");
          return <article>Product</article>;
        }
      `,
      "DYNAMIC_IMPORT_NOT_ALLOWED",
    );
  });

  it("rejects require()", () => {
    expectRejectedWith(
      `
        export default function ProductCard() {
          const React = require("react");
          return <article>{String(React)}</article>;
        }
      `,
      "REQUIRE_NOT_ALLOWED",
    );
  });

  it("rejects re-exported dependencies", () => {
    expectRejectedWith(
      `
        export { default as Badge } from "./Badge";
        export default function ProductCard() {
          return <article>Product</article>;
        }
      `,
      "UNSUPPORTED_IMPORT",
    );
  });

  it("records allowed modules once in source order", () => {
    const result = analyzeComponentSource(
      submission(`
        import React from "react";
        import type { FC } from "react";
        import { jsx } from "react/jsx-runtime";
        interface Props { title: string }
        const ProductCard: FC<Props> = ({ title }) => <article>{title}{String(jsx)}</article>;
        export default ProductCard;
      `),
    );

    expect(result.accepted).toBe(true);
    if (result.accepted) {
      expect(result.contract.imports).toEqual(["react", "react/jsx-runtime"]);
    }
  });
});

describe("analyzeComponentSource default component resolution", () => {
  it("rejects a missing default export", () => {
    expectRejectedWith(
      `export function ProductCard() { return <article>Product</article>; }`,
      "MISSING_DEFAULT_EXPORT",
    );
  });

  it("rejects an unresolved default-export identifier", () => {
    expectRejectedWith(
      `export default ProductCard;`,
      "UNRESOLVED_DEFAULT_EXPORT",
    );
  });

  it.each([
    ["anonymous function", "export default function () { return <article>Product</article>; }"],
    ["anonymous arrow", "export default () => <article>Product</article>;"],
  ])("rejects an %s", (_label, source) => {
    expectRejectedWith(source, "ANONYMOUS_COMPONENT_NOT_ALLOWED");
  });

  it("rejects a class component", () => {
    expectRejectedWith(
      `
        import React from "react";
        export default class ProductCard extends React.Component {
          render() { return <article>Product</article>; }
        }
      `,
      "CLASS_COMPONENT_NOT_SUPPORTED",
    );
  });

  it("rejects a generic component", () => {
    expectRejectedWith(
      `
        interface ProductCardProps { title: string }
        export default function ProductCard<T>(props: ProductCardProps) {
          return <article>{props.title}{String(null as T)}</article>;
        }
      `,
      "GENERIC_COMPONENT_NOT_SUPPORTED",
    );
  });

  it("rejects a component with multiple parameters", () => {
    expectRejectedWith(
      `
        interface ProductCardProps { title: string }
        function ProductCard(props: ProductCardProps, ref: object) {
          return <article>{props.title}{String(ref)}</article>;
        }
        export default ProductCard;
      `,
      "MULTIPLE_COMPONENT_PARAMETERS",
    );
  });

  it.each([
    ["memo wrapper", "memo(ProductCard)"],
    ["forwardRef wrapper", "forwardRef(ProductCard)"],
    ["higher-order wrapper", "withTheme(ProductCard)"],
    ["default expression", "condition ? ProductCard : OtherCard"],
  ])("rejects a %s default export", (_label, expression) => {
    expectRejectedWith(
      `
        interface ProductCardProps { title: string }
        function ProductCard(props: ProductCardProps) { return <article>{props.title}</article>; }
        function OtherCard(props: ProductCardProps) { return <article>{props.title}</article>; }
        const condition = true;
        declare function memo<T>(value: T): T;
        declare function forwardRef<T>(value: T): T;
        declare function withTheme<T>(value: T): T;
        export default ${expression};
      `,
      "UNSUPPORTED_DEFAULT_EXPORT",
    );
  });

  it("rejects namespace declarations", () => {
    expectRejectedWith(
      `
        namespace ProductData { export const title = "Product"; }
        export default function ProductCard() {
          return <article>{ProductData.title}</article>;
        }
      `,
      "UNSUPPORTED_SOURCE_DECLARATION",
    );
  });

  it("rejects invalid runtime input through the submission schema", () => {
    const result = analyzeComponentSource({
      id: "invalid id",
      prompt: "",
      componentCode: "",
      language: "tsx",
    });

    expect(result.accepted).toBe(false);
    expect(result.issues.every((issue) => issue.code === "CONTRACT_VALIDATION_FAILED")).toBe(true);
  });
});

