import Link from "next/link";

const workflowSteps = [
  {
    number: "01",
    title: "Add prompt and component",
    body: "Describe the intended experience and paste one supported, self-contained React component.",
  },
  {
    number: "02",
    title: "Generate adversarial states",
    body: "Semantic AI proposals join a dependable set of deterministic boundary fixtures.",
  },
  {
    number: "03",
    title: "Execute safely in the sandbox",
    body: "Each state runs serially inside an isolated browser preview, never in the StateStorm parent.",
  },
  {
    number: "04",
    title: "Inspect the State Atlas",
    body: "Compare clean and fragile states, recorded findings, and one live selected-state rerender.",
  },
] as const;

const capabilities = [
  "Prompt-derived semantic states",
  "Deterministic boundary states",
  "Isolated serial execution",
  "Runtime-error detection",
  "Blank-render detection",
  "Overflow warnings",
  "Broken-image findings",
  "Live state inspection",
] as const;

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="border-b border-white/10">
        <div className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-8">
          <nav className="flex items-center justify-between gap-6" aria-label="Primary navigation">
            <Link
              href="/"
              className="inline-flex items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-400"
            >
              <span className="grid size-9 place-items-center rounded-lg border border-sky-400/40 bg-sky-400/10 font-mono text-sm font-bold text-sky-300">
                SS
              </span>
              <span className="text-lg font-semibold tracking-tight">StateStorm</span>
            </Link>
            <Link
              href="/preflight"
              className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-slate-100 transition-colors hover:border-sky-400 hover:text-sky-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-400"
            >
              Open preflight
            </Link>
          </nav>

          <div className="grid gap-12 py-20 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] lg:items-center lg:py-28">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300">
                Adversarial UI preflight
              </p>
              <h1 className="mt-5 max-w-4xl text-5xl font-semibold tracking-[-0.04em] text-balance sm:text-6xl lg:text-7xl">
                AI builds the happy path. StateStorm reveals what it forgot.
              </h1>
              <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
                Turn an original requirement and a React component into adversarial states,
                browser-derived failure evidence, and an interactive State Atlas.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/preflight"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg bg-sky-400 px-5 py-3 font-semibold text-slate-950 transition-colors hover:bg-sky-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300"
                >
                  Launch StateStorm
                </Link>
                <Link
                  href="/preflight?demo=1"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/25 bg-white/5 px-5 py-3 font-semibold text-white transition-colors hover:border-sky-400 hover:bg-sky-400/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300"
                >
                  Load demo
                </Link>
              </div>
              <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-400">
                Supports self-contained React TSX/JSX with locally declared,
                JSON-serializable props and React-only imports.
              </p>
            </div>

            <aside className="rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-sky-950/40" aria-label="StateStorm evidence preview">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-sky-300">State Atlas</p>
                  <p className="mt-1 font-semibold">12 states tested</p>
                </div>
                <span className="rounded-full bg-rose-400/15 px-3 py-1 text-xs font-semibold text-rose-200">
                  4 issue states
                </span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                  <p className="text-2xl font-semibold text-emerald-300">8</p>
                  <p className="mt-1 text-slate-300">Clean states</p>
                </div>
                <div className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-4">
                  <p className="text-2xl font-semibold text-rose-300">1</p>
                  <p className="mt-1 text-slate-300">Runtime failure</p>
                </div>
                <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4">
                  <p className="text-2xl font-semibold text-amber-300">1</p>
                  <p className="mt-1 text-slate-300">Blank render</p>
                </div>
                <div className="rounded-xl border border-orange-400/20 bg-orange-400/10 p-4">
                  <p className="text-2xl font-semibold text-orange-300">2</p>
                  <p className="mt-1 text-slate-300">Visual findings</p>
                </div>
              </div>
              <p className="mt-5 rounded-xl border border-sky-400/20 bg-sky-400/10 p-4 text-sm leading-6 text-sky-100">
                AI proposes. Deterministic browser evidence decides.
              </p>
            </aside>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20 text-slate-950" aria-labelledby="how-it-works">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">How it works</p>
          <h2 id="how-it-works" className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            From one component to evidence-backed states
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {workflowSteps.map((step) => (
              <article key={step.number} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="font-mono text-sm font-semibold text-sky-700">{step.number}</p>
                <h3 className="mt-6 text-lg font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-slate-900 py-20" aria-labelledby="why-it-matters">
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">Why it matters</p>
            <h2 id="why-it-matters" className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              The first render is rarely the whole story.
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            <p className="border-l-2 border-sky-400 pl-4 text-sm leading-7 text-slate-300">
              AI-generated UI often captures the intended happy path and leaves boundary behavior unexplored.
            </p>
            <p className="border-l-2 border-amber-400 pl-4 text-sm leading-7 text-slate-300">
              StateStorm exposes fragile states before the component reaches integration.
            </p>
            <p className="border-l-2 border-emerald-400 pl-4 text-sm leading-7 text-slate-300">
              Runtime and visual findings come from the browser—not from a model guessing what rendered.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20 text-slate-950" aria-labelledby="capabilities">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">MVP capabilities</p>
          <h2 id="capabilities" className="mt-3 text-3xl font-semibold tracking-tight">Focused MVP capabilities</h2>
          <div className="mt-8 flex flex-wrap gap-3">
            {capabilities.map((capability) => (
              <span key={capability} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                {capability}
              </span>
            ))}
          </div>

          <div className="mt-14 grid gap-8 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm lg:grid-cols-[0.7fr_1.3fr] lg:p-9">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">Supported scope</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">Narrow by design, clear by default.</h2>
            </div>
            <div className="grid gap-4 text-sm leading-6 text-slate-600 sm:grid-cols-2">
              <p className="rounded-xl bg-slate-50 p-4">
                Self-contained React TSX/JSX with React-only imports and locally declared JSON-serializable props.
              </p>
              <p className="rounded-xl bg-slate-50 p-4">
                Callback props and imported prop types are not yet supported. StateStorm does not claim full production certification.
              </p>
            </div>
          </div>

          <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-7 text-sm text-slate-500">
            <p>StateStorm · adversarial component preflight</p>
            <div className="flex gap-4">
              <Link href="/analyze" className="underline decoration-slate-300 underline-offset-4 hover:text-sky-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-600">
                Contract analyzer
              </Link>
              <Link href="/gate-0" className="underline decoration-slate-300 underline-offset-4 hover:text-sky-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-600">
                Sandbox boundary check
              </Link>
            </div>
          </footer>
        </div>
      </section>
    </main>
  );
}
