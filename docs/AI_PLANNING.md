# Gemini semantic planning boundary

## Purpose

SS-M2-002 adds optional semantic enrichment after deterministic source analysis
and boundary-fixture generation. Gemini is the single MVP provider. It proposes
bounded data; it does not analyze source, execute a component, verify browser
behavior or construct the final RunPlan.

## Provider configuration

- Package: `@google/genai`
- Required key for semantic generation: `GEMINI_API_KEY`
- Optional model override: `GEMINI_MODEL`
- Default model: `gemini-3.1-flash-lite`
- Request limit: one SDK request with `retryOptions.attempts` set to `1`
- Deadline: approximately 12 seconds
- Response: `application/json` constrained by a Gemini JSON Schema and then
  parsed through `AiPlanningProposalSchema`

Public production AI planning was successfully verified with
`GEMINI_MODEL=gemini-3.1-flash-lite`. That exact model is also the repository
default. The bounded `GEMINI_MODEL` server override remains available; there is
no model fallback, automatic model selection or second provider.

The SDK client is initialized lazily in an `import "server-only"` adapter. The
key is never returned, logged, placed in an issue or included in provider input.

## Data sent to Gemini

The request contains exactly:

1. the original user prompt;
2. the validated serialized `ComponentContract`;
3. deterministic happy-path props;
4. trusted planning instructions.

Submitted component source is deliberately absent. The request also excludes
environment values, server metadata, filesystem paths, raw errors and stack
traces. Prompt and contract strings are labeled untrusted data in the trusted
instructions and cannot redefine the planning boundary.

## Intermediate proposal

The strict proposal contains up to eight requirement suggestions and four
semantic fixture suggestions. Each requirement supplies a title, statement,
classification and rationale. Each semantic fixture supplies a label, intent,
up to twelve JSON-text assignments and a list of optional props to omit. All
properties are required and unknown properties are rejected.

Gemini JSON Schema narrows generation, but it is not the trust boundary. The
response text must parse as JSON and pass the Zod proposal schema before any
value reaches a materializer.

## Trusted materialization

Requirement materialization normalizes whitespace and Unicode, removes stable
duplicates, preserves proposal order, caps output at eight and validates each
accepted value through `RequirementSchema`. Heuristic requirements map to the
current `state` category and unsupported requirements remain explicitly
unsupported. Deterministic classifications are rejected because the proposal
does not carry a trusted supported assertion.

Semantic fixture materialization starts from a fresh deep clone of happy-path
props. JSON text must parse to a JSON value, the prop must be declared, the
value must match its top-level kind and enum, and only optional props may be
omitted. Each candidate independently passes `FixtureSchema`; one invalid
candidate does not discard later valid candidates.

Fixture merge priority is happy path, valid semantic fixtures, then remaining
deterministic boundaries. Canonical JSON removes duplicate prop states before
the twelve-fixture cap. Stable warnings explain every rejection, duplicate and
limit. The final object must pass `RunPlanSchema`.

## Failure behavior

Public statuses are `generated`, `unavailable`, `timeout`, `refused`,
`invalid-output` and `provider-error`. Missing keys and quota exhaustion are
unavailable. Every non-generated status adds a sanitized warning and assembles
a deterministic-only RunPlan with zero fabricated requirements and zero AI
fixtures. No automatic retry or alternate provider is used, and expected Gemini
failure is not an HTTP 500.

Tests inject fake `AiPlannerProvider` implementations. The test suite never
calls Gemini.
