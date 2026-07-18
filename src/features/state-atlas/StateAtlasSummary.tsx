import type { StateAtlasSummary as StateAtlasSummaryModel } from "../../domain";

const summaryMetrics: Array<{
  key: keyof StateAtlasSummaryModel;
  label: string;
}> = [
  { key: "totalStates", label: "Total states" },
  { key: "cleanStates", label: "Clean" },
  { key: "runtimeFailures", label: "Runtime failures" },
  { key: "blankRenders", label: "Blank renders" },
  { key: "overflowWarnings", label: "Overflow warnings" },
  { key: "brokenImages", label: "Broken images" },
  { key: "otherFailures", label: "Other failures" },
];

export function StateAtlasSummary({
  summary,
}: {
  summary: StateAtlasSummaryModel;
}) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
      {summaryMetrics.map((metric) => (
        <div
          key={metric.key}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {metric.label}
          </dt>
          <dd className="mt-2 text-2xl font-semibold text-slate-950">
            {summary[metric.key]}
          </dd>
        </div>
      ))}
    </dl>
  );
}
