# StateStorm production demo script

## Recording target

- **Narration target:** 290–315 words
- **Edited runtime target:** 2 minutes 25 seconds to 2 minutes 40 seconds
- **Hard maximum:** 3 minutes
- **Recording source:** [production demo](https://statestorm.vercel.app/preflight?demo=1)
- **Continuity rule:** Shorten only real execution waiting time. Show the in-progress run before the cut and resume on the Atlas produced by that same run.

Rehearse once against production at roughly 116–124 narrated words per minute. Use the live plan and result counts rather than memorized values; natural action pauses should keep the edited take within 2:25–2:40.

## 0:00–0:20 — Cold open and product

- **Target / maximum:** 18 / 20 seconds
- **On-screen action:** Begin on a real completed production Atlas with the clean component visible, then briefly reveal the issue cards. Cut to the homepage and select **Load demo**.
- **Expected screen:** A polished clean state, its recorded fragile states, then the StateStorm headline and stable demo route.
- **Exact narration:** “This AI-generated component looks finished. But an empty title crashes it, zero price makes it disappear, and a long title breaks its layout. StateStorm is an AI preflight that exposes these fragile states before integration. AI builds the happy path. StateStorm reveals what it forgot.”
- **Safe cut:** Cut from the cold-open Atlas to the homepage on “StateStorm.” The opening Atlas must come from a real production run.

## 0:20–0:45 — Input and planning

- **Target / maximum:** 24 / 25 seconds
- **On-screen action:** Point to the original requirement and TSX source, click **Generate state plan**, then show total, deterministic, and AI-proposed counts.
- **Expected screen:** The loaded AtlasProductCard input and a validated RunPlan of no more than twelve states. If Gemini falls back, the UI must show the real fallback message and an AI count of zero.
- **Exact narration:** “From the production homepage, I load the stable demo. StateStorm takes the original requirement and one supported React component. Gemini proposes prompt-specific semantic cases. Deterministic logic adds guaranteed boundary states, validates everything into a RunPlan of up to twelve fixtures, and preserves useful coverage if Gemini is unavailable.”
- **Safe cut:** Cut only after the Generate action; resume on the plan created by that request.

## 0:45–1:25 — Real isolated execution

- **Target / maximum:** 38 / 40 seconds
- **On-screen action:** Click **Run preflight**. Show live progress and the active preview across at least two fixtures, then use a clear wait-time edit and resume on the completed Atlas by 1:25.
- **Expected screen:** One active Sandpack preview, serial completed/total progress, then the Atlas belonging to that execution.
- **Exact narration:** “Now I run the preflight. Each fixture executes separately and serially inside an isolated Sandpack browser iframe; submitted code never runs in the StateStorm parent. The preview and progress are live. I’m shortening only the wait here—the real run continues, and the completed Atlas belongs to this same execution. Browser observation, not model opinion, determines the results.”
- **Safe cut:** After two visible progress changes, add a plain “Real serialized run continues” transition. Never splice in an earlier or different run.

## 1:25–2:05 — State Atlas payoff

- **Target / maximum:** 38 / 40 seconds
- **On-screen action:** Show the deterministic conclusion and metrics. Select only: runtime, blank, one state carrying overflow and/or broken-image evidence, then clean.
- **Expected screen:** A contained runtime crash, blank render, possible-overflow and confirmed broken-image evidence, followed by one clean inspection rerender.
- **Exact narration:** “The State Atlas makes the failure pattern immediate. This runtime state contains the empty-title crash. This blank state records the zero-price disappearance. Here, the browser reports possible overflow and a confirmed broken image; those are bounded findings, and one state can contain more than one. Filters keep the evidence scannable. Finally, this clean state opens one isolated inspection rerender from its recorded props. The original recorded result remains authoritative.”
- **Safe cut:** Cuts between selections are safe after the selected label and finding remain readable for at least one second.

## 2:05–2:25 — Why the approach is different

- **Target / maximum:** 19 / 20 seconds
- **On-screen action:** Hold on the Atlas and, if visible without scrolling away, the AI/deterministic plan counts.
- **Expected screen:** Browser-derived evidence and the distinction between semantic and boundary planning.
- **Exact narration:** “StateStorm is not a chatbot guessing whether the UI works. AI interprets the requirement and proposes semantic cases; deterministic boundaries provide the baseline; schemas keep untrusted proposals out of execution; and the browser decides what actually rendered or failed. AI proposes. Deterministic browser evidence decides.”
- **Safe cut:** None recommended.

## 2:25–2:40 — Honest scope and close

- **Target / maximum:** 14 / 15 seconds
- **On-screen action:** Hold on the clean Atlas overview or return to the homepage supported-scope copy.
- **Expected screen:** The narrow supported MVP scope and product positioning.
- **Exact narration:** “The MVP supports self-contained React TSX or JSX with locally declared, JSON-serializable props. Callback props and imported prop types remain outside the current scope. AI builds the happy path. StateStorm reveals what it forgot.”
- **Safe cut:** End immediately after the positioning line.

## Accuracy notes

- Say **possible overflow**, not definitive layout failure, after the required cold open.
- Say **confirmed broken image** only for browser-observed completed-image evidence.
- Describe clean inspection as a **rerender from recorded props**, never a screenshot or replay.
- If Gemini falls back, say: “Semantic AI planning was unavailable for this run, so StateStorm preserved deterministic boundary coverage.”
- Never claim arbitrary React support, complete requirement verification, hardened security containment, screenshots, or automatic fixing.
