import type { RunPlan, StateAtlasEntry } from "../../domain";
import { StateInspectionSandboxClient } from "./StateInspectionSandboxClient";

export function StateInspectionPreview({
  entry,
  runPlan,
  sessionId,
}: {
  entry: StateAtlasEntry;
  runPlan: RunPlan;
  sessionId: string;
}) {
  const canRender = entry.executionResult.status === "passed";
  const fixture = {
    id: entry.fixtureId,
    label: entry.fixtureLabel,
    origin: entry.fixtureOrigin,
    intent: entry.fixtureIntent,
    props: entry.fixtureProps,
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
        Live inspection — rerendered from recorded fixture props
      </p>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="text-xl font-semibold text-slate-950">
          {entry.fixtureLabel}
        </h3>
        <span className="text-sm font-medium text-slate-500">
          Recorded: {entry.executionResult.status}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        Recorded execution findings remain the source of truth. This isolated
        rerender cannot overwrite them.
      </p>

      <div className="mt-4">
        {canRender ? (
          <StateInspectionSandboxClient
            key={`${sessionId}:${entry.fixtureId}`}
            sessionId={sessionId}
            fixture={fixture}
            componentSource={runPlan.submission.componentCode}
            language={runPlan.submission.language}
          />
        ) : (
          <div
            role="status"
            className="grid min-h-80 place-items-center rounded-xl border border-dashed border-rose-300 bg-rose-50 p-8 text-center"
          >
            <div>
              <p className="font-semibold text-rose-950">
                No visible recorded preview is available for this state.
              </p>
              <p className="mt-2 text-sm text-rose-800">
                {entry.executionResult.summary}
              </p>
              {entry.executionResult.sanitizedMessage ? (
                <p className="mt-1 text-sm text-rose-800">
                  {entry.executionResult.sanitizedMessage}
                </p>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
