import { describe, expect, it } from "vitest";

import {
  createFixtureDataFile,
  createRunPlanSandboxFiles,
} from "../create-runplan-sandbox-files";

const fixture = {
  id: "fixture-quotes",
  label: "Quoted values",
  origin: "manual" as const,
  intent: "Prove JSON-only fixture construction.",
  props: {
    title: "A quote: \" and a closing tag: </script>",
    count: 0,
  },
};

const input = {
  sessionId: "session-one",
  runId: "run-one",
  fixtureId: fixture.id,
  nonce: "nonce-one",
  fixture,
  componentSource:
    "export default function Card({ title }) { return <p>{title}</p>; }",
  language: "jsx" as const,
};

describe("RunPlan Sandpack virtual files", () => {
  it("keeps submitted source in its own inert virtual file", () => {
    const files = createRunPlanSandboxFiles(input);
    const submittedFile = files["/src/SubmittedComponent.tsx"];
    const appFile = files["/src/App.tsx"];
    const submittedCode =
      typeof submittedFile === "string" ? submittedFile : submittedFile?.code;
    const appCode = typeof appFile === "string" ? appFile : appFile?.code;

    expect(submittedCode).toBe(input.componentSource);
    expect(appCode).not.toContain(input.componentSource);
    expect(Object.keys(files)).toEqual(
      expect.arrayContaining([
        "/src/SubmittedComponent.tsx",
        "/src/fixture-data.ts",
        "/src/runtime-bridge.tsx",
        "/src/App.tsx",
      ]),
    );
  });

  it("serializes fixture props as trusted JSON data", () => {
    const source = createFixtureDataFile(input);

    expect(source).toContain("const serializedFixture =");
    expect(source).toContain("JSON.parse");
    expect(source).not.toContain("eval(");
    expect(source).not.toContain("new Function");
  });

  it("creates a fresh correlated fixture file for every run", () => {
    const first = createFixtureDataFile(input);
    const second = createFixtureDataFile({ ...input, runId: "run-two" });

    expect(first).not.toBe(second);
    expect(first).toContain("run-one");
    expect(second).toContain("run-two");
  });

  it("runs bounded overflow and broken-image detectors inside the sandbox", () => {
    const files = createRunPlanSandboxFiles(input);
    const runtimeFile = files["/src/runtime-bridge.tsx"];
    const runtimeSource =
      typeof runtimeFile === "string" ? runtimeFile : runtimeFile?.code ?? "";

    expect(runtimeSource).toContain('type: "DETECTOR_EVIDENCE"');
    expect(runtimeSource).toContain("DETECTOR_SETTLE_MS = 750");
    expect(runtimeSource).toContain("scrollWidth > htmlElement.clientWidth");
    expect(runtimeSource).toContain("image.complete");
    expect(runtimeSource).toContain("image.naturalWidth !== 0");
    expect(runtimeSource).toContain("MAX_FINDINGS_PER_DETECTOR = 5");
    expect(runtimeSource).not.toContain("innerHTML");
    expect(runtimeSource).not.toContain("image.src");
  });
});
