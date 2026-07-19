# StateStorm final submission checklist

Run this checklist from a clean, signed-out perspective. A checked item means it was observed in the final public artifact—not merely expected from local code or a previous deployment.

## Deadline and working target

- **Hard deadline:** July 19, 2026, 11:59 PM IST.
- **Target submission window:** 10:59–11:14 PM IST, at least 45–60 minutes before the deadline.
- [ ] Stop editorial changes before the target window and reserve the remaining time for upload processing, public-permission checks, form review, and recovery.
- [ ] Keep one local backup and one separate backup copy of both the final video and the final deck until judging closes.

## Product

- [ ] **Homepage:** `https://statestorm.vercel.app/` returns 200, loads without authentication, shows the positioning line, explains the product, and links to both blank preflight and the stable demo.
- [ ] **Demo route:** `https://statestorm.vercel.app/preflight?demo=1` returns 200 and visibly preloads the approved requirement and `AtlasProductCard` source.
- [ ] **API:** A supported production submission produces a validated component contract and RunPlan without exposing raw errors, stack traces, or secrets.
- [ ] **Fallback:** With Gemini unavailable or unusable, the UI explicitly reports deterministic fallback and produces an executable deterministic boundary plan.
- [ ] **Full preflight:** The stable demo completes a real serial run and produces clean, runtime, blank, possible-overflow, and confirmed broken-image evidence in the State Atlas.
- [ ] **Rerun:** **Run preflight again** clears the prior Atlas, creates a fresh complete session, and shows no stale results.
- [ ] **Cancellation/replacement:** Replacing an active run prevents its late preview, result, and detector messages from owning the new UI.
- [ ] **Mobile:** Homepage and preflight remain usable at a real mobile viewport; labels, controls, source input, metrics, cards, filters, and inspection do not become inaccessible.
- [ ] **Incognito:** Repeat the main path in an incognito/private browser with extensions disabled and record zero StateStorm parent exceptions or hydration warnings.
- [ ] **Scope copy:** Public copy does not claim arbitrary React, full requirement verification, screenshots, complete accessibility, hardened security, production certification, or automatic fixing.

## Repository

- [ ] **Public visibility:** `https://github.com/Neeraj05042001/statestorm` opens while signed out and the `main` branch is readable.
- [ ] **README first viewport:** Product name, positioning, concise explanation, and live links are immediately visible.
- [ ] **README coverage:** Problem, solution, workflow, AI role, architecture, capabilities, supported contract, setup, Gemini configuration, scripts/tests, security, limitations, Codex disclosure, and detailed docs are present.
- [ ] **No secrets:** Search tracked and changed files for private keys, tokens, passwords, credentials, environment values, and accidental personal data; inspect every match manually.
- [ ] **Clean main:** Final submission repository is on `main` with an empty `git status --short` after the separately authorized commit/push workflow.
- [ ] **Latest deployment commit:** Production identifies or demonstrably contains accepted product commit `c281d1659e86ba4bf253874f963f753bf7917017` before any later documentation-only submission commit.
- [ ] **Licences and acknowledgements:** [`THIRD_PARTY_ACKNOWLEDGEMENTS.md`](THIRD_PARTY_ACKNOWLEDGEMENTS.md) matches direct package metadata and no licence is guessed.
- [ ] **Documentation links:** Every relative Markdown link in README and `docs/submission/` resolves; every public link returns successfully.
- [ ] **No unapproved artifact:** No local recording, unpublished screenshot, credential file, build output, or slide binary is accidentally tracked.
- [ ] **Diff review:** The final submission diff contains documentation/README/status work only unless a later packet explicitly authorizes more.

## Video

- [ ] **Duration:** Final runtime is no more than 3:00; preferred 2:25–2:40.
- [ ] **Public accessibility:** The video URL opens and plays from start to finish in a signed-out incognito window without requesting access.
- [ ] **Video metadata:** Final title spells **StateStorm** correctly, the thumbnail is readable at small size, and the description contains the correct live product and repository URLs.
- [ ] **YouTube processing:** Wait for HD post-processing, then replay at the highest available quality and confirm UI text, cuts, audio, and captions remain clear.
- [ ] **Backup:** Keep the exported master and a second upload-ready video copy in separate locations.
- [ ] **Narration:** The problem, product, planning, isolated execution, State Atlas, differentiation, honest scope, and positioning close are clear.
- [ ] **No secrets/private tabs:** No API key, `.env`, terminal, deployment dashboard, notification, email, credential prompt, account detail, or private tab appears.
- [ ] **Audio:** Speech is clear, correctly leveled, and not masked by music or noise.
- [ ] **Resolution:** UI labels and evidence are readable at the exported resolution; the source recording used 1440 × 900.
- [ ] **Captions:** Human-reviewed captions are present, synchronized, and do not cover important product evidence.
- [ ] **Editing integrity:** Any execution wait is shortened with clear continuity, and the completed Atlas belongs to the real visible run.
- [ ] **Correct URLs:** The video shows only the final production URL and does not expose localhost, preview deployment, or private share URLs.

## Pitch deck

- [ ] **Exactly six slides:** No title-only seventh slide or hidden extra slide is present.
- [ ] **Accurate claims:** Every current capability is implemented; every future item is visibly labeled **Next** or **Future**.
- [ ] **Public link:** The deck URL opens in a signed-out browser without requesting access.
- [ ] **Readable without narration:** Titles, core argument, workflow, AI boundary, technical credibility, scope, and next direction make sense on their own.
- [ ] **Readable layout:** Body copy respects the slide word limits, has adequate contrast, and is legible on a typical laptop display.
- [ ] **Real screenshot:** Any product screenshot comes from the current production build; diagrams are labeled as diagrams and contain no fabricated results.
- [ ] **Footer links:** Final slide includes the correct live product and repository URLs.
- [ ] **Backup:** Keep the editable source and final exported deck/PDF in separate locations and verify both open correctly.

## Submission

- [ ] **Project name:** Exactly `StateStorm`.
- [ ] **Team name:** Exactly `StateStorm`.
- [ ] **Participant:** Exactly `Neeraj Kumar`, plus only participant details Neeraj has personally verified.
- [ ] **Hosted URL:** `https://statestorm.vercel.app/`.
- [ ] **Repository URL:** `https://github.com/Neeraj05042001/statestorm`.
- [ ] **Video URL:** Replace `DEMO_VIDEO_URL_PENDING` everywhere and re-open the pasted URL from the form preview.
- [ ] **Optional deck URL:** Replace `PITCH_DECK_URL_PENDING` everywhere if the form accepts a deck, then test it signed out.
- [ ] **Form copy:** Chosen variants fit live word/character limits and preserve punctuation, bullets, and links after paste.
- [ ] **Acknowledgements:** Libraries, Gemini/Google GenAI, Sandpack/CodeSandbox, Vercel, and Codex are disclosed accurately.
- [ ] **Limitations:** Narrow component contract and security qualification remain visible in the submitted answer set.
- [ ] **Code of conduct:** Read and affirm the event’s current code of conduct and eligibility/terms personally; do not delegate this attestation.
- [ ] **Final submit confirmation:** Review the rendered submission once more, then use the event’s final submit action.
- [ ] **Confirmation screenshot:** Capture the successful submission confirmation, timestamp, project name, and any submission ID without exposing private account data.
- [ ] **Archive copy:** Save a private snapshot/PDF of the final rendered README, the exact submitted answers, video URL, deck URL, confirmation screenshot, and submission ID.

## Do not submit until

Do **not** submit until every blocking item below is true:

1. Submission can complete at least 45 minutes before the July 19, 2026, 11:59 PM IST deadline.
2. The final production product, stable demo, and public repository open signed out.
3. A real full preflight and fresh rerun have completed in extension-free production without stale ownership or parent failure.
4. The video is under three minutes, publicly playable in processed HD, captioned, accurately titled/described, and free of secrets or private surfaces.
5. The deck contains exactly six readable slides, labels all roadmap items as future work, and has a verified backup copy.
6. `DEMO_VIDEO_URL_PENDING` and `PITCH_DECK_URL_PENDING` have been replaced wherever the final form or private submission records should expose them.
7. The final repository state, deployment commit relationship, documentation links, acknowledgements, secret scan, README archive, and submitted-answer archive have been manually verified.
8. Neeraj has personally confirmed participant information, event rules, code of conduct, eligibility, and the rendered final submission.

If any item cannot be verified, leave the submission unsubmitted and record the blocker rather than substituting an assumption.
