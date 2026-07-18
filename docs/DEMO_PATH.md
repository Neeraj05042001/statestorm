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
   report a fresh `start` and successful `done`, the context error to become
   null, a fresh `SANDBOX_READY` event and `Compiler recovery verified`.
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
was accepted at `https://statestorm.vercel.app/gate-0`; repeat the same evidence
path after any separately authorized execution-boundary change.

## Gate 0 accepted verification path

This is the technical evidence path accepted by the ChatGPT Project architecture
authority. It is not the final hackathon product demo.

1. Run **Run safe short fixture** and confirm visible correlated success.
2. Run **Run safe long fixture** and confirm visibly different correlated
   content.
3. Run **Run runtime crash fixture** and confirm the isolated `RUNTIME_ERROR`.
4. Increment the parent heartbeat from 0 to 1 while the crash fallback remains
   contained.
5. Run a safe fixture without refreshing and confirm visible recovery with the
   heartbeat still at 1.
6. Click **Inject invalid TSX probe** and confirm the provisional compilation
   diagnostic while any previous iframe DOM is treated as stale.
7. Click **Restore valid sample component**; do not start another fixture while
   restoration remains in flight.
8. Wait for `Compiler recovery verified`, proving current-client start,
   successful completion, null context error and a fresh bootstrap event.
9. Run a final valid fixture and confirm a new correlated visible render without
   refreshing the parent page.

## Gate 3 RunPlan execution verification path

This sequence supplements the frozen Gate 0 path. It does not replace or weaken
any Gate 0 check above.

### Deterministic fallback

1. Open `/preflight` with `GEMINI_API_KEY` unavailable.
2. Create the example plan and confirm `det-happy-path` is first, the plan has no
   more than twelve fixtures and the UI reports deterministic fallback.
3. Click **Run planned states** and confirm one active preview appears.
4. Observe the current fixture and completed/total counters. Confirm fixture IDs
   appear in the same order as the RunPlan and never run in parallel.
5. Wait for completion and confirm ordered status badges and pass/failure totals.
6. Click **Run again** and confirm a new session completes.
7. Start another execution, then create a replacement plan. Confirm the old
   preview is removed and no stale result updates the replacement UI.

### Fragile component

Use the prompt and `FragileProduct` TSX source in
`docs/RUNPLAN_EXECUTION.md`. Confirm:

1. the happy-path fixture passes;
2. the empty-string fixture produces a contained runtime error with no stack;
3. the zero-number fixture produces a blank render;
4. a later negative or large-number fixture still executes and passes;
5. the parent page remains mounted throughout;
6. **Run again** succeeds after both failures.

### Recorded local Gate 3 result

Local browser verification completed the twelve-fixture fragile-component path
with exactly nine passed and three failed results. `det-empty-strings` was a
contained runtime error with
`Cannot read properties of undefined (reading 'toUpperCase')`.
`ai-semantic-03` and `det-zero-numbers` were blank renders. Later fixtures
continued and passed, the parent remained mounted, rerun created a fresh session
with the correct order, and no requirement verdict was fabricated.

The evidence did not explicitly exercise step 7 of the deterministic fallback
path while a run was in flight. Replacement cancellation therefore remains
pending and must be verified separately. Public Vercel execution verification
also remains pending; Gate 3 stays open until that production path passes.

### Regression and production build

After the `/preflight` sequence, navigate directly to `/analyze` and `/gate-0`.
Repeat the accepted Gate 0 safe, crash, runtime recovery, invalid-source and
compiler-recovery sequence. Run the same checks against `npm run start` output.
Record browser version, exact URL, session/fixture IDs, parent exceptions and
external Sandpack network failures. Do not record manual evidence as verified
until it has been observed.
