# StateStorm AI and Codex usage

StateStorm uses AI in the product and Codex in the development workflow. Those roles are distinct.

## Product AI: Gemini

### Purpose

Deterministic prop metadata can generate stable generic boundaries, but it cannot fully interpret the original product requirement. Gemini supplies that semantic layer. It receives the original prompt, validated `ComponentContract`, safe deterministic happy-path props, and trusted planning instructions, then proposes:

- structured review requirements; and
- prompt-specific semantic fixture assignments.

Submitted component source is not sent to Gemini.

### Trust and fallback

The Gemini adapter asks for structured JSON, but structured output is still untrusted. StateStorm parses the response through a strict Zod-backed proposal schema and uses deterministic materializers to verify requirement classifications, prop names, JSON values, prop-kind compatibility, required props, uniqueness, priority, and plan size. The provider never writes the final RunPlan directly.

Invalid, refused, timed-out, unavailable, missing-credential, quota/provider-failed, or otherwise unusable AI output produces a bounded public status and deterministic fallback. The fallback contains no fabricated AI requirements or semantic fixtures; it preserves the deterministic boundary plan.

### Authority boundary

Gemini does not:

- execute submitted source;
- bypass unsupported-component rules;
- decide whether a component passed or failed;
- interpret browser evidence as a prompt-requirement verdict; or
- modify or fix the submitted component.

Runtime and visual outcomes come from correlated browser execution and bounded in-iframe detectors. **AI proposes. Deterministic browser evidence decides.**

### Concise product-AI answer for a submission form

Gemini interprets the original requirement and proposes structured review criteria and semantic fixtures from the prompt, validated component contract, and safe baseline values. Submitted source is not sent. Zod-backed schemas and deterministic compatibility checks gate every proposal; expected provider failures fall back to deterministic boundary coverage. AI never executes the component or decides runtime pass/failure.

## Codex development usage

### How Codex contributed

OpenAI Codex acted as the repository executor for narrow milestone packets. Across the project, it assisted with:

- implementing authorized, scoped repository changes;
- writing and updating focused automated tests;
- maintaining architecture, decision, status, limitation, detector, execution, and demo documentation;
- inspecting client/server dependency and submitted-code execution boundaries;
- running lint, strict type checking, Vitest, production builds, and diff checks; and
- supporting development, optimized local, and public-production validation with evidence recorded for human review.

Each milestone packet required lint, typecheck, tests, and build validation. Important behavior was also reviewed manually in the browser and, where authorized, in the public deployment.

### Human direction and review

Human-led product direction and architecture review controlled scope, security boundaries, gate acceptance, and the next permitted action. Codex implemented the authorized packet and reported evidence; it did not independently expand the product, add unapproved providers or capabilities, declare its own gates passed, or decide submission claims.

This is not a claim that Codex autonomously created the entire product. Product positioning, architecture choices, milestone acceptance, production review, and final submission responsibility remained human-directed.

### Concise Codex answer for a submission form

Codex implemented narrow, human-authorized repository milestone packets; helped write tests and documentation; and ran lint, typecheck, Vitest, build, and boundary audits. Every milestone was reviewed, including manual production checks where authorized. Product scope, architecture decisions, gate acceptance, and final claims remained human-directed; Codex did not autonomously create or approve the entire product.

### Fuller README or deck explanation

StateStorm was developed through controlled milestone packets. Codex helped translate each approved architecture slice into focused implementation, tests, documentation, and validation evidence. The workflow combined automated lint/type/test/build checks with manual browser and production review. Human authority retained control of scope, trust boundaries, gate acceptance, and submission accuracy, so Codex accelerated execution without becoming the source of architectural truth.

## Accurate disclosure checklist

- [ ] Describe Gemini as semantic planning, not runtime judgment.
- [ ] State that submitted source is not sent to Gemini.
- [ ] Mention deterministic fallback without implying it is AI-generated.
- [ ] Describe Codex as an implementation and validation assistant under milestone packets.
- [ ] Keep architecture and final acceptance human-directed.
- [ ] Do not claim autonomous end-to-end creation, autonomous deployment, or unreviewed production changes.
