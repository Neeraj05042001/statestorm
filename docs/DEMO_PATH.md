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

### Recorded Gate 3 result

Local browser verification completed the twelve-fixture fragile-component path
with exactly nine passed and three failed results. `det-empty-strings` was a
contained runtime error with
`Cannot read properties of undefined (reading 'toUpperCase')`.
`ai-semantic-03` and `det-zero-numbers` were blank renders. Later fixtures
continued and passed, the parent remained mounted, rerun created a fresh session
with the correct order, and no requirement verdict was fabricated.

Public Vercel verification reproduced the same twelve-fixture serial execution,
exact nine-passed/three-failed totals, contained runtime error, two blank
renders, continuation, mounted parent and fresh ordered rerun without stale
completed-session results.

Step 7 also passed publicly. During an active rerun, a new prompt and component
were submitted. The prior execution stopped owning the UI and its results did
not reappear. The replacement became active and was correctly rejected with
`UNSUPPORTED_PROP_TYPE` for `onAddToCart?: () => void`. Planned requirements
were not falsely marked passed or failed.

The architecture authority accepted the production evidence. Gate 3 is passed,
closed and frozen.

## Gate 4 State Atlas verification path

This sequence is the accepted SS-M4-001 manual path. Local production-build and
public Vercel browser verification passed. The architecture authority accepted
the evidence, so Gate 4 is passed, closed and frozen.

Use this prompt:

```text
Render a product card with a title, price, image, featured treatment and calm
or urgent tone. Exercise empty, zero-price, long-title and invalid-image states.
```

Use this TSX component (it is also the current `/preflight` example):

```tsx
interface AtlasProductCardProps {
  title: string;
  price: number;
  imageUrl: string;
  featured: boolean;
  tone?: "calm" | "urgent";
}

export default function AtlasProductCard({
  title = "Everyday mug",
  price = 24.99,
  imageUrl = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='100'%3E%3Crect width='160' height='100' fill='%230ea5e9'/%3E%3C/svg%3E",
  featured = true,
  tone = "calm",
}: AtlasProductCardProps) {
  if (!title) throw new Error("Atlas product title must not be empty");
  if (price === 0) return null;

  return (
    <article
      data-tone={tone}
      style={{ width: 240, padding: 16, border: "1px solid #cbd5e1" }}
    >
      <img
        src={imageUrl}
        alt={title + " product"}
        style={{ display: "block", width: 160, height: 100 }}
      />
      <h2
        data-testid="product-title"
        style={{ maxWidth: 180, whiteSpace: "nowrap", overflow: "hidden" }}
      >
        {title}
      </h2>
      <p>{price.toFixed(2)}</p>
      {featured ? <strong>Featured product</strong> : null}
    </article>
  );
}
```

The deterministic happy path uses the embedded data image and should remain a
clean successful state. The empty-string fixture should produce a contained
runtime error. The zero-number fixture should produce a blank render. The long-
string fixture should constrain a non-wrapping title so scroll width exceeds
client width, and its unusable relative image value should be capable of a
confirmed broken-image finding without public network availability.

Run this sequence:

1. Generate the RunPlan and execute all states.
2. Confirm the State Atlas appears only after the completed session.
3. Confirm at least one clean state, one runtime failure, one blank render, one
   overflow warning and one broken-image state.
4. Confirm All, Issues, Clean, Runtime, Blank, Overflow and Broken images show
   the correct cards and visible selected state.
5. Confirm the first issue in RunPlan order is selected by default.
6. Select a clean state and confirm exactly one preview labeled **Live
   inspection — rerendered from recorded fixture props**.
7. Select the runtime and blank states and confirm their recorded-evidence
   overlays appear without replacing the recorded result.
8. Switch repeatedly between passed states and inspect the page for exactly one
   inspection iframe lifecycle at a time.
9. Run the complete plan again. Confirm the prior atlas unmounts, results reset,
   the new serial session completes and no stale findings return.
10. Replace the plan during execution and confirm the old preview, results and
    detector messages cannot update the replacement UI.

Repeat against development and `npm run start -- -p 3100`. Then re-run the
frozen `/analyze` and `/gate-0` paths, deterministic fallback planning and live
Gemini planning when local provider capacity is available. Record exact browser
version, URL, session and fixture IDs, state totals, selected state, iframe
count, parent exceptions and relevant hosted Sandpack network failures.

### Accepted local and public result

The production-build browser sequence passed. Completed execution produced the
validated atlas; runtime and blank results stayed correctly classified;
overflow and confirmed broken-image evidence appeared; every filter worked;
and the first issue was selected predictably. One clean selection mounted one
inspection Sandpack, switching state replaced that lifecycle, runtime and blank
selections showed overlays, and inspection did not replace recorded results.
**Run again** reset and recreated the atlas.

The first happy-path run produced one isolated timeout. It did not reproduce on
rerun or after a hard refresh: happy path passed and Other failures returned to
zero. A hydration warning was separately traced to a browser extension adding
`cz-shortcut-listen` to `body`; incognito mode with extensions disabled removed
the warning. No hydration suppression or layout change is warranted.

Public Vercel verification passed in an extension-free browser. The completed
execution produced the validated Atlas with correct summary counts; every
filter worked; the first issue was selected predictably; one clean-state live
inspection sandbox mounted; selection changes replaced its lifecycle; runtime
and blank overlays showed recorded evidence; and inspection rerenders did not
overwrite recorded findings. **Run again** created a fresh execution session
and Atlas. Happy path passed, Other failures remained zero, broken-image
findings exposed no full image URL and no hydration warning occurred. No prompt
requirement was falsely marked passed or failed.

The architecture authority accepted this public evidence. State Atlas,
overflow detection, broken-image detection and one-state live inspection are
accepted MVP capabilities. Recorded execution remains authoritative. Screenshot
capture, visual baselines, responsive matrices and requirement verdicts remain
excluded. No screenshots or prompt-requirement verdicts were added.

### Regression and production build

After the `/preflight` sequence, navigate directly to `/analyze` and `/gate-0`.
Repeat the accepted Gate 0 safe, crash, runtime recovery, invalid-source and
compiler-recovery sequence. Run the same checks against `npm run start` output.
Record browser version, exact URL, session/fixture IDs, parent exceptions and
external Sandpack network failures. Do not record manual evidence as verified
until it has been observed.
