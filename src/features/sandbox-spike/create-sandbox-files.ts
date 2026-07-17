import type { SandpackFiles } from "@codesandbox/sandpack-react";

import type { SandboxRun } from "./protocol";

export const USER_COMPONENT_SOURCE = String.raw`import type { ReactNode } from "react";

export interface SampleCardProps {
  title: string;
  description: string;
  shouldCrash?: boolean;
  footer?: ReactNode;
}

export default function SampleCard({
  title,
  description,
  shouldCrash = false,
}: SampleCardProps) {
  if (shouldCrash) {
    throw new Error("Deliberate Gate 0 runtime failure");
  }

  return (
    <article
      className="sample-card"
      data-statestorm-diagnostic-card="true"
    >
      <p className="eyebrow">Isolated sample component</p>
      <h2>{title}</h2>
      <p>{description}</p>
    </article>
  );
}
`;

export const INVALID_USER_COMPONENT_SOURCE = String.raw`export default function SampleCard() {
  return <article>Deliberately invalid Gate 0 compilation probe;
}
`;

const RUNTIME_BRIDGE_SOURCE = String.raw`import {
  Component,
  useEffect,
  type ErrorInfo,
  type ReactNode,
} from "react";

import { currentFixture } from "./current-fixture";

const EVENT_SOURCE = "statestorm-sandbox" as const;
const PROTOCOL_VERSION = 1 as const;
const DIAGNOSTIC_ROOT_ID = "statestorm-diagnostic-root";
const DIAGNOSTIC_MARKER_SELECTOR =
  '[data-statestorm-diagnostic-card="true"]';
const MAX_ERROR_NAME_LENGTH = 120;
const MAX_ERROR_MESSAGE_LENGTH = 1000;
const MAX_ERROR_STACK_LENGTH = 4000;
const MAX_RESOURCE_ORIGINS = 20;

type RuntimeErrorDetails = {
  name: string;
  message: string;
  stack?: string;
};

type VisibleRenderEvidence = {
  renderedRootChildCount: number;
  renderedTextLength: number;
  diagnosticMarkerPresent: boolean;
  expectedTitlePresent: boolean;
  expectedDescriptionPresent: boolean;
  hasLayoutBox: boolean;
};

function truncate(value: string, maximumLength: number): string {
  return value.slice(0, maximumLength);
}

function normalizeError(value: unknown): RuntimeErrorDetails {
  if (value instanceof Error) {
    return {
      name: truncate(value.name || "Error", MAX_ERROR_NAME_LENGTH),
      message: truncate(value.message || "Unknown runtime error", MAX_ERROR_MESSAGE_LENGTH),
      ...(value.stack
        ? { stack: truncate(value.stack, MAX_ERROR_STACK_LENGTH) }
        : {}),
    };
  }

  return {
    name: "Error",
    message: truncate(String(value), MAX_ERROR_MESSAGE_LENGTH),
  };
}

function postEvent(event: Record<string, unknown>): void {
  const serializableEvent = JSON.parse(JSON.stringify(event)) as Record<
    string,
    unknown
  >;
  window.parent.postMessage(serializableEvent, "*");
}

function baseEvent(): Record<string, unknown> {
  return {
    source: EVENT_SOURCE,
    protocolVersion: PROTOCOL_VERSION,
    nonce: currentFixture.nonce,
    runId: currentFixture.runId,
    fixtureId: currentFixture.fixtureId,
    componentMode: currentFixture.componentMode,
  };
}

function collectVisibleRenderEvidence(): VisibleRenderEvidence {
  const root = document.getElementById(DIAGNOSTIC_ROOT_ID);
  const marker = root?.querySelector<HTMLElement>(DIAGNOSTIC_MARKER_SELECTOR);
  const renderedText = root?.textContent?.trim() ?? "";
  const markerStyles = marker ? window.getComputedStyle(marker) : null;
  const markerRectangle = marker?.getBoundingClientRect();

  return {
    renderedRootChildCount: root?.childElementCount ?? 0,
    renderedTextLength: renderedText.length,
    diagnosticMarkerPresent: marker !== null && marker !== undefined,
    expectedTitlePresent: renderedText.includes(currentFixture.props.title),
    expectedDescriptionPresent: renderedText.includes(
      currentFixture.props.description,
    ),
    hasLayoutBox:
      Boolean(markerRectangle) &&
      Number(markerRectangle?.width) > 0 &&
      Number(markerRectangle?.height) > 0 &&
      markerStyles?.display !== "none" &&
      markerStyles?.visibility !== "hidden" &&
      markerStyles?.opacity !== "0",
  };
}

function hasConfirmedVisibleRender(evidence: VisibleRenderEvidence): boolean {
  return (
    evidence.renderedRootChildCount > 0 &&
    evidence.renderedTextLength > 0 &&
    evidence.diagnosticMarkerPresent &&
    evidence.expectedTitlePresent &&
    evidence.expectedDescriptionPresent &&
    evidence.hasLayoutBox
  );
}

function collectReadyEvidence(evidence: VisibleRenderEvidence) {
  let parentDomAccess: "accessible" | "blocked" = "blocked";

  try {
    void window.parent.document.documentElement;
    parentDomAccess = "accessible";
  } catch {
    parentDomAccess = "blocked";
  }

  const resourceOrigins = Array.from(
    new Set(
      performance.getEntriesByType("resource").flatMap((entry) => {
        try {
          return [new URL(entry.name).origin];
        } catch {
          return [];
        }
      }),
    ),
  ).slice(0, MAX_RESOURCE_ORIGINS);

  return {
    ...evidence,
    parentDomAccess,
    runtimeOrigin: window.location.origin,
    resourceOrigins,
  };
}

function RenderEvidenceReporter() {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const evidence = collectVisibleRenderEvidence();

      if (!hasConfirmedVisibleRender(evidence)) {
        postEvent({
          ...baseEvent(),
          type: "RENDER_EVIDENCE_MISSING",
          evidence,
          message:
            "The diagnostic root did not contain the expected visible fixture output.",
        });
        return;
      }

      if (
        currentFixture.componentMode === "bootstrap" ||
        currentFixture.componentMode === "recovery-bootstrap"
      ) {
        postEvent({
          ...baseEvent(),
          type: "SANDBOX_READY",
          evidence: collectReadyEvidence(evidence),
        });
        return;
      }

      if (currentFixture.componentMode === "valid") {
        postEvent({
          ...baseEvent(),
          type: "RENDER_COMMITTED",
          evidence,
        });
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  return null;
}

interface RuntimeErrorBoundaryProps {
  children: ReactNode;
}

interface RuntimeErrorBoundaryState {
  error: RuntimeErrorDetails | null;
}

class RuntimeErrorBoundary extends Component<
  RuntimeErrorBoundaryProps,
  RuntimeErrorBoundaryState
> {
  state: RuntimeErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): RuntimeErrorBoundaryState {
    return { error: normalizeError(error) };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo): void {
    const normalizedError = normalizeError(error);
    const componentStack = errorInfo.componentStack
      ? truncate(errorInfo.componentStack, MAX_ERROR_STACK_LENGTH)
      : undefined;

    postEvent({
      ...baseEvent(),
      type: "RUNTIME_ERROR",
      error: {
        ...normalizedError,
        ...(normalizedError.stack || !componentStack
          ? {}
          : { stack: componentStack }),
      },
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
      <RenderEvidenceReporter />
    </RuntimeErrorBoundary>
  );
}
`;

const APP_SOURCE = String.raw`import SampleCard from "./UserComponent";
import { currentFixture } from "./current-fixture";
import { RuntimeBridge } from "./runtime-bridge";
import "./styles.css";

export default function App() {
  return (
    <RuntimeBridge>
      <main
        id="statestorm-diagnostic-root"
        data-run-id={currentFixture.runId}
        data-fixture-id={currentFixture.fixtureId}
        data-component-mode={currentFixture.componentMode}
      >
        <SampleCard {...currentFixture.props} />
      </main>
    </RuntimeBridge>
  );
}
`;

const INDEX_SOURCE = String.raw`import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Gate 0 sandbox root element was not found");
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
    <title>StateStorm Gate 0 preview</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`;

const SANDBOX_STYLES_SOURCE = String.raw`:root {
  color: #0f172a;
  background: #f8fafc;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  padding: 24px;
}

#statestorm-diagnostic-root {
  display: block;
  min-height: 1px;
}

.sample-card,
.runtime-fallback {
  display: block;
  max-width: 640px;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  background: white;
  color: #0f172a;
  padding: 24px;
  box-shadow: 0 12px 32px rgb(15 23 42 / 8%);
}

.sample-card h2 {
  margin: 8px 0 12px;
  font-size: 24px;
}

.sample-card p,
.runtime-fallback p {
  line-height: 1.6;
}

.eyebrow {
  color: #0369a1;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.runtime-fallback {
  border-color: #fca5a5;
  color: #991b1b;
}
`;

export function createCurrentFixtureFile(run: SandboxRun): string {
  const serializedFixture = JSON.stringify({
    runId: run.runId,
    fixtureId: run.fixtureId,
    nonce: run.nonce,
    componentMode: run.componentMode,
    props: run.props,
  });

  return `interface CurrentFixture {
  runId: string;
  fixtureId: "safe-short" | "safe-long" | "runtime-crash";
  nonce: string;
  componentMode:
    | "bootstrap"
    | "valid"
    | "recovery-bootstrap"
    | "invalid-compilation-probe";
  props: {
    title: string;
    description: string;
    shouldCrash?: boolean;
  };
}

const serializedFixture = ${JSON.stringify(serializedFixture)};

export const currentFixture = JSON.parse(
  serializedFixture,
) as CurrentFixture;
`;
}

export function createSandboxFiles(run: SandboxRun): SandpackFiles {
  return {
    "/UserComponent.tsx": {
      code: USER_COMPONENT_SOURCE,
      active: true,
      readOnly: true,
    },
    "/current-fixture.ts": {
      code: createCurrentFixtureFile(run),
      hidden: false,
      readOnly: true,
    },
    "/runtime-bridge.tsx": {
      code: RUNTIME_BRIDGE_SOURCE,
      hidden: false,
      readOnly: true,
    },
    "/App.tsx": {
      code: APP_SOURCE,
      hidden: false,
      readOnly: true,
    },
    "/index.tsx": {
      code: INDEX_SOURCE,
      hidden: false,
      readOnly: true,
    },
    "/public/index.html": {
      code: HTML_SOURCE,
      hidden: true,
      readOnly: true,
    },
    "/styles.css": {
      code: SANDBOX_STYLES_SOURCE,
      hidden: true,
      readOnly: true,
    },
  };
}
