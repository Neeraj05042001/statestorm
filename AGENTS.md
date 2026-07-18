# StateStorm repository executor instructions

## Authority and scope

- The ChatGPT Project is the architecture and decision authority.
- Codex is the repository executor. Implement only the authorized task packet.
- The frozen Gate 0 scope is an architecture spike that compiles and renders one
  hardcoded React/TypeScript component under controlled, JSON-serializable
  fixtures in Sandpack.
- Do not add a second AI provider, production failure detectors, a state atlas,
  production UI polish, or automatic fixing unless a later task packet
  explicitly authorizes it.
- Do not proceed past a gate until the ChatGPT Project has accepted that gate.
- Avoid generalized abstractions and feature creep.

## Execution boundary

- Submitted component code must never execute in the StateStorm parent
  application, during server rendering, or through parent-side `eval`,
  `new Function`, generated dynamic imports, or executable
  `dangerouslySetInnerHTML`.
- Keep Sandpack behind the repository's client-only boundary and treat it as a
  provisional **browser-isolated execution candidate**, not a hardened security
  sandbox.
- Validate all sandbox messages before accepting them.
- Never expose, log, add, or request secrets. This repository requires no
  environment variables for Gate 0.

## Required validation

Run these commands after implementation changes:

```text
npm run lint
npm run typecheck
npm run build
```

When browser access is available, also execute the Gate 0 sequence in
`docs/DEMO_PATH.md` against development and production servers.

## Documentation rules

- Update `docs/STATUS.md` with the current gate, validation evidence, blockers,
  and next permitted action.
- Update architecture, decisions, limitations, and demo-path documentation when
  implementation evidence changes.
- Distinguish verified facts, provisional findings, and pending manual evidence.
- Never mark Gate 0 passed; only the ChatGPT Project architecture review can do
  that.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may
all differ from training data. Read the relevant guide in
`node_modules/next/dist/docs/` before writing Next.js code. Heed deprecation
notices.
<!-- END:nextjs-agent-rules -->
