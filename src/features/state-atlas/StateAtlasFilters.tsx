export type StateAtlasFilter =
  | "all"
  | "issues"
  | "clean"
  | "runtime"
  | "blank"
  | "overflow"
  | "broken-images";

const filters: Array<{ id: StateAtlasFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "issues", label: "Issues" },
  { id: "clean", label: "Clean" },
  { id: "runtime", label: "Runtime" },
  { id: "blank", label: "Blank" },
  { id: "overflow", label: "Overflow" },
  { id: "broken-images", label: "Broken images" },
];

export function StateAtlasFilters({
  selected,
  onChange,
}: {
  selected: StateAtlasFilter;
  onChange: (filter: StateAtlasFilter) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Filter State Atlas states">
      {filters.map((filter) => (
        <button
          key={filter.id}
          type="button"
          aria-pressed={selected === filter.id}
          onClick={() => onChange(filter.id)}
          className={`rounded-full border px-3 py-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 ${
            selected === filter.id
              ? "border-slate-950 bg-slate-950 text-white"
              : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
