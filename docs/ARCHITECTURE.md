# StateStorm Gate 0 architecture

## Status

Sandpack is the accepted **browser-isolated execution engine** for the scoped
hackathon MVP. Gate 0 is formally accepted after local development,
built-production and public verification at
`https://statestorm.vercel.app/gate-0`.

Gate 1 is also formally accepted after local development, built-production and
public verification at `https://statestorm.vercel.app/analyze`. RunPlan version
1, deterministic source analysis and the server-only analysis workflow are now
frozen as the Gate 1 baseline.

## Current shell

- Next.js 16.2.10 App Router, TypeScript, ESLint and Tailwind CSS 4
- React and ReactDOM 19.2.4 in the StateStorm parent
- npm with `package-lock.json`
- `@codesandbox/sandpack-react` 2.20.0, which installs
  `@codesandbox/sandpack-client` 2.19.8
- `/gate-0` is statically prerendered, while Sandpack is loaded through a client
  component and `next/dynamic` with `ssr: false`

## Accepted Gate 0 baseline

### Accepted MVP architecture

- The Next.js application owns the parent UI and parent-only state. Submitted
  component code never executes in the parent or during server rendering.
- Sandpack's `react-ts` template executes the hardcoded component in a
  cross-origin CodeSandbox iframe.
- Explicit virtual files define the component, JSON-serialized fixture, runtime
  bridge, application wrapper, React entry, HTML root and preview styles.
- Compilation, recovery and fixture runs are strictly serialized.
- The runtime bridge emits bounded structured events. The parent accepts them
  only after protocol, nonce, run, fixture, component-mode and source-window
  correlation.
- Visible success requires current-client completion plus correlated marker,
  expected-content, non-empty-root and layout-box evidence.
- A sandbox error boundary contains the deliberate render crash, emits
  `RUNTIME_ERROR` and leaves the Next.js parent mounted and interactive.
- Compiler recovery requires a fresh current-client `start`, successful `done`,
  null Sandpack context error and correlated `SANDBOX_READY` before fixture
  controls return.
- Direct public navigation, hosted dependency reachability, runtime recovery and
  compiler recovery were verified at
  `https://statestorm.vercel.app/gate-0`.

### Temporary accommodations

- `reactStrictMode: false` remains limited to the Sandpack hackathon MVP path.
- Compilation observability remains provisional because installed listener
  messages have no StateStorm run-level correlation.
- Strict serialization is mandatory; retained iframe DOM after a compilation
  failure is stale and cannot be accepted as the current result.
- Visible-output checks are deliberately coupled to the known Gate 0 component
  and fixtures.

### Unresolved post-hackathon hardening

- malicious-code security analysis and enforcement
- CPU, memory, infinite-loop, storage and network-abuse containment
- a stable correlated compiler-error contract
- hosted-service availability and version-control strategy
- general component inputs, dependencies and framework support
- restoration of React Strict Mode or replacement of the incompatible client
  lifecycle

## Gate 1 domain-contract layer

SS-M1-001 adds a domain layer under `src/domain` before any execution adapter.
Zod runtime schemas define `ComponentSubmission`, `ComponentContract`,
`PropDefinition`, `Requirement`, `Fixture`, `ContractIssue` and versioned
`RunPlan` data. Their TypeScript types are inferred from the schemas rather than
maintained separately.

The layer validates supplied metadata, enforces the React import allowlist and
JSON-only executable values, and performs RunPlan cross-field validation.
Structural validation is separate from executability: a plan with an
error-severity `ContractIssue` is valid serialized data but is classified as
non-executable.

This layer is deliberately separated from the frozen Gate 0 execution path.
There is no AI call, fixture generator, requirement evaluator,
RunPlan-to-Sandpack adapter or execution-result contract. Nothing in
`src/domain` or `src/analysis` imports the sandbox spike, and Gate 0 behavior is
unchanged.

## Gate 1 deterministic source-analysis layer

SS-M1-002 adds `src/analysis/component-source` between a validated
`ComponentSubmission` and the accepted `ComponentContract` schema. It parses
the submitted string in memory with the installed TypeScript Compiler API and
traverses syntax nodes directly. It never executes, imports, transpiles or
writes submitted code.

The layer has a deliberate facts-only boundary. It records static syntax facts:
allowlisted imports, one named default function component, local prop
declarations, source-order properties, optional markers, literal unions and
complete JSON destructuring defaults. Later AI interpretation may consume a
validated contract, but AI does not participate in source parsing or override a
parser rejection.

Analysis fails closed. Syntax diagnostics, disallowed imports, ambiguous default
exports, imported or unresolved prop types, complex composition and executable
prop shapes produce stable `ContractIssue` errors and no partial contract. A
candidate is accepted only after `ComponentContractSchema` validates it.

This is limited local AST analysis rather than full TypeScript semantic type
checking. No `Program`, type checker, module resolver, JSDoc inference or
dependency graph is created. The full pipeline and supported subset are
recorded in `docs/SOURCE_ANALYSIS.md`.

## Accepted Gate 1 server-only analysis flow

The accepted Gate 1 request path is:

`Browser submission -> POST /api/component-analysis -> Node.js server-only service -> deterministic AST analyzer -> validated ComponentContract or ContractIssue errors`

The browser owns form state, creates a URL-safe request ID, sends the strict
`ComponentSubmission` JSON value and renders the returned diagnostic contract
or issues. It does not import the analyzer or TypeScript Compiler API. The
shared client-safe response schema reuses `ComponentContractSchema` and
`ContractIssueSchema` without importing anything from `src/analysis`.

The Route Handler explicitly selects the Node.js runtime. It safely parses and
validates JSON, treats unsupported source as a normal HTTP 200 analysis outcome,
and maps malformed input or unexpected failures to bounded schema-valid issues.
Responses are `no-store` and never contain raw TypeScript diagnostics, `Error`
objects or stack traces.

The dedicated service under `src/server/component-analysis` is marked with
`import "server-only"`. It revalidates the submission, invokes the accepted
analyzer and validates the final API response. Submitted code remains an
in-memory string: the service never executes it, imports it, loads a submitted
module or writes it to the filesystem.

The `/analyze` page is deliberately a minimal diagnostic workflow. It does not
persist input, invoke AI, generate fixtures, integrate with Sandpack or change
the frozen Gate 0 runtime.

The accepted language boundary distinguishes prop-less JSX from props-driven
components. A prop-less named JSX component is supported. A component with
props must use TSX and locally declared prop types. Neither JSDoc nor PropTypes
is inspected for prop inference.

The complete `ComponentSubmission` contract continues to require a prompt. The
current deterministic analyzer validates the submission but does not interpret
the prompt. That field becomes essential when a later authorized milestone adds
requirement extraction and fixture planning.

Public verification confirmed accepted contract display, prop optionality, enum
values and defaults, stable unsupported-import and syntax issues, stable missing
or unresolved props issues, sanitized server failures, the Node.js server-only
boundary and the unchanged Gate 0 route. The diagnostic UI remains temporary
and is not the final StateStorm product design.

## Verified Sandpack setup

The provider uses the installed `react-ts` template with no `customSetup`.
`/UserComponent.tsx` is the active editor file. It is not the runtime entry.
The template's `/package.json` declares `/index.tsx` as `main`; that explicit
virtual file mounts `<App />` into the explicit `#root` in
`/public/index.html` by using `createRoot`.

The resolved virtual project contains:

| File | Verified responsibility |
| --- | --- |
| `/UserComponent.tsx` | Typed sample component with the diagnostic card marker |
| `/current-fixture.ts` | Safely serialized nonce, run ID, fixture ID, component mode and props |
| `/runtime-bridge.tsx` | Error boundary, visible-DOM evidence and structured events |
| `/App.tsx` | Marked diagnostic root and component/fixture composition |
| `/index.tsx` | Actual React root entry and mount |
| `/public/index.html` | Explicit `#root` host element |
| `/styles.css` | Minimal visible preview styles |
| `tsconfig.json` | Inherited from the installed `react-ts` template |
| `/package.json` | Inherited template dependencies and `/index.tsx` main |

Browser resource evidence showed matching sandbox React and ReactDOM 19.2.7
packages. The two sandbox packages are compatible with each other. Their patch
version is resolved by the hosted template and is independent of the parent's
19.2.4 patch version.

All generated imports use matching path casing. Browser inspection confirmed
that the diagnostic root mounts, the CSS does not hide it, and the short card
has a non-zero 607 by 183 pixel layout box in the validation viewport.

## Verified F1 root cause

The failure had three concrete causes:

1. Fixture controls were enabled during Sandpack startup. In the installed
   Sandpack React implementation, the immediate recompilation effect calls
   `client.updateSandbox` only when `client.status === "done"`. An update made
   earlier is skipped and is not replayed merely because the client later
   becomes done. The parent nevertheless waited on the new run ID, so it timed
   out while the iframe retained older content.
2. `RenderCommitReporter` reported from a sibling effect after the wrapper
   committed. It did not inspect the component root, marker, title, description
   or layout box. Consequently, `RENDER_COMMITTED` meant "the bridge committed,"
   not "the expected component is visibly present."
3. During development validation, Strict Mode effect replay produced replaced
   Sandpack clients: canceled iframe navigations were observed, and the iframe
   contained the bootstrap DOM while the client returned by the current preview
   ref remained `initializing`. With Strict Mode disabled for this provisional
   dependency and the observer rebound to the current client instance, the
   current client consistently reached `done` and accepted repeated updates.

Browser evidence recorded a timed-out
`POST https://col.csbops.io/data/sandpack`. Public verification confirmed that
this external telemetry failure is non-blocking: compilation, rendering and
recovery still completed. It remains a network limitation, not a StateStorm run
failure.

## Corrected initialization and run lifecycle

Initialization requires both:

1. The current preview client reaches `done`.
2. A source-window-verified bootstrap event proves that the iframe root contains
   the expected marker, title and description, non-empty text and a non-zero
   layout box.

Fixture buttons remain disabled until both signals arrive. Initialization that
misses either signal becomes an explicit initialization failure after the named
30-second provisional timeout.

All compilation and fixture execution is strictly serialized. Controls stay
disabled while the single active run is in flight. The MVP must not introduce a
second concurrent compile or fixture request because Sandpack compilation
messages have no StateStorm run-level correlation.

Before every valid run, the parent rechecks that the current preview client is
still `done`. It then creates a new run ID, writes only the serialized fixture
file and enters `Compiling current run`. A run becomes `Component visibly
rendered` only after both the current client's new `done` message/status and a
strictly validated `RENDER_COMMITTED` event arrive for the same nonce, run ID,
fixture ID and `componentMode: "valid"`.

The runtime event includes diagnostic-only evidence:

- root child count
- rendered text length
- diagnostic marker presence
- expected title presence
- expected description presence
- non-zero visible layout box

Missing evidence produces `RENDER_EVIDENCE_MISSING`, never success. Parent-side
protocol validation and `MessageEvent.source` equality still reject stale,
mismatched or unrelated messages.

## Confirmed F1 findings

- A fresh development load reaches explicit Sandpack readiness.
- `safe-short`, `safe-long`, then `safe-short` again each use unique correlated
  runs and visibly update the same iframe without a parent refresh.
- Reloading the parent and rerunning `safe-short` also succeeds.
- The explicit virtual entry mounts into the expected root.
- The parent console showed only development informational/HMR messages, with no
  uncaught parent exception or hydration error.
- The production build succeeds and statically prerenders `/gate-0` without
  executing submitted component code on the server.

## Verified runtime crash and recovery flow

The `runtime-crash` fixture throws `Deliberate Gate 0 runtime failure` during
React rendering. The sandbox error boundary catches the value, converts it to
bounded name/message/optional-stack strings, and emits `RUNTIME_ERROR` with the
protocol source, version, nonce, run ID, fixture ID and component mode.

The boundary key is `currentFixture.runId`, so the next serialized run resets the
controlled fallback without remounting the parent page or Sandpack provider. A
failed render cannot mount the sibling evidence reporter and therefore cannot
emit `RENDER_COMMITTED`.

The parent accepts the error only after protocol correlation and
`MessageEvent.source` equality checks. It enters the distinct `Runtime error`
state while parent-owned heartbeat state remains interactive. Development and
built-server tests both recovered to `safe-short` and then visibly different
`safe-long` content without a parent refresh.

## Verified compilation diagnostic flow

The invalid probe batches a new serialized run with
`componentMode: "invalid-compilation-probe"` and syntactically invalid
`/UserComponent.tsx`. The parent records the context error before replacement and
all relevant installed listener messages for the active probe.

Observed messages were `start`, status transitions,
`done.compilatonError=true`, and `action/show-error`. The installed public
context `error` changed from null to a populated `SandpackError` and cleared
after valid source restoration. The invalid current source never started the
current runtime bridge; the iframe retained the last valid DOM, whose run ID did
not match the invalid parent run. The parent therefore reported neither visible
success nor runtime error and instead displayed `Compilation diagnostic error`.

Compilation failures are classified through the active
`invalid-compilation-probe` mode, typed context error and installed listener
signals. This classification is accepted provisionally for the serialized MVP.
Listener messages contain no StateStorm nonce, run, fixture or mode correlation
and are not a stable final correlation contract.

When invalid source prevents the new runtime bridge from starting, the iframe
may continue displaying DOM from the previous valid run. That DOM is explicitly
stale output. Its run ID does not match the active invalid diagnostic, and it
must never be accepted as the current result.

## Verified F4 compilation-recovery root cause

The pre-F4 restoration path updated provider files and immediately changed the
active component mode from `invalid-compilation-probe` to `valid`. It did not
wait for a new current-client compile cycle, a cleared Sandpack context error or
a fresh runtime bootstrap before re-enabling fixture execution.

That created two related races. Source restoration and a subsequent fixture
update could overlap, and a late `done.compilatonError` or `action/show-error`
message from the invalid compile could be interpreted under the newly active
valid run. Because those listener messages have no StateStorm correlation
fields, the parent could enter `Run failure` even though the error belonged to
the previous invalid source. The iframe then continued displaying the stale
compilation result.

Installed Sandpack behavior also explains why provider state alone was not
proof of recovery: its file-update observer dispatches only to registered
clients whose status is already `done`. The old restore path prechecked that
status but did not prove that the restored files started and completed a fresh
compile on the same client.

## Corrected restoration lifecycle

Restoration is now a distinct serialized `recovery-bootstrap` run:

1. The parent verifies the current preview client is `done`, writes the valid
   `/UserComponent.tsx` plus the recovery fixture into provider state and calls
   `updateSandbox` with those exact files on that same client.
2. Controls remain disabled while the parent observes a fresh listener `start`.
3. The current client must then report a successful `done`; an old already-done
   snapshot is not accepted as the recovery completion.
4. The public Sandpack context error must be null.
5. The restored runtime bridge must emit a fresh source-window-validated and
   run-correlated `SANDBOX_READY` event.
6. Only after all four recovery signals are present does the parent enter
   `Compiler recovery verified`, clear the serialized in-flight lock and enable
   fixture controls.

Compilation failures are current results only while the active serialized mode
is `invalid-compilation-probe`. Uncorrelated listener errors observed during a
valid or recovery run are retained as diagnostics but cannot fail that run. A
valid render additionally requires a null current context error. No parent
refresh, Next.js remount or Sandpack client remount is used; parent-owned
heartbeat state survives both recovery cycles.

## Verified timeout behavior

Runtime and compilation outcomes stop the current run timer with their distinct
states. A deliberately isolated iframe produced no outcome for a current valid
run and reached the provisional 20,000 ms `Timed out` transition. During that
run, a stale message from the actual iframe window was rejected for nonce
mismatch and did not cancel the timer. Initialization retains its separate
30,000 ms failure transition. No automatic retries were added.

## Built production-server evidence

`npm run build` compiled and statically prerendered `/gate-0`. The normal
`npm run start -- -p 3100` command served the route at
`http://localhost:3100/gate-0`. Edge 150 direct navigation reached readiness and
completed safe, crash, heartbeat, safe recovery and long-content checks. F4 then
passed two complete invalid-source recovery cycles followed by visible
`safe-short` and `safe-long` renders. Both recoveries proved current-client
start/successful-done, null context error and fresh bootstrap evidence. The
production parent target recorded no `Run failure`, console message, uncaught
exception or loading failure.

## Public deployment evidence

Direct navigation to `https://statestorm.vercel.app/gate-0` completed the
accepted Gate 0 path. The deployment visibly rendered both safe fixtures,
contained the deliberate runtime crash, preserved and incremented the parent
heartbeat, recovered without refreshing the parent, classified invalid TSX,
reached `Compiler recovery verified` after restoring valid source and visibly
rendered a final valid fixture. Hosted Sandpack dependencies were reachable.

## Post-hackathon work still open

- Compilation diagnostics remain limited to serialized execution because they
  lack message-level StateStorm correlation.
- The development Strict Mode trade-off must be reopened before
  post-hackathon hardening or broader product expansion.
- Resource exhaustion, infinite-loop containment and malicious-code hardening
  remain unimplemented.
