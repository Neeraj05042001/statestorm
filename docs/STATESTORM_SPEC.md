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

Only the input and RunPlan contract validation in steps 1 and 4 is implemented
in the Gate 1 domain layer. Gate 0 separately proves the feasibility of a
hardcoded serialized Sandpack diagnostic. The remaining workflow steps are
planned and are not implemented by the current baseline.

## AI responsibilities

The planned AI boundary may interpret the user's prompt and supported
source-derived metadata, normalize requirements, and propose JSON-compatible
fixtures or contract issues. AI output must pass the deterministic RunPlan
contract before it can become executable. AI does not execute submitted code,
decide deterministic browser outcomes, bypass unsupported-component rules or
modify component source automatically.

No OpenAI integration, AI extraction, requirement extraction or AI fixture
generation is implemented in the current baseline.

## Deterministic browser responsibilities

The browser execution boundary is responsible for compiling and rendering an
eligible component with one JSON fixture at a time, correlating evidence to the
current run, containing supported runtime failures from the parent application,
rejecting stale preview output and reporting observable results. Submitted code
must not execute in the StateStorm parent application or during server
rendering.

Gate 0 proves these responsibilities only for its hardcoded diagnostic fixtures
and accepted Sandpack recovery sequence. A RunPlan-to-Sandpack adapter,
generalized failure detectors and versioned execution results are not yet
implemented.

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
| Source-code analysis into `ComponentContract` | Planned; next permitted work and not implemented |
| AI prompt interpretation, requirement extraction and fixture generation | Planned; not implemented |
| RunPlan-to-Sandpack execution integration | Planned; not implemented |
| Deterministic production detectors and requirement evaluation | Planned; not implemented |
| State atlas presentation | Planned; not implemented |
| Automatic component fixing | Explicitly excluded from the current scope |
