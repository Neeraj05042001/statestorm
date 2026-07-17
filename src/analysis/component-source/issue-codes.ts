import type ts from "typescript";

import type { ContractIssue } from "../../domain";

export const ComponentSourceIssueCode = {
  sourceSyntaxError: "SOURCE_SYNTAX_ERROR",
  unsupportedImport: "UNSUPPORTED_IMPORT",
  relativeImportNotAllowed: "RELATIVE_IMPORT_NOT_ALLOWED",
  aliasImportNotAllowed: "ALIAS_IMPORT_NOT_ALLOWED",
  dynamicImportNotAllowed: "DYNAMIC_IMPORT_NOT_ALLOWED",
  requireNotAllowed: "REQUIRE_NOT_ALLOWED",
  unsupportedSourceDeclaration: "UNSUPPORTED_SOURCE_DECLARATION",
  missingDefaultExport: "MISSING_DEFAULT_EXPORT",
  unsupportedDefaultExport: "UNSUPPORTED_DEFAULT_EXPORT",
  unresolvedDefaultExport: "UNRESOLVED_DEFAULT_EXPORT",
  anonymousComponentNotAllowed: "ANONYMOUS_COMPONENT_NOT_ALLOWED",
  classComponentNotSupported: "CLASS_COMPONENT_NOT_SUPPORTED",
  genericComponentNotSupported: "GENERIC_COMPONENT_NOT_SUPPORTED",
  multipleComponentParameters: "MULTIPLE_COMPONENT_PARAMETERS",
  missingPropsType: "MISSING_PROPS_TYPE",
  unresolvedPropsType: "UNRESOLVED_PROPS_TYPE",
  unsupportedPropsDeclaration: "UNSUPPORTED_PROPS_DECLARATION",
  unsupportedPropType: "UNSUPPORTED_PROP_TYPE",
  unsupportedPropDefault: "UNSUPPORTED_PROP_DEFAULT",
  duplicatePropName: "DUPLICATE_PROP_NAME",
  contractValidationFailed: "CONTRACT_VALIDATION_FAILED",
} as const;

export type ComponentSourceIssueCode =
  (typeof ComponentSourceIssueCode)[keyof typeof ComponentSourceIssueCode];

export function sourcePath(
  sourceFile: ts.SourceFile,
  position: number,
): ["componentCode", number, number] {
  const location = sourceFile.getLineAndCharacterOfPosition(
    Math.max(0, Math.min(position, sourceFile.getFullText().length)),
  );

  return ["componentCode", location.line + 1, location.character + 1];
}

export function issueAt(
  sourceFile: ts.SourceFile,
  node: ts.Node,
  code: ComponentSourceIssueCode,
  message: string,
  suggestion?: string,
): ContractIssue {
  return {
    code,
    severity: "error",
    message,
    path: sourcePath(sourceFile, node.getStart(sourceFile, false)),
    ...(suggestion === undefined ? {} : { suggestion }),
  };
}

