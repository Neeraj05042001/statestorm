"use client";

import { type FormEvent, useMemo, useState } from "react";

import {
  ComponentAnalysisApiResponseSchema,
  type ComponentAnalysisApiResponse,
} from "../../domain/component-analysis-api";
import type { ComponentContract } from "../../domain/component-contract";
import type { ContractIssue } from "../../domain/contract-issue";

const supportedExample = `interface ProductCardProps {
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

const genericUnexpectedIssue: ContractIssue = {
  code: "UNEXPECTED_SERVER_RESPONSE",
  severity: "error",
  message: "The analysis server returned an unexpected response",
  path: ["request"],
  suggestion: "Try the request again",
};

type SubmissionState =
  | { status: "idle" }
  | { status: "submitting" }
  | {
      status: "accepted";
      response: Extract<ComponentAnalysisApiResponse, { accepted: true }>;
    }
  | {
      status: "rejected";
      response: Extract<ComponentAnalysisApiResponse, { accepted: false }>;
    }
  | { status: "request-validation-error"; issues: ContractIssue[] }
  | { status: "unexpected-server-error"; issues: ContractIssue[] };

function issuePath(issue: ContractIssue): string | undefined {
  return issue.path?.join(" → ");
}

function formatJsonValue(value: unknown): string {
  return JSON.stringify(value);
}

function IssueList({ issues }: { issues: ContractIssue[] }) {
  if (issues.length === 0) {
    return null;
  }

  return (
    <ul className="space-y-3">
      {issues.map((issue, index) => (
        <li
          key={`${issue.code}-${issue.path?.join("-") ?? "general"}-${index}`}
          className={
            issue.severity === "error"
              ? "rounded-lg border border-rose-200 bg-rose-50 p-4"
              : "rounded-lg border border-amber-200 bg-amber-50 p-4"
          }
        >
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            <span className="uppercase">{issue.severity}</span>
            <code>{issue.code}</code>
          </div>
          <p className="mt-2 text-sm text-slate-800">{issue.message}</p>
          {issuePath(issue) ? (
            <p className="mt-2 text-xs text-slate-600">
              Path: <code>{issuePath(issue)}</code>
            </p>
          ) : null}
          {issue.suggestion ? (
            <p className="mt-2 text-sm text-slate-700">
              Suggested next step: {issue.suggestion}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function ContractResult({ contract }: { contract: ComponentContract }) {
  return (
    <div className="space-y-6">
      <dl className="grid gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Component
          </dt>
          <dd className="mt-1 font-medium text-slate-950">
            {contract.componentName}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Language
          </dt>
          <dd className="mt-1 font-medium uppercase text-slate-950">
            {contract.language}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Export
          </dt>
          <dd className="mt-1 font-medium text-slate-950">
            {contract.exportStyle}
          </dd>
        </div>
      </dl>

      <div>
        <h3 className="text-sm font-semibold text-slate-950">Allowed imports</h3>
        <p className="mt-1 text-sm text-slate-700">
          {contract.imports.length > 0 ? contract.imports.join(", ") : "None"}
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-950">Props</h3>
        {contract.props.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No props declared.</p>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="px-2 py-2 font-medium">Name</th>
                  <th className="px-2 py-2 font-medium">Requirement</th>
                  <th className="px-2 py-2 font-medium">Kind</th>
                  <th className="px-2 py-2 font-medium">Type</th>
                  <th className="px-2 py-2 font-medium">Default</th>
                  <th className="px-2 py-2 font-medium">Enum values</th>
                </tr>
              </thead>
              <tbody>
                {contract.props.map((prop) => (
                  <tr key={prop.name} className="border-b border-slate-100">
                    <td className="px-2 py-3 font-medium text-slate-950">
                      {prop.name}
                    </td>
                    <td className="px-2 py-3">
                      {prop.required ? "Required" : "Optional"}
                    </td>
                    <td className="px-2 py-3">{prop.kind}</td>
                    <td className="px-2 py-3">
                      <code>{prop.typeText}</code>
                    </td>
                    <td className="px-2 py-3">
                      {Object.prototype.hasOwnProperty.call(
                        prop,
                        "defaultValue",
                      )
                        ? formatJsonValue(prop.defaultValue)
                        : "—"}
                    </td>
                    <td className="px-2 py-3">
                      {prop.enumValues
                        ? prop.enumValues.map(formatJsonValue).join(", ")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-950">Warnings</h3>
        {contract.warnings.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {contract.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-slate-600">No warnings.</p>
        )}
      </div>
    </div>
  );
}

export function AnalyzeSubmissionClient() {
  const [prompt, setPrompt] = useState("");
  const [componentCode, setComponentCode] = useState("");
  const [language, setLanguage] = useState<"tsx" | "jsx">("tsx");
  const [state, setState] = useState<SubmissionState>({ status: "idle" });

  const activeIssues = useMemo(() => {
    if (state.status === "rejected") {
      return state.response.issues;
    }
    if (
      state.status === "request-validation-error" ||
      state.status === "unexpected-server-error"
    ) {
      return state.issues;
    }
    return [];
  }, [state]);

  const fieldIssue = (field: "prompt" | "componentCode" | "language") =>
    activeIssues.find(
      (issue) =>
        issue.path?.[0] === "submission" && issue.path?.[1] === field,
    );

  const loadExample = () => {
    setPrompt(
      "Create a product card that shows its title, price, featured state and visual tone.",
    );
    setComponentCode(supportedExample);
    setLanguage("tsx");
    setState({ status: "idle" });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (state.status === "submitting") {
      return;
    }

    setState({ status: "submitting" });

    try {
      const response = await fetch("/api/component-analysis", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: `submission-${crypto.randomUUID()}`,
          prompt,
          componentCode,
          language,
        }),
      });

      const raw: unknown = await response.json();
      const parsed = ComponentAnalysisApiResponseSchema.safeParse(raw);
      if (!parsed.success) {
        setState({
          status: "unexpected-server-error",
          issues: [genericUnexpectedIssue],
        });
        return;
      }

      if (response.status === 400) {
        setState({
          status: "request-validation-error",
          issues: parsed.data.issues,
        });
        return;
      }

      if (!response.ok) {
        setState({
          status: "unexpected-server-error",
          issues: parsed.data.issues,
        });
        return;
      }

      setState(
        parsed.data.accepted
          ? { status: "accepted", response: parsed.data }
          : { status: "rejected", response: parsed.data },
      );
    } catch {
      setState({
        status: "unexpected-server-error",
        issues: [genericUnexpectedIssue],
      });
    }
  };

  const statusLabel = {
    idle: "Idle",
    submitting: "Submitting",
    accepted: "Accepted",
    rejected: "Rejected",
    "request-validation-error": "Request validation error",
    "unexpected-server-error": "Unexpected server error",
  }[state.status];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-950">
            Component submission
          </h2>
          <button
            type="button"
            onClick={loadExample}
            disabled={state.status === "submitting"}
            className="rounded-md border border-sky-700 px-3 py-2 text-sm font-medium text-sky-800 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Load example
          </button>
        </div>

        <p className="mt-4 rounded-lg bg-sky-50 p-4 text-sm leading-6 text-sky-950">
          Supports named, self-contained React components with locally declared,
          JSON-serializable props. External files, arbitrary packages,
          callbacks, ReactNode and complex TypeScript composition are not yet
          supported.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-5">
          <div>
            <label htmlFor="analysis-prompt" className="text-sm font-semibold">
              Original prompt or requirements
            </label>
            <textarea
              id="analysis-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={5}
              aria-invalid={fieldIssue("prompt") ? true : undefined}
              aria-describedby={
                fieldIssue("prompt") ? "analysis-prompt-error" : undefined
              }
              className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
            />
            {fieldIssue("prompt") ? (
              <p id="analysis-prompt-error" className="mt-1 text-sm text-rose-700">
                {fieldIssue("prompt")?.message}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="analysis-code" className="text-sm font-semibold">
              Component code
            </label>
            <textarea
              id="analysis-code"
              value={componentCode}
              onChange={(event) => setComponentCode(event.target.value)}
              rows={20}
              spellCheck={false}
              aria-invalid={fieldIssue("componentCode") ? true : undefined}
              aria-describedby={
                fieldIssue("componentCode") ? "analysis-code-error" : undefined
              }
              className="mt-2 w-full rounded-lg border border-slate-300 p-3 font-mono text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
            />
            {fieldIssue("componentCode") ? (
              <p id="analysis-code-error" className="mt-1 text-sm text-rose-700">
                {fieldIssue("componentCode")?.message}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="analysis-language" className="text-sm font-semibold">
              Language
            </label>
            <select
              id="analysis-language"
              value={language}
              onChange={(event) =>
                setLanguage(event.target.value === "jsx" ? "jsx" : "tsx")
              }
              className="mt-2 block rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
            >
              <option value="tsx">TSX</option>
              <option value="jsx">JSX</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={state.status === "submitting"}
            className="inline-flex rounded-md bg-slate-950 px-5 py-2.5 font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {state.status === "submitting" ? "Analyzing…" : "Analyze"}
          </button>
        </form>
      </section>

      <section
        aria-live="polite"
        className="self-start rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-950">
            Analysis result
          </h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {statusLabel}
          </span>
        </div>

        {state.status === "idle" ? (
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Submit a component to inspect its deterministic contract. This does
            not execute the component.
          </p>
        ) : null}

        {state.status === "submitting" ? (
          <p className="mt-4 text-sm text-slate-600">
            Analyzing source on the application server…
          </p>
        ) : null}

        {state.status === "accepted" ? (
          <div className="mt-6 space-y-5">
            <ContractResult contract={state.response.contract} />
            <IssueList issues={state.response.issues} />
          </div>
        ) : null}

        {state.status === "rejected" ||
        state.status === "request-validation-error" ||
        state.status === "unexpected-server-error" ? (
          <div className="mt-6">
            <IssueList issues={activeIssues} />
          </div>
        ) : null}
      </section>
    </div>
  );
}
