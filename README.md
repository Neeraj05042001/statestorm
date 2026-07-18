# StateStorm

**AI builds the happy path. StateStorm reveals what it forgot.**

StateStorm is an adversarial preflight tool for supported React components. It
turns an original product requirement and one self-contained component into a
bounded set of component states, executes those states serially inside an
isolated browser preview, records runtime and visual evidence, and presents the
result in an interactive State Atlas.

**AI proposes. Deterministic browser evidence decides.** Semantic planning can
suggest prompt-specific states, but it never decides whether a component
actually rendered or failed.

## The problem

AI-generated UI often demonstrates a convincing happy path while empty values,
zero values, long content, invalid images, and other boundaries remain
unexplored. Those states can crash, render nothing, overflow their container, or
silently degrade when the component is integrated.

## The solution

StateStorm combines two complementary planning sources:

- Gemini-assisted semantic proposals derived from the original prompt and a
  validated component contract; and
- deterministic boundary fixtures that remain available when Gemini is
  unavailable or returns unusable output.

Every accepted fixture then runs through the real browser execution path.
Recorded runtime and detector evidence—not model opinion—drives the final State
Atlas categories and developer conclusion.

## Current workflow

1. Add the original requirement and one supported React TSX/JSX component.
2. Analyze the component contract and generate at most twelve adversarial
   states.
3. Review semantic criteria, AI-proposed states, deterministic boundaries, and
   planning warnings.
4. Run the preflight. StateStorm executes one state at a time in Sandpack.
5. Inspect clean, runtime-failure, blank-render, overflow, broken-image, and
   other recorded outcomes in the State Atlas.
6. Select one state for a live isolated rerender. Recorded execution remains
   authoritative.

The stable `AtlasProductCard` demonstration is available from **Load demo** on
the homepage or preflight screen. Its healthy image is an embedded data URL, so
the clean happy path does not depend on an external image service.

## Implemented capabilities

- prompt-derived semantic states through one bounded Gemini request;
- deterministic happy-path and boundary states;
- schema-validated, JSON-serializable RunPlan version 1;
- a twelve-state maximum with deterministic merge order and deduplication;
- isolated, serialized Sandpack execution;
- cancellation, rerun freshness, and stale-result rejection;
- runtime-error, blank-render, compile, timeout, infrastructure, and
  cancellation outcomes;
- conservative possible-overflow warnings;
- confirmed broken-image findings without exposing full image URLs;
- deterministic State Atlas metrics and developer conclusions;
- accessible Atlas filters and one selected-state live inspection sandbox; and
- deterministic boundary fallback when semantic AI planning is unavailable.

StateStorm does not claim prompt-requirement pass/fail verification, complete
accessibility verification, perfect visual regression testing, arbitrary React
support, or production security certification.

## Supported component contract

The current MVP supports:

- one self-contained default-export React component in TSX or JSX;
- `react` and tooling-required `react/jsx-runtime` imports only;
- props declared locally in the submitted source;
- flat `string`, `number`, `boolean`, literal-enum, array, object, or supported
  unknown metadata; and
- values that round-trip losslessly through JSON.

Props-driven components must use TSX with a supported local prop declaration.
Callback/function props, ReactNode/JSX props, imported prop types, relative
modules, design-system imports, arbitrary packages, and complex TypeScript type
composition are not supported.

## Technology stack

- Next.js 16 App Router and React 19
- TypeScript 5
- Tailwind CSS 4
- Zod runtime contracts
- `@google/genai` for the single server-only semantic-planning boundary
- CodeSandbox Sandpack for client-only React execution
- Vitest and ESLint

## Local setup

Install dependencies and start development:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The main product flow is
at `/preflight`; `/analyze` and `/gate-0` remain technical regression routes.

Run the required validation:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

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
sent to Gemini. The provider receives only the prompt, validated component
metadata, deterministic happy-path props, and trusted planning instructions.

## Deployment

Accepted public baseline: [https://statestorm.vercel.app](https://statestorm.vercel.app)

The local SS-M5-001 product experience must be deployed only through a later,
separately authorized action. This milestone does not deploy or modify the
public environment.

## Security boundary

Submitted source remains a string in the StateStorm parent until it is written
to Sandpack virtual files. It is never executed in the Next.js parent, during
server rendering, through parent-side `eval` or `new Function`, or through
executable HTML injection. Runtime and detector messages must pass strict
schema, correlation, nonce, active-run, and source-window checks.

Sandpack is a browser-isolated execution candidate for this hackathon MVP, not
a hardened hostile-code sandbox. CPU, memory, infinite-loop, storage, and
network-abuse containment remain outside the current scope.

## Known limitations

- Hosted Sandpack compiler and package services must be reachable.
- Runs are intentionally serialized and can take longer than parallel testing.
- Compilation diagnostics remain provisional because upstream messages lack
  StateStorm-level correlation fields.
- Overflow detection is heuristic and can produce false positives or negatives.
- Broken-image collection is point-in-time and may miss images still loading.
- Live inspection is a rerender, not a screenshot of the recorded execution.
- There is no persistence, authentication, collaboration, export, responsive
  viewport matrix, screenshot baseline, selective rerun, or automatic fixing.
- The current iframe boundary does not provide malicious-code hardening or
  production certification.

See [docs/KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md) for the complete
technical record and [docs/DEMO_PATH.md](docs/DEMO_PATH.md) for the demo and
regression sequence.

## Acknowledgements

Codex assisted with repository implementation, tests, documentation, build
validation, and security-boundary verification. Product scope and architecture
decisions remain governed by the StateStorm architecture authority.
