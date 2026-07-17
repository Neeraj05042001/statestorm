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
- Current status: Accepted for the hackathon MVP, including execution in the
  selected cross-origin Sandpack iframe. This is not a malicious-code guarantee.

## D-002: Use Sandpack as the hackathon MVP execution candidate

- Recommendation: Use Sandpack as the selected browser-isolated execution
  engine for the hackathon MVP.
- Reason: F1 proves repeatable valid rendering, and F2 proves local runtime
  containment plus built-server recovery without adding a second bundler.
- Alternatives: Custom Babel/esbuild iframe compiler, WebContainers or server
  execution.
- Trade-off: Faster spike implementation in exchange for hosted CodeSandbox and
  package-service dependencies.
- Risk: External availability, client lifecycle fragility and unresolved
  security properties.
- Validation method: Gate 0 valid/crash/recovery/compile/deployment sequences.
- Current status: Accepted by the ChatGPT Project architecture authority as the
  hackathon MVP execution engine after public deployment verification. Later
  security hardening remains open.

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
- Current status: Accepted for Gate 0 after public verification of compiler
  recovery and a subsequent valid render.

## D-010: Accept Gate 0 sandbox feasibility baseline

- Recommendation: Accept the documented Next.js parent and cross-origin
  Sandpack `react-ts` execution path as the StateStorm hackathon MVP sandbox
  feasibility baseline.
- Reason: Local development, built-production and public deployment evidence
  proved visible fixture rendering, correlated runtime-error containment,
  parent heartbeat survival, runtime recovery, provisional compilation
  diagnostics and verified compiler recovery followed by a valid rerender.
- Alternatives considered: Replace Sandpack before the MVP, execute submitted
  code in the parent or server, or keep Gate 0 open pending post-hackathon
  security and resource-containment work.
- Trade-off: The MVP gains a proven execution path quickly while retaining a
  hosted dependency, strictly serialized runs and provisional compilation
  correlation.
- Risk: Gate 0 acceptance does not provide malicious-code hardening, resource-
  exhaustion containment, general component support or production security
  certification. `reactStrictMode: false` remains a temporary accommodation.
- Validation method: Run the accepted short/long/crash/heartbeat/recovery and
  invalid-source/compiler-recovery sequence in development, built production
  and the public deployment at `https://statestorm.vercel.app/gate-0`.
- Current status: Accepted by the ChatGPT Project architecture authority. Gate 0
  is passed and closed; no Gate 1 implementation has begun.

## D-011: Use Zod as the runtime contract system

- Recommendation: Define each Gate 1 domain contract as a Zod schema and export
  its TypeScript type through `z.infer`.
- Reason: One runtime source of truth prevents handwritten validation and static
  types from drifting.
- Alternatives considered: TypeScript interfaces with manual guards, JSON
  Schema generation or a second validation library.
- Trade-off: Domain modules depend on Zod and schema composition conventions.
- Risk: Library upgrades can change diagnostics or inferred types and require
  explicit contract-version review.
- Validation method: Runtime acceptance/rejection tests, strict type-checking
  and field-path assertions.
- Current status: Accepted as part of the RunPlan version 1 contract baseline;
  Gate 1 remains open.

## D-012: Restrict executable props to JSON values

- Recommendation: Permit only recursive JSON-compatible values in fixture
  props, defaults, enum values and assertion values.
- Reason: JSON data serializes deterministically and cannot smuggle executable
  callbacks or JSX into the execution boundary.
- Alternatives considered: Structured clone values, ReactNode, functions or
  source-string callbacks.
- Trade-off: Callbacks, Date, Map, Set, bigint and ReactNode props are excluded.
- Risk: Some otherwise valid React components cannot be represented by contract
  version 1.
- Validation method: Accept nested JSON and reject every named non-JSON value,
  including non-finite numbers and class instances.
- Current status: Accepted for contract version 1.

## D-013: Use a React-only import allowlist

- Recommendation: Allow `react` and tooling-required `react/jsx-runtime`; reject
  relative, alias and all other package imports.
- Reason: The first supported contract must be self-contained and compatible
  with the frozen React-only Sandpack baseline.
- Alternatives considered: Arbitrary npm dependencies, repository-relative
  modules or configurable aliases.
- Trade-off: Components that depend on local files, design systems or other
  packages are unsupported.
- Risk: The supported component population is intentionally narrow.
- Validation method: Schema tests for allowed React specifiers and rejected
  package, relative and alias specifiers.
- Current status: Accepted for contract version 1.

## D-014: Version and serialize RunPlan

- Recommendation: Require `version: 1`, strict schemas and a lossless JSON
  serialize/parse round trip for every RunPlan.
- Reason: Execution and future persistence need an explicit, portable contract
  rather than in-memory application objects.
- Alternatives considered: Unversioned TypeScript objects or executable plan
  fields.
- Trade-off: Contract evolution requires deliberate versioning and migration
  decisions.
- Risk: Version 1 may need replacement rather than silent extension when real
  component inputs are broader.
- Validation method: Strict parsing, JSON-boundary refinement and round-trip
  equality tests.
- Current status: Accepted for RunPlan version 1.

## D-015: Limit each RunPlan to twelve serialized fixtures

- Recommendation: Require at least one and at most twelve fixtures, with unique
  IDs and JSON-only props.
- Reason: A bounded MVP plan avoids unreviewed execution fan-out and keeps the
  serialized artifact inspectable.
- Alternatives considered: Unbounded fixtures or a larger arbitrary limit.
- Trade-off: Plans needing broader combinatorial coverage must be split or
  deferred.
- Risk: Twelve is an MVP operational bound, not a measured universal optimum.
- Validation method: Boundary schema tests, including rejection of thirteen
  fixtures.
- Current status: Accepted for RunPlan version 1.

## D-016: Defer execution-result contracts

- Recommendation: Stop at validated RunPlan data and executability
  classification; define execution requests and results in a later authorized
  architecture task.
- Reason: Gate 1 must establish inputs before coupling them to the frozen Gate 0
  sandbox or future detectors.
- Alternatives considered: Add a RunPlan executor, detector outputs or sandbox
  event mappings in SS-M1-001.
- Trade-off: A validated executable plan cannot yet be run through this new
  domain layer.
- Risk: Later execution evidence may require an explicitly versioned RunPlan
  successor or companion contract.
- Validation method: Dependency inspection confirms `src/domain` has no sandbox
  imports and tests call no executor.
- Current status: Accepted scope boundary for SS-M1-001; result contracts remain
  deferred.

## D-017: Accept the RunPlan version 1 contract baseline

- Recommendation: Accept the strict, versioned SS-M1-001 domain schemas,
  cross-field validation and separate executability classification as the
  RunPlan version 1 baseline.
- Reason: The baseline defines one runtime-validated JSON boundary for supported
  component metadata, requirements, fixtures and contract issues without
  coupling the domain layer to execution.
- Alternatives considered: Continue with unversioned TypeScript-only objects,
  defer acceptance until execution integration or expand version 1 to broader
  component inputs.
- Trade-off: The accepted contract is deliberately limited to self-contained
  React components, allowlisted imports, JSON values and at most twelve
  fixtures.
- Risk: Source-analysis and execution evidence may require an explicitly
  versioned successor rather than silently extending version 1.
- Validation method: Runtime schema tests, concrete issue-path assertions,
  executability tests, JSON round-trip tests, lint, strict type-checking and a
  production build.
- Current status: Accepted by the ChatGPT Project architecture authority. Gate 1
  remains open, and the next permitted work is source-code analysis into
  `ComponentContract`.
