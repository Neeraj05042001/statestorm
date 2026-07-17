export interface RunLogEntry {
  id: string;
  timestamp: string;
  runId: string;
  fixtureId: string;
  eventType: string;
  outcome: "pending" | "success" | "failure" | "diagnostic" | "rejected";
  detail?: string;
}

export default function RunLog({ entries }: { entries: RunLogEntry[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3">
        <h2 className="font-semibold text-slate-950">Parent diagnostic log</h2>
        <p className="mt-1 text-sm text-slate-600">
          Newest first. Rejected or stale protocol messages remain visible but
          cannot replace the current result.
        </p>
      </div>
      <div className="max-h-96 overflow-auto rounded border border-slate-200">
        <table className="w-full min-w-[900px] border-collapse text-left text-xs">
          <thead className="sticky top-0 bg-slate-100 text-slate-700">
            <tr>
              <th className="p-2 font-semibold">Timestamp</th>
              <th className="p-2 font-semibold">Run</th>
              <th className="p-2 font-semibold">Fixture</th>
              <th className="p-2 font-semibold">Event</th>
              <th className="p-2 font-semibold">Outcome</th>
              <th className="p-2 font-semibold">Detail</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-slate-500">
                  No diagnostic events yet.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="border-t border-slate-200 align-top">
                  <td className="whitespace-nowrap p-2 font-mono text-slate-600">
                    {entry.timestamp}
                  </td>
                  <td className="max-w-44 break-all p-2 font-mono text-slate-700">
                    {entry.runId}
                  </td>
                  <td className="whitespace-nowrap p-2 text-slate-700">
                    {entry.fixtureId}
                  </td>
                  <td className="whitespace-nowrap p-2 font-mono text-slate-900">
                    {entry.eventType}
                  </td>
                  <td className="whitespace-nowrap p-2 font-semibold text-slate-700">
                    {entry.outcome}
                  </td>
                  <td className="max-w-xl break-words p-2 text-slate-600">
                    {entry.detail ?? "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
