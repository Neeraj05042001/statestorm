# Gate 0 technical verification path

This is the engineering verification sequence for the provisional Sandpack
architecture spike. It is not the final three-minute product demo.

## Preparation

Run the development path with `npm run dev`, or validate built output with:

```text
npm run lint
npm run typecheck
npm run build
npm run start -- -p 3100
```

Open `/gate-0` directly. Use `http://localhost:3000/gate-0` for development or
`http://localhost:3100/gate-0` for the built server. No environment variables or
secrets are required.

## Runtime containment and recovery

1. Wait until the parent reports `Sandpack ready`, preview client status is
   `done`, and controls are enabled.
2. Run **Run safe short fixture**. Confirm `Component visibly rendered`, a
   correlated `RENDER_COMMITTED`, and the visible `Calm state` card.
3. Run **Run runtime crash fixture**. Confirm the parent reports `Runtime error`,
   accepts a correlated `RUNTIME_ERROR`, and shows
   `Deliberate Gate 0 runtime failure`.
4. Confirm the iframe shows its controlled runtime fallback and no
   `RENDER_COMMITTED` was accepted for the crash run.
5. Click **Increment parent heartbeat**. Confirm the count changes from 0 to 1.
6. Run **Run safe short fixture** without refreshing. Confirm visible success
   returns and heartbeat remains 1.
7. Run **Run safe long fixture**. Confirm the longer title and description are
   visibly different and correlated to a new run ID.

## Compilation diagnostic and recovery

1. From a valid rendered fixture, click **Inject invalid TSX probe**.
2. Confirm component mode is `invalid-compilation-probe` and the parent reports
   `Compilation diagnostic error`, never rendered or runtime error.
3. Inspect the compilation diagnostic: context error before injection should be
   null; the current context error and listener trace should show the invalid
   `/UserComponent.tsx` failure; classification should be `provisional`.
4. Confirm no current correlated runtime-bridge event was accepted. The iframe
   may retain the previous valid DOM, which has the previous run ID.
5. Click **Restore valid sample component**. Wait for the current client to
   return to `done` and for `safe-short` to render visibly.
6. Run **Run safe short fixture** once more. Confirm a new correlated visible
   success without a parent refresh or provider remount.

## Timeout and stale-message diagnostic

The normal crash and invalid-source paths must resolve before the run timer and
must not become generic timeouts. To exercise a genuinely missing outcome, an
executor may isolate the preview iframe after readiness, start a new run, and
send a mismatched protocol event from that iframe window. Confirm the stale
event is rejected and the current run still reaches `Timed out` after 20,000 ms.
This diagnostic intentionally damages that preview instance; reload only after
the timeout evidence has been captured.

Initialization failure is separate: readiness has its own provisional 30,000 ms
timeout and must not be reported as a run timeout.

## Production evidence to record

Record the exact URL, browser/version, parent state and run IDs, heartbeat value,
iframe text/run attributes, parent console exceptions and relevant network
failures. Direct built-server `/gate-0` navigation must succeed. Public deployment
is not verified by this sequence.
