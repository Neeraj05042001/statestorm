import ts from "typescript";

import {
  ComponentContractSchema,
  ComponentSubmissionSchema,
  type ComponentSubmission,
  type ContractIssue,
} from "../../domain";
import { analyzeImports } from "./analyze-imports";
import { analyzeProps } from "./analyze-props";
import { findDefaultComponent } from "./find-default-component";
import { ComponentSourceIssueCode, sourcePath } from "./issue-codes";
import type { ComponentAnalysisResult } from "./types";

type SourceFileWithParseDiagnostics = ts.SourceFile & {
  readonly parseDiagnostics: readonly ts.DiagnosticWithLocation[];
};

function submissionIssues(input: unknown): ContractIssue[] | undefined {
  const result = ComponentSubmissionSchema.safeParse(input);
  if (result.success) {
    return undefined;
  }

  return result.error.issues.map((issue) => ({
    code: ComponentSourceIssueCode.contractValidationFailed,
    severity: "error" as const,
    message: `Invalid component submission: ${issue.message}`,
    path: [
      "submission",
      ...issue.path.map((segment) =>
        typeof segment === "number" || typeof segment === "string"
          ? segment
          : String(segment),
      ),
    ],
    suggestion: "Provide a valid ComponentSubmission value",
  }));
}

function parseSource(submission: ComponentSubmission): ts.SourceFile {
  return ts.createSourceFile(
    submission.language === "tsx" ? "Component.tsx" : "Component.jsx",
    submission.componentCode,
    ts.ScriptTarget.Latest,
    true,
    submission.language === "tsx" ? ts.ScriptKind.TSX : ts.ScriptKind.JSX,
  );
}

function syntaxIssues(sourceFile: ts.SourceFile): ContractIssue[] {
  const diagnostics = (sourceFile as SourceFileWithParseDiagnostics)
    .parseDiagnostics;
  return [...diagnostics]
    .sort(
      (left, right) =>
        (left.start ?? 0) - (right.start ?? 0) || left.code - right.code,
    )
    .map((diagnostic) => ({
      code: ComponentSourceIssueCode.sourceSyntaxError,
      severity: "error" as const,
      message: `TS${diagnostic.code}: ${ts.flattenDiagnosticMessageText(
        diagnostic.messageText,
        " ",
      )}`,
      path: sourcePath(sourceFile, diagnostic.start ?? 0),
      suggestion: "Correct the source syntax before analysis",
    }));
}

function contractValidationIssues(input: unknown): ContractIssue[] {
  const result = ComponentContractSchema.safeParse(input);
  if (result.success) {
    return [];
  }

  return result.error.issues.map((issue) => ({
    code: ComponentSourceIssueCode.contractValidationFailed,
    severity: "error" as const,
    message: `Generated ComponentContract is invalid: ${issue.message}`,
    path: [
      "contract",
      ...issue.path.map((segment) =>
        typeof segment === "number" || typeof segment === "string"
          ? segment
          : String(segment),
      ),
    ],
    suggestion: "Keep analyzer output aligned with ComponentContractSchema",
  }));
}

export function analyzeComponentSource(
  submission: ComponentSubmission,
): ComponentAnalysisResult {
  const invalidSubmissionIssues = submissionIssues(submission);
  if (invalidSubmissionIssues !== undefined) {
    return { accepted: false, issues: invalidSubmissionIssues };
  }

  const validatedSubmission = ComponentSubmissionSchema.parse(submission);
  const sourceFile = parseSource(validatedSubmission);
  const parseIssues = syntaxIssues(sourceFile);
  if (parseIssues.length > 0) {
    return { accepted: false, issues: parseIssues };
  }

  const importAnalysis = analyzeImports(sourceFile);
  const componentResolution = findDefaultComponent(sourceFile, importAnalysis);
  const issues = [...importAnalysis.issues, ...componentResolution.issues];
  if (componentResolution.component === undefined) {
    return { accepted: false, issues };
  }

  const propsAnalysis = analyzeProps(
    sourceFile,
    componentResolution.component,
    importAnalysis,
  );
  issues.push(...propsAnalysis.issues);
  if (propsAnalysis.props === undefined || issues.some((issue) => issue.severity === "error")) {
    return { accepted: false, issues };
  }

  const contractCandidate = {
    componentName: componentResolution.component.componentName,
    exportStyle: "default" as const,
    language: validatedSubmission.language,
    imports: importAnalysis.imports,
    props: propsAnalysis.props,
    warnings: issues
      .filter((issue) => issue.severity === "warning")
      .map((issue) => issue.message),
  };
  const validationIssues = contractValidationIssues(contractCandidate);
  if (validationIssues.length > 0) {
    return { accepted: false, issues: [...issues, ...validationIssues] };
  }

  return {
    accepted: true,
    contract: ComponentContractSchema.parse(contractCandidate),
    issues,
  };
}

