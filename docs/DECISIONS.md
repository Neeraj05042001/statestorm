# StateStorm decisions

## D-001: Parent application must never execute submitted component code

- Recommendation: Keep submitted source only in Sandpack virtual files behind
  the client-only boundary.
- Reason: A preview failure must not share the Next.js parent execution context
  or server-rendering path.
- Alternatives: Parent `eval`, `new Function`, generated imports, server-side
  compilation or execution.
- Trade-off: The architecture depends on iframe messaging and an external
  compiler/runtime.
- Risk: The current iframe is not a hardened malicious-code sandbox.
- Validation method: Production build, client-only dynamic import inspection and
  protocol/source-window browser checks.
- Current status: Accepted.

## D-002: Use Sandpack as the hackathon MVP execution candidate

- Recommendation: Use Sandpack as the selected browser-isolated execution
  candidate for the hackathon MVP.
- Reason: F1 proves repeatable valid rendering, and F2 proves local runtime
  containment plus built-server recovery without adding a second bundler.
- Alternatives: Custom Babel/esbuild iframe compiler, WebContainers or server
  execution.
- Trade-off: Faster spike implementation in exchange for hosted CodeSandbox and
  package-service dependencies.
- Risk: External availability, client lifecycle fragility and unresolved
  security properties.
- Validation method: Gate 0 valid/crash/recovery/compile/deployment sequences.
- Current status: Accepted by the ChatGPT Project architecture authority for the
  hackathon MVP. Public deployment verification and later security hardening
  remain open.

## D-003: Use the Next.js App Router shell

- Recommendation: Retain the initialized Next.js 16.2.10 App Router shell.
- Reason: Repository preflight found an empty Git repository, so the original
  Gate 0 packet authorized this shell.
- Alternatives: Vite or another application framework.
- Trade-off: Next.js client/server boundaries must be kept explicit for a
  browser-only sandbox dependency.
- Risk: Framework development behavior can interact with third-party client
  effects, as the Sandpack Strict Mode issue demonstrated.
- Validation method: Lint, strict type check, static production build and direct
  `/gate-0` browser load.
- Current status: Accepted after repository inspection.

## D-004: Keep Gate 0 fixture inputs JSON-serializable

- Recommendation: Continue serializing the complete fixture payload with
  `JSON.stringify` before writing `/current-fixture.ts`.
- Reason: It keeps fixture input data-only and avoids executable string
  interpolation.
- Alternatives: JSX-valued fixtures, functions or arbitrary runtime imports.
- Trade-off: React nodes, callbacks and richer inputs are excluded from Gate 0.
- Risk: This scope does not yet represent every real component prop shape.
- Validation method: Inspect generated fixture source and repeat short/long runs.
- Current status: Accepted for Gate 0.

## D-005: Visible success requires current-client completion and DOM evidence

- Recommendation: Accept a valid render only when the current preview client is
  `done` and the current correlated runtime event proves the expected root,
  marker, title, description, non-empty text and layout box.
- Reason: Wrapper commit alone produced the F1 false positive, while early file
  updates could be dropped by Sandpack.
- Alternatives: Trust `useEffect` commit, trust Sandpack `done` alone, or infer
  success from an absence of errors.
- Trade-off: The check is deliberately coupled to the known Gate 0 sample.
- Risk: It must not be promoted into the final general detector architecture.
- Validation method: Fresh load, short-long-short sequence, iframe DOM snapshots
  and parent/iframe run-ID comparison.
- Current status: Accepted for the Gate 0 diagnostic.

## D-006: Disable Next development Strict Mode for the Sandpack hackathon MVP

- Recommendation: Use `reactStrictMode: false` for the current Sandpack-based
  hackathon MVP path. Reopen this decision before post-hackathon hardening,
  freezing the shell or broader product expansion.
- Reason: With effect replay active, browser evidence showed replaced/canceled
  iframe clients and a current client stuck at `initializing` while older iframe
  content existed. With replay disabled and current-client rebinding, repeated
  runs reached `done` reliably.
- Alternatives: Keep Strict Mode and accept intermittent initialization, patch or
  fork Sandpack, or replace the architecture in a separately authorized spike.
- Trade-off: React's development-only Strict Mode checks are disabled globally.
- Risk: Other parent-side effect bugs may be less visible during development.
- Validation method: Compare client/iframe lifecycle evidence before and after,
  then run two fresh short-long-short browser sequences.
- Current status: Accepted provisionally by the ChatGPT Project architecture
  authority for the Sandpack hackathon MVP path only.

## D-007: Treat Sandpack compilation observability as provisional

- Recommendation: For Gate 0 diagnostics only, combine the typed
  `sandpack.error` context with installed listener `action/show-error` and
  `done.compilatonError` messages while one serialized invalid diagnostic run is
  active.
- Reason: Both development and built-server probes distinguished invalid TSX
  from runtime failure and recovered in the same preview. The context error was
  null before injection, populated on failure and cleared after restoration.
- Alternatives: Treat compilation failure as a timeout, depend only on the
  iframe overlay, or build a new compiler/error normalizer.
- Trade-off: The diagnostic is machine-observable now, but the listener messages
  have no StateStorm nonce, run, fixture or mode fields.
- Risk: The installed listener includes the misspelled
  `compilatonError` field, and the reported message shape can reflect Sandpack
  internals. Neither should be frozen as the final StateStorm API.
- Validation method: Invalid `/UserComponent.tsx` injection, context and listener
  trace capture, absence of a current runtime event, distinct parent state, and
  valid-source restoration in development and built production servers.
- Current status: Accepted provisionally by the ChatGPT Project architecture
  authority while execution remains strictly serialized. It is not an accepted
  final compilation-error correlation contract.

## D-008: Serialize execution and reject stale preview output

- Recommendation: Permit exactly one compilation or fixture run at a time. Treat
  iframe DOM left from a prior successful run after invalid source as stale
  output, never as the current result.
- Reason: Sandpack compilation listener messages carry no StateStorm correlation
  fields, while the iframe can retain the previous valid DOM when new source
  fails before the runtime bridge starts.
- Alternatives: Run concurrent probes and infer ownership from arrival order, or
  treat any visible iframe DOM as current.
- Trade-off: Serialized execution limits throughput but gives the MVP an
  unambiguous active diagnostic run.
- Risk: Future concurrency requires a different compilation channel with stable
  message-level correlation.
- Validation method: Disable controls during a run, correlate valid/runtime
  events to the active run, and verify that invalid-source state rejects the
  retained previous run ID.
- Current status: Accepted for the hackathon MVP.

## D-009: Require an explicit current-client restoration handshake

- Recommendation: Restore invalid source through a dedicated serialized
  `recovery-bootstrap` run dispatched to the verified current client. Re-enable
  fixture execution only after a fresh compile `start`, successful `done`, null
  context error and fresh correlated `SANDBOX_READY` event.
- Reason: The pre-F4 provider-only transition changed the active mode too early.
  It neither proved that valid source completed on the current client nor
  separated late uncorrelated invalid-source errors from the next valid run.
- Alternatives: Clear error state immediately, delay by a fixed interval, trust
  provider file state, remount the Sandpack preview or refresh the parent.
- Trade-off: Recovery has an explicit intermediate run and waits for four
  signals before controls return.
- Risk: Listener compilation messages remain provisional and uncorrelated. The
  serialized restriction is still mandatory.
- Validation method: In development and built production mode, run two invalid
  TSX/restoration cycles, require all four recovery signals, then visibly render
  `safe-short` and `safe-long` while preserving the parent heartbeat.
- Current status: Implemented for Gate 0. Public verification of the corrected
  build remains pending; Gate 0 remains open.
