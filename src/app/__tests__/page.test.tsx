import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import Home from "../page";
import PreflightPage from "../preflight/page";

function renderHomepageFooter() {
  const html = renderToStaticMarkup(<Home />);
  const footer = html.match(/<footer[\s\S]*<\/footer>/)?.[0];

  if (!footer) throw new Error("Expected the homepage footer to render");
  return footer;
}

describe("public product pages", () => {
  it("renders the approved positioning and supporting principle", () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain("AI builds the happy path.");
    expect(html).toContain("StateStorm</strong> reveals");
    expect(html).toContain("what it forgot.");
    expect(html).toContain(
      "AI proposes. Deterministic browser evidence decides.",
    );
  });

  it("links the hero and header to the verified live demo", () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain('href="/preflight?demo=1"');
    expect(html).toContain("Run the live demo");
    expect(html).toContain("Load live demo");
  });

  it("links to the public StateStorm GitHub repository", () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain(
      'href="https://github.com/Neeraj05042001/statestorm"',
    );
    expect(html).toContain("View source on GitHub");
  });

  it("names the four implemented evidence categories", () => {
    const html = renderToStaticMarkup(<Home />);

    ["Runtime crash", "Blank render", "Possible overflow", "Broken image"].forEach(
      (category) => expect(html).toContain(category),
    );
  });

  it("renders the complete six-stage workflow", () => {
    const html = renderToStaticMarkup(<Home />);
    const stages = [
      "Prompt + component",
      "Contract analysis",
      "AI + boundary states",
      "Validated RunPlan",
      "Isolated execution",
      "State Atlas",
    ];

    stages.forEach((stage) => expect(html).toContain(stage));
  });

  it("states the AI authority boundary without a fabricated verdict", () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain("AI makes it relevant.");
    expect(html).toContain("Evidence makes it trustworthy.");
    expect(html).toContain(
      "AI never declares whether the component passed.",
    );
  });

  it("renders all approved technical metrics with precise server wording", () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain("12</dt><dd>maximum prioritized states");
    expect(html).toContain("271</dt><dd>passing tests");
    expect(html).toContain("1</dt><dd>serialized active execution");
    expect(html).toContain(
      "0</dt><dd>submitted source executed by the server",
    );
  });

  it("states the supported component scope", () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain("self-contained TSX/JSX");
    expect(html).toContain("locally declared, JSON-serializable props");
  });

  it("does not advertise unimplemented capabilities", () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).not.toContain("automatic fixing");
    expect(html).not.toContain("production certification");
    expect(html).not.toContain("visual baselines");
    expect(html).not.toContain("screenshot capture");
  });

  it("removes copy that conflicts with the premium homepage", () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).not.toContain("Adversarial UI preflight");
    expect(html).not.toContain("Launch StateStorm");
    expect(html).not.toContain("MVP capabilities");
    expect(html).not.toContain("Focused MVP capabilities");
    expect(html).not.toContain("The first render is rarely the whole story");
    expect(html).not.toContain(
      "Gate 0 is implemented and awaiting architecture review",
    );
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

describe("homepage footer", () => {
  it("renders the StateStorm footer brand and product description", () => {
    const footer = renderHomepageFooter();

    expect(footer).toContain('aria-label="StateStorm footer"');
    expect(footer).toContain("StateStorm");
    expect(footer).toContain(
      "Adversarial preflight for supported React components.",
    );
  });

  it("links the footer demo action to the verified route", () => {
    const footer = renderHomepageFooter();

    expect(footer).toContain('href="/preflight?demo=1"');
    expect(footer).toContain("Run live demo");
  });

  it("links GitHub externally and safely", () => {
    const footer = renderHomepageFooter();

    expect(footer).toContain(
      'href="https://github.com/Neeraj05042001/statestorm"',
    );
    expect(footer).toContain('target="_blank"');
    expect(footer).toContain('rel="noreferrer"');
    expect(footer).toContain("GitHub (opens in a new tab)");
  });

  it("links the public documentation, limitations, and acknowledgements", () => {
    const footer = renderHomepageFooter();

    expect(footer).toContain(
      'href="https://github.com/Neeraj05042001/statestorm/tree/main/docs"',
    );
    expect(footer).toContain(
      'href="https://github.com/Neeraj05042001/statestorm/blob/main/docs/KNOWN_LIMITATIONS.md"',
    );
    expect(footer).toContain(
      'href="https://github.com/Neeraj05042001/statestorm/blob/main/docs/submission/THIRD_PARTY_ACKNOWLEDGEMENTS.md"',
    );
  });

  it("renders the complete footer trust line", () => {
    const footer = renderHomepageFooter();

    expect(footer).toContain("No sign-up");
    expect(footer).toContain("Inputs are not persisted");
    expect(footer).toContain("Deterministic fallback");
  });

  it("credits the human builder", () => {
    const footer = renderHomepageFooter();

    expect(footer).toContain("© 2026 StateStorm · Built by Neeraj Kumar");
  });

  it("closes with the accepted AI authority principle", () => {
    const footer = renderHomepageFooter();

    expect(footer).toContain(
      "AI proposes. Deterministic browser evidence decides.",
    );
  });
});
