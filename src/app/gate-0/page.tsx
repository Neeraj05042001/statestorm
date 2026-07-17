import Link from "next/link";

import SandboxSpikeClient from "@/features/sandbox-spike/SandboxSpikeClient";

export default function GateZeroPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="space-y-3">
        <Link href="/" className="text-sm font-medium text-sky-700 underline">
          Back to StateStorm
        </Link>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
            SS-M0-001
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Gate 0 sandbox execution diagnostic
          </h1>
        </div>
        <p className="max-w-4xl leading-7 text-slate-600">
          This technical spike exercises a provisional browser-isolated execution
          candidate. It is not a hardened malicious-code sandbox and Gate 0 remains
          open until architecture review.
        </p>
      </header>

      <SandboxSpikeClient />
    </main>
  );
}
