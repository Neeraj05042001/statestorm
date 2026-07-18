# RunPlan fixture execution

## Status and scope

SS-M3-001 connects an accepted executable RunPlan v1 to the frozen Gate 0
Sandpack boundary. Gate 3 remains open. This slice executes planned fixtures and
reports observable render outcomes; it does not verify prompt requirements,
capture screenshots, build a state atlas or add advanced detectors.

## Execution layers

The implementation has three explicit layers:

1. `executeRunPlan` is a React-independent orchestrator. It revalidates the
   RunPlan, requires the retained submission source, preserves fixture order,
   awaits one injected executor call at a time, continues after fixture-level
   failures, honors cancellation and validates the complete session result.
2. `RunPlanSandboxAdapter` is the browser-only Sandpack adapter. It exposes the
   `FixtureSandboxExecutor` interface to the UI and creates exactly one active
   `react-ts` provider and iframe for the current fixture.
3. The runtime protocol reuses the Gate 0 source marker, version, plain-object
   guard, correlation discipline and source-window equality check. Gate 0 keeps
   its fixture-specific accepted evidence rules unchanged.

Tests inject fake executors into the orchestrator. Submitted source is never
executed by those Node.js tests.

## Isolated virtual project

Every fixture receives a fresh Sandpack lifecycle containing separate files:

- `/src/SubmittedComponent.tsx`
- `/src/fixture-data.ts`
- `/src/runtime-bridge.tsx`
- `/src/App.tsx`
- `/index.tsx`
- `/public/index.html`
- `/styles.css`

The submitted source remains a string in the parent until it becomes the
submitted-component virtual file. Fixture props cross the boundary through a
double JSON serialization and `JSON.parse`; the wrapper spreads exactly that
validated prop object and introduces no prop. There is no parent-side `eval`,
`new Function`, generated submitted-module import or executable HTML injection.

## Runtime protocol and success gate

Every accepted runtime message must contain the current `sessionId`, `runId`,
`fixtureId` and nonce, plus the accepted source marker and protocol version. The
parent also requires `MessageEvent.source` to equal the current preview iframe
window. Unknown, malformed, stale or mismatched messages are ignored.

The sandbox error boundary emits a bounded name and message without returning a
raw `Error` or stack. The render reporter inspects the correlated fixture root
after commit. A passed result requires all of:

- successful Sandpack completion for the active fixture;
- a correlated render commit;
- the expected correlated root DOM;
- meaningful visible DOM;
- no correlated runtime failure.

An empty root, `null` render or whitespace-only output is not meaningful. A
render commit alone and Sandpack completion alone are both insufficient.

## Result classifications

`FixtureExecutionResultSchema` accepts only `passed`, `compile-error`,
`runtime-error`, `blank-render`, `timeout`, `infrastructure-error` and
`cancelled`. Evidence records Sandpack completion, render commit, expected DOM
and meaningful DOM as booleans. The strict result schemas reject unknown fields,
including raw errors, compiler objects, source, iframe references and Sandpack
clients.

Compilation attribution remains provisional. Each fixture receives a new,
single-run provider/iframe, so an active `done.compilatonError` signal belongs to
that lifecycle. An uncorrelated message is never promoted to a compile verdict.
The adapter prefers its deterministic ten-second timeout to a false verdict.

## Serialization, cleanup and cancellation

The orchestrator awaits each result before starting the next fixture. Runtime,
blank, compile, timeout and infrastructure results do not stop later fixtures.
The adapter removes the active provider before resolving the fixture promise,
so crash and timeout cleanup precede the next lifecycle.

Starting a newer execution lease aborts the prior lease. Generating a new plan
unmounts the execution owner and aborts its session. Component unmount and the
Cancel action do the same. Progress and completion callbacks check lease
ownership, so a cancelled or replaced run cannot update the active UI.

## Minimal `/preflight` workflow

An accepted plan exposes **Run planned states**. The panel shows the current
fixture, completed/total counts, an active preview, ordered result badges,
bounded messages, all-pass or failure totals, cancellation and **Run again**.
Planning remains available during execution as an explicit replacement action;
loading a different example is disabled while a run owns the sandbox.

The page states explicitly: **Planned requirements are not automatically
verified by execution yet.** No execution result claims a prompt requirement
passed or failed.

## Fragile-component manual verification input

Use this prompt:

```text
Render a product summary with a visible title initial and price. Exercise empty
titles, a zero price and normal numeric values.
```

Use this TSX component:

```tsx
interface FragileProductProps {
  title: string;
  price: number;
}

export default function FragileProduct({
  title,
  price,
}: FragileProductProps) {
  if (price === 0) return null;

  const initial = title[0].toUpperCase();

  return (
    <article>
      <strong>{initial}</strong>
      <h2>{title}</h2>
      <p>{price.toFixed(2)}</p>
    </article>
  );
}
```

The deterministic happy path should pass. The empty-string fixture should
produce a contained runtime error. The zero-number fixture should produce a
blank render. A later negative or large-number fixture should still execute and
pass. Run the same plan again to verify a fresh session after both failures.

Automated tests prove the classifications, ordering, continuation, cancellation
and schema boundaries.

## Recorded local browser evidence

Local fragile-component verification passed with one twelve-fixture RunPlan:

- final totals were exactly nine passed and three failed;
- `det-empty-strings` produced a contained `runtime-error` with
  `Cannot read properties of undefined (reading 'toUpperCase')`;
- `ai-semantic-03` and `det-zero-numbers` produced `blank-render`;
- later fixtures continued after both runtime and blank failures and passed;
- the parent page remained mounted;
- **Run again** created a fresh session and reproduced the ordered results;
- no stale results from the completed first execution appeared; and
- no planned requirement was marked passed or failed.

Replacement cancellation remains pending because the supplied evidence did not
explicitly start a run and generate a replacement plan while it was in flight.
Public Vercel execution verification also remains pending. Gate 3 remains open
until production verification passes.
