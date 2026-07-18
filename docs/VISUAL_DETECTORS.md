# Essential visual detectors

## Status and boundary

SS-M4-001 adds two conservative, browser-observed detectors: possible layout
overflow and confirmed broken images. Detector logic runs inside the active
fixture's Sandpack iframe. The parent never queries submitted DOM, fetches a
submitted image URL or inserts submitted HTML.

Local production-build and public Vercel browser verification passed. Overflow
detection and broken-image detection are accepted MVP capabilities, and Gate 4
is passed, closed and frozen.

Findings supplement `FixtureExecutionResult`; they never replace or reinterpret
`passed`, `runtime-error`, `blank-render`, `compile-error`, `timeout`,
`infrastructure-error` or `cancelled`.

## Accepted browser evidence

Production-build browser verification observed conservative overflow warnings
on constrained long-content states and confirmed broken-image findings without
complete URLs. Runtime-error and blank-render states retained their execution
classifications, later states continued, and inspection rerenders did not
change recorded findings.

One initial local happy-path timeout was non-reproducible. The happy path passed
on rerun and after a hard refresh, with Other failures returning to zero.

Public Vercel verification in an extension-free browser reproduced
conservative overflow warnings and confirmed broken-image findings without
exposing full image URLs. Runtime and blank classifications remained intact,
happy path passed, Other failures remained zero, inspection did not overwrite
recorded findings and no hydration warning occurred. No prompt requirement was
falsely marked passed or failed. The detector milestone adds neither screenshots
nor prompt-requirement verdicts.

## Collection sequence

The runtime bridge first proves the correlated fixture root committed. For a
meaningful render, it waits 750 ms for layout and image state to settle, then
collects bounded plain metadata. The detector event carries the Gate 3 source
marker and protocol version plus current `sessionId`, `runId`, `fixtureId` and
nonce.

The parent accepts an event only when:

- the top-level object has exactly the allowed detector-event keys;
- every correlation field matches the active fixture;
- `MessageEvent.source` exactly equals the active preview iframe window;
- the kind, strings, arrays and finite dimensions pass bounded validation;
- no detector contributes more than five observations; and
- no unknown field, raw node, `Error`, source string, URL or HTML is present.

The parent normalizes accepted observations into `DetectorFindingSchema`
values. Stable IDs are assigned with deterministic application code from the
fixture identity, detector kind and finding order. Final fixture results reject
a finding whose `fixtureId` does not match the result.

If the runtime detector reports an internal collection failure, the execution
result is preserved with no visual finding and a sanitized warning. A parent
wait of 1,750 ms bounds missing detector evidence. At overall fixture cleanup,
an otherwise complete meaningful render remains passed and records detector
unavailability rather than becoming a submitted-component timeout.

## Overflow heuristic

The detector inspects the correlated fixture root and at most 199 visible
descendants, for a maximum of 200 candidates. It uses a two-pixel tolerance and
reports at most five findings.

A candidate is reported when its scroll width exceeds client width plus the
tolerance, its scroll height exceeds client height plus the tolerance, or both.
Hidden, transparent, zero-sized and explicitly marked StateStorm infrastructure
elements are ignored. Root-level horizontal overflow represents bounded
document/root overflow without treating ordinary sandbox-shell page scroll as
submitted layout evidence.

Evidence contains only detector name, tag, an optional bounded `id` or
`data-testid` hint, axis and rounded client/scroll dimensions. Text content and
HTML are never collected. The finding uses warning severity and the wording
**possible layout overflow**; it is not a prompt-requirement verdict.

False positives remain possible for intentional scrolling, carousels,
off-canvas layouts and deliberately clipped decoration. False negatives remain
possible for transform-only overflow, pseudo-elements, canvas/SVG internals,
late font changes, content outside the bounded scan and responsive states not
represented by the current preview size.

## Broken-image heuristic

The detector inspects at most 100 rendered `img` elements and reports at most
five findings. An image is confirmed broken only when `complete === true` and
`naturalWidth === 0`. Healthy images and images still pending at collection
time are ignored.

Evidence records only the `IMG` tag, an optional bounded hint, whether non-empty
alt text exists and one source classification: `empty`, `relative`, `external`
or `data`. The complete source URL is never emitted. The parent does not fetch,
proxy or retry submitted image resources. Confirmed broken images use error
severity, but the fixture execution status remains passed when visible DOM
otherwise passed.

External availability and image timing can change between recorded execution
and live inspection. Pending images can therefore be missed, and a later
inspection rerender is not allowed to overwrite the recorded finding.
