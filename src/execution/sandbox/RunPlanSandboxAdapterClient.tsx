"use client";

import dynamic from "next/dynamic";

import type { FixtureSandboxExecutor } from "../execute-run-plan";

const RunPlanSandboxAdapter = dynamic(
  () => import("./RunPlanSandboxAdapter"),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
        Loading the client-only Sandpack execution adapter...
      </div>
    ),
  },
);

export function RunPlanSandboxAdapterClient({
  onExecutorChange,
}: {
  onExecutorChange: (executor: FixtureSandboxExecutor | null) => void;
}) {
  return <RunPlanSandboxAdapter onExecutorChange={onExecutorChange} />;
}
