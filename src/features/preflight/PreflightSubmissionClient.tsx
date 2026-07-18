"use client";

import { type FormEvent, useState } from "react";

import {
  PreflightPlanApiResponseSchema,
  type ContractIssue,
  type PreflightPlanApiResponse,
} from "../../domain";
import {
  RunPlanExecutionPanel,
  type ExecutionWorkflowPhase,
} from "./RunPlanExecutionPanel";

export const atlasExampleCode = `interface AtlasProductCardProps {
  title: string;
  price: number;
  imageUrl: string;
  featured: boolean;
  tone?: "calm" | "urgent";
}

export default function AtlasProductCard({
  title = "Everyday mug",
  price = 24.99,
  imageUrl = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='100'%3E%3Crect width='160' height='100' fill='%230ea5e9'/%3E%3C/svg%3E",
  featured = true,
  tone = "calm",
}: AtlasProductCardProps) {
  if (!title) throw new Error("Atlas product title must not be empty");
  if (price === 0) return null;

  return (
    <article
      data-tone={tone}
      style={{ width: 240, padding: 16, border: "1px solid #cbd5e1" }}
    >
      <img
        src={imageUrl}
        alt={title + " product"}
        style={{ display: "block", width: 160, height: 100 }}
      />
      <h2
        data-testid="product-title"
        style={{ maxWidth: 180, whiteSpace: "nowrap", overflow: "hidden" }}
      >
        {title}
      </h2>
      <p>{price.toFixed(2)}</p>
      {featured ? <strong>Featured product</strong> : null}
    </article>
  );
}`;

export const atlasExamplePrompt =
  "Render a product card with a title, price, image, featured treatment and calm or urgent tone. Exercise empty, zero-price, long-title and invalid-image states.";

export type PreflightPageState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "complete"; response: PreflightPlanApiResponse }
  | {
      status: "request-validation";
      response: Extract<PreflightPlanApiResponse, { accepted: false }>;
    }
  | { status: "server-error"; issues: ContractIssue[] };

export interface PreflightInputs {
  prompt: string;
  componentCode: string;
  language: "tsx" | "jsx";
}

export function initialPreflightInputs(initialDemo: boolean): PreflightInputs {
  return initialDemo
    ? {
        prompt: atlasExamplePrompt,
        componentCode: atlasExampleCode,
        language: "tsx",
      }
    : { prompt: "", componentCode: "", language: "tsx" };
}

const unexpectedIssue: ContractIssue = {
  code: "UNEXPECTED_SERVER_RESPONSE",
  severity: "error",
  message: "StateStorm could not read the planning response.",
  path: ["request"],
  suggestion: "Try generating the state plan again.",
};

const workflowStages = [
  {
    number: 1,
    title: "Component",
    description: "Add the requirement and source",
  },
  {
    number: 2,
    title: "State plan",
    description: "Review adversarial fixtures",
  },
  {
    number: 3,
    title: "Execute and inspect",
    description: "Collect browser evidence",
  },
] as const;

function WorkflowProgress({ activeStage }: { activeStage: 1 | 2 | 3 }) {
  return (
    <ol
      className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-3"
      aria-label="StateStorm preflight progress"
    >
      {workflowStages.map((stage) => {
        const active = stage.number === activeStage;
        const complete = stage.number < activeStage;
        return (
          <li
            key={stage.number}
            aria-current={active ? "step" : undefined}
            className={`flex items-center gap-4 border-slate-200 px-5 py-4 md:border-r md:last:border-r-0 ${
              active ? "bg-sky-50" : "bg-white"
            }`}
          >
            <span
              className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold ${
                active
                  ? "bg-sky-600 text-white"
                  : complete
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-100 text-slate-500"
              }`}
            >
              {complete ? "✓" : stage.number}
            </span>
            <span>
              <span className="block text-sm font-semibold text-slate-950">
                {stage.title}
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">
                {stage.description}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function IssueList({ issues }: { issues: readonly ContractIssue[] }) {
  if (issues.length === 0) return null;

  return (
    <ul className="space-y-3">
      {issues.map((issue, index) => (
        <li
          key={`${issue.code}-${index}`}
          className={`rounded-xl border p-4 text-sm ${
            issue.severity === "error"
              ? "border-rose-200 bg-rose-50"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          <p className="font-semibold text-slate-950">
            {issue.severity === "error" ? "Needs attention" : "Planning note"}
          </p>
          <p className="mt-1 leading-6 text-slate-700">{issue.message}</p>
          {issue.suggestion ? (
            <p className="mt-2 font-medium text-slate-800">
              Next step: {issue.suggestion}
            </p>
          ) : null}
          <details className="mt-3 text-xs text-slate-500">
            <summary className="cursor-pointer rounded outline-none focus-visible:ring-2 focus-visible:ring-sky-600">
              Technical detail
            </summary>
            <code className="mt-2 block">{issue.code}</code>
          </details>
        </li>
      ))}
    </ul>
  );
}

function stateLabel(state: PreflightPageState): string {
  if (state.status === "idle") return "Waiting for input";
  if (state.status === "submitting") return "Planning states";
  if (state.status === "request-validation") return "Input needs attention";
  if (state.status === "server-error") return "Planning unavailable";
  if (!state.response.accepted) return "Unsupported component";
  return state.response.ai.status === "generated"
    ? "AI-enriched plan ready"
    : "Boundary plan ready";
}

function RequirementGroups({
  requirements,
}: {
  requirements: Extract<
    PreflightPlanApiResponse,
    { accepted: true }
  >["runPlan"]["requirements"];
}) {
  if (requirements.length === 0) {
    return (
      <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
        No semantic review criteria were materialized. Deterministic boundary
        states are still ready to execute.
      </p>
    );
  }

  const groupLabels = {
    deterministic: "Structured criteria",
    heuristic: "Visual review criteria",
    unsupported: "Out-of-scope criteria",
  } as const;

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-3">
      {(["deterministic", "heuristic", "unsupported"] as const).map(
        (classification) => {
          const entries = requirements.filter(
            (requirement) => requirement.verification === classification,
          );
          if (entries.length === 0) return null;
          return (
            <section
              key={classification}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {groupLabels[classification]}
              </h4>
              <ul className="mt-3 space-y-3 text-sm">
                {entries.map((requirement) => (
                  <li key={requirement.id}>
                    <p className="font-medium leading-5 text-slate-900">
                      {requirement.statement}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                      {requirement.category}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          );
        },
      )}
    </div>
  );
}

export function PreflightResultPanel({
  state,
  onExecutionActiveChange,
  onExecutionPhaseChange,
}: {
  state: PreflightPageState;
  onExecutionActiveChange?: (active: boolean) => void;
  onExecutionPhaseChange?: (phase: ExecutionWorkflowPhase) => void;
}) {
  const accepted =
    state.status === "complete" && state.response.accepted
      ? state.response
      : undefined;
  const visibleIssues =
    state.status === "server-error"
      ? state.issues
      : state.status === "complete" || state.status === "request-validation"
        ? state.response.issues
        : [];

  const deterministicCount = accepted
    ? accepted.runPlan.fixtures.filter(
        (fixture) => fixture.origin === "deterministic",
      ).length
    : 0;
  const aiCount = accepted
    ? accepted.runPlan.fixtures.filter((fixture) => fixture.origin === "ai")
        .length
    : 0;

  return (
    <section
      aria-live="polite"
      aria-busy={state.status === "submitting"}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            State plan
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {accepted ? "Review the planned coverage" : "Plan component states"}
          </h2>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
          {stateLabel(state)}
        </span>
      </div>

      {state.status === "idle" ? (
        <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-600">
          StateStorm first analyzes the supported component contract, then
          combines semantic proposals with deterministic boundaries. No submitted
          component code runs during planning.
        </p>
      ) : null}
      {state.status === "submitting" ? (
        <div className="mt-5 rounded-xl border border-sky-200 bg-sky-50 p-4" role="status">
          <p className="font-semibold text-sky-950">
            Analyzing the component and generating a validated state plan…
          </p>
          <p className="mt-1 text-sm text-sky-800">
            StateStorm is preserving deterministic boundary coverage while semantic planning completes.
          </p>
        </div>
      ) : null}
      {state.status === "complete" && !state.response.accepted ? (
        <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-600">
          This source is outside the supported component contract. The notes below
          explain what to change before generating a plan.
        </p>
      ) : null}
      {state.status === "request-validation" ? (
        <p className="mt-5 text-sm text-slate-600">
          Correct the highlighted input problem before planning can continue.
        </p>
      ) : null}
      {state.status === "server-error" ? (
        <p className="mt-5 text-sm text-slate-600">
          StateStorm could not complete planning. The submitted component was not executed.
        </p>
      ) : null}

      {accepted ? (
        <div className="mt-6 space-y-7">
          {accepted.ai.status === "generated" ? (
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
              <p className="font-semibold text-violet-950">Semantic AI planning added prompt-specific states.</p>
              <p className="mt-1 text-sm leading-6 text-violet-800">
                Every proposal still passed StateStorm&apos;s trusted schemas before entering the plan.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
              <p className="font-semibold text-sky-950">
                Semantic AI planning was unavailable, so StateStorm preserved deterministic boundary coverage.
              </p>
              <p className="mt-1 text-sm leading-6 text-sky-800">
                The plan remains executable and no unvalidated provider output was used.
              </p>
            </div>
          )}

          <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Planned states", accepted.runPlan.fixtures.length],
              ["Deterministic", deterministicCount],
              ["AI-proposed", aiCount],
              ["Review criteria", accepted.runPlan.requirements.length],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
                <dd className="mt-2 text-2xl font-semibold text-slate-950">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
            <div>
              <h3 className="font-semibold text-slate-950">{accepted.contract.componentName}</h3>
              <p className="mt-1 text-sm text-slate-600">
                {accepted.contract.props.length} locally declared props · {accepted.contract.language.toUpperCase()}
              </p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
              Supported contract
            </span>
          </div>

          <div>
            <h3 className="font-semibold text-slate-950">Planned review criteria</h3>
            <p className="mt-1 text-sm text-slate-600">
              These organize review intent; they are not pass/fail verdicts.
            </p>
            <RequirementGroups requirements={accepted.runPlan.requirements} />
          </div>

          <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <summary className="cursor-pointer rounded text-sm font-semibold text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2">
              Inspect fixture details ({accepted.runPlan.fixtures.length})
            </summary>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {accepted.runPlan.fixtures.map((fixture) => (
                <article key={fixture.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-950">{fixture.label}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase text-slate-600">
                      {fixture.origin === "ai" ? "AI" : "Deterministic"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-600">{fixture.intent}</p>
                  <pre className="mt-3 max-h-28 overflow-auto rounded-lg bg-slate-950 p-3 text-xs leading-5 text-slate-100">
                    {JSON.stringify(fixture.props, null, 2)}
                  </pre>
                </article>
              ))}
            </div>
          </details>

          {visibleIssues.length > 0 ? (
            <details className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
              <summary className="cursor-pointer rounded text-sm font-semibold text-amber-950 outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2">
                Planning warnings and technical details ({visibleIssues.length})
              </summary>
              <div className="mt-4">
                <IssueList issues={visibleIssues} />
              </div>
            </details>
          ) : null}

          <p className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm font-medium leading-6 text-sky-950">
            AI proposes candidate states. Runtime and visual conclusions come only from recorded browser evidence.
          </p>

          <RunPlanExecutionPanel
            runPlan={accepted.runPlan}
            onExecutionActiveChange={onExecutionActiveChange}
            onExecutionPhaseChange={onExecutionPhaseChange}
          />
        </div>
      ) : null}

      {!accepted && visibleIssues.length > 0 ? (
        <div className="mt-6">
          <IssueList issues={visibleIssues} />
        </div>
      ) : null}
    </section>
  );
}

export function PreflightSubmissionClient({
  initialDemo = false,
}: {
  initialDemo?: boolean;
}) {
  const initialInputs = initialPreflightInputs(initialDemo);
  const [prompt, setPrompt] = useState(initialInputs.prompt);
  const [componentCode, setComponentCode] = useState(initialInputs.componentCode);
  const [language, setLanguage] = useState<"tsx" | "jsx">(initialInputs.language);
  const [demoLoaded, setDemoLoaded] = useState(initialDemo);
  const [state, setState] = useState<PreflightPageState>({ status: "idle" });
  const [executionActive, setExecutionActive] = useState(false);
  const [executionPhase, setExecutionPhase] =
    useState<ExecutionWorkflowPhase>("ready");

  const acceptedPlan = state.status === "complete" && state.response.accepted;
  const activeStage: 1 | 2 | 3 = acceptedPlan
    ? executionPhase === "ready"
      ? 2
      : 3
    : 1;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (state.status === "submitting") return;
    setExecutionActive(false);
    setExecutionPhase("ready");
    setState({ status: "submitting" });

    try {
      const response = await fetch("/api/preflight-plan", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "preflight-product-card",
          prompt,
          componentCode,
          language,
        }),
      });
      const parsed = PreflightPlanApiResponseSchema.safeParse(
        await response.json(),
      );
      if (!parsed.success) {
        setState({ status: "server-error", issues: [unexpectedIssue] });
        return;
      }
      if (response.status === 400 && !parsed.data.accepted) {
        setState({ status: "request-validation", response: parsed.data });
        return;
      }
      if (!response.ok) {
        setState({ status: "server-error", issues: parsed.data.issues });
        return;
      }
      setState({ status: "complete", response: parsed.data });
    } catch {
      setState({ status: "server-error", issues: [unexpectedIssue] });
    }
  };

  const loadDemo = () => {
    setPrompt(atlasExamplePrompt);
    setComponentCode(atlasExampleCode);
    setLanguage("tsx");
    setDemoLoaded(true);
    setExecutionActive(false);
    setExecutionPhase("ready");
    setState({ status: "idle" });
  };

  const updatePrompt = (value: string) => {
    setPrompt(value);
    setDemoLoaded(false);
  };
  const updateComponentCode = (value: string) => {
    setComponentCode(value);
    setDemoLoaded(false);
  };
  const updateLanguage = (value: "tsx" | "jsx") => {
    setLanguage(value);
    setDemoLoaded(false);
  };

  return (
    <div className="space-y-7">
      <WorkflowProgress activeStage={activeStage} />

      <section
        id="component-input"
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Component input</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Add prompt and component</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              StateStorm needs the original requirement plus one supported React component. Planning never executes submitted source.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {demoLoaded ? (
              <span className="rounded-full bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-900" role="status">
                Demo example loaded
              </span>
            ) : null}
            <button
              type="button"
              onClick={loadDemo}
              disabled={state.status === "submitting" || executionActive}
              className="rounded-lg border border-sky-700 px-4 py-2 text-sm font-semibold text-sky-800 outline-none transition-colors hover:bg-sky-50 focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 disabled:border-slate-300 disabled:text-slate-400"
            >
              Load demo
            </button>
          </div>
        </div>
        {executionActive ? (
          <p className="mt-3 text-sm text-slate-500">
            Loading the demo is disabled while the isolated execution sandbox owns the current run.
          </p>
        ) : null}

        <form onSubmit={submit} className="mt-7 grid gap-6 lg:grid-cols-[minmax(280px,0.75fr)_minmax(0,1.25fr)]">
          <div className="space-y-6">
            <div>
              <label htmlFor="preflight-prompt" className="text-sm font-semibold text-slate-950">
                Original product requirement
              </label>
              <p id="preflight-prompt-help" className="mt-1 text-xs leading-5 text-slate-500">
                Describe what the component should render and which edge cases matter.
              </p>
              <textarea
                id="preflight-prompt"
                aria-describedby="preflight-prompt-help"
                value={prompt}
                onChange={(event) => updatePrompt(event.target.value)}
                rows={8}
                placeholder="Example: Render a product card and exercise empty, zero-price, long-title, and invalid-image states."
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm leading-6 outline-none transition-colors focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <fieldset>
              <legend className="text-sm font-semibold text-slate-950">Source language</legend>
              <p className="mt-1 text-xs leading-5 text-slate-500">Props-driven components require TSX with local prop declarations.</p>
              <div className="mt-3 inline-flex rounded-xl border border-slate-300 bg-slate-50 p-1">
                {(["tsx", "jsx"] as const).map((option) => (
                  <label key={option} className="cursor-pointer">
                    <input
                      type="radio"
                      name="preflight-language"
                      value={option}
                      checked={language === option}
                      onChange={() => updateLanguage(option)}
                      className="peer sr-only"
                    />
                    <span className="block rounded-lg px-5 py-2 text-sm font-semibold uppercase text-slate-600 outline-none peer-checked:bg-slate-950 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-sky-600 peer-focus-visible:ring-offset-2">
                      {option}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              <p className="font-semibold text-slate-900">Supported component scope</p>
              <p className="mt-1">
                One self-contained default export, React-only imports, and locally declared JSON-serializable props. Callback props and imported prop types are not yet supported.
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={state.status === "submitting"}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-sky-600 px-5 py-3 font-semibold text-white outline-none transition-colors hover:bg-sky-500 focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 disabled:bg-slate-300"
              >
                {state.status === "submitting" ? "Generating state plan…" : "Generate state plan"}
              </button>
              {executionActive ? (
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Generating a replacement plan cancels the active execution and rejects late results.
                </p>
              ) : null}
            </div>
          </div>

          <div>
            <label htmlFor="preflight-code" className="text-sm font-semibold text-slate-950">
              React component source
            </label>
            <p id="preflight-code-help" className="mt-1 text-xs leading-5 text-slate-500">
              Paste one self-contained default-export component. StateStorm analyzes this string on the server and executes it only inside Sandpack.
            </p>
            <textarea
              id="preflight-code"
              aria-describedby="preflight-code-help"
              value={componentCode}
              onChange={(event) => updateComponentCode(event.target.value)}
              rows={26}
              spellCheck={false}
              placeholder="export default function ProductCard() { return <article>…</article>; }"
              className="mt-2 min-h-[34rem] w-full rounded-xl border border-slate-700 bg-slate-950 p-4 font-mono text-[13px] leading-6 text-slate-100 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
            />
          </div>
        </form>
      </section>

      <PreflightResultPanel
        state={state}
        onExecutionActiveChange={setExecutionActive}
        onExecutionPhaseChange={setExecutionPhase}
      />
    </div>
  );
}
