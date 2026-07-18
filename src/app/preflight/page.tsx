import Link from "next/link";

import { PreflightSubmissionClient } from "../../features/preflight/PreflightSubmissionClient";

export default async function PreflightPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string | string[] }>;
}) {
  const query = await searchParams;
  const initialDemo = query.demo === "1";

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-5 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-400"
          >
            <span className="grid size-8 place-items-center rounded-lg border border-sky-400/40 bg-sky-400/10 font-mono text-xs font-bold text-sky-300">
              SS
            </span>
            <span className="font-semibold tracking-tight">StateStorm</span>
          </Link>
          <p className="hidden text-sm text-slate-400 sm:block">
            AI proposes. Deterministic browser evidence decides.
          </p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-8 lg:py-14">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
          StateStorm Preflight
        </p>
        <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-5xl">
          Find the states your component forgot.
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
          Plan adversarial component states, execute them one at a time in an
          isolated browser sandbox, and inspect recorded failures in the State Atlas.
        </p>
        <div className="mt-9">
          <PreflightSubmissionClient initialDemo={initialDemo} />
        </div>
      </div>
    </main>
  );
}
