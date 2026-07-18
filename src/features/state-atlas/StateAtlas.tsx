"use client";

import { useState } from "react";

import type { RunPlan, StateAtlas as StateAtlasModel, StateAtlasEntry } from "../../domain";
import { StateAtlasCard } from "./StateAtlasCard";
import {
  StateAtlasFilters,
  type StateAtlasFilter,
} from "./StateAtlasFilters";
import { StateAtlasSummary } from "./StateAtlasSummary";
import { StateInspectionPreview } from "./StateInspectionPreview";

export function filterAtlasEntries(
  entries: readonly StateAtlasEntry[],
  filter: StateAtlasFilter,
): StateAtlasEntry[] {
  if (filter === "all") return [...entries];
  if (filter === "issues") {
    return entries.filter((entry) => entry.category !== "clean");
  }
  if (filter === "clean") {
    return entries.filter((entry) => entry.category === "clean");
  }
  if (filter === "runtime") {
    return entries.filter((entry) => entry.category === "runtime-failure");
  }
  if (filter === "blank") {
    return entries.filter((entry) => entry.category === "blank-render");
  }
  if (filter === "overflow") {
    return entries.filter((entry) =>
      entry.visualFindings.some(
        (finding) => finding.kind === "layout-overflow",
      ),
    );
  }
  return entries.filter((entry) =>
    entry.visualFindings.some((finding) => finding.kind === "broken-image"),
  );
}

export function defaultAtlasSelectionId(
  entries: readonly StateAtlasEntry[],
): string | undefined {
  return (
    entries.find((entry) => entry.category !== "clean")?.fixtureId ??
    entries.find((entry) => entry.fixtureId === "det-happy-path")?.fixtureId ??
    entries[0]?.fixtureId
  );
}

export function selectionForFilter(input: {
  entries: readonly StateAtlasEntry[];
  filter: StateAtlasFilter;
  selectedId: string | undefined;
}): string | undefined {
  const visibleEntries = filterAtlasEntries(input.entries, input.filter);
  return visibleEntries.some((entry) => entry.fixtureId === input.selectedId)
    ? input.selectedId
    : visibleEntries[0]?.fixtureId;
}

export function StateAtlasView({
  atlas,
  runPlan,
  filter,
  selectedId,
  onFilterChange,
  onSelect,
}: {
  atlas: StateAtlasModel;
  runPlan: RunPlan;
  filter: StateAtlasFilter;
  selectedId: string | undefined;
  onFilterChange: (filter: StateAtlasFilter) => void;
  onSelect: (fixtureId: string) => void;
}) {
  const visibleEntries = filterAtlasEntries(atlas.entries, filter);
  const selectedEntry = atlas.entries.find(
    (entry) => entry.fixtureId === selectedId,
  );

  return (
    <section aria-labelledby="state-atlas-heading" className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
          Recorded browser evidence
        </p>
        <h4
          id="state-atlas-heading"
          className="mt-1 text-2xl font-semibold tracking-tight text-slate-950"
        >
          State Atlas
        </h4>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Compare completed states, isolate runtime and visual findings, and
          inspect one recorded prop set at a time. Recorded execution remains authoritative.
        </p>
      </div>

      <StateAtlasSummary summary={atlas.summary} />
      <StateAtlasFilters selected={filter} onChange={onFilterChange} />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        {visibleEntries.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {visibleEntries.map((entry) => (
              <StateAtlasCard
                key={entry.fixtureId}
                entry={entry}
                selected={entry.fixtureId === selectedId}
                onSelect={onSelect}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
            No recorded states match this filter.
          </p>
        )}

        <div className="xl:sticky xl:top-5">
          {selectedEntry ? (
            <StateInspectionPreview
              entry={selectedEntry}
              runPlan={runPlan}
              sessionId={atlas.sessionId}
            />
          ) : (
            <div className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
              Select a filter with recorded states to inspect a result.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function StateAtlas({
  atlas,
  runPlan,
}: {
  atlas: StateAtlasModel;
  runPlan: RunPlan;
}) {
  const [filter, setFilter] = useState<StateAtlasFilter>("all");
  const [selectedId, setSelectedId] = useState<string | undefined>(() =>
    defaultAtlasSelectionId(atlas.entries),
  );

  const changeFilter = (nextFilter: StateAtlasFilter) => {
    setFilter(nextFilter);
    setSelectedId((current) =>
      selectionForFilter({
        entries: atlas.entries,
        filter: nextFilter,
        selectedId: current,
      }),
    );
  };

  return (
    <StateAtlasView
      atlas={atlas}
      runPlan={runPlan}
      filter={filter}
      selectedId={selectedId}
      onFilterChange={changeFilter}
      onSelect={setSelectedId}
    />
  );
}
