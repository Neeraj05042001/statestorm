import type { StateAtlasEntry } from "../../domain";

function categoryClass(category: StateAtlasEntry["category"]): string {
  if (category === "clean") return "bg-emerald-100 text-emerald-900";
  if (category === "overflow-warning") return "bg-amber-100 text-amber-950";
  if (category === "broken-image") return "bg-orange-100 text-orange-950";
  if (category === "cancelled") return "bg-slate-200 text-slate-800";
  return "bg-rose-100 text-rose-950";
}

const categoryLabels: Record<StateAtlasEntry["category"], string> = {
  clean: "Clean",
  "runtime-failure": "Runtime failure",
  "blank-render": "Blank render",
  "compile-failure": "Compile failure",
  timeout: "Timed out",
  "infrastructure-failure": "Runner failure",
  "overflow-warning": "Overflow warning",
  "broken-image": "Broken image",
  cancelled: "Cancelled",
};

export function StateAtlasCard({
  entry,
  selected,
  onSelect,
}: {
  entry: StateAtlasEntry;
  selected: boolean;
  onSelect: (fixtureId: string) => void;
}) {
  return (
    <article
      className={`flex h-full flex-col rounded-xl border bg-white p-4 shadow-sm transition-colors ${
        selected
          ? "border-sky-600 ring-2 ring-sky-100"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h5 className="font-semibold leading-5 text-slate-950">{entry.fixtureLabel}</h5>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {entry.fixtureOrigin === "ai" ? "AI-planned state" : "Deterministic state"}
          </p>
        </div>
        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold ${categoryClass(entry.category)}`}
        >
          {categoryLabels[entry.category]}
        </span>
      </div>

      <p className="mt-3 text-sm leading-5 text-slate-600">
        {entry.fixtureIntent}
      </p>

      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
        <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">
          Browser: {entry.executionResult.status}
        </span>
        {entry.visualFindings.map((finding) => (
          <span
            key={finding.id}
            className={`rounded-full px-2 py-1 ${
              finding.kind === "broken-image"
                ? "bg-orange-100 text-orange-950"
                : "bg-amber-100 text-amber-950"
            }`}
          >
            {finding.kind === "broken-image" ? "Broken image" : "Possible overflow"}
          </span>
        ))}
      </div>

      <pre className="mt-3 max-h-24 overflow-auto rounded-lg bg-slate-950 p-3 text-xs leading-5 text-slate-100" title="Recorded fixture props">
        {JSON.stringify(entry.fixtureProps)}
      </pre>

      <button
        type="button"
        aria-current={selected ? "true" : undefined}
        onClick={() => onSelect(entry.fixtureId)}
        className={`mt-4 rounded-lg border px-3 py-2 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 ${
          selected
            ? "border-sky-700 bg-sky-50 text-sky-900"
            : "border-slate-300 text-slate-800 hover:border-sky-600 hover:text-sky-800"
        }`}
      >
        {selected ? "Inspecting state" : "Inspect state"}
      </button>
    </article>
  );
}
