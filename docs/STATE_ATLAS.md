# Interactive State Atlas

## Status and scope

SS-M4-001 adds the judge-facing State Atlas for a completed, validated
`ExecutionSessionResult`. Local production-build and public Vercel browser
verification passed, and the architecture authority accepted Gate 4. The State
Atlas and one-state live inspection are accepted MVP capabilities; Gate 4 is
passed, closed and frozen.

The atlas is a recorded-evidence presentation layer. It does not change fixture
execution status, verify prompt requirements, persist a session, capture a
screenshot or edit and selectively rerun fixtures.

## Accepted browser evidence

The production-build `AtlasProductCard` sequence produced a validated atlas,
preserved runtime and blank classifications, displayed overflow and confirmed
broken-image findings, and exercised every atlas filter. The first issue was
selected predictably. Selecting a clean state mounted one inspection sandbox;
changing selection replaced its lifecycle; failed and blank states showed
recorded-evidence overlays; and inspection never changed recorded results.

A complete local rerun reset and recreated the atlas. One initial happy-path
timeout did not reproduce on rerun or after hard refresh: the happy path passed
and Other failures returned to zero.

Public Vercel verification in an extension-free browser reproduced the
validated Atlas, correct runtime and blank classifications, correct summary
counts and every filter. It confirmed predictable first-issue selection, one
live inspection sandbox, replacement of its lifecycle on selection change,
recorded-evidence overlays and fresh **Run again** session ownership. Happy path
passed, Other failures remained zero, inspection did not overwrite recorded
findings, no hydration warning occurred and no prompt requirement was falsely
marked passed or failed.

Recorded execution and detector findings remain authoritative. No screenshots
or requirement verdicts were added.

## Model construction

`buildStateAtlas` is a pure builder with two inputs: the accepted RunPlan and a
completed execution session. It revalidates both inputs, rejects cancelled
sessions, unknown results, missing results and duplicate fixture IDs, then
preserves RunPlan fixture order.

Every entry contains the meaningful fixture label, origin, intent and cloned
JSON props, its validated execution result, its validated visual findings and
one deterministic display category. The final object passes
`StateAtlasSchema` before it reaches the UI.

The allowed categories are:

- `clean`
- `runtime-failure`
- `blank-render`
- `compile-failure`
- `timeout`
- `infrastructure-failure`
- `overflow-warning`
- `broken-image`
- `cancelled`

Execution failure classifications take priority over visual findings. For a
passed fixture, confirmed broken-image evidence takes display priority over an
overflow warning. Summary counts still count both detector kinds when both are
present. A passed fixture with any accepted visual finding is never displayed
as clean.

## Interactive presentation

After execution completes, the atlas replaces the long result list as the
primary presentation. The prior ordered summaries, sanitized messages and
detector-unavailable warnings remain available under **Detailed execution
evidence**.

The summary reports total, clean, runtime, blank, overflow, broken-image and
other-failure state counts. Accessible pressed-state buttons filter All,
Issues, Clean, Runtime, Blank, Overflow and Broken images. Cards show a
meaningful label, AI or deterministic origin, intent, category, execution and
detector badges, compact JSON props and a keyboard-operable inspect action.

Initial selection is the first issue in RunPlan order. If there is no issue,
`det-happy-path` is selected when present, otherwise the first entry is used.
When a filter hides the current selection, selection moves deterministically to
the first visible entry. An empty filter result mounts no inspection preview.

## Selected live inspection

Exactly one selected passed state may mount a client-only Sandpack preview. The
preview is labeled **Live inspection — rerendered from recorded fixture props**.
It receives the original submitted source and the selected recorded JSON props
through the same virtual-file construction used by Gate 3. Submitted source
still executes only inside the cross-origin Sandpack iframe.

Changing selection keys the provider to the session and fixture, which removes
the prior inspection lifecycle before the next selected state is displayed.
The atlas is shown only after serial execution is complete, so the inspection
sandbox does not run beside an execution sandbox. Starting a complete rerun
unmounts the atlas before the execution adapter becomes active.

Runtime, compile, blank, timeout, infrastructure and cancelled entries show a
recorded-evidence overlay instead of attempting to replace their result with a
new verdict. An inspection rerender never writes into the execution session or
State Atlas. Recorded execution and detector findings remain authoritative.

## Deliberate exclusions

- no screenshot capture or visual-regression baseline
- no requirement pass/fail verdicts
- no fixture or component editing
- no selective result replacement
- no responsive viewport matrix
- no persistence, export or downloadable report
- no iframe per atlas card
