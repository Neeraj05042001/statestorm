# Component analysis API

## Purpose

`POST /api/component-analysis` is the explicit browser-to-server boundary for
the deterministic component source analyzer. It accepts one validated
`ComponentSubmission` and returns either a validated `ComponentContract` or
stable `ContractIssue` values.

The route does not execute, import, transpile or persist submitted source. It
does not invoke AI, create fixtures or send code to the Gate 0 sandbox.

## Runtime boundary

- The App Router Route Handler explicitly selects the Node.js runtime.
- The handler calls `src/server/component-analysis`, whose public entry and
  implementation both import the `server-only` marker.
- Only that service imports the deterministic analyzer. The analyzer's
  TypeScript Compiler API dependency is absent from client-transitive modules.
- Both input and output cross runtime schema boundaries. Unexpected errors are
  converted to a generic issue without an `Error`, TypeScript diagnostic or
  stack trace.
- Responses set `Cache-Control: no-store, max-age=0`.

## Request

The JSON body must satisfy the existing strict `ComponentSubmissionSchema`:

```json
{
  "id": "submission-6fd5d2f",
  "prompt": "Render a compact status card",
  "componentCode": "export default function StatusCard() { return <p>Ready</p>; }",
  "language": "tsx"
}
```

The ID must use URL-safe unreserved characters. The browser creates a UUID-based
ID for each request, but the server still validates it. Prompt and component
source are required bounded strings; language is `tsx` or `jsx`.

## Response

Successfully processed supported source returns HTTP 200:

```json
{
  "accepted": true,
  "contract": {
    "componentName": "StatusCard",
    "exportStyle": "default",
    "language": "tsx",
    "imports": [],
    "props": [],
    "warnings": []
  },
  "issues": []
}
```

Successfully processed unsupported source is also HTTP 200. It is an analysis
outcome, not a server failure:

```json
{
  "accepted": false,
  "issues": [
    {
      "code": "UNSUPPORTED_IMPORT",
      "severity": "error",
      "message": "Import 'some-package' is not supported",
      "path": ["componentCode", 1, 1]
    }
  ]
}
```

Both variants are validated with `ComponentAnalysisApiResponseSchema`, which
reuses `ComponentContractSchema` and `ContractIssueSchema`.

## HTTP behavior

| Status | Meaning |
| --- | --- |
| 200 | Analysis completed, whether the source was accepted or unsupported |
| 400 | Malformed JSON or a request that fails `ComponentSubmissionSchema` |
| 500 | Unexpected internal failure, returned only as `INTERNAL_ANALYSIS_ERROR` |

The service does not log complete source, complete prompts, request headers or
secrets. Request input is held only for the current request and is not stored.

## Current limitations

The endpoint requires the application server and is not available as offline
browser-only analysis. It accepts only the frozen deterministic source subset
documented in `SOURCE_ANALYSIS.md`. There is no authentication, persistence,
AI planning, fixture generation, sandbox execution or state-atlas integration
in this milestone.
