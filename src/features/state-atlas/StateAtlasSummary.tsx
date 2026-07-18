import type { StateAtlasSummary as StateAtlasSummaryModel } from "../../domain";

const summaryMetrics: Array<{
  key: keyof StateAtlasSummaryModel;
  label: string;
  className: string;
}> = [
  {
    key: "totalStates",
    label: "Total states",
    className: "border-slate-800 bg-slate-950 text-white",
  },
  {
    key: "cleanStates",
    label: "Clean",
    className: "border-emerald-200 bg-emerald-50 text-emerald-950",
  },
  {
    key: "runtimeFailures",
    label: "Runtime failures",
    className: "border-rose-200 bg-rose-50 text-rose-950",
  },
  {
    key: "blankRenders",
    label: "Blank renders",
    className: "border-rose-200 bg-rose-50 text-rose-950",
  },
  {
    key: "overflowWarnings",
    label: "Overflow warnings",
    className: "border-amber-200 bg-amber-50 text-amber-950",
  },
  {
    key: "brokenImages",
    label: "Broken images",
    className: "border-orange-200 bg-orange-50 text-orange-950",
  },
  {
    key: "otherFailures",
    label: "Other failures",
    className: "border-slate-300 bg-slate-100 text-slate-900",
  },
];

function stateCount(count: number): string {
  return count === 1 ? "one state" : `${count} states`;
}

function joinConclusions(conclusions: string[]): string {
  if (conclusions.length === 1) return conclusions[0];
  if (conclusions.length === 2) return conclusions.join(" and ");
  return `${conclusions.slice(0, -1).join(", ")}, and ${conclusions.at(-1)}`;
}

export function stateAtlasConclusion(summary: StateAtlasSummaryModel): {
  headline: string;
  detail: string;
} {
  const issueStates = summary.totalStates - summary.cleanStates;
  if (issueStates === 0) {
    return {
      headline: "No runtime or visual issues found",
      detail: `All ${summary.totalStates} tested states completed without a recorded failure or detector finding.`,
    };
  }

  const conclusions: string[] = [];
  if (summary.runtimeFailures > 0) {
    conclusions.push(`crashed in ${stateCount(summary.runtimeFailures)}`);
  }
  if (summary.blankRenders > 0) {
    conclusions.push(`rendered blank in ${stateCount(summary.blankRenders)}`);
  }
  if (summary.overflowWarnings > 0) {
    conclusions.push(
      `showed possible overflow in ${stateCount(summary.overflowWarnings)}`,
    );
  }
  if (summary.brokenImages > 0) {
    conclusions.push(
      `contained broken images in ${stateCount(summary.brokenImages)}`,
    );
  }
  if (summary.otherFailures > 0) {
    conclusions.push(
      `had other execution failures in ${stateCount(summary.otherFailures)}`,
    );
  }

  return {
    headline: `${issueStates} of ${summary.totalStates} ${summary.totalStates === 1 ? "state" : "states"} showed issues`,
    detail: `The component ${joinConclusions(conclusions)}.`,
  };
}

export function StateAtlasSummary({
  summary,
}: {
  summary: StateAtlasSummaryModel;
}) {
  const conclusion = stateAtlasConclusion(summary);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
          Developer conclusion
        </p>
        <p className="mt-2 text-xl font-semibold tracking-tight text-sky-950 sm:text-2xl">
          {conclusion.headline}
        </p>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-sky-900">
          {conclusion.detail}
        </p>
        <p className="mt-1 max-w-4xl text-sm leading-6 text-sky-900">
          A state may contain more than one recorded finding.
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        {summaryMetrics.map((metric) => (
          <div
            key={metric.key}
            className={`rounded-xl border p-4 ${metric.className}`}
          >
            <dt className="text-[11px] font-semibold uppercase tracking-wide opacity-70">
              {metric.label}
            </dt>
            <dd className="mt-2 text-2xl font-semibold">
              {summary[metric.key]}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
