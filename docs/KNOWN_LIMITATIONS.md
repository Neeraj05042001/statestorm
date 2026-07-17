# Known limitations

1. **Hosted execution dependency.** Gate 0 requires
   `2-19-8-sandpack.codesandbox.io` and CodeSandbox-hosted package metadata. It
   is not offline-capable.
2. **Multiple external package services.** Verified initialization used
   `data.jsdelivr.com`, `cdn.jsdelivr.net` and
   `prod-packager-packages.codesandbox.io`. Network policy, availability or rate
   limits can prevent initialization.
3. **Non-blocking external telemetry timeout.** Browser evidence showed
   `POST https://col.csbops.io/data/sandpack` failing with
   `ERR_CONNECTION_TIMED_OUT`. Public verification proved that safe rendering,
   runtime recovery and compiler recovery still succeed when it occurs. It
   remains external console noise and a network limitation.
4. **Development Strict Mode is disabled temporarily.** Sandpack 2.20.0 client
   registration was unstable under development effect replay. Disabling Strict
   Mode stabilized the current client, but removes React's development-only
   double-invocation checks from the whole Next.js shell. This accommodation
   must be reopened after the hackathon.
5. **Diagnostic visible-output proof only.** Gate 0 checks a known root, marker,
   expected fixture strings and layout box. This prevents the observed false
   positive but is not the future general blank-render detector.
6. **React-only spike.** Only the installed `react-ts` template and a self-
   contained sample are supported.
7. **Hardcoded fixtures and component.** There is no component editor, arbitrary
   user input, arbitrary dependency support or semantic fixture generation.
8. **Hosted versions can move.** The template specifies React and ReactDOM
   ranges; browser validation resolved both to 19.2.7 while the parent uses
   19.2.4.
9. **Security hardening is incomplete.** The iframe boundary, nonce, protocol
   guards and source equality are useful evidence, not proof of malicious-code
   safety.
10. **No resource containment.** CPU exhaustion, infinite loops, memory pressure,
    storage access and abusive network behavior are not controlled.
11. **React error-boundary scope.** The boundary catches render and React
    lifecycle failures below it. It does not contain infinite loops, resource
    exhaustion, arbitrary asynchronous callback failures or every browser API
    failure.
12. **Compilation correlation is provisional and serialized.** The installed
    public context exposes `SandpackError | null`, and installed listener types
    expose `action/show-error` plus `done.compilatonError`. Listener messages
    have no StateStorm nonce/run/fixture/mode fields. Only one compile, recovery
    or fixture run may execute at a time, and their internal error wording is not
    a stable final contract. F4 ignores uncorrelated listener errors outside the
    active invalid probe; that is a serialized Gate 0 accommodation, not final
    correlation.
13. **Invalid compilation retains prior DOM.** Because invalid source never
    starts the new runtime bridge, the iframe can continue showing the last valid
    DOM. The parent correctly refuses to treat that stale run ID as current and
    now withholds controls until current-client compile completion, a null
    context error and a fresh bootstrap are verified. This is still not a final
    preview-error user experience.
14. **Public verification is point-in-time evidence.** Gate 0 passed at
    `https://statestorm.vercel.app/gate-0`, including hosted dependency access
    and compiler recovery. That does not guarantee future CodeSandbox service
    availability, immutable hosted versions or production readiness.
15. **Gate 0 is not production certification.** Acceptance proves the scoped
    hackathon MVP feasibility baseline only. It does not remove any limitation
    above or certify the iframe for hostile submitted code.
