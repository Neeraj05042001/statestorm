import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import Home from "../page";
import PreflightPage from "../preflight/page";

describe("public product pages", () => {
  it("renders the homepage hero and primary product calls to action", () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain(
      "AI builds the happy path. StateStorm reveals what it forgot.",
    );
    expect(html).toContain('href="/preflight"');
    expect(html).toContain("Launch StateStorm");
    expect(html).toContain('href="/preflight?demo=1"');
    expect(html).toContain("Load demo");
    expect(html).not.toContain(
      "Gate 0 is implemented and awaiting architecture review",
    );
  });

  it("states the supported component scope without unsupported claims", () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain("Self-contained React TSX/JSX");
    expect(html).toContain("locally declared JSON-serializable props");
    expect(html).toContain(
      "Callback props and imported prop types are not yet supported",
    );
    expect(html).not.toContain("production certification</span>");
  });

  it("lists only the implemented MVP capabilities", () => {
    const html = renderToStaticMarkup(<Home />);
    const capabilities = [
      "Prompt-derived semantic states",
      "Deterministic boundary states",
      "Isolated serial execution",
      "Runtime-error detection",
      "Blank-render detection",
      "Overflow warnings",
      "Broken-image findings",
      "Live state inspection",
    ];

    expect(html).toContain("MVP capabilities");
    expect(html).not.toContain("Implemented today");
    capabilities.forEach((capability) => expect(html).toContain(capability));
    expect(html).not.toContain("automatic fixing");
    expect(html).not.toContain("requirement pass/fail");
  });

  it("renders final preflight language and the demo query with populated input", async () => {
    const normalPage = await PreflightPage({ searchParams: Promise.resolve({}) });
    const demoPage = await PreflightPage({
      searchParams: Promise.resolve({ demo: "1" }),
    });
    const normalHtml = renderToStaticMarkup(normalPage);
    const demoHtml = renderToStaticMarkup(demoPage);

    expect(normalHtml).toContain("StateStorm Preflight");
    expect(normalHtml).toContain("Plan component states");
    expect(normalHtml).not.toContain("Gate 4 State Atlas diagnostic");
    expect(demoHtml).toContain("Demo example loaded");
    expect(demoHtml).toContain("AtlasProductCard");
  });
});
