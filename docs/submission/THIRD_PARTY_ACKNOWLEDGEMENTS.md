# Third-party acknowledgements

StateStorm is built with the direct packages and external services below. Package versions and licence identifiers were read from the installed package metadata for accepted repository HEAD `c281d1659e86ba4bf253874f963f753bf7917017`. This is an acknowledgement record, not legal advice or a replacement for upstream licence texts.

## Direct runtime packages

| Package | Installed version | Role in StateStorm | Licence reported by package metadata |
| --- | ---: | --- | --- |
| `next` | 16.2.10 | Next.js App Router application and server boundaries | MIT |
| `react` | 19.2.4 | Parent application UI | MIT |
| `react-dom` | 19.2.4 | Parent DOM rendering | MIT |
| `@codesandbox/sandpack-react` | 2.20.0 | Client-only browser execution and selected-state inspection | Apache-2.0 |
| `@google/genai` | 2.12.0 | Server-only Gemini semantic-planning adapter | Apache-2.0 |
| `zod` | 4.4.3 | Runtime schemas and validation | MIT |
| `server-only` | 0.0.1 | Server-boundary import guard | MIT |

## Direct development packages

| Package | Installed version | Role in StateStorm | Licence reported by package metadata |
| --- | ---: | --- | --- |
| `typescript` | 5.9.3 | Type checking and the server-side TypeScript Compiler API analyzer | Apache-2.0 |
| `tailwindcss` | 4.3.3 | Styling system | MIT |
| `@tailwindcss/postcss` | 4.3.3 | Tailwind/PostCSS build integration | MIT |
| `vitest` | 4.1.10 | Automated tests | MIT |
| `eslint` | 9.39.5 | Linting | MIT |
| `eslint-config-next` | 16.2.10 | Next.js ESLint configuration | MIT |
| `@types/node` | 20.19.43 | Node.js TypeScript declarations | MIT |
| `@types/react` | 19.2.17 | React TypeScript declarations | MIT |
| `@types/react-dom` | 19.2.3 | ReactDOM TypeScript declarations | MIT |

The authoritative dependency declarations remain in [`package.json`](../../package.json) and the resolved dependency graph remains in [`package-lock.json`](../../package-lock.json). Transitive packages retain their own upstream notices and licence terms.

## Services and development assistance

- **Google Gemini API** supplies the optional semantic-planning service through the Google GenAI SDK. Provider availability and terms are external to the repository; no service licence claim is made here.
- **CodeSandbox Sandpack hosted services** supply the browser compiler/runtime and package infrastructure used by the Sandpack client. The current MVP depends on their network availability.
- **Vercel** hosts the public StateStorm prototype at `https://statestorm.vercel.app/`. No service licence claim is made here.
- **GitHub** hosts the public repository at `https://github.com/Neeraj05042001/statestorm`. No service licence claim is made here.
- **OpenAI Codex** assisted with narrow repository implementation tasks, tests, documentation, and validation under human-directed architecture and review. Codex is not a runtime dependency of the product, and no service licence claim is made here.

## Concise acknowledgement for README or submission forms

Built with Next.js, React, TypeScript, Tailwind CSS, Zod, Google GenAI, CodeSandbox Sandpack, Vitest, ESLint, and Vercel. OpenAI Codex assisted with implementation, tests, documentation, and validation under human-directed architecture and review. Exact direct-package versions and locally reported licences are listed in `docs/submission/THIRD_PARTY_ACKNOWLEDGEMENTS.md`.
