# Deterministic component source analysis

## Status and boundary

SS-M1-002 implements the Gate 1 source-analysis step for the frozen,
self-contained React component subset. The analyzer accepts a runtime-validated
`ComponentSubmission` and returns either a `ComponentContract` validated by the
existing schema or stable `ContractIssue` errors.

Analysis is deterministic and in memory. It does not execute, import, transpile
or write submitted source. It does not call AI, resolve packages, generate
fixtures, evaluate requirements or invoke the Gate 0 sandbox.

## Public API

`analyzeComponentSource(submission)` returns one of:

- `{ accepted: true, contract, issues }` when the complete supported contract
  passes `ComponentContractSchema`;
- `{ accepted: false, issues }` when submission validation, syntax, imports,
  component resolution, prop analysis or contract validation fails.

Fatal errors never return a partial contract. Identical input produces
identical output; no IDs, timestamps or machine paths are generated.

## Analysis pipeline

1. Validate the input with `ComponentSubmissionSchema`.
2. Parse TSX or JSX with `typescript.createSourceFile`, the matching script kind,
   `ScriptTarget.Latest` and parent nodes enabled.
3. Convert parse diagnostics into bounded `SOURCE_SYNTAX_ERROR` issues.
4. Validate static imports and reject dynamic imports, `require`, re-exports,
   namespaces and module declarations.
5. Resolve exactly one named default component declaration.
6. Traverse inline or local prop declarations in source order.
7. Extract only complete JSON literal destructuring defaults.
8. Validate the generated contract with `ComponentContractSchema`.

The analyzer uses TypeScript syntax-tree facts only. It deliberately does not
create a `Program`, invoke the TypeScript type checker or perform module
resolution.

## Supported component declarations

- named `export default function Component(...)` declarations;
- a named local function followed by `export default Component`;
- a named local arrow or function expression followed by the same export;
- `React.FC<Props>` and `React.FunctionComponent<Props>` through a React default
  or namespace binding;
- `FC<Props>` and `FunctionComponent<Props>` imported from React, including
  local aliases;
- named components with no parameter, representing no props.

Anonymous defaults, class components, generic functions, multiple parameters,
default expressions, higher-order wrappers, `memo` and `forwardRef` are
rejected.

## Supported prop declarations

The one props parameter may use a local interface, a local object type alias or
an inline object type. A supported React function-component annotation may
supply that same local type for an unannotated identifier or destructured
parameter. Interfaces must not be inherited or generic, and type aliases must
be direct object literals.

Supported metadata is:

- `string`, `number` and `boolean` primitives;
- unions of at least two JSON literal values as `enum` props;
- `T[]` and `Array<T>` when `T` is itself supported;
- inline object literals and one locally declared non-generic object interface
  or object type alias;
- optional markers and supported destructuring defaults;
- property order and useful `typeText` from source order and source text.

Callbacks, ReactNode, JSX values, Date, Map, Set, Promise, symbol, bigint, any,
unknown, generic parameters, imported types, conditional or mapped types,
intersections, non-literal unions and indexed-access types fail closed as
`UNSUPPORTED_PROP_TYPE`.

## Static default extraction

Defaults are read only from simple object destructuring. Supported values are
quoted string literals, finite numeric literals, booleans, null, and complete
array or object literals containing the same supported values. The value must
also match the inferred prop kind.

Identifiers, calls, template expressions, functions, computed properties,
spreads, class instances, undefined, NaN and Infinity produce
`UNSUPPORTED_PROP_DEFAULT`. No expression is evaluated.

## Stable issue codes

| Code | Meaning |
| --- | --- |
| `SOURCE_SYNTAX_ERROR` | TypeScript reported invalid TSX or JSX syntax |
| `UNSUPPORTED_IMPORT` | Package, side-effect, imported-type or re-export form is unsupported |
| `RELATIVE_IMPORT_NOT_ALLOWED` | A relative module was imported |
| `ALIAS_IMPORT_NOT_ALLOWED` | A repository path alias was imported |
| `DYNAMIC_IMPORT_NOT_ALLOWED` | Source contains `import()` |
| `REQUIRE_NOT_ALLOWED` | Source contains `require()` |
| `UNSUPPORTED_SOURCE_DECLARATION` | Source contains a namespace or module declaration |
| `MISSING_DEFAULT_EXPORT` | No default component export exists |
| `UNSUPPORTED_DEFAULT_EXPORT` | The default is an expression, wrapper, re-export or unsupported declaration |
| `UNRESOLVED_DEFAULT_EXPORT` | A default identifier does not resolve to one local declaration |
| `ANONYMOUS_COMPONENT_NOT_ALLOWED` | The default component has no stable name |
| `CLASS_COMPONENT_NOT_SUPPORTED` | The default resolves to a class |
| `GENERIC_COMPONENT_NOT_SUPPORTED` | The component function declares type parameters |
| `MULTIPLE_COMPONENT_PARAMETERS` | The component takes more than one parameter |
| `MISSING_PROPS_TYPE` | A props parameter has no supported annotation |
| `UNRESOLVED_PROPS_TYPE` | A props name has no local declaration |
| `UNSUPPORTED_PROPS_DECLARATION` | The parameter or top-level props declaration is unsupported |
| `UNSUPPORTED_PROP_TYPE` | A prop type is executable, imported, composed or otherwise unsupported |
| `UNSUPPORTED_PROP_DEFAULT` | A default is not a complete compatible JSON literal |
| `DUPLICATE_PROP_NAME` | A props declaration repeats a property |
| `CONTRACT_VALIDATION_FAILED` | Input or generated output failed an accepted domain schema |

Issue paths use `componentCode`, one-based line and one-based column where a
source location exists. Messages and suggestions are bounded domain data; raw
TypeScript diagnostic objects are never returned.

## Verified evidence

Vitest covers every accepted component form, interface/type/inline props,
destructuring, primitives, enums, arrays, objects and defaults. It also covers
syntax errors, every rejected import/export category, unsupported types,
deterministic output, source-order props, useful issue paths and final schema
validation. The accepted M1-001 tests continue to run unchanged.

