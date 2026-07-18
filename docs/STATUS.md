# StateStorm status

## Current work

- Gate: Gate 3 (passed, closed and frozen)
- Task: SS-M3-001 (completed)
- State: Public Vercel execution, rerun freshness, replacement cancellation and stale-result rejection passed
- Architecture authority: ChatGPT Project
- Repository executor: Codex
- Latest accepted milestone: Gate 3 serialized RunPlan sandbox-execution baseline
- Gate 0 execution architecture: Frozen and reused through narrow protocol primitives
- RunPlan version 1: Frozen and unchanged
- Gate 1 baseline: Frozen RunPlan v1, deterministic source analysis and server-only submission workflow
- Gate 2 baseline: Frozen deterministic fixtures, Gemini proposal boundary, trusted materialization and stable RunPlan assembly
- Gate 3 baseline: Frozen serialized fixture execution through the client-only Sandpack boundary, validated execution results and stale-session ownership rejection

## Formally accepted Gate 3 outcome

The ChatGPT Project architecture authority accepted SS-M3-001 at
`1aba17aa5d9d97ae76521f76bf00987fef685cea` after the required public Vercel
execution and replacement-cancellation evidence passed. Gate 3 is closed and
the execution baseline below is frozen.

- The accepted RunPlan retains the submitted component source and language, so
  execution requires no server-side submitted-module import or evaluation.
- `executeRunPlan` is independent of React and Sandpack. It revalidates RunPlan
  v1, preserves order, executes one injected fixture executor at a time,
  continues after fixture failures, supports AbortSignal cancellation and
  validates the final session through `ExecutionSessionResultSchema`.
- `RunPlanSandboxAdapter` remains behind a Client Component and
  `next/dynamic({ ssr: false })`. It creates one fresh `react-ts` provider and
  cross-origin iframe for the active fixture, then removes it after the result
  or ten-second timeout before the next fixture begins.
- Separate submitted-component, JSON fixture-data, runtime-bridge and wrapper
  virtual files keep source and data roles explicit. Fixture props are double
  JSON serialized; no `eval`, `new Function`, executable HTML or parent-side
  submitted-module import was added.
- Runtime messages require the accepted source marker and protocol version plus
  current session, run, fixture and nonce correlation and exact source-window
  equality. Unknown, malformed and stale messages are rejected.
- Passed requires active Sandpack completion, correlated render commit,
  expected root DOM, meaningful visible DOM and no runtime error. Runtime,
  blank, compile, timeout, infrastructure and cancellation are distinct strict
  result classifications.
- `/preflight` now exposes execution, progress, an active preview, ordered
  results, bounded messages, totals, cancellation and rerun without adding
  screenshots, requirement verdicts or a state atlas.
- Automated tests use fake executors and never execute submitted source in
  Node. Local and public Vercel browser evidence confirm the documented fragile
  component, serial continuation, rerun freshness and stale-session rejection.

## SS-M3-001 validation evidence

| Command | Result | Important output |
| --- | --- | --- |
| `npm run lint` | Pass | ESLint completed with no errors or warnings |
| `npm run typecheck` | Pass | `tsc --noEmit` completed with no errors |
| `npm run test` | Pass | Vitest 4.1.10 passed 229 tests across 20 files; all provider and executor tests use injected fakes |
| `npm run build` | Pass | Next.js 16.2.10 produced build `IDVioscfUV_z2OQBRlmOr`; `/preflight`, `/analyze` and `/gate-0` are static pages and both APIs are server routes |
| `git diff --check` | Pass | No whitespace errors; Git reported only the repository's existing LF-to-CRLF checkout notices |

Verified optimized-output evidence:

- Direct production HTTP requests to `/preflight`, `/analyze` and `/gate-0`
  returned 200.
- `POST /api/preflight-plan` returned 200, accepted a schema-valid plan, kept
  `det-happy-path` first, returned eight fixtures and used deterministic
  fallback after the locally configured provider returned `provider-error`.
- The optimized static client output contains zero matches for `@google/genai`,
  `GEMINI_API_KEY`, `GEMINI_MODEL`, the server planning service, the analyzer or
  TypeScript Compiler API markers.
- RunPlan virtual-file and runtime markers occur in one lazy client chunk and
  have zero matches in the preflight SSR chunks. Sandpack remains the submitted-
  code execution boundary.
- Source inspection found no parent-side `eval`, `new Function`, executable
  `dangerouslySetInnerHTML`, source/provider-response logging or application
  filesystem-write path. The previous planning debug logs were removed.

Local browser evidence supplied to SS-M3-001-F1:

- One twelve-fixture RunPlan executed strictly serially and completed with
  exactly nine passed and three failed results.
- `det-empty-strings` produced a contained `runtime-error` with the sanitized
  message `Cannot read properties of undefined (reading 'toUpperCase')`.
- `ai-semantic-03` and `det-zero-numbers` produced `blank-render` results.
- Fixtures after the runtime and blank failures continued and passed; the
  parent page remained mounted.
- **Run again** started a fresh session and reproduced the correct ordered
  results. No stale results from the completed first execution appeared.
- Planned requirements were not incorrectly marked passed or failed.

Public Vercel evidence accepted for Gate 3 closure:

- A twelve-fixture RunPlan executed strictly serially and completed with the
  same exact nine passed and three failed results recorded locally.
- `det-empty-strings` produced the contained `runtime-error`
  `Cannot read properties of undefined (reading 'toUpperCase')`;
  `ai-semantic-03` and `det-zero-numbers` produced `blank-render` results.
- Later fixtures continued and passed after both failure types, and the parent
  page remained mounted.
- **Run again** created a fresh ordered execution session without stale results
  from the completed prior session.
- During an active rerun, submitting a new prompt and component removed the
  previous execution's UI ownership. Its results did not reappear, and the
  replacement submission became active.
- The replacement was correctly rejected with `UNSUPPORTED_PROP_TYPE` for
  `onAddToCart?: () => void`.
- Planned requirements were not incorrectly marked passed or failed.

## Formally accepted Gate 2 outcome

The task packet records Gate 2 as passed and frozen. Public verification proved
live Gemini requirements and semantic fixtures using
`GEMINI_MODEL=gemini-3.1-flash-lite`, deterministic fallback, schema-valid
RunPlan v1, the twelve-fixture cap and stable AI/deterministic ordering. That
exact model is also the repository default, while the bounded environment
override remains available. SS-M3-001 does not change those planning decisions.

## Accepted SS-M2-002-PIVOT evidence

- Gemini is the single MVP semantic-planning provider. The server-only adapter
  uses `@google/genai` with `GEMINI_API_KEY`, an optional `GEMINI_MODEL` override
  and the committed default `gemini-3.1-flash-lite`.
- The adapter is lazy, performs one request with SDK retries disabled, applies
  an approximately 12-second timeout, requests structured JSON and revalidates
  the parsed response through the strict `AiPlanningProposalSchema`.
- Gemini receives only the original prompt, serialized `ComponentContract`,
  deterministic happy-path props and trusted planning instructions. Submitted
  component source, environment values, server metadata and stack traces are
  not included.
- Trusted StateStorm code normalizes and validates AI requirements, rejects
  deterministic claims without a supported assertion, materializes semantic
  fixtures from cloned happy-path props, validates every assignment and
  omission, then validates every emitted fixture through `FixtureSchema`.
- Fixture merge order is happy path, valid semantic fixtures, then remaining
  deterministic boundaries. Canonical props are deduplicated before the
  accepted twelve-fixture cap, and the happy path is always retained.
- Missing credentials, quota exhaustion, timeouts, refusals, malformed output
  and provider failures produce stable warning codes and a schema-valid
  deterministic-only RunPlan rather than HTTP 500.
- `POST /api/preflight-plan` is a no-store Node.js boundary. At Gate 2
  acceptance, `/preflight` showed contract, AI status, requirements, fixtures
  and issues without execution.
- Tests use injected fake providers only and make no Gemini network call. Gate 2
  is passed and frozen; SS-M3-001 adds execution without changing planning.

## Accepted SS-M2-001 evidence

- SS-M2-001 is accepted and frozen at
  `aea75aaf0984347314ed82446ddaff90f9b68223`.
- `generateDeterministicFixtures` converts a validated `ComponentContract` into
  existing runtime-validated `Fixture` values and stable `ContractIssue` data.
- A representative happy path and eleven ordered boundary strategies use fixed
  IDs, grouped prop variations, canonical nested deduplication and the accepted
  twelve-fixture maximum.
- Required props remain present, undeclared props are never added, defaults are
  deeply cloned and every ordered candidate and emitted fixture passes
  `FixtureSchema`.
- Unknown prop kinds, incompatible defaults and invalid enum metadata fail
  closed. Collections without defaults produce empty containers and one bounded
  coverage warning.
- Implementation evidence exists in focused baseline, strategy, invariant,
  JSON-safety, deduplication and limit tests. Gate 2 is passed and frozen.
- At SS-M2-001 acceptance, no AI integration, prompt interpretation,
  requirement extraction, semantic fixture generation, sandbox orchestration,
  state atlas, editing or UI had been added. The frozen Gate 0 and Gate 1
  implementations remain unchanged by SS-M2-002.

## Formally accepted Gate 1 outcome

The ChatGPT Project architecture authority formally accepted Gate 1 after
public verification at:

https://statestorm.vercel.app/analyze

Public evidence confirmed that the supported example returns an accepted
`ProductCard` contract; props, optionality, enum values and defaults render
correctly; unsupported packages return `UNSUPPORTED_IMPORT`; invalid syntax
returns `SOURCE_SYNTAX_ERROR`; and missing or unresolved prop declarations
return stable corrective issues. The page remains mounted without exposing
server stack traces, the analyzer remains behind its Node.js server-only
boundary, and the frozen Gate 0 route remains operational.

RunPlan version 1 and the deterministic source-analysis baseline are now frozen.
At Gate 1 closure, no Gate 2 implementation had begun.

## Accepted SS-M1-003 evidence

- `/analyze` provides prompt, component source and TSX/JSX inputs, explicit
  idle/submitting/accepted/rejected/request-error/server-error states, a
  supported example and diagnostic contract/issue presentation.
- The browser submits a UUID-based URL-safe ID through
  `POST /api/component-analysis`. The Node.js Route Handler validates the strict
  submission schema before calling a dedicated `server-only` adapter.
- The adapter invokes the accepted deterministic analyzer and validates the
  final discriminated response schema. Unsupported source is a normal HTTP 200
  analysis result; malformed input is HTTP 400; unexpected failures are a
  sanitized HTTP 500.
- The new connection does not execute submitted source and does not import the
  analyzer or TypeScript runtime into a client-transitive module.
- No AI integration, requirement extraction, fixture generation, sandbox
  execution integration, detector, editor, state atlas, persistence or database
  was added. Gate 0 remains frozen and unchanged.
- SS-M1-003 is locally, built-production and publicly verified. Gate 1 is passed
  and formally accepted.
- No AI integration, requirement extraction, fixture generation or sandbox
  execution integration has begun.
- JSX support is intentionally narrow: prop-less JSX components are supported,
  while props-driven components must use TSX with locally declared prop types.
  JSDoc and PropTypes inference are not implemented.
- `ComponentSubmission` still requires a prompt. Deterministic source analysis
  validates but does not interpret that prompt; it becomes essential in the
  next milestone for requirement extraction.

## SS-M1-003 development and built-server evidence

- Headless Edge completed the development UI sequence: open `/analyze`, load
  the exact built-in `ProductCard` example, submit it, observe the accepted
  four-prop contract and `calm` default, replace it with an unsupported import,
  observe `UNSUPPORTED_IMPORT`, add invalid syntax and observe
  `SOURCE_SYNTAX_ERROR`. The page retained its heading with zero runtime
  exceptions, and direct `/gate-0` navigation loaded successfully.
- Development API checks returned HTTP 200 for accepted source, HTTP 200 with
  `UNSUPPORTED_IMPORT`, HTTP 200 with `SOURCE_SYNTAX_ERROR`, and HTTP 400 with
  `MALFORMED_JSON`. Every response used the no-store policy.
- `npm run start -- -p 3100` served the final optimized build in 2.9 seconds.
  Headless Edge repeated the full example, unsupported-import, syntax-error and
  `/gate-0` sequence with zero runtime exceptions. Direct API checks also
  confirmed accepted, unsupported, syntax and malformed response behavior.
- Successful accepted analysis on the optimized server proves that its Node.js
  API bundle resolves and runs TypeScript 5.9.3. Build artifacts contain
  TypeScript/analyzer markers in server chunks and zero matching analyzer or
  TypeScript-runtime markers in `.next/static` client chunks.
- Client-transitive source imports were also audited: `/analyze` imports only
  client-safe domain schemas and types, never `src/analysis`, `src/server` or
  `typescript`.

## Accepted SS-M1-002 evidence

- The ChatGPT Project architecture authority accepted SS-M1-002 as the
  deterministic source-analysis baseline.
- The installed TypeScript 5.9.3 Compiler API parses TSX or JSX in memory with
  parent nodes enabled; submitted code is not executed, imported, transpiled or
  written to disk.
- Source-order AST traversal validates imports, resolves one named default
  function component, resolves the documented local props subset, extracts only
  compatible JSON literal defaults and validates accepted output through
  `ComponentContractSchema`.
- Unsupported syntax, imports, component declarations, prop declarations,
  types and defaults fail closed with stable `ContractIssue` codes and useful
  source paths. Fatal issues never return a partial contract.
- Tests prove supported named function, arrow, `React.FC`, imported
  `FC`/`FunctionComponent`, interface, object-alias, inline, destructured,
  primitive, enum, array, object and default-value forms.
- Tests also prove identical-input determinism, source-order props, schema
  acceptance and every required unsupported-source category.
- No AI, requirement extraction, fixture generation, sandbox integration,
  detector, editor, state atlas or UI was added. The frozen Gate 0 runtime was
  not modified.

## Accepted SS-M1-001 evidence

- The ChatGPT Project architecture authority accepted SS-M1-001.
- Seven runtime-validated domain contracts exist under `src/domain`.
- Zod schemas are the source of truth and exported types use `z.infer`.
- RunPlan version 1 is strict, JSON-serializable and cross-field validated.
- Structural validity remains separate from error-issue executability.
- Vitest covers valid plans, JSON nesting, unsupported values and imports,
  duplicate identifiers, required/unknown props, fixture bounds, deterministic
  assertions, error-issue executability and JSON round trips.
- No AI integration, source parsing, prop inference, fixture generation,
  requirement evaluation, sandbox adapter, detector or UI was added.
- `docs/STATESTORM_SPEC.md` now records the confirmed frozen product
  specification and distinguishes implemented capabilities from planned work.

## Formally accepted Gate 0 outcome

The ChatGPT Project architecture authority formally accepted Gate 0 after
public verification at:

https://statestorm.vercel.app/gate-0

The deployed application verified:

- visibly distinct `safe-short` and `safe-long` renders
- correlated runtime-crash classification through `RUNTIME_ERROR`
- parent survival and heartbeat progression from 0 to 1 after the crash
- heartbeat preservation at 1 through a valid recovery run
- valid runtime recovery without a parent-page refresh
- provisional invalid-TSX compilation classification
- verified compiler restoration followed by a valid visible rerender
- direct public `/gate-0` navigation and reachable hosted Sandpack dependencies

The `col.csbops.io` timeout remains a verified non-blocking external telemetry
limitation. Gate 0 acceptance establishes the hackathon MVP feasibility
baseline; it is not malicious-code hardening or production certification.

## Verified F4 evidence

- The deployed pre-F4 build could classify invalid TSX, but restoration changed
  the active run to valid before proving that the current Sandpack client had
  compiled the restored source. A later, uncorrelated listener error could then
  be assigned to that valid run and force `Run failure` while the iframe retained
  the stale compilation overlay.
- Restoration now dispatches the valid `/UserComponent.tsx` and a dedicated
  `recovery-bootstrap` fixture directly to the verified current preview client.
  Fixture controls remain disabled until that client emits a fresh `start`, a
  successful `done`, the public context error is null and the runtime bridge
  emits a fresh, correlated `SANDBOX_READY` event.
- Stale compilation listener messages are diagnostic only outside the active
  serialized invalid probe. They cannot fail a later valid or recovery run.
- Edge 150 development mode passed `safe-short` -> invalid TSX -> restore ->
  `safe-short` -> invalid TSX -> restore -> `safe-long`. Both restorations
  reached `Compiler recovery verified`; the final long render produced 237
  visible characters and the parent heartbeat remained 1.
- The same sequence passed against the built server at
  `http://localhost:3100/gate-0`. The production collection recorded no parent
  `Run failure`, exception, console message or loading failure.
- Neither recovery remounted nor refreshed the Next.js parent application. A
  Sandpack preview/client remount was not necessary.

## Verified F2 evidence

- The accepted F1 `react-ts` entry, readiness, source-window validation,
  nonce/run/fixture/mode correlation and visible-DOM success gates remain in
  place.
- Development Edge 150 reached explicit readiness and completed, without a
  parent refresh:
  - `safe-short` rendered with correlated run
    `run-83d7d575-53e5-43be-ac24-df6e1859de69`.
  - `runtime-crash` produced only correlated `RUNTIME_ERROR` for
    `run-96d1d9d7-4826-43fe-a497-973c35efbfd1`, with the exact message
    `Deliberate Gate 0 runtime failure`.
  - Parent heartbeat changed from 0 to 1 after the crash.
  - `safe-short` recovered under
    `run-1cfe4a3d-9985-49ab-a661-e3e2613cdcad`; heartbeat remained 1.
  - `safe-long` then rendered 237 visible characters under
    `run-cb76bc43-7f6c-4257-a892-e18a1929d61a`.
- Invalid `/UserComponent.tsx` produced the distinct `Compilation diagnostic
  error` state. The context error was null before injection, became populated,
  and returned to null after valid-source restoration.
- The invalid run observed listener `start`, status changes,
  `done.compilatonError=true`, and `action/show-error`. It produced no current
  correlated runtime-bridge event and was never reported as rendered or as a
  runtime error.
- Restoring the valid sample recovered the same preview/provider; a subsequent
  `safe-short` also rendered successfully.
- A forced missing-outcome diagnostic reached the 20,000 ms run timeout. A stale
  iframe message was rejected for nonce mismatch and did not cancel that current
  run's timeout. Initialization remains a separate 30,000 ms timeout.
- The built server at `http://localhost:3100` passed direct `/gate-0` navigation,
  readiness, safe/crash/heartbeat/safe/long, invalid-source, restoration and
  final safe-render checks in Edge 150.
- Production browser collection recorded zero parent exceptions, zero parent
  console messages and zero loading failures. Development collection recorded
  only React development, HMR and Fast Refresh informational messages.

## Compilation observability status

Classification: **accepted provisionally for the serialized hackathon MVP**.

The installed public Sandpack context type exposes `error` as
`SandpackError | null`. Installed listener types expose `action/show-error` and
the misspelled `done.compilatonError`, but those messages carry no StateStorm
nonce, run ID, fixture ID or component mode. Gate 0 associates them with the
single serialized active invalid diagnostic. Only one compilation or fixture run
may execute at a time, and this listener shape must not become the final
compilation-error correlation contract.

## SS-M2-002 validation commands

| Command | Result | Important output |
| --- | --- | --- |
| `npm run lint` | Pass | ESLint completed with no errors or warnings |
| `npm run typecheck` | Pass | `tsc --noEmit` completed with no errors |
| `npm run test` | Pass | Vitest 4.1.10 passed 188 tests across 15 files; provider tests use injected fakes and never call Gemini |
| `npm run build` | Pass | Next.js 16.2.10 produced final build `Br7Mc-DhhcwYMfYJRbOvo`; `/preflight`, `/analyze` and `/gate-0` were emitted as static pages and both planning APIs were emitted as server routes |
| `npm run start -- -p 3200` | Pass | Final Next.js production server became ready in 3.7 seconds; deterministic fallback plus direct `/preflight`, `/analyze` and `/gate-0` requests passed |

## SS-M2-002 built-server and bundle evidence

- The final optimized server became ready at `http://localhost:3200` in 3.7
  seconds with `GEMINI_API_KEY` and `GEMINI_MODEL` absent.
- `POST /api/preflight-plan` returned HTTP 200, `accepted: true`, AI status
  `unavailable`, zero requirements, a non-empty deterministic fixture set,
  `det-happy-path` first, `AI_PLANNER_UNAVAILABLE` and the no-store policy.
- Final direct requests to `/preflight`, `/analyze` and `/gate-0` all returned
  HTTP 200. The preflight HTML contained prompt, language, load-example and
  no-execution guidance.
- The four JavaScript chunks in the final `/preflight` client reference manifest
  contained zero matches for the Gemini SDK, Gemini environment variables,
  server planner, analyzer entry point or TypeScript Compiler API markers.
- No live Gemini request was made. AI-generated behavior is validated with
  injected deterministic fake providers; live free-tier verification is an
  optional later environment check, not a requirement for this implementation.

## Accepted limitations and remaining risks

- Compilation observability is accepted provisionally only while execution is
  strictly serialized; it still lacks message-level StateStorm correlation.
- Previous iframe DOM after invalid source is stale output and must never be
  accepted as the current result.
- `reactStrictMode: false` is accepted provisionally only for the Sandpack
  hackathon MVP path and must be reopened before post-hackathon hardening or
  broader product expansion.
- Resource exhaustion, malicious-code hardening and hosted-service availability
  remain outside this spike.
- `npm audit` reports two moderate dependency findings. They are non-blocking
  for the accepted contract baseline; no forced or breaking dependency upgrade
  was performed.

## Blockers

No implementation blocker affects the accepted SS-M3-001 baseline. Gemini
free-tier capacity and hosted Sandpack availability remain external, but
deterministic planning and bounded execution outcomes remain available within
their documented limits. Gate 3 is passed, closed and frozen, and the Gate 0,
Gate 1, Gate 2 and RunPlan version 1 boundaries remain binding.

## Next permitted action

The next authorized milestone is the visual state atlas and essential
user-facing detectors. That work requires its own scoped task; SS-M3-001-F2
records Gate 3 closure only and does not begin Gate 4 implementation.
