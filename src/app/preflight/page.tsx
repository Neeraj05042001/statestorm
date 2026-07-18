import Link from "next/link";

import { PreflightSubmissionClient } from "../../features/preflight/PreflightSubmissionClient";

export default function PreflightPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-12">
      <Link href="/" className="text-sm font-medium text-sky-700 underline">
        Back to StateStorm
      </Link>
      <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
        Gate 4 State Atlas diagnostic
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
        Component preflight planning
      </h1>
      <p className="mt-3 max-w-3xl leading-7 text-slate-600">
        Build a validated RunPlan, then execute its fixtures one at a time in the
        browser-only Sandpack boundary. Planning remains useful when Gemini is
        unavailable.
      </p>
      <div className="mt-8">
        <PreflightSubmissionClient />
      </div>
    </main>
  );
}
