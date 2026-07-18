import type { SandpackFiles } from "@codesandbox/sandpack-react";

import { FixtureSchema, type Fixture } from "../../domain";
import type { RuntimeFixtureCorrelation } from "./runtime-protocol";

export interface RunPlanSandboxFileInput extends RuntimeFixtureCorrelation {
  fixture: Fixture;
  componentSource: string;
  language: "tsx" | "jsx";
}

const RUNTIME_BRIDGE_SOURCE = String.raw`import {
  Component,
  useEffect,
  type ErrorInfo,
  type ReactNode,
} from "react";

import { currentFixture } from "./fixture-data";

const EVENT_SOURCE = "statestorm-sandbox" as const;
const PROTOCOL_VERSION = 1 as const;
const ROOT_ID = "statestorm-fixture-root";
const MAX_ERROR_NAME_LENGTH = 120;
const MAX_ERROR_MESSAGE_LENGTH = 1000;
const MAX_RENDERED_TEXT_LENGTH = 20000;
const DETECTOR_SETTLE_MS = 750;
const OVERFLOW_TOLERANCE_PX = 2;
const MAX_INSPECTED_ELEMENTS = 200;
const MAX_INSPECTED_IMAGES = 100;
const MAX_FINDINGS_PER_DETECTOR = 5;
const MEANINGFUL_TAGS = new Set([
  "BUTTON",
  "CANVAS",
  "IMG",
  "INPUT",
  "METER",
  "PROGRESS",
  "SELECT",
  "SVG",
  "TEXTAREA",
  "VIDEO",
]);

type RuntimeErrorDetails = {
  name: string;
  message: string;
};

function truncate(value: string, maximumLength: number): string {
  return value.slice(0, maximumLength);
}

function normalizeError(value: unknown): RuntimeErrorDetails {
  if (value instanceof Error) {
    return {
      name: truncate(value.name || "Error", MAX_ERROR_NAME_LENGTH),
      message: truncate(
        value.message || "Unknown runtime error",
        MAX_ERROR_MESSAGE_LENGTH,
      ),
    };
  }

  return {
    name: "Error",
    message: truncate(String(value), MAX_ERROR_MESSAGE_LENGTH),
  };
}

function baseEvent() {
  return {
    source: EVENT_SOURCE,
    protocolVersion: PROTOCOL_VERSION,
    sessionId: currentFixture.sessionId,
    runId: currentFixture.runId,
    fixtureId: currentFixture.fixtureId,
    nonce: currentFixture.nonce,
  };
}

function postEvent(event: Record<string, unknown>): void {
  const serializedEvent = JSON.parse(JSON.stringify(event)) as Record<
    string,
    unknown
  >;
  window.parent.postMessage(serializedEvent, "*");
}

function isVisiblyRendered(element: Element): boolean {
  const htmlElement = element as HTMLElement;
  const styles = window.getComputedStyle(htmlElement);
  const rectangle = htmlElement.getBoundingClientRect();
  return (
    rectangle.width > 0 &&
    rectangle.height > 0 &&
    styles.display !== "none" &&
    styles.visibility !== "hidden" &&
    styles.opacity !== "0"
  );
}

function collectRenderEvidence() {
  const root = document.getElementById(ROOT_ID);
  const renderedText = root?.textContent?.trim() ?? "";
  const expectedDomFound =
    root !== null &&
    root.dataset.sessionId === currentFixture.sessionId &&
    root.dataset.runId === currentFixture.runId &&
    root.dataset.fixtureId === currentFixture.fixtureId;
  const meaningfulElementFound = root
    ? Array.from(root.querySelectorAll("*")).some((element) => {
        if (!isVisiblyRendered(element)) return false;
        const styles = window.getComputedStyle(element);
        return (
          (element.textContent?.trim().length ?? 0) > 0 ||
          MEANINGFUL_TAGS.has(element.tagName) ||
          styles.backgroundImage !== "none"
        );
      })
    : false;

  return {
    renderedRootChildCount: root?.childElementCount ?? 0,
    renderedTextLength: Math.min(
      renderedText.length,
      MAX_RENDERED_TEXT_LENGTH,
    ),
    expectedDomFound,
    meaningfulDomFound:
      expectedDomFound && (renderedText.length > 0 || meaningfulElementFound),
  };
}

function elementHint(element: Element): string | undefined {
  const testId = element
    .getAttribute("data-testid")
    ?.trim()
    .replace(/[^A-Za-z0-9_.-]/g, "")
    .slice(0, 96);
  if (testId) return '[data-testid="' + testId + '"]';
  const id = element.id
    .trim()
    .replace(/[^A-Za-z0-9_.-]/g, "")
    .slice(0, 120);
  return id ? '#' + id : undefined;
}

function boundedDimension(value: number): number {
  return Math.min(10000000, Math.max(0, Math.round(value)));
}

function overflowObservation(element: Element) {
  if (!isVisiblyRendered(element)) return null;
  if (element.closest('[data-statestorm-infrastructure="true"]')) return null;
  const htmlElement = element as HTMLElement;
  if (htmlElement.clientWidth <= 0 || htmlElement.clientHeight <= 0) return null;
  const horizontal =
    htmlElement.scrollWidth > htmlElement.clientWidth + OVERFLOW_TOLERANCE_PX;
  const vertical =
    htmlElement.scrollHeight > htmlElement.clientHeight + OVERFLOW_TOLERANCE_PX;
  if (!horizontal && !vertical) return null;

  return {
    kind: "layout-overflow",
    evidence: {
      detector: "overflow-v1",
      elementTag: element.tagName.slice(0, 32),
      ...(elementHint(element) ? { elementHint: elementHint(element) } : {}),
      axis: horizontal && vertical ? "both" : horizontal ? "horizontal" : "vertical",
      clientWidth: boundedDimension(htmlElement.clientWidth),
      scrollWidth: boundedDimension(htmlElement.scrollWidth),
      clientHeight: boundedDimension(htmlElement.clientHeight),
      scrollHeight: boundedDimension(htmlElement.scrollHeight),
    },
  };
}

function collectOverflowObservations(root: HTMLElement) {
  const observations: Record<string, unknown>[] = [];
  const candidates = [
    root,
    ...Array.from(root.querySelectorAll("*")).slice(0, MAX_INSPECTED_ELEMENTS - 1),
  ];

  for (const candidate of candidates) {
    const observation = overflowObservation(candidate);
    if (observation) observations.push(observation);
    if (observations.length >= MAX_FINDINGS_PER_DETECTOR) break;
  }
  return observations;
}

function imageSourceKind(source: string | null) {
  const normalized = source?.trim() ?? "";
  if (!normalized) return "empty";
  if (normalized.toLowerCase().startsWith("data:")) return "data";
  if (/^(?:https?:)?\/\//i.test(normalized)) return "external";
  return "relative";
}

function collectBrokenImageObservations(root: HTMLElement) {
  const observations: Record<string, unknown>[] = [];
  const images = Array.from(root.querySelectorAll("img")).slice(
    0,
    MAX_INSPECTED_IMAGES,
  );

  for (const image of images) {
    if (!image.complete || image.naturalWidth !== 0) continue;
    observations.push({
      kind: "broken-image",
      evidence: {
        detector: "broken-image-v1",
        elementTag: "IMG",
        ...(elementHint(image) ? { elementHint: elementHint(image) } : {}),
        imageAltPresent: image.alt.trim().length > 0,
        imageSourceKind: imageSourceKind(image.getAttribute("src")),
      },
    });
    if (observations.length >= MAX_FINDINGS_PER_DETECTOR) break;
  }
  return observations;
}

function collectDetectorPayload() {
  const root = document.getElementById(ROOT_ID);
  if (!root) {
    return {
      observations: [],
      warnings: ["Visual detectors could not find the correlated fixture root."],
    };
  }

  const observations: Record<string, unknown>[] = [];
  const warnings: string[] = [];
  try {
    observations.push(...collectOverflowObservations(root));
  } catch {
    warnings.push("The layout detector was unavailable for this fixture.");
  }
  try {
    observations.push(...collectBrokenImageObservations(root));
  } catch {
    warnings.push("The image detector was unavailable for this fixture.");
  }
  return { observations, warnings };
}

function RenderCommitReporter() {
  useEffect(() => {
    let detectorTimeoutId: number | undefined;
    const timeoutId = window.setTimeout(() => {
      const evidence = collectRenderEvidence();
      postEvent({
        ...baseEvent(),
        type: "RENDER_COMMITTED",
        evidence,
      });

      if (evidence.expectedDomFound && evidence.meaningfulDomFound) {
        detectorTimeoutId = window.setTimeout(() => {
          const detectorPayload = collectDetectorPayload();
          postEvent({
            ...baseEvent(),
            type: "DETECTOR_EVIDENCE",
            observations: detectorPayload.observations,
            warnings: detectorPayload.warnings,
          });
        }, DETECTOR_SETTLE_MS);
      }
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      if (detectorTimeoutId !== undefined) {
        window.clearTimeout(detectorTimeoutId);
      }
    };
  }, []);

  return null;
}

interface RuntimeErrorBoundaryState {
  error: RuntimeErrorDetails | null;
}

class RuntimeErrorBoundary extends Component<
  { children: ReactNode },
  RuntimeErrorBoundaryState
> {
  state: RuntimeErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): RuntimeErrorBoundaryState {
    return { error: normalizeError(error) };
  }

  componentDidCatch(error: unknown, _errorInfo: ErrorInfo): void {
    postEvent({
      ...baseEvent(),
      type: "RUNTIME_ERROR",
      error: normalizeError(error),
    });
  }

  render() {
    if (this.state.error) {
      return (
        <section className="runtime-fallback" role="alert">
          <strong>Sandbox runtime error</strong>
          <p>{this.state.error.message}</p>
        </section>
      );
    }

    return this.props.children;
  }
}

export function RuntimeBridge({ children }: { children: ReactNode }) {
  return (
    <RuntimeErrorBoundary key={currentFixture.runId}>
      {children}
      <RenderCommitReporter />
    </RuntimeErrorBoundary>
  );
}
`;

const APP_SOURCE = String.raw`import type { ComponentType } from "react";

import SubmittedComponent from "./SubmittedComponent";
import { currentFixture } from "./fixture-data";
import { RuntimeBridge } from "./runtime-bridge";
import "../styles.css";

const FixtureComponent = SubmittedComponent as ComponentType<
  Record<string, unknown>
>;

export default function App() {
  return (
    <RuntimeBridge>
      <main
        id="statestorm-fixture-root"
        data-session-id={currentFixture.sessionId}
        data-run-id={currentFixture.runId}
        data-fixture-id={currentFixture.fixtureId}
      >
        <FixtureComponent {...currentFixture.props} />
      </main>
    </RuntimeBridge>
  );
}
`;

const INDEX_SOURCE = String.raw`import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./src/App";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("StateStorm sandbox root element was not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`;

const HTML_SOURCE = String.raw`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>StateStorm fixture preview</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`;

const STYLES_SOURCE = String.raw`:root {
  color: #0f172a;
  background: #f8fafc;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}

* { box-sizing: border-box; }
body { margin: 0; min-height: 100vh; padding: 20px; }
#statestorm-fixture-root { display: block; min-height: 1px; }
.runtime-fallback {
  border: 1px solid #fca5a5;
  border-radius: 10px;
  background: #fff1f2;
  color: #991b1b;
  padding: 16px;
}
`;

export function createFixtureDataFile(
  input: RuntimeFixtureCorrelation & { fixture: Fixture },
): string {
  const fixture = FixtureSchema.parse(input.fixture);
  const serializedFixture = JSON.stringify({
    sessionId: input.sessionId,
    runId: input.runId,
    fixtureId: fixture.id,
    nonce: input.nonce,
    props: fixture.props,
  });

  return `interface CurrentFixture {
  sessionId: string;
  runId: string;
  fixtureId: string;
  nonce: string;
  props: Record<string, unknown>;
}

const serializedFixture = ${JSON.stringify(serializedFixture)};

export const currentFixture = JSON.parse(
  serializedFixture,
) as CurrentFixture;
`;
}

export function createRunPlanSandboxFiles(
  input: RunPlanSandboxFileInput,
): SandpackFiles {
  return {
    "/src/SubmittedComponent.tsx": {
      code: input.componentSource,
      active: true,
      readOnly: true,
    },
    "/src/fixture-data.ts": {
      code: createFixtureDataFile(input),
      hidden: false,
      readOnly: true,
    },
    "/src/runtime-bridge.tsx": {
      code: RUNTIME_BRIDGE_SOURCE,
      hidden: false,
      readOnly: true,
    },
    "/src/App.tsx": {
      code: APP_SOURCE,
      hidden: false,
      readOnly: true,
    },
    "/index.tsx": {
      code: INDEX_SOURCE,
      hidden: true,
      readOnly: true,
    },
    "/public/index.html": {
      code: HTML_SOURCE,
      hidden: true,
      readOnly: true,
    },
    "/styles.css": {
      code: STYLES_SOURCE,
      hidden: true,
      readOnly: true,
    },
  };
}
