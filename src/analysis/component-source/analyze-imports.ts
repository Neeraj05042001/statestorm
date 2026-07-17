import ts from "typescript";

import type { ContractIssue } from "../../domain";
import { ComponentSourceIssueCode, issueAt } from "./issue-codes";
import type { ImportAnalysis } from "./types";

const ALLOWED_IMPORTS = new Set(["react", "react/jsx-runtime"]);

function classifyModuleSpecifier(moduleName: string) {
  if (moduleName.startsWith(".")) {
    return {
      code: ComponentSourceIssueCode.relativeImportNotAllowed,
      message: `Relative import '${moduleName}' is not allowed`,
      suggestion: "Make the submitted component self-contained",
    };
  }

  if (
    moduleName.startsWith("@/") ||
    moduleName.startsWith("~/") ||
    moduleName.startsWith("#/")
  ) {
    return {
      code: ComponentSourceIssueCode.aliasImportNotAllowed,
      message: `Aliased import '${moduleName}' is not allowed`,
      suggestion: "Remove repository path aliases from the submitted component",
    };
  }

  return {
    code: ComponentSourceIssueCode.unsupportedImport,
    message: `Package import '${moduleName}' is outside the React allowlist`,
    suggestion: "Use only react or react/jsx-runtime imports",
  };
}

function recordImportBindings(
  declaration: ts.ImportDeclaration,
  importedBindings: Set<string>,
  reactNamespaceBindings: Set<string>,
  reactFunctionComponentBindings: Set<string>,
) {
  const importClause = declaration.importClause;
  if (importClause === undefined) {
    return;
  }

  if (importClause.name !== undefined) {
    importedBindings.add(importClause.name.text);
    reactNamespaceBindings.add(importClause.name.text);
  }

  const bindings = importClause.namedBindings;
  if (bindings === undefined) {
    return;
  }

  if (ts.isNamespaceImport(bindings)) {
    importedBindings.add(bindings.name.text);
    reactNamespaceBindings.add(bindings.name.text);
    return;
  }

  for (const element of bindings.elements) {
    const importedName = element.propertyName?.text ?? element.name.text;
    const localName = element.name.text;
    importedBindings.add(localName);
    if (importedName === "FC" || importedName === "FunctionComponent") {
      reactFunctionComponentBindings.add(localName);
    }
  }
}

export function analyzeImports(sourceFile: ts.SourceFile): ImportAnalysis {
  const imports: string[] = [];
  const seenAllowedImports = new Set<string>();
  const issues: ContractIssue[] = [];
  const importedBindings = new Set<string>();
  const reactNamespaceBindings = new Set<string>();
  const reactFunctionComponentBindings = new Set<string>();

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      const moduleName = ts.isStringLiteral(statement.moduleSpecifier)
        ? statement.moduleSpecifier.text
        : statement.moduleSpecifier.getText(sourceFile);

      const importClause = statement.importClause;
      if (importClause === undefined) {
        issues.push(
          issueAt(
            sourceFile,
            statement,
            ComponentSourceIssueCode.unsupportedImport,
            `Side-effect import '${moduleName}' is not supported`,
            "Use an explicit React import or remove the side-effect import",
          ),
        );
        continue;
      }

      if (!ALLOWED_IMPORTS.has(moduleName)) {
        const classification = classifyModuleSpecifier(moduleName);
        issues.push(
          issueAt(
            sourceFile,
            statement.moduleSpecifier,
            classification.code,
            classification.message,
            classification.suggestion,
          ),
        );
      } else {
        if (!seenAllowedImports.has(moduleName)) {
          imports.push(moduleName);
          seenAllowedImports.add(moduleName);
        }
        recordImportBindings(
          statement,
          importedBindings,
          reactNamespaceBindings,
          reactFunctionComponentBindings,
        );
      }

      if (!ALLOWED_IMPORTS.has(moduleName)) {
        recordImportBindings(
          statement,
          importedBindings,
          new Set<string>(),
          new Set<string>(),
        );
      }
      continue;
    }

    if (ts.isExportDeclaration(statement) && statement.moduleSpecifier) {
      issues.push(
        issueAt(
          sourceFile,
          statement,
          ComponentSourceIssueCode.unsupportedImport,
          "Re-exported dependencies are not supported",
          "Declare the submitted component and its prop types in this source file",
        ),
      );
    }
  }

  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node)) {
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        issues.push(
          issueAt(
            sourceFile,
            node,
            ComponentSourceIssueCode.dynamicImportNotAllowed,
            "Dynamic import() is not allowed",
            "Use only static allowlisted React imports",
          ),
        );
      } else if (
        ts.isIdentifier(node.expression) &&
        node.expression.text === "require"
      ) {
        issues.push(
          issueAt(
            sourceFile,
            node,
            ComponentSourceIssueCode.requireNotAllowed,
            "require() is not allowed",
            "Use only static allowlisted React imports",
          ),
        );
      }
    } else if (ts.isImportTypeNode(node)) {
      issues.push(
        issueAt(
          sourceFile,
          node,
          ComponentSourceIssueCode.unsupportedImport,
          "Imported type expressions are not supported",
          "Declare prop types in the submitted source file",
        ),
      );
    } else if (ts.isModuleDeclaration(node)) {
      issues.push(
        issueAt(
          sourceFile,
          node,
          ComponentSourceIssueCode.unsupportedSourceDeclaration,
          "Namespace and module declarations are not supported",
          "Use local interfaces or object type aliases for props",
        ),
      );
    }

    ts.forEachChild(node, visit);
  };

  ts.forEachChild(sourceFile, visit);

  return {
    imports,
    issues,
    importedBindings,
    reactNamespaceBindings,
    reactFunctionComponentBindings,
  };
}

