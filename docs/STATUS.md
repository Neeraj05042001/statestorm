# StateStorm status

## Current work

- Gate: Gate 0 (open; not accepted)
- Task: SS-M0-001-F4
- State: F4 passed local development and built-production verification; public
  redeployment verification remains pending
- Architecture authority: ChatGPT Project
- Repository executor: Codex
- Prior decisions: SS-M0-001-F1 and SS-M0-001-F2 are accepted by the ChatGPT
  Project architecture authority

## Verified F4 evidence

- The deployed pre-F4 build could classify invalid TSX, but restoration changed
  the active run to valid before proving that the current Sandpack client had
  compiled the restored source. A later, uncorrelated listener error could then
  be assigned to that valid run and force `Run failure` while the iframe retained
  the stale compilation overlay.
- Restoration now dispatches the valid `/UserComponent.tsx` and a dedicated
  `recovery-bootstrap` fixture directly to the verified current preview client.
  Fixture controls remain disabled until that client emits a fresh `start`, a
  successful `done`, the public context error is null and the runtime bridge
  emits a fresh, correlated `SANDBOX_READY` event.
- Stale compilation listener messages are diagnostic only outside the active
  serialized invalid probe. They cannot fail a later valid or recovery run.
- Edge 150 development mode passed `safe-short` -> invalid TSX -> restore ->
  `safe-short` -> invalid TSX -> restore -> `safe-long`. Both restorations
  reached `Compiler recovery verified`; the final long render produced 237
  visible characters and the parent heartbeat remained 1.
- The same sequence passed against the built server at
  `http://localhost:3100/gate-0`. The production collection recorded no parent
  `Run failure`, exception, console message or loading failure.
- Neither recovery remounted nor refreshed the Next.js parent application. A
  Sandpack preview/client remount was not necessary.

## Verified F2 evidence

- The accepted F1 `react-ts` entry, readiness, source-window validation,
  nonce/run/fixture/mode correlation and visible-DOM success gates remain in
  place.
- Development Edge 150 reached explicit readiness and completed, without a
  parent refresh:
  - `safe-short` rendered with correlated run
    `run-83d7d575-53e5-43be-ac24-df6e1859de69`.
  - `runtime-crash` produced only correlated `RUNTIME_ERROR` for
    `run-96d1d9d7-4826-43fe-a497-973c35efbfd1`, with the exact message
    `Deliberate Gate 0 runtime failure`.
  - Parent heartbeat changed from 0 to 1 after the crash.
  - `safe-short` recovered under
    `run-1cfe4a3d-9985-49ab-a661-e3e2613cdcad`; heartbeat remained 1.
  - `safe-long` then rendered 237 visible characters under
    `run-cb76bc43-7f6c-4257-a892-e18a1929d61a`.
- Invalid `/UserComponent.tsx` produced the distinct `Compilation diagnostic
  error` state. The context error was null before injection, became populated,
  and returned to null after valid-source restoration.
- The invalid run observed listener `start`, status changes,
  `done.compilatonError=true`, and `action/show-error`. It produced no current
  correlated runtime-bridge event and was never reported as rendered or as a
  runtime error.
- Restoring the valid sample recovered the same preview/provider; a subsequent
  `safe-short` also rendered successfully.
- A forced missing-outcome diagnostic reached the 20,000 ms run timeout. A stale
  iframe message was rejected for nonce mismatch and did not cancel that current
  run's timeout. Initialization remains a separate 30,000 ms timeout.
- The built server at `http://localhost:3100` passed direct `/gate-0` navigation,
  readiness, safe/crash/heartbeat/safe/long, invalid-source, restoration and
  final safe-render checks in Edge 150.
- Production browser collection recorded zero parent exceptions, zero parent
  console messages and zero loading failures. Development collection recorded
  only React development, HMR and Fast Refresh informational messages.

## Compilation observability status

Classification: **accepted provisionally for the serialized hackathon MVP**.

The installed public Sandpack context type exposes `error` as
`SandpackError | null`. Installed listener types expose `action/show-error` and
the misspelled `done.compilatonError`, but those messages carry no StateStorm
nonce, run ID, fixture ID or component mode. Gate 0 associates them with the
single serialized active invalid diagnostic. Only one compilation or fixture run
may execute at a time, and this listener shape must not become the final
compilation-error correlation contract.

## Validation commands

| Command | Result | Important output |
| --- | --- | --- |
| `npm run lint` | Pass | ESLint completed with no errors or warnings |
| `npm run typecheck` | Pass | `tsc --noEmit` completed with no errors |
| `npm run build` | Pass | Next.js 16.2.10 compiled, TypeScript passed, and `/`, `/_not-found` and `/gate-0` were statically prerendered |
| `npm run start -- -p 3100` | Pass | Next.js production server became ready in 995 ms at `http://localhost:3100` |

## Remaining Gate 0 evidence and risks

- The corrected F4 build has not been deployed or verified at the public
  `/gate-0` URL. The earlier deployed build exhibited the recovery failure that
  F4 corrects.
- Compilation observability is accepted provisionally only while execution is
  strictly serialized; it still lacks message-level StateStorm correlation.
- Previous iframe DOM after invalid source is stale output and must never be
  accepted as the current result.
- `reactStrictMode: false` is accepted provisionally only for the Sandpack
  hackathon MVP path and must be reopened before post-hackathon hardening or
  broader product expansion.
- Resource exhaustion, malicious-code hardening and hosted-service availability
  remain outside this spike.

## Blockers

No local blocker remains for runtime crash containment, parent survival,
serialized compilation recovery, compilation diagnostics or built local
production-server execution. Gate 0 remains open because the corrected build
still requires public deployment verification.

## Next permitted action

After separate authorization, deploy the corrected build and verify direct
deployed `/gate-0` navigation plus the F4 recovery sequence. Do not begin
another milestone or mark Gate 0 passed before that evidence is reviewed.
