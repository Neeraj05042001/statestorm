"use client";

import { useState } from "react";

export default function ParentHeartbeat() {
  const [heartbeat, setHeartbeat] = useState(0);

  return (
    <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
      <h2 className="font-semibold text-emerald-950">Parent heartbeat</h2>
      <p className="mt-1 text-sm leading-6 text-emerald-800">
        This counter is parent-owned React state outside the preview iframe.
      </p>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setHeartbeat((value) => value + 1)}
          className="rounded-md bg-emerald-800 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        >
          Increment parent heartbeat
        </button>
        <output
          aria-live="polite"
          aria-label="Parent heartbeat count"
          className="rounded bg-white px-3 py-2 font-mono text-sm text-emerald-950"
        >
          {heartbeat}
        </output>
      </div>
    </section>
  );
}
