# StateStorm six-slide pitch deck content

Use exactly these six slides. Favor large production visuals and short labels. Keep implementation detail in presenter notes.

## Slide 1 — StateStorm

- **Objective:** Establish the product and payoff immediately.
- **Final slide copy:**

  **StateStorm**

  **AI builds the happy path. StateStorm reveals what it forgot.**

  AI preflight that turns a React requirement and component into adversarial states, browser evidence, and an interactive State Atlas.

- **Visual composition:** Use one full-width screenshot from a real completed production Atlas. Keep the conclusion, summary metrics, several issue cards, and selected-state area readable. Do not use a mock result.
- **Presenter note:** “StateStorm exposes fragile states in supported AI-generated React components before integration. It connects original intent to a bounded, evidence-driven browser run.”
- **Copy ceiling:** 28 words, excluding the product name.

## Slide 2 — One component. Several hidden failures.

- **Objective:** Make the problem concrete through the demo component.
- **Final slide copy:**

  **Happy path** — finished at first glance

  **Empty title → Runtime crash**

  **Zero price → Blank render**

  **Long title → Possible overflow**

  **Invalid image → Broken image**

- **Visual composition:** Place the clean product card on the left. On the right, stack four compact failure rows with distinct runtime, blank, warning, and image evidence styling. Use only outcomes demonstrated by the real production demo.
- **Presenter note:** “The component appears complete until ordinary prop boundaries expose four different failure modes. StateStorm puts those states in one comparable evidence surface.”
- **Copy ceiling:** 24 words.

## Slide 3 — From requirement to evidence.

- **Objective:** Explain the complete user journey in one glance.
- **Final slide copy:**

  **Prompt + Component**
  → **Contract**
  → **AI + Boundary States**
  → **Isolated Execution**
  → **Browser Evidence**
  → **State Atlas**

- **Visual composition:** Use a six-node horizontal flow with one strong arrow and no secondary branches. Base the later approved visual on [the RunPlan assembly diagram](../diagrams/run-plan-assembly.mmd), simplified for judges.
- **Presenter note:** “StateStorm analyzes the supported contract, combines prompt-aware and deterministic states, validates the bounded plan, executes each state in the browser, and constructs the Atlas from recorded evidence.”
- **Copy ceiling:** 18 words.

## Slide 4 — AI proposes. Evidence decides.

- **Objective:** Show why AI matters and where its authority ends.
- **Final slide copy:**

  **Gemini semantic cases** + **Deterministic boundaries**

  ↓

  **Validated RunPlan**

  ↓

  **Browser execution remains authoritative**

  **AI never declares whether the component passed.**

- **Visual composition:** Two equal planning lanes converge into the RunPlan, then one bold line continues to browser evidence. Adapt [the AI planning boundary diagram](../diagrams/ai-planning-boundary.mmd).
- **Presenter note:** “Gemini interprets prompt intent. Deterministic fixtures guarantee baseline coverage and fallback. Trusted schemas gate every proposal. Runtime and detector outcomes come only from the browser.”
- **Copy ceiling:** 25 words.

## Slide 5 — Built for trustworthy preflight.

- **Objective:** Pair the real result with compact technical proof.
- **Final slide copy:**

  **TypeScript Compiler API** · **Zod contracts**

  **Serialized Sandpack execution** · **Stale-result rejection**

  **Deterministic fallback** · **271 passing tests**

  Component galleries organize authored examples. StateStorm generates adversarial states and executes them for evidence.

- **Visual composition:** Use a real Atlas screenshot across roughly two-thirds of the slide. Place the six proof points in a narrow side panel; keep the gallery differentiation as one footer line.
- **Presenter note:** “The server derives a trusted contract without executing submitted source. The browser runs one state at a time, rejects stale ownership, and records bounded evidence. The current suite passes 271 tests.”
- **Copy ceiling:** 37 words.

## Slide 6 — Built, deployed and deliberately focused.

- **Objective:** Close with the user, present value, current scope, and credible next steps.
- **Final slide copy:**

  **For:** Developers integrating AI-generated React components

  **Today:** Find fragile states before integration

  **MVP:** Self-contained TSX/JSX · local JSON-serializable props · React-only imports

  **Next:** Imported types · controlled callback mocks · responsive matrices

  **Live:** https://statestorm.vercel.app/

  **Code:** https://github.com/Neeraj05042001/statestorm

- **Visual composition:** Use three compact bands—**Who**, **Today**, **Next**—with the two public URLs in a high-contrast footer. Mark the three roadmap items explicitly as **Next**.
- **Presenter note:** “The product is built and public, with a deliberately narrow contract. The next work expands supported inputs and viewport coverage without weakening the evidence boundary.”
- **Copy ceiling:** 45 words, excluding URLs.

## Deck-wide accuracy rules

- Use only current production screenshots; diagrams must be visibly conceptual.
- Keep all roadmap items under **Next** and show no more than the three listed.
- Do not invent users, adoption, market size, savings, benchmarks, testimonials, certifications, or business impact.
- Use **possible overflow**, **confirmed broken image**, and **browser-isolated Sandpack**. Do not imply screenshot baselines, complete requirement verification, or hardened containment.
- Add a public video link only after it exists and has been checked signed out.
