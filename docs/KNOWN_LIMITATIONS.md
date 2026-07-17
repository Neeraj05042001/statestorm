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
16. **React-only component import contract.** Contract version 1 allows only
    `react` and tooling-required `react/jsx-runtime`. Relative modules, aliases
    and arbitrary package dependencies are rejected.
17. **Executable props are JSON-only.** Callbacks, functions, JSX, ReactNode,
    Date, Map, Set, bigint, class instances and non-finite numbers cannot appear
    in fixtures or other executable values.
18. **Self-contained component scope.** Components that require local files,
    styles imported from modules, design systems or other npm packages are not
    representable by the current contract.
19. **Only ComponentContract metadata is source-derived.** SS-M1-002 derives the
    documented local component and prop subset. Requirement, fixture, issue and
    RunPlan assembly remain supplied data; they are not inferred or generated.
20. **No AI generation exists.** Deterministic AST analysis is implemented, but
    there is no AI interpretation, requirement extraction, fixture generator or
    OpenAI integration.
21. **Execution integration is deferred.** A validated executable RunPlan is a
    data classification only; no RunPlan-to-Sandpack adapter or versioned
    execution-result contract exists yet.
22. **Dependency audit findings remain open.** `npm audit` reports two moderate
    dependency findings. They are non-blocking for the accepted RunPlan version
    1 baseline, and no forced dependency upgrade was performed. They require a
    separately authorized dependency review before production certification.
23. **Component declaration support is narrow.** Analysis accepts named default
    functions, named local functions or arrows exported directly as default,
    and documented React `FC`/`FunctionComponent` annotations only. Anonymous
    defaults, wrappers, `memo` and `forwardRef` are unsupported.
24. **No class or generic components.** Class declarations, generic component
    functions and components with multiple parameters fail closed.
25. **No imported prop types.** Props must resolve to an inline object, one
    local interface or one local object type alias in the submitted source.
26. **No executable or ReactNode props.** Callbacks, function types, ReactNode,
    JSX values and other executable shapes are rejected rather than classified
    as `unknown`.
27. **No JSDoc prop inference.** JSX source with a props parameter must still
    provide a supported type declaration; JSDoc is not inspected.
28. **No full TypeScript semantic checking.** The analyzer uses
    `createSourceFile` and local syntax traversal only. It does not create a
    `Program`, invoke the type checker, resolve modules or prove body-level type
    correctness.
29. **Complex type composition is unsupported.** Inherited interfaces,
   intersections, conditional and mapped types, indexed access, generic type
   parameters, non-literal unions and recursive object types fail closed.
30. **Analysis requires the application server.** `/analyze` calls the Node.js
   application route; the deterministic analyzer is intentionally unavailable
   when that server cannot be reached.
31. **No offline browser-only analysis.** The TypeScript Compiler API and source
   analyzer remain server-only and are not shipped to the client for offline
   use.
32. **Analysis input is not persisted.** Prompt, component source and result
   live only in browser memory and the current request. A reload loses them, and
   there is no history, sharing or recovery mechanism.
33. **The frozen source subset still applies.** The submission page does not
   expand analyzer support beyond named, self-contained components with local
   JSON-compatible props and the documented import restrictions.
34. **Analysis triggers no AI or execution.** Submitting the form does not plan
   requirements, generate fixtures, execute Sandpack, produce a state atlas or
   edit the component.
35. **No populated collection generation without defaults.** Array and object
   props use their explicit JSON defaults or empty containers. Flat kind and
   type-text metadata is insufficient to invent safe nested values.
36. **No semantic domain values.** Deterministic fixtures use generic boundary
   representatives and do not interpret the prompt or infer business-specific
   states such as realistic prices, names or statuses.
37. **Grouped strategies reduce isolation.** Each boundary strategy varies all
   props of a matching kind together. A failing grouped fixture may not identify
   one individual prop as the cause.
38. **Maximum twelve deterministic fixtures.** Fixed priority and canonical
   deduplication keep only the first twelve unique candidates. Broader coverage
   requires an explicit future planning decision.
39. **Prompt interpretation remains absent.** `ComponentSubmission.prompt` is
   required by the accepted contract but is not consumed by deterministic
   fixture planning.
40. **Deterministic fixtures are not executed.** SS-M2-001 does not assemble a
   complete RunPlan, connect fixtures to Sandpack or produce browser evidence.
