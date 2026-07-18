"use client";

import {
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
} from "@codesandbox/sandpack-react";

import type { Fixture } from "../../domain";
import { createRunPlanSandboxFiles } from "../../execution/sandbox/create-runplan-sandbox-files";

export default function StateInspectionSandbox({
  sessionId,
  fixture,
  componentSource,
  language,
}: {
  sessionId: string;
  fixture: Fixture;
  componentSource: string;
  language: "tsx" | "jsx";
}) {
  const runId = `inspection-${fixture.id}`;
  const files = createRunPlanSandboxFiles({
    sessionId,
    runId,
    fixtureId: fixture.id,
    nonce: "inspection-preview",
    fixture,
    componentSource,
    language,
  });

  return (
    <SandpackProvider
      key={`${sessionId}:${fixture.id}`}
      template="react-ts"
      files={files}
      options={{
        activeFile: "/src/SubmittedComponent.tsx",
        autorun: true,
        autoReload: true,
        initMode: "immediate",
        recompileMode: "immediate",
      }}
    >
      <SandpackLayout style={{ height: 420 }}>
        <SandpackPreview
          showNavigator={false}
          showOpenInCodeSandbox={false}
          showOpenNewtab={false}
          showRefreshButton={false}
          showRestartButton={false}
          showSandpackErrorOverlay
          style={{ height: "100%" }}
        />
      </SandpackLayout>
    </SandpackProvider>
  );
}
