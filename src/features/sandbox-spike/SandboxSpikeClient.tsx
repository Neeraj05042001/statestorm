"use client";

import dynamic from "next/dynamic";

const SandboxSpike = dynamic(() => import("./SandboxSpike"), {
  loading: () => (
    <p className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600">
      Loading the client-only Sandpack diagnostic...
    </p>
  ),
  ssr: false,
});

export default function SandboxSpikeClient() {
  return <SandboxSpike />;
}
