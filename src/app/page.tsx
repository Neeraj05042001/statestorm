import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-6 px-6 py-20">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
        StateStorm
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
        Gate 0 is implemented and awaiting architecture review.
      </h1>
      <p className="max-w-2xl text-lg leading-8 text-slate-600">
        The current route is a diagnostic architecture spike for a provisional
        browser-isolated execution candidate. Gate 0 is not yet accepted.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/analyze"
          className="inline-flex rounded-md bg-sky-700 px-4 py-2.5 font-medium text-white hover:bg-sky-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
        >
          Analyze a component
        </Link>
        <Link
          href="/gate-0"
          className="inline-flex rounded-md bg-slate-950 px-4 py-2.5 font-medium text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
        >
          Open Gate 0 diagnostic
        </Link>
      </div>
    </main>
  );
}
