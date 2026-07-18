"use client";

import dynamic from "next/dynamic";

import type { Fixture } from "../../domain";

const StateInspectionSandbox = dynamic(
  () => import("./StateInspectionSandbox"),
  {
    ssr: false,
    loading: () => (
      <div className="grid min-h-80 place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
        Loading isolated inspection preview...
      </div>
    ),
  },
);

export function StateInspectionSandboxClient(props: {
  sessionId: string;
  fixture: Fixture;
  componentSource: string;
  language: "tsx" | "jsx";
}) {
  return <StateInspectionSandbox {...props} />;
}
