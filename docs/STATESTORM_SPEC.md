# StateStorm frozen product specification

## Product purpose and positioning

StateStorm is a developer-facing diagnostic product for turning a submitted,
self-contained React component and its natural-language rendering brief into a
reviewable set of component states backed by deterministic browser evidence.
The hackathon MVP is intentionally narrow: it supports controlled React
component inputs and a serialized browser execution path. It is not a general
application runner, a production monitoring service, a hardened malicious-code
sandbox or an autonomous code-fixing system.

## User inputs

The product input contract consists of:

- a non-empty natural-language prompt describing the intended component
  behavior and presentation;
- one self-contained default-export React component supplied as TSX or JSX;
- a stable submission identifier and the matching source language.

Version 1 does not accept a repository, environment secrets, multiple source
files, executable prop values or arbitrary package dependencies.

## Core workflow

The frozen workflow is:

1. Validate the submitted prompt, source and language at the domain boundary.
2. Analyze supported component source into a `ComponentContract`.
3. Extract reviewable requirements and propose bounded JSON fixtures.
4. Validate the component metadata, requirements, fixtures and issues as a
   versioned `RunPlan` before execution.
5. Execute eligible fixtures one at a time in the browser-isolated execution
   candidate.
6. Collect deterministic browser evidence and correlate it to the active run.
7. Present the resulting component states and evidence for review.

Steps 1 through 4 have the accepted planning implementation: deterministic
source analysis, deterministic boundary fixtures, optional Gemini proposals,
trusted materialization and final RunPlan validation. SS-M3-001 now connects
that plan to serialized browser execution and bounded result presentation while
reusing the accepted Gate 0 Sandpack boundary.

## AI responsibilities

Gemini is the single MVP AI boundary. It may interpret the user's prompt and
supported source-derived contract metadata, and propose bounded requirements
and JSON-compatible fixture assignments. Submitted component source is not sent
to Gemini. AI output must pass the strict proposal schema and deterministic
StateStorm materialization before it can enter a validated RunPlan. AI does not
execute submitted code, decide deterministic browser outcomes, bypass
unsupported-component rules or modify component source automatically.

## Deterministic browser responsibilities

The browser execution boundary is responsible for compiling and rendering an
eligible component with one JSON fixture at a time, correlating evidence to the
current run, containing supported runtime failures from the parent application,
rejecting stale preview output and reporting observable results. Submitted code
must not execute in the StateStorm parent application or during server
rendering.

Gate 0 proves its hardcoded diagnostic fixtures and accepted Sandpack recovery
sequence. SS-M3-001 adds the RunPlan-to-Sandpack adapter and strict companion
execution-result schemas. Generalized production detectors and requirement
evaluation remain unimplemented.

## Supported component scope

RunPlan version 1 supports only:

- a self-contained React component written in TSX or JSX;
- a default export;
- imports from `react` and tooling-required `react/jsx-runtime` only;
- flat prop metadata using `string`, `number`, `boolean`, `enum`, `array`,
  `object` or `unknown` kinds;
- between one and twelve fixtures per RunPlan;
- fixture props and other executable values that are losslessly
  JSON-serializable.

## Restricted import and props contract

Relative imports, alias imports and packages other than the React allowlist are
rejected. Components that require local modules, imported styles, design
systems or additional npm packages are outside version 1.

Prop and assertion values may contain only strings, finite numbers, booleans,
null, arrays of JSON values and string-keyed JSON objects. Functions, callbacks,
JSX, ReactNode, `undefined`, symbols, bigint, non-finite numbers, Date, Map, Set
and class instances are excluded. Every fixture must provide all required props
and may not provide undeclared props.

## Explicit exclusions

The current frozen scope excludes:

- non-React frameworks and multi-file component applications;
- arbitrary dependencies, repository-relative modules and executable props;
- parent-side or server-side execution of submitted code;
- malicious-code hardening and CPU, memory or infinite-loop containment;
- production failure detectors or generalized requirement evaluation;
- automatic source modification or fixing;
- production UI polish and production security certification.

## Current implemented versus planned capabilities

| Capability | Status |
| --- | --- |
| Gate 0 serialized Sandpack feasibility diagnostic and recovery evidence | Implemented and accepted as the frozen execution baseline |
| Runtime-validated component, requirement, fixture, issue and RunPlan v1 schemas | Implemented and accepted |
| JSON round-trip, cross-field validation and executability classification | Implemented and accepted |
| Deterministic source-code analysis into `ComponentContract` | Implemented for the documented local AST subset; Gate 1 review pending |
| Gemini prompt interpretation and bounded proposal generation | Implemented behind a server-only, one-request boundary with deterministic fallback |
| Trusted requirement and semantic-fixture materialization | Implemented; invalid proposals and candidates fail closed |
| RunPlan v1 assembly and `/preflight` diagnostic | Implemented and accepted; execution is connected separately by SS-M3-001 |
| RunPlan-to-Sandpack execution integration | Implemented locally by SS-M3-001; Gate 3 review and manual browser evidence pending |
| Essential overflow and broken-image detectors | Implemented and accepted as frozen Gate 4 MVP capabilities after public Vercel verification |
| Generalized production detectors and requirement evaluation | Explicitly excluded from SS-M4-001 |
| State atlas presentation | Implemented and accepted with one selected-state live inspection as a frozen Gate 4 MVP capability |
| Automatic component fixing | Explicitly excluded from the current scope |
