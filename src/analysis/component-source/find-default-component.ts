import ts from "typescript";

import type { ContractIssue } from "../../domain";
import { ComponentSourceIssueCode, issueAt } from "./issue-codes";
import type {
  ComponentResolution,
  ImportAnalysis,
  ResolvedComponent,
  SupportedFunctionLike,
} from "./types";

function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
  return (
    ts.canHaveModifiers(node) &&
    (ts.getModifiers(node)?.some((modifier) => modifier.kind === kind) ?? false)
  );
}

function isLocalDefaultExportDeclaration(
  declaration: ts.ExportDeclaration,
): boolean {
  if (declaration.exportClause === undefined) {
    return false;
  }

  if (ts.isNamespaceExport(declaration.exportClause)) {
    return declaration.exportClause.name.text === "default";
  }

  return declaration.exportClause.elements.some(
    (element) =>
      element.name.text === "default" || element.propertyName?.text === "default",
  );
}

function findDeclarations(
  sourceFile: ts.SourceFile,
  name: string,
): (ts.FunctionDeclaration | ts.ClassDeclaration | ts.VariableDeclaration)[] {
  const declarations: (
    | ts.FunctionDeclaration
    | ts.ClassDeclaration
    | ts.VariableDeclaration
  )[] = [];

  for (const statement of sourceFile.statements) {
    if (
      ts.isFunctionDeclaration(statement) &&
      statement.name?.text === name
    ) {
      declarations.push(statement);
      continue;
    }

    if (ts.isClassDeclaration(statement) && statement.name?.text === name) {
      declarations.push(statement);
      continue;
    }

    if (!ts.isVariableStatement(statement)) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === name) {
        declarations.push(declaration);
      }
    }
  }

  return declarations;
}

function getFcPropsType(
  sourceFile: ts.SourceFile,
  declaration: ts.VariableDeclaration,
  imports: ImportAnalysis,
): { matched: false } | { matched: true; propsType?: ts.TypeNode; issue?: ContractIssue } {
  const annotation = declaration.type;
  if (annotation === undefined || !ts.isTypeReferenceNode(annotation)) {
    return { matched: false };
  }

  let isFunctionComponentType = false;
  if (ts.isIdentifier(annotation.typeName)) {
    isFunctionComponentType = imports.reactFunctionComponentBindings.has(
      annotation.typeName.text,
    );
  } else if (
    ts.isIdentifier(annotation.typeName.left) &&
    imports.reactNamespaceBindings.has(annotation.typeName.left.text) &&
    (annotation.typeName.right.text === "FC" ||
      annotation.typeName.right.text === "FunctionComponent")
  ) {
    isFunctionComponentType = true;
  }

  if (!isFunctionComponentType) {
    return { matched: false };
  }

  if (annotation.typeArguments?.length !== 1) {
    return {
      matched: true,
      issue: issueAt(
        sourceFile,
        annotation,
        ComponentSourceIssueCode.missingPropsType,
        "React function-component annotations must provide exactly one local props type",
        "Use React.FC<LocalProps> or FunctionComponent<LocalProps>",
      ),
    };
  }

  return { matched: true, propsType: annotation.typeArguments[0] };
}

function validateFunctionShape(
  sourceFile: ts.SourceFile,
  componentName: string,
  declaration: ts.Node,
  functionLike: SupportedFunctionLike,
  fcPropsType: ts.TypeNode | undefined,
): ComponentResolution {
  if ((functionLike.typeParameters?.length ?? 0) > 0) {
    return {
      issues: [
        issueAt(
          sourceFile,
          functionLike,
          ComponentSourceIssueCode.genericComponentNotSupported,
          `Generic component '${componentName}' is not supported`,
          "Submit a non-generic component with concrete local prop types",
        ),
      ],
    };
  }

  if (functionLike.parameters.length > 1) {
    return {
      issues: [
        issueAt(
          sourceFile,
          functionLike,
          ComponentSourceIssueCode.multipleComponentParameters,
          `Component '${componentName}' must take at most one props parameter`,
          "Remove ref or other additional function parameters",
        ),
      ],
    };
  }

  const component: ResolvedComponent = {
    componentName,
    declaration,
    functionLike,
    ...(fcPropsType === undefined ? {} : { fcPropsType }),
  };
  return { component, issues: [] };
}

function resolveVariableComponent(
  sourceFile: ts.SourceFile,
  declaration: ts.VariableDeclaration,
  componentName: string,
  imports: ImportAnalysis,
): ComponentResolution {
  const initializer = declaration.initializer;
  if (
    initializer === undefined ||
    (!ts.isArrowFunction(initializer) && !ts.isFunctionExpression(initializer))
  ) {
    return {
      issues: [
        issueAt(
          sourceFile,
          declaration,
          ComponentSourceIssueCode.unsupportedDefaultExport,
          `Default export '${componentName}' is not a direct function component`,
          "Export a named function or a const initialized directly with an arrow function",
        ),
      ],
    };
  }

  const fcType = getFcPropsType(sourceFile, declaration, imports);
  if (declaration.type !== undefined && !fcType.matched) {
    return {
      issues: [
        issueAt(
          sourceFile,
          declaration.type,
          ComponentSourceIssueCode.unsupportedPropsDeclaration,
          "Only React.FC<Props> and FunctionComponent<Props> variable annotations are supported",
          "Annotate the function parameter directly or use an imported React function-component type",
        ),
      ],
    };
  }

  if (fcType.matched && fcType.issue !== undefined) {
    return { issues: [fcType.issue] };
  }

  return validateFunctionShape(
    sourceFile,
    componentName,
    declaration,
    initializer,
    fcType.matched ? fcType.propsType : undefined,
  );
}

function resolveIdentifierExport(
  sourceFile: ts.SourceFile,
  exportAssignment: ts.ExportAssignment,
  identifier: ts.Identifier,
  imports: ImportAnalysis,
): ComponentResolution {
  const declarations = findDeclarations(sourceFile, identifier.text);
  if (declarations.length !== 1) {
    return {
      issues: [
        issueAt(
          sourceFile,
          identifier,
          ComponentSourceIssueCode.unresolvedDefaultExport,
          `Default export '${identifier.text}' does not resolve to one local declaration`,
          "Declare one named local function component before exporting it as default",
        ),
      ],
    };
  }

  const declaration = declarations[0];
  if (ts.isClassDeclaration(declaration)) {
    return {
      issues: [
        issueAt(
          sourceFile,
          declaration,
          ComponentSourceIssueCode.classComponentNotSupported,
          `Class component '${identifier.text}' is not supported`,
          "Use a named function component",
        ),
      ],
    };
  }

  if (ts.isFunctionDeclaration(declaration)) {
    return validateFunctionShape(
      sourceFile,
      identifier.text,
      declaration,
      declaration,
      undefined,
    );
  }

  return resolveVariableComponent(
    sourceFile,
    declaration,
    identifier.text,
    imports,
  );
}

export function findDefaultComponent(
  sourceFile: ts.SourceFile,
  imports: ImportAnalysis,
): ComponentResolution {
  const defaultExports: ts.Node[] = [];

  for (const statement of sourceFile.statements) {
    if (ts.isExportAssignment(statement) && !statement.isExportEquals) {
      defaultExports.push(statement);
    } else if (hasModifier(statement, ts.SyntaxKind.DefaultKeyword)) {
      defaultExports.push(statement);
    } else if (
      ts.isExportDeclaration(statement) &&
      isLocalDefaultExportDeclaration(statement)
    ) {
      defaultExports.push(statement);
    }
  }

  if (defaultExports.length === 0) {
    return {
      issues: [
        {
          code: ComponentSourceIssueCode.missingDefaultExport,
          severity: "error",
          message: "A named default-exported component is required",
          path: ["componentCode"],
          suggestion: "Export one named function component as default",
        },
      ],
    };
  }

  if (defaultExports.length > 1) {
    return {
      issues: [
        issueAt(
          sourceFile,
          defaultExports[1],
          ComponentSourceIssueCode.unsupportedDefaultExport,
          "Multiple default exports are not supported",
          "Keep exactly one named default component export",
        ),
      ],
    };
  }

  const defaultExport = defaultExports[0];
  if (ts.isClassDeclaration(defaultExport)) {
    return {
      issues: [
        issueAt(
          sourceFile,
          defaultExport,
          ComponentSourceIssueCode.classComponentNotSupported,
          "Class components are not supported",
          "Use a named function component",
        ),
      ],
    };
  }

  if (ts.isFunctionDeclaration(defaultExport)) {
    if (defaultExport.name === undefined) {
      return {
        issues: [
          issueAt(
            sourceFile,
            defaultExport,
            ComponentSourceIssueCode.anonymousComponentNotAllowed,
            "Anonymous default components are not supported",
            "Give the default-exported function a stable name",
          ),
        ],
      };
    }

    return validateFunctionShape(
      sourceFile,
      defaultExport.name.text,
      defaultExport,
      defaultExport,
      undefined,
    );
  }

  if (ts.isExportDeclaration(defaultExport)) {
    return {
      issues: [
        issueAt(
          sourceFile,
          defaultExport,
          ComponentSourceIssueCode.unsupportedDefaultExport,
          "Default export declarations and re-exports are not supported",
          "Use 'export default ComponentName' for a local named component",
        ),
      ],
    };
  }

  if (!ts.isExportAssignment(defaultExport)) {
    return {
      issues: [
        issueAt(
          sourceFile,
          defaultExport,
          ComponentSourceIssueCode.unsupportedDefaultExport,
          "The default export is not a supported function component",
          "Export one named local function component",
        ),
      ],
    };
  }

  const expression = defaultExport.expression;
  if (ts.isIdentifier(expression)) {
    return resolveIdentifierExport(sourceFile, defaultExport, expression, imports);
  }

  if (ts.isArrowFunction(expression) || ts.isFunctionExpression(expression)) {
    return {
      issues: [
        issueAt(
          sourceFile,
          expression,
          ComponentSourceIssueCode.anonymousComponentNotAllowed,
          "Anonymous default component expressions are not supported",
          "Assign the component to a named local declaration before exporting it",
        ),
      ],
    };
  }

  if (ts.isClassExpression(expression)) {
    return {
      issues: [
        issueAt(
          sourceFile,
          expression,
          ComponentSourceIssueCode.classComponentNotSupported,
          "Class components are not supported",
          "Use a named function component",
        ),
      ],
    };
  }

  return {
    issues: [
      issueAt(
        sourceFile,
        expression,
        ComponentSourceIssueCode.unsupportedDefaultExport,
        "Default export expressions, wrappers, memo and forwardRef are not supported",
        "Export the named function component directly",
      ),
    ],
  };
}

