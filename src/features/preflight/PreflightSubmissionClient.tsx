"use client";

import { type FormEvent, useState } from "react";

import {
  PreflightPlanApiResponseSchema,
  type ContractIssue,
  type PreflightPlanApiResponse,
} from "../../domain";
import { RunPlanExecutionPanel } from "./RunPlanExecutionPanel";

const exampleCode = `interface ProductCardProps {
  title: string;
  price: number;
  featured: boolean;
  tone?: "calm" | "urgent";
}

export default function ProductCard({
  title,
  price,
  featured,
  tone = "calm",
}: ProductCardProps) {
  return (
    <article data-tone={tone}>
      <h2>{title}</h2>
      <p>{price.toFixed(2)}</p>
      {featured ? <strong>Featured</strong> : null}
    </article>
  );
}`;

const examplePrompt =
  "Create a calm product card with a clear title and price. Featured products should feel prominent, and unusually long titles should remain understandable.";

export type PreflightPageState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "complete"; response: PreflightPlanApiResponse }
  | {
      status: "request-validation";
      response: Extract<PreflightPlanApiResponse, { accepted: false }>;
    }
  | { status: "server-error"; issues: ContractIssue[] };

const unexpectedIssue: ContractIssue = {
  code: "UNEXPECTED_SERVER_RESPONSE",
  severity: "error",
  message: "The planning server returned an unexpected response",
  path: ["request"],
  suggestion: "Try planning again",
};

function IssueList({ issues }: { issues: readonly ContractIssue[] }) {
  if (issues.length === 0) return null;

  return (
    <ul className="space-y-2">
      {issues.map((issue, index) => (
        <li
          key={`${issue.code}-${index}`}
          className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm"
        >
          <p className="font-semibold">
            {issue.severity.toUpperCase()} · {issue.code}
          </p>
          <p className="mt-1 text-slate-700">{issue.message}</p>
        </li>
      ))}
    </ul>
  );
}

function stateLabel(state: PreflightPageState): string {
  if (state.status === "idle") return "Idle";
  if (state.status === "submitting") return "Submitting";
  if (state.status === "request-validation") return "Request validation";
  if (state.status === "server-error") return "Server error";
  if (!state.response.accepted) return "Unsupported component";
  return state.response.ai.status === "generated"
    ? "AI-generated success"
    : "Deterministic fallback";
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
      <p className="mt-1 text-sm text-slate-600">
        No validated semantic requirements were materialized.
      </p>
    );
  }

  return (
    <div className="mt-2 space-y-4">
      {(["deterministic", "heuristic", "unsupported"] as const).map(
        (classification) => {
          const entries = requirements.filter(
            (requirement) => requirement.verification === classification,
          );
          if (entries.length === 0) return null;
          return (
            <section key={classification}>
              <h4 className="text-xs font-semibold uppercase text-slate-500">
                {classification}
              </h4>
              <ul className="mt-2 space-y-2 text-sm">
                {entries.map((requirement) => (
                  <li
                    key={requirement.id}
                    className="rounded-lg bg-slate-50 p-3"
                  >
                    <p className="font-medium">{requirement.statement}</p>
                    <p className="mt-1 text-xs uppercase text-slate-500">
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
}: {
  state: PreflightPageState;
  onExecutionActiveChange?: (active: boolean) => void;
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

  return (
    <section
      aria-live="polite"
      className="self-start rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Preflight result</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
          {stateLabel(state)}
        </span>
      </div>

      {state.status === "idle" ? (
        <p className="mt-4 text-sm text-slate-600">
          Planning analyzes source and prepares fixtures. It does not execute
          the submitted component.
        </p>
      ) : null}
      {state.status === "submitting" ? (
        <p className="mt-4 text-sm text-slate-600">
          Analyzing and assembling a validated RunPlan…
        </p>
      ) : null}
      {state.status === "complete" && !state.response.accepted ? (
        <p className="mt-4 text-sm text-slate-600">
          This component is outside the currently supported source contract.
        </p>
      ) : null}
      {state.status === "request-validation" ? (
        <p className="mt-4 text-sm text-slate-600">
          Correct the submitted fields before planning can continue.
        </p>
      ) : null}
      {state.status === "server-error" ? (
        <p className="mt-4 text-sm text-slate-600">
          The server returned a sanitized unexpected failure.
        </p>
      ) : null}

      {accepted ? (
        <div className="mt-6 space-y-6">
          <div>
            <h3 className="font-semibold">Component contract</h3>
            <p className="mt-1 text-sm text-slate-700">
              {accepted.contract.componentName} - {accepted.contract.props.length}{" "}
              props - {accepted.contract.language.toUpperCase()}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              AI status: {accepted.ai.status}
              {accepted.ai.model ? ` (${accepted.ai.model})` : ""}
            </p>
          </div>

          <div>
            <h3 className="font-semibold">Requirements by classification</h3>
            <RequirementGroups requirements={accepted.runPlan.requirements} />
          </div>

          <div>
            <h3 className="font-semibold">Fixture plan</h3>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {accepted.runPlan.fixtures.map((fixture) => (
                <article
                  key={fixture.id}
                  className="rounded-lg border border-slate-200 p-3"
                >
                  <p className="text-sm font-semibold">{fixture.label}</p>
                  <p className="mt-1 text-xs uppercase text-slate-500">
                    {fixture.origin}
                  </p>
                  <p className="mt-2 text-xs text-slate-600">
                    {fixture.intent}
                  </p>
                  <pre className="mt-2 overflow-x-auto text-xs text-slate-700">
                    {JSON.stringify(fixture.props, null, 2)}
                  </pre>
                </article>
              ))}
            </div>
          </div>

          <p className="rounded-lg bg-sky-50 p-3 text-sm font-medium text-sky-950">
            Gemini did not verify runtime behavior. Planned requirements are not
            automatically verified by execution yet.
          </p>

          <RunPlanExecutionPanel
            runPlan={accepted.runPlan}
            onExecutionActiveChange={onExecutionActiveChange}
          />
        </div>
      ) : null}

      <div className="mt-6">
        <IssueList issues={visibleIssues} />
      </div>
    </section>
  );
}

export function PreflightSubmissionClient() {
  const [prompt, setPrompt] = useState(examplePrompt);
  const [componentCode, setComponentCode] = useState(exampleCode);
  const [language, setLanguage] = useState<"tsx" | "jsx">("tsx");
  const [state, setState] = useState<PreflightPageState>({ status: "idle" });
  const [executionActive, setExecutionActive] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (state.status === "submitting") return;
    setExecutionActive(false);
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

  const loadExample = () => {
    setPrompt(examplePrompt);
    setComponentCode(exampleCode);
    setLanguage("tsx");
    setExecutionActive(false);
    setState({ status: "idle" });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Plan a supported component</h2>
          <button
            type="button"
            onClick={loadExample}
            disabled={state.status === "submitting" || executionActive}
            className="rounded-md border border-sky-700 px-3 py-2 text-sm font-medium text-sky-800 disabled:opacity-50"
          >
            Load example
          </button>
        </div>
        <p className="mt-4 rounded-lg bg-sky-50 p-4 text-sm leading-6 text-sky-950">
          Supports one self-contained default-export React component with local,
          JSON-compatible props and React-only imports.
        </p>
        <form onSubmit={submit} className="mt-5 space-y-5">
          <div>
            <label htmlFor="preflight-prompt" className="text-sm font-semibold">
              Product requirement prompt
            </label>
            <textarea
              id="preflight-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={5}
              className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-sm"
            />
          </div>
          <div>
            <label htmlFor="preflight-code" className="text-sm font-semibold">
              React TypeScript component
            </label>
            <textarea
              id="preflight-code"
              value={componentCode}
              onChange={(event) => setComponentCode(event.target.value)}
              rows={20}
              spellCheck={false}
              className="mt-2 w-full rounded-lg border border-slate-300 p-3 font-mono text-sm"
            />
          </div>
          <div>
            <label htmlFor="preflight-language" className="text-sm font-semibold">
              Source language
            </label>
            <select
              id="preflight-language"
              value={language}
              onChange={(event) =>
                setLanguage(event.target.value === "jsx" ? "jsx" : "tsx")
              }
              className="mt-2 block rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="tsx">TSX</option>
              <option value="jsx">JSX</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={state.status === "submitting"}
            className="rounded-md bg-slate-950 px-5 py-2.5 font-medium text-white disabled:opacity-50"
          >
            {state.status === "submitting"
              ? "Planning…"
              : executionActive
                ? "Cancel execution and create new plan"
                : "Create preflight plan"}
          </button>
        </form>
      </section>

      <PreflightResultPanel
        state={state}
        onExecutionActiveChange={setExecutionActive}
      />
    </div>
  );
}
