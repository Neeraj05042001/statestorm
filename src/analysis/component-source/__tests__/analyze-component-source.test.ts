import { describe, expect, it } from "vitest";

import { ComponentContractSchema } from "../../../domain";
import { analyzeComponentSource } from "../index";
import { expectAccepted, submission } from "./test-helpers";

describe("analyzeComponentSource supported component declarations", () => {
  it("analyzes a named default-exported function with interface props", () => {
    const result = expectAccepted(`
      import React from "react";

      interface ProductCardProps {
        title: string;
        rating?: number;
      }

      export default function ProductCard(props: ProductCardProps) {
        return <article><h2>{props.title}</h2><span>{props.rating}</span></article>;
      }
    `);

    expect(result.contract).toEqual({
      componentName: "ProductCard",
      exportStyle: "default",
      language: "tsx",
      imports: ["react"],
      props: [
        { name: "title", required: true, kind: "string", typeText: "string" },
        { name: "rating", required: false, kind: "number", typeText: "number" },
      ],
      warnings: [],
    });
  });

  it("resolves a separately default-exported named function", () => {
    const result = expectAccepted(`
      type ProductCardProps = { title: string };
      function ProductCard(props: ProductCardProps) {
        return <article>{props.title}</article>;
      }
      export default ProductCard;
    `);

    expect(result.contract.componentName).toBe("ProductCard");
  });

  it("resolves a separately default-exported arrow component", () => {
    const result = expectAccepted(`
      interface ProductCardProps { title: string }
      const ProductCard = (props: ProductCardProps) => {
        return <article>{props.title}</article>;
      };
      export default ProductCard;
    `);

    expect(result.contract.props[0]?.name).toBe("title");
  });

  it("supports React.FC<Props> with destructured props", () => {
    const result = expectAccepted(`
      import React from "react";
      interface ProductCardProps { title: string }
      const ProductCard: React.FC<ProductCardProps> = ({ title }) => {
        return <article>{title}</article>;
      };
      export default ProductCard;
    `);

    expect(result.contract.imports).toEqual(["react"]);
    expect(result.contract.props).toHaveLength(1);
  });

  it("supports an imported FC<Props> alias", () => {
    const result = expectAccepted(`
      import type { FC as ReactFunction } from "react";
      type ProductCardProps = { title: string };
      const ProductCard: ReactFunction<ProductCardProps> = ({ title }) => (
        <article>{title}</article>
      );
      export default ProductCard;
    `);

    expect(result.contract.componentName).toBe("ProductCard");
  });

  it("supports imported FunctionComponent<Props>", () => {
    const result = expectAccepted(`
      import { FunctionComponent } from "react";
      interface ProductCardProps { title: string }
      const ProductCard: FunctionComponent<ProductCardProps> = ({ title }) => (
        <article>{title}</article>
      );
      export default ProductCard;
    `);

    expect(result.contract.props[0]?.kind).toBe("string");
  });

  it("accepts a component with no props", () => {
    const result = expectAccepted(`
      export default function ProductCard() {
        return <article>Static product</article>;
      }
    `);

    expect(result.contract.props).toEqual([]);
  });

  it("accepts a JSX component with no props", () => {
    const result = expectAccepted(
      `
        export default function ProductCard() {
          return <article>Static JSX product</article>;
        }
      `,
      "jsx",
    );

    expect(result.contract.language).toBe("jsx");
    expect(result.contract.props).toEqual([]);
  });

  it("analyzes an inline object props declaration", () => {
    const result = expectAccepted(`
      export default function ProductCard(props: { title: string; featured: boolean }) {
        return <article data-featured={props.featured}>{props.title}</article>;
      }
    `);

    expect(result.contract.props.map((prop) => prop.name)).toEqual([
      "title",
      "featured",
    ]);
  });

  it("preserves prop order from a local type alias", () => {
    const result = expectAccepted(`
      type ProductCardProps = {
        title: string;
        count: number;
        featured?: boolean;
      };
      const ProductCard = (props: ProductCardProps) => (
        <article>{props.title} {props.count} {String(props.featured)}</article>
      );
      export default ProductCard;
    `);

    expect(result.contract.props.map((prop) => prop.name)).toEqual([
      "title",
      "count",
      "featured",
    ]);
  });

  it("returns output accepted by ComponentContractSchema", () => {
    const result = expectAccepted(`
      interface ProductCardProps { title: string }
      export default function ProductCard({ title }: ProductCardProps) {
        return <article>{title}</article>;
      }
    `);

    expect(ComponentContractSchema.safeParse(result.contract).success).toBe(true);
  });

  it("returns identical output for identical input", () => {
    const input = submission(`
      interface ProductCardProps { title: string; count?: number }
      export default function ProductCard(props: ProductCardProps) {
        return <article>{props.title} {props.count}</article>;
      }
    `);

    expect(analyzeComponentSource(input)).toEqual(analyzeComponentSource(input));
  });
});

