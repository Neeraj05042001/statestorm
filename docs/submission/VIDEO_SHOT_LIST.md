# StateStorm demo video shot list

## Recording setup

- [ ] Use an incognito or private browser profile with extensions disabled.
- [ ] Set the recording viewport to **1440 × 900**.
- [ ] Use production only: `https://statestorm.vercel.app/` and `https://statestorm.vercel.app/preflight?demo=1`.
- [ ] Start at 100% browser zoom. If the full Atlas is not readable, use 90%; do not go below 80%.
- [ ] Close private tabs, terminals, developer tools, email, chat, password managers, and environment/configuration files.
- [ ] Enable operating-system Do Not Disturb and suppress browser, calendar, chat, and update notifications.
- [ ] Verify the intended microphone, record a ten-second sample, and check level, room noise, clipping, and playback.
- [ ] Hide bookmarks and personal profile UI where practical; use a neutral browser window.
- [ ] Preload the stable demo in a separate clean tab, but keep only the production product visible during capture.
- [ ] Complete one rehearsed successful production run immediately before recording. Record the observed plan status, total states, and Atlas categories on paper, not in a visible private app.
- [ ] Capture backup production screenshots of the homepage, loaded input, completed Atlas summary, one runtime result, one blank result, one overflow finding, one broken-image finding, and one clean inspection. Keep them outside the repository unless separately approved.

Never display an API key, terminal secret, `.env` file, provider dashboard, deployment dashboard, or credential prompt.

## Cursor and scroll path

1. Place the cursor off the headline before recording.
2. Move once to **Load demo** and click.
3. Pause over **Original product requirement**, then move to **React component source** without selecting text.
4. Move directly to **Generate state plan**; while it loads, keep the cursor still.
5. Trace the total, deterministic, and AI-proposed counts from left to right, then the semantic review criteria.
6. Move directly to **Run preflight**. During execution, keep the cursor away from the active iframe and progress text.
7. After completion, trace the developer conclusion and summary metrics left to right.
8. Select cards in this order: runtime, blank, overflow, broken image, then clean.
9. Apply **Issues** once, clear it with **All** if needed, and finish on a clean state with the live inspection visible.
10. Stop moving the cursor during the closing positioning line.

Use smooth, deliberate movements. Avoid circling, highlighting source, opening raw diagnostics, or hovering over anything that can obscure evidence.

## Exact screens to capture

- [ ] Homepage hero, one-sentence explanation, both calls to action, and supported scope.
- [ ] Loaded demo badge, full original requirement label, and enough source to establish that it is React TSX.
- [ ] Completed state-plan summary with total, deterministic, and AI-proposed counts.
- [ ] Semantic review criteria or the honest deterministic-fallback notice.
- [ ] **Run preflight** click.
- [ ] Serialized progress with current state, completed/total count, and one active isolated preview.
- [ ] Editing continuity from the real in-progress run to its genuinely completed Atlas.
- [ ] Deterministic developer conclusion and all summary metrics.
- [ ] Runtime failure recorded-evidence view.
- [ ] Blank-render recorded-evidence view.
- [ ] Possible overflow warning evidence.
- [ ] Confirmed broken-image evidence without a full image URL.
- [ ] One filter in action.
- [ ] Clean selected-state live inspection with the rerender label.
- [ ] Supported MVP scope and the final positioning line.

## Safe editing points

- After the homepage sentence and before clicking **Load demo**.
- On the **Load demo** route transition.
- After **Generate state plan** is clicked and before the validated plan appears.
- After two or three visible fixture progress changes. Add a plain continuity card such as “Real serialized run continues”; resume only on that same run’s completed Atlas.
- Between Atlas card selections, provided the selected label and evidence remain readable.
- Before the final supported-scope statement.

Do not cut in a way that makes a fallback plan look AI-generated, makes a prior run look current, or makes live inspection look like recorded evidence.

## Failure recovery

### Gemini uses deterministic fallback

1. Continue if the UI displays the expected fallback message and the plan is executable.
2. Narrate the actual outcome: “Semantic AI planning was unavailable for this run, so StateStorm preserved deterministic boundary coverage.”
3. Show the AI-proposed count as zero and the deterministic count honestly.
4. Explain Gemini’s product role in the narration or architecture slide, but never imply it contributed to that specific run.
5. If the judging rules require live AI evidence, pause recording and retry later; do not expose the provider dashboard or key.

### Sandpack initialization is unusually slow

1. Wait up to the product’s normal visible timeout without interacting with the iframe.
2. If the run continues normally, use the safe editing point and retain clear continuity.
3. If initialization fails, stop the take, hard-refresh the incognito tab, reload the stable demo, and begin a fresh run.
4. Never splice results from a different component or unexplained earlier session into the take.

### One fixture times out

1. Let the real run finish; later fixtures should continue.
2. If the Atlas records the timeout, describe it as an **other execution failure**, not as a product success or component defect.
3. For the main take, start a new complete run only if the timeout was the documented non-reproducible hosted Sandpack condition. Keep the first outcome in the recording notes.
4. Do not edit the timeout out of an otherwise presented result summary.

### Public video link is broken

1. Test the final link in a signed-out incognito window and on a second device or network.
2. Confirm view permission is public/unlisted as permitted by the event and no login is required.
3. Re-upload or correct permission, replace the submission URL, and test again before final submit.
4. Keep a local master and one backup host or upload-ready copy until judging closes.

### Notification or credential exposure occurs

1. Stop recording immediately.
2. Discard the take; do not rely on cropping, blur, or audio removal for a secret.
3. If a credential may have been captured, rotate it through the relevant service before any upload.
4. Restore Do Not Disturb, close private surfaces, reopen a clean incognito window, and record a fresh take.

## Final video quality and accessibility check

- [ ] Runtime is no more than 3:00; target 2:35–2:50.
- [ ] Export is at least 1440 × 900 or an equivalent high-quality frame with readable UI text.
- [ ] Speech is intelligible at normal volume, with no clipping, music masking, or long silence.
- [ ] Add accurate human-reviewed captions; confirm **Gemini**, **Sandpack**, **RunPlan**, and **State Atlas** are spelled correctly.
- [ ] Keep meaningful UI text on screen long enough to read and avoid rapid flashing transitions.
- [ ] Ensure captions do not cover the plan counts, progress, Atlas metrics, findings, or selected-state label.
- [ ] Confirm the video contains no private tab, notification, account identifier, credential, API key, environment file, or terminal secret.
- [ ] Verify every spoken capability against the final submission copy.
- [ ] Open the final public URL signed out, play from start to finish, enable captions, and seek through the complete timeline.
