# StateStorm component and RunPlan contract version 1

## Status and scope

SS-M1-001 defines the runtime-validated domain boundary that precedes execution.
Zod schemas are the source of truth, and all exported TypeScript types are
inferred from those schemas. This layer validates manually supplied data only.
It does not parse source, infer props, call AI, generate fixtures, evaluate
requirements or execute a RunPlan.

## Contract modules

| Contract | Purpose |
| --- | --- |
| `ComponentSubmission` | Bounded TSX/JSX source submission with a stable URL-safe ID |
| `ComponentContract` | Supported default-export React metadata, import allowlist, props and warnings |
| `PropDefinition` | Flat prop metadata with a supported kind and JSON-compatible defaults/enums |
| `Requirement` | Requirement metadata and optional supported assertion |
| `Fixture` | Labeled JSON-only prop object and deterministic/AI/manual origin metadata |
| `ContractIssue` | Stable issue code, severity, message and optional field path/suggestion |
| `RunPlan` | Versioned aggregate with cross-field validation and executability classification |

Every object schema is strict. Unknown contract fields are rejected instead of
being silently discarded.

## JSON executable-value boundary

`JsonValueSchema` accepts only strings, finite numbers, booleans, null, arrays
of JSON values and string-keyed records of JSON values. It rejects undefined,
functions, symbols, bigint, non-finite numbers, Date, Map, Set and user-defined
class instances.

Fixture `props`, prop `defaultValue`, prop `enumValues` and assertion `value`
use this boundary. Callbacks, JSX values and ReactNode values are not supported
by contract version 1.

## Supported component contract

- Language is `tsx` or `jsx` and must match the submission language.
- Export style is the literal `default`.
- Imports may contain only `react` and, when generated tooling needs it,
  `react/jsx-runtime`.
- Relative imports, alias imports and all other packages are rejected.
- Prop kinds are `string`, `number`, `boolean`, `enum`, `array`, `object` and
  `unknown`.
- Prop names must be unique. Enum metadata requires at least two JSON-compatible
  values.
- An `unknown` required prop still needs a concrete JSON value in every fixture.

This contract records metadata; SS-M1-001 does not infer it from component
source.

## Requirement contract

Supported assertion types are `text-present`, `text-absent`, `element-count`,
`image-present`, `renders` and `no-overflow`. Deterministic requirements require
one of those assertions. Requirements categorized as `unsupported` must use
`verification: "unsupported"`.

No assertion evaluator or detector is implemented in this task.

## RunPlan version 1

A RunPlan contains:

- `version: 1`
- one validated submission and component contract
- requirements with unique IDs
- between one and twelve fixtures with unique IDs
- zero or more contract issues

Schema refinements reject duplicate prop names, fixture IDs and requirement
IDs; missing required fixture props; undeclared fixture props; submission and
component language mismatches; and any value that would prevent a lossless JSON
serialize/parse round trip.

Validation issues use concrete paths such as
`fixtures[0].props.title`, `component.props[1].name` and
`requirements[0].expectedAssertion`.

## Structural validity and executability

`parseRunPlan` and `safeParseRunPlan` validate structure and cross-field rules.
An issue with `severity: "error"` remains valid serialized data, but
`isRunPlanExecutable` returns false. Warnings do not make a validated plan
non-executable.

Executability here is a contract classification only. No RunPlan-to-Sandpack
adapter or execution-result contract exists yet, and the frozen Gate 0 sandbox
behavior is unchanged.
