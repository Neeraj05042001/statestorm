import type { Metadata } from "next";
import Link from "next/link";

import { AnalyzeSubmissionClient } from "../../features/component-analysis/AnalyzeSubmissionClient";

export const metadata: Metadata = {
  title: "Analyze a component | StateStorm",
  description:
    "Submit a supported React component for deterministic contract analysis.",
};

export default function AnalyzePage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-12">
      <Link
        href="/"
        className="text-sm font-medium text-sky-700 hover:text-sky-900"
      >
        Back to StateStorm
      </Link>
      <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
        Gate 1 diagnostic
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
        Analyze a React component
      </h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
        The application server parses supported TSX or JSX into a validated
        component contract. Analysis is deterministic and does not run the
        submitted source.
      </p>

      <div className="mt-10">
        <AnalyzeSubmissionClient />
      </div>
    </main>
  );
}
