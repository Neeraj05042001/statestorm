import ts from "typescript";

import type {
  ContractIssue,
  JsonValue,
  PropDefinition,
  PropKind,
} from "../../domain";
import { ComponentSourceIssueCode, issueAt } from "./issue-codes";
import { readStaticJsonValue } from "./json-default-value";
import {
  analyzePropType,
  collectLocalTypeDeclarations,
  propertyNameText,
  resolvePropsMembers,
} from "./resolve-local-type";
import type {
  ImportAnalysis,
  PropsAnalysis,
  ResolvedComponent,
  StaticJsonValue,
} from "./types";

interface PropDefault {
  node: ts.Expression;
  value: StaticJsonValue;
}

interface DestructuringAnalysis {
  defaults: ReadonlyMap<string, PropDefault>;
  boundNames: ReadonlyMap<string, ts.BindingElement>;
  issues: ContractIssue[];
}

function analyzeDestructuring(
  sourceFile: ts.SourceFile,
  parameter: ts.ParameterDeclaration,
): DestructuringAnalysis {
  const defaults = new Map<string, PropDefault>();
  const boundNames = new Map<string, ts.BindingElement>();
  const issues: ContractIssue[] = [];

  if (!ts.isObjectBindingPattern(parameter.name)) {
    return { defaults, boundNames, issues };
  }

  for (const element of parameter.name.elements) {
    if (element.dotDotDotToken !== undefined || !ts.isIdentifier(element.name)) {
      issues.push(
        issueAt(
          sourceFile,
          element,
          ComponentSourceIssueCode.unsupportedPropsDeclaration,
          "Nested and rest destructuring are not supported for component props",
          "Use simple named object bindings",
        ),
      );
      continue;
    }

    const propName =
      element.propertyName === undefined
        ? element.name.text
        : propertyNameText(element.propertyName);
    if (propName === undefined) {
      issues.push(
        issueAt(
          sourceFile,
          element,
          ComponentSourceIssueCode.unsupportedPropsDeclaration,
          "Computed destructuring property names are not supported",
          "Use a simple named object binding",
        ),
      );
      continue;
    }

    boundNames.set(propName, element);
    if (element.initializer === undefined) {
      continue;
    }

    const defaultResult = readStaticJsonValue(element.initializer);
    if (!defaultResult.accepted) {
      issues.push(
        issueAt(
          sourceFile,
          element.initializer,
          ComponentSourceIssueCode.unsupportedPropDefault,
          `Default for '${propName}' is unsupported: ${defaultResult.reason}`,
          "Use a complete JSON-compatible literal default or remove the default",
        ),
      );
      continue;
    }

    defaults.set(propName, {
      node: element.initializer,
      value: defaultResult.value,
    });
  }

  return { defaults, boundNames, issues };
}

function defaultMatchesKind(
  value: StaticJsonValue,
  kind: PropKind,
  enumValues: readonly JsonValue[] | undefined,
): boolean {
  switch (kind) {
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "boolean":
      return typeof value === "boolean";
    case "enum":
      return (
        enumValues?.some(
          (enumValue) => JSON.stringify(enumValue) === JSON.stringify(value),
        ) ?? false
      );
    case "array":
      return Array.isArray(value);
    case "object":
      return value !== null && typeof value === "object" && !Array.isArray(value);
    case "unknown":
      return false;
  }
}

function selectPropsType(
  sourceFile: ts.SourceFile,
  component: ResolvedComponent,
): { typeNode?: ts.TypeNode; parameter?: ts.ParameterDeclaration; issues: ContractIssue[] } {
  const parameters = component.functionLike.parameters;
  const parameter = parameters[0];

  if (parameter === undefined) {
    return component.fcPropsType === undefined
      ? { issues: [] }
      : { typeNode: component.fcPropsType, issues: [] };
  }

  if (
    parameter.dotDotDotToken !== undefined ||
    parameter.initializer !== undefined ||
    parameter.questionToken !== undefined ||
    ts.isArrayBindingPattern(parameter.name)
  ) {
    return {
      parameter,
      issues: [
        issueAt(
          sourceFile,
          parameter,
          ComponentSourceIssueCode.unsupportedPropsDeclaration,
          "The props parameter must be one required identifier or object binding without a whole-parameter default",
          "Use props: LocalProps or destructure a supported local props type",
        ),
      ],
    };
  }

  if (
    parameter.type !== undefined &&
    component.fcPropsType !== undefined &&
    parameter.type.getText(sourceFile) !==
      component.fcPropsType.getText(sourceFile)
  ) {
    return {
      parameter,
      issues: [
        issueAt(
          sourceFile,
          parameter.type,
          ComponentSourceIssueCode.unsupportedPropsDeclaration,
          "Conflicting parameter and React function-component prop annotations are not supported",
          "Use one local props annotation",
        ),
      ],
    };
  }

  const typeNode = parameter.type ?? component.fcPropsType;
  if (typeNode === undefined) {
    return {
      parameter,
      issues: [
        issueAt(
          sourceFile,
          parameter,
          ComponentSourceIssueCode.missingPropsType,
          `Component '${component.componentName}' receives props without a supported type declaration`,
          "Add an inline object type or a local interface/type alias",
        ),
      ],
    };
  }

  return { typeNode, parameter, issues: [] };
}

export function analyzeProps(
  sourceFile: ts.SourceFile,
  component: ResolvedComponent,
  imports: ImportAnalysis,
): PropsAnalysis {
  const selection = selectPropsType(sourceFile, component);
  if (selection.issues.length > 0) {
    return { issues: selection.issues };
  }

  if (selection.typeNode === undefined) {
    return { props: [], issues: [] };
  }

  const declarations = collectLocalTypeDeclarations(sourceFile);
  const membersResult = resolvePropsMembers(
    sourceFile,
    selection.typeNode,
    declarations,
    imports,
  );
  if (membersResult.members === undefined) {
    return { issues: membersResult.issues };
  }

  const destructuring =
    selection.parameter === undefined
      ? {
          defaults: new Map<string, PropDefault>(),
          boundNames: new Map<string, ts.BindingElement>(),
          issues: [] as ContractIssue[],
        }
      : analyzeDestructuring(sourceFile, selection.parameter);

  const issues = [...destructuring.issues];
  const props: PropDefinition[] = [];
  const seenNames = new Set<string>();

  for (const member of membersResult.members) {
    if (!ts.isPropertySignature(member) || member.type === undefined) {
      issues.push(
        issueAt(
          sourceFile,
          member,
          ComponentSourceIssueCode.unsupportedPropType,
          "Props declarations may contain only typed property signatures",
          "Replace methods, call signatures and index signatures with supported data props",
        ),
      );
      continue;
    }

    const name = propertyNameText(member.name);
    if (name === undefined) {
      issues.push(
        issueAt(
          sourceFile,
          member.name,
          ComponentSourceIssueCode.unsupportedPropsDeclaration,
          "Computed prop names are not supported",
          "Use a stable identifier or string-literal prop name",
        ),
      );
      continue;
    }

    if (seenNames.has(name)) {
      issues.push(
        issueAt(
          sourceFile,
          member.name,
          ComponentSourceIssueCode.duplicatePropName,
          `Duplicate prop '${name}' is not supported`,
          "Keep one property signature for each prop",
        ),
      );
      continue;
    }
    seenNames.add(name);

    const typeResult = analyzePropType(
      sourceFile,
      member.type,
      declarations,
      imports,
    );
    issues.push(...typeResult.issues);
    if (typeResult.kind === undefined) {
      continue;
    }

    const defaultEntry = destructuring.defaults.get(name);
    if (
      defaultEntry !== undefined &&
      !defaultMatchesKind(
        defaultEntry.value,
        typeResult.kind,
        typeResult.enumValues,
      )
    ) {
      issues.push(
        issueAt(
          sourceFile,
          defaultEntry.node,
          ComponentSourceIssueCode.unsupportedPropDefault,
          `Default for '${name}' does not match its supported prop type`,
          "Use a JSON literal compatible with the declared prop type",
        ),
      );
      continue;
    }

    props.push({
      name,
      required: member.questionToken === undefined && defaultEntry === undefined,
      kind: typeResult.kind,
      typeText: member.type.getText(sourceFile).trim(),
      ...(defaultEntry === undefined
        ? {}
        : { defaultValue: defaultEntry.value }),
      ...(typeResult.enumValues === undefined
        ? {}
        : { enumValues: typeResult.enumValues }),
    });
  }

  for (const [boundName, element] of destructuring.boundNames) {
    if (!seenNames.has(boundName)) {
      issues.push(
        issueAt(
          sourceFile,
          element,
          ComponentSourceIssueCode.unsupportedPropsDeclaration,
          `Destructured prop '${boundName}' is not declared by the local props type`,
          "Add the property to the props declaration or remove the binding",
        ),
      );
    }
  }

  return issues.length === 0 ? { props, issues } : { issues };
}

