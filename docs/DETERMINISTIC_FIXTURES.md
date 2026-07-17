# Deterministic boundary fixtures

## Status and scope

SS-M2-001 adds a deterministic planning layer that converts one validated
`ComponentContract` into a small ordered collection of runtime-validated
`Fixture` values. It uses contract metadata only and remains independent of AI,
prompt interpretation, submitted component execution and the frozen Gate 0
sandbox.

This layer generates fixtures, not a complete `RunPlan`. Requirement extraction,
semantic fixture generation, RunPlan assembly and execution remain deferred.

## Public API

`generateDeterministicFixtures(contract)` returns:

```text
{
  fixtures: Fixture[];
  issues: ContractIssue[];
}
```

The input passes `ComponentContractSchema`. Every ordered candidate passes
`FixtureSchema` before canonical deduplication, and every emitted fixture is
validated again after the twelve-fixture cap. Fatal metadata or fixture issues
return no partial fixture collection.

## Representative baseline

The happy path contains every declared required and optional prop. Explicit
JSON-compatible defaults take priority; otherwise the generator uses:

| Kind | Representative value |
| --- | --- |
| `string` | `"Sample text"` |
| `number` | `1` |
| `boolean` | `true` |
| `enum` | first declared enum value |
| `array` | `[]` |
| `object` | `{}` |

Defaults are deep-cloned. Mutable arrays or objects are never shared between the
input contract or different output fixtures. `unknown` is not executable and
produces `UNEXECUTABLE_PROP_KIND` rather than an invented value.

## Fixed strategy order

Candidates always use this priority and stable ID order:

| ID | Boundary strategy |
| --- | --- |
| `det-happy-path` | All props with defaults or representative values |
| `det-minimal-required` | Required props only |
| `det-empty-strings` | Every string becomes empty |
| `det-whitespace-strings` | Every string becomes one space |
| `det-long-strings` | Every string uses the same readable 240–320 character value |
| `det-zero-numbers` | Every number becomes zero |
| `det-negative-numbers` | Every number becomes negative one |
| `det-large-numbers` | Every number becomes 999999 |
| `det-inverted-booleans` | Every happy-path boolean is inverted |
| `det-last-enum-values` | Every enum uses its final declared value |
| `det-empty-collections` | Arrays and objects become empty containers |
| `det-combined-stress` | Empty strings, zero numbers, false booleans, final enums and empty collections |

Happy path is always first, including `{}` for a prop-less component. Optional
props are omitted only by `det-minimal-required`. Every emitted fixture contains
all required props and no undeclared props.

## Deduplication and limit

Canonical JSON comparison sorts nested object keys, so property order cannot
create a false difference. The first candidate wins and later equal prop objects
are discarded without mutation. Duplicate IDs are also discarded after their
first occurrence.

The fixed strategy order defines priority. At most twelve unique fixtures are
returned. If a future strategy expansion produces more, the first twelve remain
and one `DETERMINISTIC_FIXTURE_LIMIT_APPLIED` warning reports the truncation.

## Stable issues and warnings

| Code | Severity | Meaning |
| --- | --- | --- |
| `UNEXECUTABLE_PROP_KIND` | Error | A prop has no executable deterministic JSON kind |
| `INVALID_PROP_DEFAULT` | Error | A default is not JSON-compatible or does not match its kind |
| `INVALID_ENUM_METADATA` | Error | An enum lacks two distinct ordered JSON values |
| `FIXTURE_SCHEMA_VALIDATION_FAILED` | Error | Generated data failed the accepted fixture or contract invariant |
| `DETERMINISTIC_FIXTURE_LIMIT_APPLIED` | Warning | More than twelve unique candidates were truncated |
| `LIMITED_COLLECTION_FIXTURE_COVERAGE` | Warning | A collection without a default can only use an empty container |

Only one collection warning is returned per generation result. Populated nested
array or object values require an explicit default, richer future type-shape
metadata or later AI semantic planning.

## Determinism and safety

The planner uses no randomness, UUID, timestamp, environment value, type-text
evaluation or external dependency. It never imports or executes submitted
component source and never infers undeclared props. Fixture props remain inside
the existing JSON-only executable boundary.
