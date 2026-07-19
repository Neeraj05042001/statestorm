# StateStorm submission form copy

All text below is ready to paste. Choose the concise or extended variant that fits the form; do not combine variants unless the field permits it.

## Identity

### Team name

StateStorm

### Project name

StateStorm

### Participant

Neeraj Kumar

## One-line tagline

**Primary:** AI builds the happy path. StateStorm reveals what it forgot.

**Descriptive alternative (96 characters):** AI preflight that turns React requirements into adversarial states and browser-derived evidence.

## Project description — 80–120 words (recommended default)

StateStorm is an AI preflight tool that exposes fragile states in AI-generated React components before integration. A developer provides the original requirement and one supported self-contained TSX or JSX component. StateStorm extracts a deterministic component contract, uses Gemini to propose prompt-specific semantic states, adds deterministic boundary fixtures, and validates a RunPlan of up to twelve states. It executes each state serially inside an isolated Sandpack browser iframe, where browser evidence records runtime crashes, blank renders, possible overflow, and confirmed broken images. Results appear in an interactive State Atlas with filters, deterministic summaries, and one clean-state inspection rerender. AI proposes; deterministic validation and browser evidence decide.

## Project description — 200–300 words

AI-generated React components often arrive with a convincing happy path but little evidence about empty content, zero or extreme values, broken assets, and unexpected prop combinations. StateStorm turns those overlooked states into a reviewable preflight before integration.

The developer provides the original product requirement and one supported, self-contained React TSX or JSX component. StateStorm parses the source as text on the server with the TypeScript Compiler API and produces a trusted component contract. Gemini receives the original prompt, validated contract, and safe baseline values—not the submitted source—and proposes structured requirements and prompt-specific semantic fixtures. Deterministic logic adds baseline boundary fixtures, validates every proposal, deduplicates candidates, and assembles a schema-valid RunPlan capped at twelve prioritized states. If Gemini is missing, unavailable, refused, timed out, or returns unusable output, deterministic coverage remains available.

The browser then executes one fixture at a time inside a fresh Sandpack iframe. Strict correlation and validation reject malformed or stale messages. Browser-observed evidence identifies contained runtime errors, blank renders, conservative possible-overflow warnings, and confirmed broken images. The completed run becomes an interactive State Atlas with deterministic summary metrics, filters, recorded-evidence views, and one selected-state inspection rerender. Recorded execution always remains authoritative.

StateStorm is not a generic chatbot, repository runner, complete requirement verifier, visual-regression system, or hardened hostile-code sandbox. The hackathon MVP supports self-contained components with locally declared, JSON-serializable props and React-only imports.

## Problem statement

### Concise

AI-generated UI is usually judged by one polished happy path. Empty content, extreme values, broken assets, and unexpected combinations surface later during integration, while manually constructing representative states is slow and inconsistent. The original requirement is also usually disconnected from component testing.

### Extended

Developers integrating AI-generated React components need to understand more than the first successful render. A component can crash on an empty string, render nothing for zero, overflow with long content, or quietly display a broken asset. Today, those states are often discovered through ad hoc manual testing after integration. Existing component-preview workflows are useful for authored examples, but they do not inherently turn the original natural-language requirement into prompt-specific adversarial cases. The result is a gap between what the component was asked to do, which boundary values its props allow, and what the browser actually renders.

## Solution

### Concise

StateStorm combines prompt-aware Gemini proposals with deterministic boundary fixtures, validates a bounded RunPlan, executes each state serially in Sandpack, and presents browser-derived runtime and visual evidence in an interactive State Atlas.

### Extended

StateStorm accepts an original requirement and one supported self-contained React component. It deterministically extracts the prop contract, uses Gemini to propose semantic cases, adds guaranteed boundary fixtures, and validates at most twelve prioritized states. Each fixture executes separately inside a browser-isolated Sandpack lifecycle. Strict, correlated messages produce runtime, blank-render, possible-overflow, and confirmed broken-image evidence. The State Atlas then summarizes clean and fragile states, supports filters, preserves recorded evidence, and permits one selected clean-state rerender for inspection. Deterministic fallback keeps baseline coverage available when semantic AI planning cannot contribute.

## Target user

### Concise

Developers who are reviewing or integrating AI-generated React components.

### Extended

StateStorm is designed for frontend developers and technical reviewers who receive AI-generated React components and need a fast, structured preflight before integration. The MVP is most relevant when a component is self-contained and its behavior is driven by locally declared, JSON-serializable props.

## Key features

### Concise

- Prompt-derived semantic states
- Deterministic boundary states
- Up to twelve prioritized fixtures
- TypeScript contract analysis
- Gemini planning with deterministic fallback
- Isolated, serialized Sandpack execution
- Runtime, blank, overflow, and broken-image evidence
- Interactive State Atlas, filters, rerun, cancellation, and one live inspection rerender

### Extended

StateStorm analyzes supported TSX/JSX with the TypeScript Compiler API; materializes Gemini proposals only after strict validation; guarantees deterministic boundary coverage; caps and validates the RunPlan; executes fixtures serially inside separate Sandpack lifecycles; correlates and redacts runtime/detector evidence; rejects stale results; supports cancellation and complete reruns; and presents deterministic conclusions, filters, state cards, recorded-evidence overlays, and one selected-state inspection rerender in the State Atlas.

## Originality

### Concise

StateStorm connects the original prompt to adversarial component-state planning, then separates AI suggestions from deterministic browser verdicts.

### Extended

StateStorm’s distinguishing idea is the complete chain from natural-language intent to structured semantic cases, deterministic boundaries, isolated execution, and a single evidence-backed Atlas. AI helps discover which states matter for this specific requirement, but it is not trusted to decide what rendered. Unlike a generic chatbot, StateStorm collects browser evidence; unlike a component gallery, it generates a bounded adversarial plan instead of relying only on manually authored showcase states.

## Impact

### Concise

StateStorm gives developers browser evidence of fragile component states before integration, when failures are easier to inspect and discuss.

### Extended

StateStorm provides earlier, clearer evidence about how a supported component behaves outside its happy path. A developer compares prioritized clean and fragile states in one run, inspects recorded findings, and reruns the complete plan without treating model prose as proof. The demonstrated impact is a public, working preflight workflow for the supported MVP contract; the project does not claim measured time savings, adoption, customer impact, or production certification.

## Why AI is essential

### Concise

Boundary values can be generated mechanically, but meaningful semantic edge cases depend on the original requirement. Gemini interprets that intent and proposes structured cases; deterministic validation and browser evidence retain authority.

### Extended

A prop contract can guarantee generic boundaries such as empty strings, zero, long strings, alternate booleans, and invalid image values. It cannot by itself understand that a requirement mentions an urgent tone, featured treatment, or another domain-specific combination worth reviewing. Gemini turns the original requirement and validated metadata into structured requirement and fixture proposals. StateStorm then validates, materializes, deduplicates, and caps those proposals. This keeps AI essential for semantic breadth without allowing it to execute source or decide runtime outcomes.

## How AI is used

### Concise

Gemini receives the original prompt, validated component contract, and safe happy-path values. It proposes structured requirements and semantic fixtures. Zod-backed validation and deterministic compatibility checks gate all output; expected provider failures use deterministic fallback. AI never declares runtime pass or failure.

### Extended

The server-only Gemini adapter makes one bounded structured-output request using `@google/genai`. Its input is limited to the original prompt, a validated `ComponentContract`, safe deterministic happy-path props, and trusted instructions. Submitted component source is not sent. The response must parse as the strict proposal shape and pass Zod-backed validation. Trusted application code normalizes requirements, validates assignments against declared prop kinds, removes unsupported candidates, merges semantic fixtures with deterministic boundaries, deduplicates, caps the plan at twelve, and validates the final RunPlan. Missing credentials, timeout, refusal, invalid output, quota/provider failure, or unavailability produces a visible deterministic-only fallback rather than fabricated AI content or an HTTP 500.

## How Codex was used

### Concise

Codex implemented narrow, human-authorized repository milestone packets; helped write tests and documentation; and ran lint, typecheck, tests, build, and boundary audits. Architecture and scope decisions remained human-directed, and production behavior was manually reviewed.

### Extended

OpenAI Codex acted as a repository implementation assistant under milestone packets governed by human-led product direction and architecture review. It helped implement focused changes, add and run automated tests, update architecture and limitation records, inspect client/server and sandbox boundaries, and perform lint, typecheck, test, build, and diff validation. Each gate was manually reviewed, and important behavior was checked in development, optimized local builds, and public production. Codex did not autonomously choose the product scope, declare gates passed, or create the entire product without review; architecture, acceptance, and submission claims remained human-directed.

## Technical architecture

### Concise

Next.js handles server-only source analysis and Gemini planning. Trusted code builds a Zod-validated RunPlan. A client-only adapter executes fixtures serially in cross-origin Sandpack iframes, validates correlated runtime/detector messages, and constructs the browser-evidence-backed State Atlas.

### Extended

The Next.js Node.js boundary validates the request and parses supported source text with the TypeScript Compiler API into a trusted `ComponentContract`; it never executes the component. Deterministic planning creates baseline fixtures. A server-only Gemini adapter proposes structured semantic additions from the prompt, contract, and safe baseline values. Trusted materializers validate and merge both sources into a versioned RunPlan of no more than twelve states. In the browser, a client-only execution orchestrator mounts one fresh Sandpack `react-ts` iframe per fixture. Runtime messages must match the protocol marker, session, run, fixture, nonce, and active source window. In-iframe detectors return bounded, redacted overflow and broken-image metadata. Validated results are correlated back to the plan and transformed into the interactive State Atlas. One selected passed state may mount a separate inspection rerender after execution; it cannot change the recorded result.

## Technology stack

### Concise

Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, Zod, `@google/genai`, CodeSandbox Sandpack, Vitest, ESLint, and Vercel.

### Extended

StateStorm uses Next.js 16 App Router and React 19 for the application, TypeScript 5 and its Compiler API for typed implementation and deterministic source analysis, Tailwind CSS 4 for styling, Zod for runtime contracts, Google’s `@google/genai` SDK for the single server-only Gemini boundary, `@codesandbox/sandpack-react` for isolated browser execution, Vitest and ESLint for validation, and Vercel for the public deployment.

## Challenges encountered

### Concise

The main challenges were keeping submitted source out of the parent/server runtime, correlating browser evidence to one active fixture, recovering from Sandpack lifecycle failures, and preserving useful planning when Gemini was unavailable.

### Extended

The hardest work was architectural rather than cosmetic. Sandpack initialization and compilation messages required strict serialization and explicit lifecycle ownership. Retained iframe DOM could not be trusted after a failed compile, so success needed correlated render and visible-DOM evidence. Runtime and detector events needed bounded schemas, nonce and identifier matching, and exact source-window checks to reject stale or unrelated messages. AI output required a second trust boundary: structured proposals still had to fail closed against the component contract. Finally, the product had to explain provider fallback and recorded evidence without overstating requirement verification, visual detection, or security containment.

## Reliability strategy

### Concise

Deterministic baseline fixtures, strict schemas, a twelve-state cap, serial execution, fresh per-fixture lifecycles, correlated messages, stale-result rejection, cancellation, bounded timeouts, and deterministic fallback keep the workflow controlled.

### Extended

StateStorm treats both AI output and browser messages as untrusted inputs. Zod-backed schemas and cross-field validation guard the component contract, proposal, RunPlan, execution result, detector finding, and State Atlas. Deterministic fixtures remain available independently of Gemini. Fixtures run one at a time in plan order, and each active lifecycle owns its session, run, fixture, nonce, and iframe source window. Malformed, mismatched, or late messages are ignored. Failures are recorded without preventing later fixtures from running. Cancellation and replacement invalidate prior ownership, complete reruns start fresh, and bounded timeouts prevent a missing outcome from being accepted as success.

## Security and privacy

### Concise

Submitted source is parsed as text on the server and executes only inside Sandpack, never in the StateStorm parent or Node tests. Gemini receives the prompt, validated contract, and safe baseline values—not source. Inputs and results are not persisted. The iframe is not a hardened hostile-code sandbox.

### Extended

StateStorm never runs submitted source during server rendering, in the Next.js parent, through parent-side `eval` or `new Function`, or in Node tests. The source remains text until it becomes a Sandpack virtual file in the browser. Parent acceptance of runtime and detector evidence requires strict schemas, bounded/redacted fields, current identifiers, nonce, and exact iframe-window equality. Gemini receives only the original prompt, validated component metadata, safe deterministic happy-path props, and trusted instructions; component source and environment values are not sent. The current application keeps input, plans, and results only in browser memory and the active request. Sandpack and Gemini are external services, and the current iframe boundary does not provide malicious-code hardening, resource containment, or production security certification.

## Known limitations

### Concise

The MVP supports one self-contained TSX/JSX default export with React-only imports and locally declared, JSON-serializable props. It excludes callbacks, imported prop types, arbitrary dependencies, screenshots, responsive matrices, complete accessibility/requirement verification, persistence, export, automatic fixing, and hardened hostile-code containment.

### Extended

StateStorm is not a repository runner and does not support arbitrary React. Prop-driven components must use supported TSX with local prop declarations; callbacks/functions, ReactNode/JSX props, imported or complex prop types, relative modules, design systems, and arbitrary packages fail closed. Runs depend on hosted Sandpack services and are intentionally serial. Overflow is a conservative heuristic and image evidence is point-in-time. The tool does not capture screenshots, compare visual baselines, test a responsive matrix, verify every requirement, certify accessibility or security, persist sessions, export reports, or fix code automatically. Live inspection is a new rerender from recorded props, while the original result remains authoritative.

## Future roadmap

### Concise

Resolve imported prop types, add controlled callback mocks, test responsive viewport matrices, introduce trusted requirement assertions, and export shareable reports.

### Extended

Future work can broaden the supported contract without weakening the evidence boundary: resolve imported prop types through a controlled module graph; introduce explicitly modeled callback mocks instead of arbitrary functions; execute selected states across responsive viewport matrices; add trusted requirement assertions that remain separate from heuristic detector findings; and export bounded, shareable reports. These are recommended next directions and are not implemented in the current MVP.

## Acknowledgements

### Concise

Built with Next.js, React, TypeScript, Tailwind CSS, Zod, Google GenAI, CodeSandbox Sandpack, Vitest, ESLint, and Vercel. OpenAI Codex assisted with implementation, tests, documentation, and validation under human-directed architecture and review.

### Extended

StateStorm uses open-source Next.js, React, TypeScript, Tailwind CSS, Zod, CodeSandbox Sandpack, Vitest, ESLint, and related tooling; Google’s GenAI SDK and Gemini service provide semantic planning; Vercel hosts the public prototype. OpenAI Codex assisted with narrow repository tasks, tests, documentation, and validation. Product scope, architecture decisions, gate acceptance, production review, and final claims remained human-directed. Exact package acknowledgements and locally reported licences are recorded in `docs/submission/THIRD_PARTY_ACKNOWLEDGEMENTS.md`.

## Links

### Live URL

https://statestorm.vercel.app/

### Stable demo URL

https://statestorm.vercel.app/preflight?demo=1

### Repository URL

https://github.com/Neeraj05042001/statestorm

### Demo video URL

DEMO_VIDEO_URL_PENDING

### Pitch deck URL

PITCH_DECK_URL_PENDING

## Final paste check

Before submission, replace both pending placeholders, recheck public permissions in a signed-out browser, and ensure the selected variant fits the form’s live character counter. Do not add contact details, metrics, testimonials, certifications, or user research unless Neeraj supplies and verifies them separately.
