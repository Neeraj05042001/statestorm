# StateStorm

**AI builds the happy path. StateStorm reveals what it forgot.**

StateStorm is an AI preflight tool for supported self-contained React
components. It turns the original requirement and component source into a
bounded set of semantic and boundary states, runs them in an isolated browser
preview, and presents recorded evidence in an interactive State Atlas.

**AI proposes. Deterministic browser evidence decides.**

## Try StateStorm

- [Live Product](https://statestorm.vercel.app/)
- [Stable Demo](https://statestorm.vercel.app/preflight?demo=1)
- [Source Repository](https://github.com/Neeraj05042001/statestorm)

## What StateStorm catches

- **Runtime crash:** a state throws while rendering, but the parent product
  remains available and later states continue.
- **Blank render:** the component completes without meaningful visible output.
- **Possible overflow:** a conservative browser heuristic finds content that
  exceeds its rendered bounds.
- **Confirmed broken image:** a completed image has no usable natural width,
  without exposing its full source URL.

## Why it exists

AI-generated UI often demonstrates one convincing happy path while empty
content, zero values, long text, broken assets, and unexpected combinations
remain unexplored. Those states surface during integration, when they are more
expensive to understand.

StateStorm connects the original requirement to prompt-specific Gemini
proposals and dependable deterministic boundaries. It then executes the
validated states in the browser, so the final result comes from observed
behavior rather than model opinion.

## Workflow at a glance

```text
Prompt + Component
  → Component Contract
  → AI + Deterministic Boundary States
  → Validated RunPlan (up to twelve states)
  → Isolated Serial Execution
  → Browser Evidence
  → State Atlas
```

<!-- Replace this textual workflow with a separately approved architecture image when available. -->

1. Add the original requirement and one supported React TSX or JSX component.
2. Review prompt-specific semantic proposals and deterministic boundary states.
3. Run the validated plan one state at a time inside Sandpack.
4. Compare clean and fragile states, then inspect one selected clean-state
   rerender. Recorded execution remains authoritative.

The stable `AtlasProductCard` demo follows this real planning and execution
path. It does not hardcode fixture results.

## Implemented capabilities

- prompt-derived semantic states through one bounded Gemini request;
- deterministic happy-path and boundary states with graceful fallback;
- TypeScript Compiler API component-contract analysis;
- Zod-validated, JSON-serializable RunPlan data with a twelve-state cap;
- isolated and serialized Sandpack execution;
- cancellation, rerun freshness, and stale-result rejection;
- runtime-error, blank-render, possible-overflow, and broken-image evidence;
- deterministic Atlas summaries and accessible filters; and
- one selected passed-state live inspection rerender.

StateStorm does not turn execution evidence into automatic prompt-requirement
verdicts or claim complete visual, accessibility, or security certification.

## Supported component scope

The MVP supports one self-contained default-export React component in TSX or
JSX, React-only imports, locally declared props, and values that round-trip
losslessly through JSON. Props-driven components use supported TSX local prop
declarations.

Callback/function and ReactNode/JSX props, imported or complex prop types,
relative modules, design-system imports, and arbitrary packages are outside the
current scope. See the [complete limitations](docs/KNOWN_LIMITATIONS.md) and
[frozen product specification](docs/STATESTORM_SPEC.md).

## Technology stack

- Next.js 16 App Router and React 19
- TypeScript 5 and the TypeScript Compiler API
- Tailwind CSS 4
- Zod runtime contracts
- `@google/genai` for server-only Gemini planning
- CodeSandbox Sandpack for client-only React execution
- Vitest and ESLint
- Vercel hosting

## Architecture summary

The Next.js server parses submitted source as text into a trusted component
contract; it never executes the submitted module. Deterministic fixtures and
validated Gemini proposals become a bounded RunPlan. A client-only adapter
executes one fixture at a time in a fresh Sandpack iframe, validates correlated
browser evidence, and constructs the State Atlas. One selected passed state may
be rerendered for inspection after execution, but it cannot change the recorded
result.

See the [judge-readable explanation](docs/submission/ARCHITECTURE_EXPLANATION.md)
and [full architecture record](docs/ARCHITECTURE.md).

## Local setup

Install dependencies and start development:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The main product flow is
at `/preflight`; `/analyze` and `/gate-0` remain technical regression routes.

Run the validation suite:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

The current submission candidate passes all four commands, including **271
Vitest tests across 27 files**. Re-run the suite after any change; detailed
evidence is recorded in [docs/STATUS.md](docs/STATUS.md).

Serve the optimized build on port 3100:

```bash
npm run start -- -p 3100
```

## Gemini configuration

Gemini enriches planning but is optional. Without it, StateStorm returns a
deterministic boundary plan.

Set server-only values in `.env.local` when semantic planning is desired:

```text
GEMINI_API_KEY=your_server_only_key
GEMINI_MODEL=gemini-3.1-flash-lite
```

`GEMINI_MODEL` is optional; the shown model is the repository default. Never
prefix these variables with `NEXT_PUBLIC_`. Submitted component source is not
sent to Gemini. The provider receives only the original prompt, validated
component metadata, safe deterministic happy-path props, and trusted planning
instructions.

## Security qualification

Submitted source stays text in the StateStorm parent until it becomes a
Sandpack virtual file. It is never executed in the Next.js parent, during
server rendering, through parent-side `eval` or `new Function`, or through
executable HTML injection. Accepted browser messages must pass strict schema,
correlation, active-run, and source-window checks.

Sandpack is the browser-isolated execution engine for this hackathon MVP, not a
hardened hostile-code sandbox. Resource-exhaustion and malicious-code hardening
remain outside the current scope. See [known limitations](docs/KNOWN_LIMITATIONS.md).

## Detailed documentation

- [Product specification](docs/STATESTORM_SPEC.md)
- [Architecture](docs/ARCHITECTURE.md) and [decisions](docs/DECISIONS.md)
- [RunPlan execution](docs/RUNPLAN_EXECUTION.md)
- [Visual detectors](docs/VISUAL_DETECTORS.md)
- [State Atlas](docs/STATE_ATLAS.md)
- [Known limitations](docs/KNOWN_LIMITATIONS.md)
- [Demo and regression path](docs/DEMO_PATH.md)
- [Submission checklist](docs/submission/FINAL_SUBMISSION_CHECKLIST.md)
- [Third-party acknowledgements](docs/submission/THIRD_PARTY_ACKNOWLEDGEMENTS.md)

## Acknowledgements

Codex assisted with repository implementation, tests, documentation, build
validation, and security-boundary verification under human-led product
direction and architecture review. StateStorm uses Next.js, React, TypeScript,
Tailwind CSS, Zod, Google GenAI, CodeSandbox Sandpack, Vitest, ESLint, and
Vercel. Exact direct-package versions and locally reported licences are listed
in [third-party acknowledgements](docs/submission/THIRD_PARTY_ACKNOWLEDGEMENTS.md).
