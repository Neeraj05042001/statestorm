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
- Current status: Accepted by the ChatGPT Project architecture authority and
  frozen as part of the formally accepted Gate 1 baseline in D-028.

## D-018: Parse component source with the TypeScript Compiler API

- Recommendation: Parse submitted TSX and JSX with `typescript.createSourceFile`
  and traverse the resulting syntax tree.
- Reason: The accepted component language is React TSX/JSX, and the installed
  compiler provides deterministic syntax structure and diagnostics without
  executing source.
- Alternatives considered: Regular-expression parsing, Babel, ts-morph, SWC or
  importing/transpiling the submitted module.
- Trade-off: The analyzer is coupled to the installed TypeScript syntax API.
- Risk: Compiler upgrades can change parse diagnostics or node shapes and
  require explicit analyzer regression review.
- Validation method: Syntax, import, export and prop tests assert stable domain
  output without AST snapshots.
- Current status: Accepted as part of the SS-M1-002 deterministic
  source-analysis baseline.

## D-019: Use limited local AST facts instead of semantic type checking

- Recommendation: Resolve only declarations present in the submitted source and
  do not create a TypeScript `Program`, type checker or module resolver.
- Reason: The frozen self-contained subset needs predictable local facts, not
  repository or package graph access.
- Alternatives considered: Full TypeScript semantic analysis, package
  resolution or repository-aware compilation.
- Trade-off: Type aliases and object relationships beyond the documented local
  subset cannot be interpreted.
- Risk: Some semantically valid React components are rejected.
- Validation method: Local interface, object alias and inline-type tests pass;
  imported, unresolved, inherited and composed types fail with stable issues.
- Current status: Accepted for SS-M1-002; broader semantic analysis is deferred.

## D-020: Fail closed for unsupported source and prop types

- Recommendation: Return `accepted: false` with stable `ContractIssue` errors
  whenever syntax or type structure is ambiguous or outside the supported
  subset.
- Reason: Silently guessing `unknown` would misclassify executable component
  contracts and weaken the JSON execution boundary.
- Alternatives considered: Best-effort inference, warnings with partial
  contracts or coercing unsupported values to `unknown`.
- Trade-off: The analyzer rejects inputs that a human or full compiler could
  interpret.
- Risk: The MVP support rate is intentionally narrow.
- Validation method: Unsupported callback, ReactNode, built-in, generic,
  imported and composed type tests return errors and never a partial contract.
- Current status: Accepted for SS-M1-002.

## D-021: Require one named default function component

- Recommendation: Resolve only named default function declarations or named
  local function/arrow declarations exported directly as default.
- Reason: A stable local component name and direct declaration make resolution
  deterministic without executing wrappers.
- Alternatives considered: Anonymous defaults, class components, default
  expressions, higher-order components, `memo` or `forwardRef` wrappers.
- Trade-off: Common wrapped or anonymous React patterns are unsupported.
- Risk: Users must simplify otherwise valid components before submission.
- Validation method: Every supported declaration pattern passes; anonymous,
  class, generic, multi-parameter and wrapped defaults return named issue codes.
- Current status: Accepted for the MVP source subset.

## D-022: Defer imported prop types and complex composition

- Recommendation: Accept only inline object types and one local non-inherited,
  non-generic interface or object type alias for props.
- Reason: Imported types, intersections, conditional or mapped types require
  semantic/module analysis outside the frozen task.
- Alternatives considered: Resolve dependency graphs, merge interfaces or
  approximate composed types from syntax alone.
- Trade-off: Multi-file and composition-heavy components are rejected.
- Risk: Version 1 source analysis does not cover arbitrary production React
  type patterns.
- Validation method: Imported, inherited, intersection, indexed-access and
  unresolved prop tests fail closed with useful source paths.
- Current status: Accepted SS-M1-002 scope boundary; complex composition remains
  deferred.

## D-023: Keep analyzer integration behind a dedicated server-only adapter

- Recommendation: Connect the accepted analyzer to future UI work only through
  a dedicated adapter marked `server-only`. No client component or
  client-transitive module may import the analyzer or the TypeScript runtime.
- Reason: The analyzer has a runtime dependency on the TypeScript Compiler API,
  while submitted source analysis belongs on the server boundary and must not
  enlarge or expose the browser bundle.
- Alternatives considered: Import the analyzer directly into a client
  component, share its runtime entry through a client-transitive barrel or run
  TypeScript parsing in the browser.
- Trade-off: The component submission workflow requires an explicit Route
  Handler, Server Action or equivalent server boundary and a serializable
  request/result contract.
- Risk: The workflow requires a reachable application server and ships the
  TypeScript runtime in the server build. Later deployment changes could regress
  the verified boundary or server artifact footprint.
- Validation method: Inspect the client dependency graph for analyzer and
  `typescript` imports, build the connected production application, and verify
  the deployed server-only analysis request without shipping TypeScript to the
  client.
- Current status: Accepted and frozen in the Gate 1 baseline after local,
  built-production and public server-boundary verification.

## D-024: Use a Node.js Route Handler as the explicit analyzer boundary

- Recommendation: Accept component analysis only through
  `POST /api/component-analysis`, explicitly configured for the Node.js runtime.
- Reason: The browser needs a narrow serializable boundary while the analyzer
  requires the server-scoped TypeScript Compiler API.
- Alternatives considered: Direct client analyzer import, Server Action or a
  generic service framework.
- Trade-off: Analysis requires a round trip to the application server.
- Risk: A missing server or deployment bundling failure makes analysis
  unavailable even though the form can load.
- Validation method: Route tests, production build artifact inspection and a
  successful built-server API request.
- Current status: Accepted and frozen in the Gate 1 baseline.

## D-025: Treat unsupported source as a normal analysis result

- Recommendation: Return HTTP 200 with `accepted: false` and validated issues
  when a well-formed submission is outside the frozen source subset.
- Reason: Unsupported syntax is an expected deterministic result, not an
  infrastructure failure.
- Alternatives considered: HTTP 4xx or 500 for analyzer rejections.
- Trade-off: Callers must inspect the discriminant rather than infer support
  from the HTTP status alone.
- Risk: Clients that ignore the response schema could misread a 200 response.
- Validation method: Service, Route Handler and built-server unsupported-import
  checks.
- Current status: Accepted fail-closed Gate 1 behavior.

## D-026: Do not persist component-analysis submissions

- Recommendation: Keep prompt and source only in browser state and the current
  request. Add no timestamps, database or server-side submission store.
- Reason: Persistence is not required to prove the server-only analyzer
  boundary and would expand privacy and product scope.
- Alternatives considered: Local storage, server session or database records.
- Trade-off: Reloading the page loses the form contents and results.
- Risk: Users cannot recover or share a prior analysis.
- Validation method: Code inspection for storage, database and filesystem-write
  paths.
- Current status: Accepted Gate 1 scope boundary.

## D-027: Use a minimal diagnostic UI before product workflow design

- Recommendation: Present the submitted fields, accepted contract table and
  actionable issues without adding final visual polish or editing/execution
  features.
- Reason: This milestone validates the request boundary and analyzer result,
  not the final StateStorm interaction design.
- Alternatives considered: Full editor, state atlas or integrated Sandpack
  preview.
- Trade-off: The page is useful for verification but intentionally limited.
- Risk: It must not be mistaken for the complete StateStorm workflow.
- Validation method: Development and built-server checks for every required UI
  state and the supported example.
- Current status: Accepted as a temporary Gate 1 diagnostic; final product UI
  remains deferred.

## D-028: Accept the Gate 1 component-contract and server-analysis baseline

- Recommendation: Freeze RunPlan version 1, deterministic component source
  analysis and the public `/analyze` server workflow as the accepted Gate 1
  baseline.
- Reason: Local development, built-production and public Vercel evidence prove
  supported contract extraction, stable fail-closed issues, sanitized failure
  handling and an intact Gate 0 boundary.
- Accepted flow: Browser submission -> `POST /api/component-analysis` -> Node.js
  server-only service -> deterministic AST analyzer -> validated
  `ComponentContract` or `ContractIssue` errors.
- Binding boundary: The analyzer and TypeScript Compiler API remain server-only.
  Unsupported imports, syntax, prop declarations and prop types continue to
  fail closed without a partial contract.
- JSX boundary: Prop-less JSX components are supported. Props-driven components
  must use TSX with locally declared prop types; JSDoc and PropTypes inference
  remain unimplemented.
- Prompt boundary: The complete `ComponentSubmission` contract still requires a
  prompt. Deterministic source analysis does not interpret it; requirement
  extraction will make it operationally essential in the next milestone.
- UI boundary: `/analyze` is a temporary diagnostic interface, not the final
  StateStorm product design.
- Preserved limitations: Self-contained components, local JSON-compatible props,
  no callbacks or ReactNode, no imported prop types, no full TypeScript semantic
  checking, no persistence, and no AI or sandbox execution from `/analyze`.
- Validation method: Required command validation plus public supported,
  unsupported, syntax, props-resolution, sanitization, server-boundary and Gate
  0 regression evidence.
- Current status: Formally accepted by the ChatGPT Project architecture
  authority. Gate 1 is passed and closed; no Gate 2 implementation has begun.

## D-029: Generate a deterministic fixture baseline independently of AI

- Recommendation: Always derive a bounded boundary-fixture collection directly
  from a validated `ComponentContract`, without a model call.
- Reason: StateStorm needs a reliable fallback and demo foundation when AI is
  unavailable or later semantic output is rejected.
- Alternatives considered: Wait for AI fixture generation or require hand-
  authored fixtures.
- Trade-off: Deterministic metadata-only values are less domain-specific.
- Risk: Users could mistake boundary coverage for semantic requirement coverage.
- Validation method: Identical-input equality, no-randomness inspection and
  focused baseline/strategy tests.
- Current status: Implemented by SS-M2-001; Gate 2 remains open.

## D-030: Freeze deterministic fixture IDs and generation order

- Recommendation: Use the documented `det-*` IDs and fixed candidate priority
  for every identical component contract.
- Reason: Stable IDs and order support repeatable RunPlan assembly, tests and
  later execution correlation.
- Alternatives considered: UUIDs, timestamps or sorting by generated values.
- Trade-off: Adding or reprioritizing a strategy becomes an explicit contract
  decision.
- Risk: Downstream consumers may become coupled to these version-1 IDs.
- Validation method: Exact ordered-ID assertions, unique-ID checks and repeated
  generation equality.
- Current status: Implemented for the SS-M2-001 baseline.

## D-031: Vary prop groups instead of generating a Cartesian product

- Recommendation: Apply each boundary strategy to all matching props together,
  plus one combined-stress fixture.
- Reason: A Cartesian product grows without bound and conflicts with the
  accepted twelve-fixture RunPlan maximum.
- Alternatives considered: One fixture per prop/value or all combinations.
- Trade-off: A grouped failure may not identify which individual prop caused
  the outcome.
- Risk: Later diagnostic isolation may require targeted semantic fixtures.
- Validation method: Strategy-specific prop assertions and maximum-count tests.
- Current status: Accepted SS-M2-001 scope boundary.

## D-032: Limit collection planning to defaults or empty containers

- Recommendation: Reuse explicit JSON defaults and otherwise represent arrays
  with `[]` and objects with `{}`.
- Reason: `ComponentContract` records a flat kind and type text, not executable
  nested shape metadata. Evaluating type text or guessing members would violate
  the deterministic boundary.
- Alternatives considered: Parse type text, invent nested values or omit
  required collections.
- Trade-off: Populated collection behavior is uncovered without an explicit
  default.
- Risk: Empty-only coverage may miss important nested rendering states.
- Validation method: Collection boundary tests and one stable
  `LIMITED_COLLECTION_FIXTURE_COVERAGE` warning.
- Current status: Implemented; richer collection planning remains deferred.

## D-033: Deduplicate before enforcing the twelve-fixture cap

- Recommendation: Validate ordered candidates, compare their props through
  canonical nested JSON, keep the first duplicate, then retain at most twelve.
- Reason: Defaults can make later strategies identical to happy path; duplicates
  should not consume the limited RunPlan fixture budget.
- Alternatives considered: Compare raw `JSON.stringify` output, retain duplicate
  states or truncate before deduplication.
- Trade-off: A strategy ID disappears when it produces no distinct state.
- Risk: Future canonicalization changes could alter which candidate survives.
- Validation method: Nested property-order deduplication, first-wins, limit and
  stable-warning tests.
- Current status: Implemented for SS-M2-001.

## D-034: Use Gemini as the single MVP semantic-planning provider

- Recommendation: Use the native `@google/genai` SDK and default to
  `gemini-3.1-flash-lite`, with `GEMINI_API_KEY` and an optional bounded
  `GEMINI_MODEL` server override.
- Reason: Official model documentation supports structured output for this
  exact identifier, and current official pricing explicitly lists a free tier
  suitable for the hackathon planning workload.
- Alternatives considered: A separately billed provider, multiple provider
  abstractions or a newer model whose free-tier availability was not explicit.
- Trade-off: Free-tier quotas and model availability are external and may vary.
- Risk: Provider output remains nondeterministic and may be unavailable.
- Validation method: Official documentation review, dependency audit and fake-
  provider tests; no live provider test is required or performed.
- Current status: Implemented and accepted for SS-M2-002. Public production AI
  planning was verified with `GEMINI_MODEL=gemini-3.1-flash-lite`, now also the
  repository default. The bounded override remains unchanged.

## D-035: Keep Gemini behind a one-request server-only boundary

- Recommendation: Initialize the SDK lazily in an `import "server-only"`
  adapter, make one request, set retry attempts to one and apply an approximately
  12-second timeout.
- Reason: API keys and provider SDK types must not enter a client-transitive
  graph, and implicit SDK retries would violate the bounded planning request.
- Alternatives considered: Client-side calls, automatic retry or provider
  orchestration frameworks.
- Trade-off: Transient failures immediately use deterministic fallback.
- Risk: An abort signal cannot revoke provider work already accepted remotely.
- Validation method: Adapter configuration inspection, dependency-graph audit
  and injected fake-provider tests.
- Current status: Implemented for SS-M2-002.

## D-036: Send metadata, never submitted source, to Gemini

- Recommendation: Send only the original prompt, serialized validated contract,
  deterministic happy-path props and trusted planning instructions.
- Reason: Semantic planning needs product intent and safe prop metadata, not the
  submitted implementation string.
- Alternatives considered: Send full source, server metadata or prior errors.
- Trade-off: Gemini cannot reason about implementation details absent from the
  deterministic contract.
- Risk: Prompt and contract data still leave the application boundary and must
  be treated as provider-visible data.
- Validation method: Exact provider input-key tests and client/server import
  inspection.
- Current status: Implemented as a binding data-minimization boundary.

## D-037: Treat every Gemini proposal as untrusted planning input

- Recommendation: Request structured JSON, parse it through the strict proposal
  Zod schema, then materialize requirements and fixtures through existing domain
  schemas and deterministic compatibility checks.
- Reason: Provider schema conformance is not proof that values are safe,
  supported or true.
- Alternatives considered: Use provider objects directly or let the provider
  construct a complete RunPlan.
- Trade-off: Invalid candidates are dropped and deterministic assertions without
  trusted assertion data are rejected.
- Risk: Conservative validation can discard useful but unsupported suggestions.
- Validation method: Malformed output, unknown prop, invalid JSON, type mismatch,
  required omission, deduplication, limit and final RunPlan tests.
- Current status: Implemented for SS-M2-002.

## D-038: Preserve a deterministic-only RunPlan for every expected AI failure

- Recommendation: Map missing credentials, quota exhaustion, timeout, refusal,
  malformed output and provider failure to bounded public statuses and warnings,
  then assemble the deterministic fixture plan without fabricated requirements.
- Reason: Semantic enrichment is optional; planning must not depend on external
  capacity and expected provider failure must not produce HTTP 500.
- Alternatives considered: Fail the request, retry automatically or invent
  prompt requirements locally.
- Trade-off: A fallback plan can contain zero requirements and no semantic
  fixtures.
- Risk: Users may receive less meaningful coverage without noticing the status;
  the UI therefore displays it explicitly.
- Validation method: Fake-provider tests for all six statuses and RunPlan schema
  validation of every fallback.
- Current status: Implemented for SS-M2-002; it does not execute the RunPlan.

## D-039: Execute RunPlan fixtures serially

- Recommendation: Preserve validated RunPlan fixture order and await exactly one
  sandbox result before starting the next fixture.
- Reason: Sandpack compilation diagnostics remain correlated only to one active
  lifecycle, and ordered progress must match the accepted plan.
- Trade-off: A twelve-fixture plan is slower than parallel execution.
- Current status: Implemented for SS-M3-001; concurrency remains disallowed.

## D-040: Use one clean Sandpack lifecycle per fixture

- Recommendation: Mount one client-only `react-ts` provider and iframe for the
  active fixture, then remove it before resolving the executor promise.
- Reason: Clean lifecycles prevent retained DOM, runtime fallback and compiler
  state from being accepted by a later fixture.
- Trade-off: Hosted dependencies and compilation initialize repeatedly.
- Current status: Implemented for the Gate 3 execution slice. Gate 0 keeps its
  accepted same-provider recovery diagnostic unchanged.

## D-041: Continue the session after fixture-level failures

- Recommendation: Record runtime, blank, compile, timeout and infrastructure
  results without stopping later fixtures.
- Reason: One fragile state must not hide the remaining planned states.
- Trade-off: A session can complete with multiple independent failures.
- Current status: Implemented in the framework-independent orchestrator.

## D-042: Require completion plus visible DOM evidence for success

- Recommendation: Mark passed only after active Sandpack completion, correlated
  render commit, expected root DOM, meaningful visible DOM and no runtime error.
- Reason: Gate 0 proved that iframe creation, bundle readiness and wrapper commit
  are insufficient success signals.
- Trade-off: The general meaningful-DOM check remains intentionally minimal.
- Current status: Implemented; empty and whitespace-only output is blank.

## D-043: Cancel stale planning and execution ownership

- Recommendation: A newer execution, new plan request, explicit cancellation or
  component unmount aborts the current lease and invalidates late updates.
- Reason: Results from replaced fixtures must never update the active UI.
- Trade-off: Partial cancelled results are not resumed.
- Current status: Implemented with AbortSignal and generation ownership.

## D-044: Keep execution results separate from requirements

- Recommendation: Use a strict companion execution-result schema and never add
  result or verdict fields to Fixture, Requirement or RunPlan v1.
- Reason: Browser render evidence does not yet verify prompt requirements.
- Trade-off: Users review planned requirements and execution outcomes separately.
- Current status: Implemented; no requirement pass/fail verdict exists.

## D-045: Defer screenshots and the state atlas

- Recommendation: Show only the active iframe, ordered status badges and bounded
  messages in SS-M3-001.
- Reason: Screenshot capture, atlas layout and advanced detectors require later
  architecture decisions.
- Current status: Deferred; no screenshot or atlas dependency was added.

## D-046: Accept and freeze the Gate 3 RunPlan execution baseline

- Recommendation: Accept SS-M3-001 at
  `1aba17aa5d9d97ae76521f76bf00987fef685cea` as the frozen Gate 3 baseline for
  serialized RunPlan fixture execution through the client-only Sandpack
  boundary.
- Reason: Local and public Vercel evidence proved a twelve-fixture serial run
  with exact nine-passed and three-failed outcomes, continuation after runtime
  and blank failures, parent survival, fresh ordered reruns, replacement
  cancellation and rejection of stale results.
- Replacement evidence: A new prompt and component submitted during an active
  rerun removed the prior execution's UI ownership. Its results did not
  reappear, and the replacement became active before being correctly rejected
  with `UNSUPPORTED_PROP_TYPE` for `onAddToCart?: () => void`.
- Preserved boundary: Execution results do not verify planned requirements, and
  Gate 3 adds no screenshots, visual atlas or advanced detector behavior.
- Current status: Accepted by the ChatGPT Project architecture authority. Gate
  3 is passed, closed and frozen. The next authorized milestone is the visual
  state atlas and essential user-facing detectors.
