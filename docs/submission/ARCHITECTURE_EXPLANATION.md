# StateStorm architecture explanation for judges

## Architecture in one sentence

StateStorm converts an original requirement and supported React source into a trusted, bounded RunPlan on the server, executes each JSON fixture in a client-only Sandpack iframe, validates correlated browser evidence, and presents the completed run as an interactive State Atlas.

## End-to-end flow

```text
Prompt + self-contained component source
  -> server-only request validation and TypeScript AST analysis
  -> trusted ComponentContract
  -> deterministic fixtures + optional Gemini structured proposal
  -> trusted materialization, deduplication, priority merge, twelve-state cap
  -> validated RunPlan v1
  -> client-only serial execution adapter
  -> one fresh Sandpack iframe per active fixture
  -> correlated runtime and detector evidence
  -> validated execution session
  -> interactive State Atlas
  -> at most one selected-state inspection rerender
```

Detailed repository diagrams are linked under [Existing technical references](#existing-technical-references).

## 1. Inputs and server-only contract analysis

The user supplies two meaningful inputs:

1. the original natural-language product requirement; and
2. one self-contained default-export React component in supported TSX or JSX.

The Next.js server boundary first validates the request. The deterministic analyzer uses the TypeScript Compiler API to parse the submitted source **as text in memory** and traverse a deliberately limited local AST subset. It never imports, transpiles, evaluates, writes, or server-renders the submitted module.

Supported facts are materialized into a runtime-validated `ComponentContract`: component name, language, allowlisted imports, and locally declared prop metadata such as kind, optionality, enum values, and complete JSON defaults. Unsupported syntax, imports, declarations, callbacks, imported types, and complex composition fail closed rather than producing a guessed partial contract.

## 2. Trusted planning and RunPlan assembly

Two planning sources remain intentionally separate:

- **Deterministic fixture generator:** derives a happy path and stable boundary strategies from the validated contract. It does not interpret the prompt and does not require an AI service.
- **Gemini structured proposal:** receives the original prompt, validated contract, safe deterministic happy-path props, and trusted instructions. It may propose bounded requirements and semantic fixture assignments.

Gemini output is proposal data, not an executable plan. The response must parse as the strict proposal shape. Trusted StateStorm materializers then normalize requirements; verify assignment keys and values against the contract; reject unsupported candidates; merge the deterministic happy path, accepted semantic fixtures, and remaining deterministic boundaries; remove canonical duplicates; retain priority order; cap the result at twelve states; and validate the complete versioned `RunPlan` with Zod-backed schemas.

Missing credentials, timeout, refusal, invalid output, unavailability, quota/provider failure, or an unusable proposal produces a visible deterministic-only plan. StateStorm does not fabricate semantic requirements during fallback.

Planning never executes submitted source.

## 3. Client-only isolated execution

An accepted executable RunPlan crosses into a browser-owned, client-only execution path. A React-independent orchestrator revalidates the plan, preserves its fixture order, and awaits exactly one executor result at a time.

For each fixture, the adapter mounts a fresh CodeSandbox Sandpack `react-ts` project and cross-origin iframe. Separate virtual files keep roles explicit:

- submitted component source;
- double-serialized JSON fixture data;
- runtime bridge;
- application wrapper and React entry; and
- minimal preview document and styles.

The submitted source remains a string in the StateStorm parent until it is written into the Sandpack virtual project. It is not imported by the parent. The adapter is client-only and is not server rendered. Cleanup removes the active fixture lifecycle before the orchestrator advances, preserving serial ownership.

## 4. Runtime correlation and browser evidence

Every accepted runtime or detector event must match the active protocol marker and version plus:

- `sessionId`;
- `runId`;
- `fixtureId`;
- nonce; and
- exact `MessageEvent.source` equality with the active preview iframe window.

Unknown fields, malformed data, mismatched IDs, stale messages, unbounded arrays/strings, raw DOM nodes, raw `Error` objects, full image URLs, HTML, and non-finite dimensions fail closed.

A passed fixture requires active Sandpack completion, a correlated render commit, the expected root, meaningful visible DOM, and no correlated runtime failure. Other strict classifications include compile error, contained runtime error, blank render, timeout, infrastructure error, and cancellation. One fixture failure does not stop later fixtures.

After a meaningful render settles, detector logic inside the iframe records bounded metadata for:

- **possible layout overflow**, using a conservative scroll/client-dimension heuristic; and
- **confirmed broken images**, only when a completed image has zero natural width.

Detector findings supplement execution status. They do not verify prompt requirements, capture screenshots, or turn heuristic overflow into a definitive layout verdict.

## 5. State Atlas and selected-state inspection

After serial execution completes, `buildStateAtlas` revalidates the RunPlan and execution session, requires exactly one known result per fixture, preserves plan order, derives deterministic display categories and summary metrics, and validates the final Atlas model.

The State Atlas presents:

- a deterministic developer conclusion;
- total, clean, runtime, blank, overflow, broken-image, and other-failure counts;
- accessible filters and ordered state cards;
- compact recorded props and findings; and
- recorded-evidence overlays for failed or blank states.

At most one selected **passed** state may mount a separate client-only Sandpack inspection. It rerenders the original source with the selected recorded JSON props only after execution is complete. It is not a screenshot or replay, and it cannot update the execution session, findings, categories, or summary. Recorded browser results remain authoritative.

## Trust boundary

### Submitted source

- is validated and parsed on the server as an in-memory text string;
- is executed only inside a Sandpack browser iframe;
- never enters the StateStorm parent DOM as submitted HTML;
- is never executed by Node.js tests;
- is never run during server rendering;
- is never evaluated through parent-side `eval`, `new Function`, or generated submitted-module imports; and
- is **not sent to Gemini**.

### Gemini receives

- the original prompt;
- the validated `ComponentContract`;
- safe deterministic happy-path values; and
- trusted planning instructions.

Gemini does not receive submitted component source, environment values, server metadata, raw errors, browser evidence, or stacks.

### Important boundary qualification

Sandpack is the accepted browser-isolated execution engine for this hackathon MVP, not a hardened hostile-code sandbox. CPU, memory, infinite-loop, storage, and network-abuse containment remain outside the implemented scope.

## Four distinct authorities

| Stage | Authority | What it may do | What it may not claim |
| --- | --- | --- | --- |
| AI proposal | Gemini through the server-only adapter | Interpret prompt intent and propose structured requirements and semantic fixtures | Execute source or decide pass/failure |
| Deterministic validation | TypeScript analysis, materializers, and Zod-backed contracts | Accept supported facts, reject invalid proposals, assemble the bounded RunPlan | Prove a prompt requirement from model prose |
| Browser observation | Correlated Sandpack runtime and in-iframe detectors | Record runtime, blank-render, possible-overflow, and confirmed broken-image evidence | Provide complete visual, accessibility, or security certification |
| Final presentation | Validated State Atlas and deterministic formatter | Summarize recorded evidence, filter states, and rerender one selected passed fixture | Overwrite recorded evidence or present inspection as the original run |

## Existing technical references

- [Full architecture](../ARCHITECTURE.md)
- [Frozen product specification](../STATESTORM_SPEC.md)
- [Architecture decisions](../DECISIONS.md)
- [RunPlan assembly diagram](../diagrams/run-plan-assembly.mmd)
- [AI planning boundary diagram](../diagrams/ai-planning-boundary.mmd)
- [Serialized execution sequence](../diagrams/runplan-execution-sequence.mmd)
- [State Atlas flow](../diagrams/state-atlas-flow.mmd)
- [Visual detector design](../VISUAL_DETECTORS.md)
- [Known limitations](../KNOWN_LIMITATIONS.md)
