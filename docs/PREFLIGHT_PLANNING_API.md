# Preflight planning API

## Endpoint

`POST /api/preflight-plan` accepts the existing strict `ComponentSubmission`
JSON contract and runs in the Node.js runtime. Responses use
`Cache-Control: no-store, max-age=0`.

## Response semantics

- HTTP 400: malformed JSON or a request that fails `ComponentSubmissionSchema`.
- HTTP 200 with `accepted: false`: well-formed source is outside the supported
  analyzer or deterministic fixture contract.
- HTTP 200 with `accepted: true`: the response contains a validated contract,
  a schema-valid RunPlan v1, bounded issues and the public AI status. This
  includes deterministic fallback when Gemini is unavailable.
- HTTP 500: only an unexpected internal service failure. The body is sanitized
  and contains no source, key, provider object, raw error or stack trace.

An accepted response is validated through `PreflightPlanApiResponseSchema`.
The nested RunPlan repeats the same bounded planning issues so downstream
consumers do not lose fallback or candidate-rejection evidence.

## Security and execution boundary

The browser sends source to the StateStorm Node.js route for deterministic AST
analysis. The service never executes, imports or writes submitted code. The
Gemini adapter receives no component source. `/preflight` displays planned data
only and does not send a RunPlan to Sandpack.

After an accepted response, the client may execute the returned RunPlan through
the separately loaded browser-only Sandpack adapter. Submitted source still does
not execute in this Route Handler or the parent application context.

The client page imports only client-safe domain, orchestration and adapter
modules. The Gemini SDK, server planner, TypeScript runtime and analyzer must
remain absent from its client-transitive bundle. Sandpack remains the only
submitted-code execution boundary.
