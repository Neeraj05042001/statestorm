import ts from "typescript";

import type { ContractIssue, JsonValue, PropKind } from "../../domain";
import { ComponentSourceIssueCode, issueAt } from "./issue-codes";
import type { ImportAnalysis } from "./types";

export interface LocalTypeDeclarations {
  interfaces: ReadonlyMap<string, readonly ts.InterfaceDeclaration[]>;
  aliases: ReadonlyMap<string, readonly ts.TypeAliasDeclaration[]>;
}

export interface PropTypeAnalysis {
  kind?: PropKind;
  enumValues?: JsonValue[];
  issues: ContractIssue[];
}

export interface PropsMembersResolution {
  members?: readonly ts.TypeElement[];
  issues: ContractIssue[];
}

function addDeclaration<T extends ts.Declaration>(
  declarations: Map<string, T[]>,
  name: string,
  declaration: T,
) {
  const existing = declarations.get(name);
  if (existing === undefined) {
    declarations.set(name, [declaration]);
  } else {
    existing.push(declaration);
  }
}

export function collectLocalTypeDeclarations(
  sourceFile: ts.SourceFile,
): LocalTypeDeclarations {
  const interfaces = new Map<string, ts.InterfaceDeclaration[]>();
  const aliases = new Map<string, ts.TypeAliasDeclaration[]>();

  for (const statement of sourceFile.statements) {
    if (ts.isInterfaceDeclaration(statement)) {
      addDeclaration(interfaces, statement.name.text, statement);
    } else if (ts.isTypeAliasDeclaration(statement)) {
      addDeclaration(aliases, statement.name.text, statement);
    }
  }

  return { interfaces, aliases };
}

function literalTypeValue(node: ts.LiteralTypeNode): JsonValue | undefined {
  const literal = node.literal;
  if (ts.isStringLiteral(literal)) {
    return literal.text;
  }
  if (ts.isNumericLiteral(literal)) {
    const value = Number(literal.text);
    return Number.isFinite(value) ? value : undefined;
  }
  if (
    ts.isPrefixUnaryExpression(literal) &&
    (literal.operator === ts.SyntaxKind.MinusToken ||
      literal.operator === ts.SyntaxKind.PlusToken) &&
    ts.isNumericLiteral(literal.operand)
  ) {
    const unsigned = Number(literal.operand.text);
    const value =
      literal.operator === ts.SyntaxKind.MinusToken ? -unsigned : unsigned;
    return Number.isFinite(value) ? (Object.is(value, -0) ? 0 : value) : undefined;
  }
  if (literal.kind === ts.SyntaxKind.TrueKeyword) {
    return true;
  }
  if (literal.kind === ts.SyntaxKind.FalseKeyword) {
    return false;
  }
  if (literal.kind === ts.SyntaxKind.NullKeyword) {
    return null;
  }
  return undefined;
}

function unsupportedTypeIssue(
  sourceFile: ts.SourceFile,
  node: ts.Node,
  message: string,
): ContractIssue {
  return issueAt(
    sourceFile,
    node,
    ComponentSourceIssueCode.unsupportedPropType,
    message,
    "Use string, number, boolean, a JSON literal union, an array or a local object declaration",
  );
}

function validateObjectMembers(
  sourceFile: ts.SourceFile,
  members: readonly ts.TypeElement[],
  declarations: LocalTypeDeclarations,
  imports: ImportAnalysis,
  resolving: ReadonlySet<string>,
): ContractIssue[] {
  const issues: ContractIssue[] = [];
  const seenNames = new Set<string>();

  for (const member of members) {
    if (!ts.isPropertySignature(member) || member.type === undefined) {
      issues.push(
        unsupportedTypeIssue(
          sourceFile,
          member,
          "Object prop types may contain only typed property signatures",
        ),
      );
      continue;
    }

    const name = propertyNameText(member.name);
    if (name === undefined) {
      issues.push(
        unsupportedTypeIssue(
          sourceFile,
          member.name,
          "Computed object property names are not supported",
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
          `Duplicate property '${name}' is not supported`,
          "Keep one declaration for each property",
        ),
      );
      continue;
    }
    seenNames.add(name);

    issues.push(
      ...analyzePropType(
        sourceFile,
        member.type,
        declarations,
        imports,
        resolving,
      ).issues,
    );
  }

  return issues;
}

function propertyNameText(name: ts.PropertyName): string | undefined {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) {
    return name.text;
  }
  if (ts.isNumericLiteral(name)) {
    return name.text;
  }
  return undefined;
}

function analyzeLocalObjectReference(
  sourceFile: ts.SourceFile,
  typeNode: ts.TypeReferenceNode,
  declarations: LocalTypeDeclarations,
  imports: ImportAnalysis,
  resolving: ReadonlySet<string>,
): PropTypeAnalysis {
  if (!ts.isIdentifier(typeNode.typeName) || typeNode.typeArguments !== undefined) {
    return {
      issues: [
        unsupportedTypeIssue(
          sourceFile,
          typeNode,
          `Unsupported referenced prop type '${typeNode.getText(sourceFile)}'`,
        ),
      ],
    };
  }

  const name = typeNode.typeName.text;
  if (imports.importedBindings.has(name)) {
    return {
      issues: [
        unsupportedTypeIssue(
          sourceFile,
          typeNode,
          `Imported prop type '${name}' is not supported`,
        ),
      ],
    };
  }

  if (resolving.has(name)) {
    return {
      issues: [
        unsupportedTypeIssue(
          sourceFile,
          typeNode,
          `Recursive prop type '${name}' is not supported`,
        ),
      ],
    };
  }

  const interfaceDeclarations = declarations.interfaces.get(name) ?? [];
  const aliasDeclarations = declarations.aliases.get(name) ?? [];
  if (interfaceDeclarations.length + aliasDeclarations.length !== 1) {
    return {
      issues: [
        unsupportedTypeIssue(
          sourceFile,
          typeNode,
          `Prop type '${name}' does not resolve to one local object declaration`,
        ),
      ],
    };
  }

  const nextResolving = new Set(resolving);
  nextResolving.add(name);

  if (interfaceDeclarations.length === 1) {
    const declaration = interfaceDeclarations[0];
    if (
      declaration.heritageClauses !== undefined ||
      (declaration.typeParameters?.length ?? 0) > 0
    ) {
      return {
        issues: [
          unsupportedTypeIssue(
            sourceFile,
            declaration,
            `Inherited or generic interface '${name}' is not supported`,
          ),
        ],
      };
    }

    const issues = validateObjectMembers(
      sourceFile,
      declaration.members,
      declarations,
      imports,
      nextResolving,
    );
    return issues.length === 0 ? { kind: "object", issues } : { issues };
  }

  const alias = aliasDeclarations[0];
  if ((alias.typeParameters?.length ?? 0) > 0 || !ts.isTypeLiteralNode(alias.type)) {
    return {
      issues: [
        unsupportedTypeIssue(
          sourceFile,
          alias.type,
          `Local type '${name}' must be a non-generic object type literal`,
        ),
      ],
    };
  }

  const issues = validateObjectMembers(
    sourceFile,
    alias.type.members,
    declarations,
    imports,
    nextResolving,
  );
  return issues.length === 0 ? { kind: "object", issues } : { issues };
}

export function analyzePropType(
  sourceFile: ts.SourceFile,
  typeNode: ts.TypeNode,
  declarations: LocalTypeDeclarations,
  imports: ImportAnalysis,
  resolving: ReadonlySet<string> = new Set<string>(),
): PropTypeAnalysis {
  if (typeNode.kind === ts.SyntaxKind.StringKeyword) {
    return { kind: "string", issues: [] };
  }
  if (typeNode.kind === ts.SyntaxKind.NumberKeyword) {
    return { kind: "number", issues: [] };
  }
  if (typeNode.kind === ts.SyntaxKind.BooleanKeyword) {
    return { kind: "boolean", issues: [] };
  }

  if (ts.isUnionTypeNode(typeNode)) {
    const enumValues = typeNode.types.map((member) =>
      ts.isLiteralTypeNode(member) ? literalTypeValue(member) : undefined,
    );
    if (
      enumValues.length >= 2 &&
      enumValues.every((value) => value !== undefined)
    ) {
      return { kind: "enum", enumValues: enumValues as JsonValue[], issues: [] };
    }
    return {
      issues: [
        unsupportedTypeIssue(
          sourceFile,
          typeNode,
          "Unions must contain at least two JSON-compatible literal values",
        ),
      ],
    };
  }

  if (ts.isArrayTypeNode(typeNode)) {
    const element = analyzePropType(
      sourceFile,
      typeNode.elementType,
      declarations,
      imports,
      resolving,
    );
    return element.issues.length === 0
      ? { kind: "array", issues: [] }
      : { issues: element.issues };
  }

  if (
    ts.isTypeReferenceNode(typeNode) &&
    ts.isIdentifier(typeNode.typeName) &&
    typeNode.typeName.text === "Array"
  ) {
    if (typeNode.typeArguments?.length !== 1) {
      return {
        issues: [
          unsupportedTypeIssue(
            sourceFile,
            typeNode,
            "Array<T> props require exactly one supported element type",
          ),
        ],
      };
    }
    const element = analyzePropType(
      sourceFile,
      typeNode.typeArguments[0],
      declarations,
      imports,
      resolving,
    );
    return element.issues.length === 0
      ? { kind: "array", issues: [] }
      : { issues: element.issues };
  }

  if (ts.isTypeLiteralNode(typeNode)) {
    const issues = validateObjectMembers(
      sourceFile,
      typeNode.members,
      declarations,
      imports,
      resolving,
    );
    return issues.length === 0 ? { kind: "object", issues } : { issues };
  }

  if (ts.isTypeReferenceNode(typeNode)) {
    return analyzeLocalObjectReference(
      sourceFile,
      typeNode,
      declarations,
      imports,
      resolving,
    );
  }

  return {
    issues: [
      unsupportedTypeIssue(
        sourceFile,
        typeNode,
        `Unsupported prop type '${typeNode.getText(sourceFile)}'`,
      ),
    ],
  };
}

export function resolvePropsMembers(
  sourceFile: ts.SourceFile,
  typeNode: ts.TypeNode,
  declarations: LocalTypeDeclarations,
  imports: ImportAnalysis,
): PropsMembersResolution {
  if (ts.isTypeLiteralNode(typeNode)) {
    return { members: typeNode.members, issues: [] };
  }

  if (ts.isIntersectionTypeNode(typeNode)) {
    return {
      issues: [
        unsupportedTypeIssue(
          sourceFile,
          typeNode,
          "Intersection props declarations are not supported",
        ),
      ],
    };
  }

  if (!ts.isTypeReferenceNode(typeNode) || !ts.isIdentifier(typeNode.typeName)) {
    return {
      issues: [
        issueAt(
          sourceFile,
          typeNode,
          ComponentSourceIssueCode.unsupportedPropsDeclaration,
          "Props must use an inline object, local interface or local object type alias",
          "Declare props in the same source file without type composition",
        ),
      ],
    };
  }

  const name = typeNode.typeName.text;
  if (imports.importedBindings.has(name)) {
    return {
      issues: [
        unsupportedTypeIssue(
          sourceFile,
          typeNode,
          `Imported props declaration '${name}' is not supported`,
        ),
      ],
    };
  }

  if (typeNode.typeArguments !== undefined) {
    return {
      issues: [
        unsupportedTypeIssue(
          sourceFile,
          typeNode,
          "Generic props declarations are not supported",
        ),
      ],
    };
  }

  const interfaceDeclarations = declarations.interfaces.get(name) ?? [];
  const aliasDeclarations = declarations.aliases.get(name) ?? [];
  if (interfaceDeclarations.length + aliasDeclarations.length === 0) {
    return {
      issues: [
        issueAt(
          sourceFile,
          typeNode,
          ComponentSourceIssueCode.unresolvedPropsType,
          `Props type '${name}' does not resolve in this source file`,
          "Declare the props interface or object type alias locally",
        ),
      ],
    };
  }

  if (interfaceDeclarations.length + aliasDeclarations.length !== 1) {
    return {
      issues: [
        issueAt(
          sourceFile,
          typeNode,
          ComponentSourceIssueCode.unsupportedPropsDeclaration,
          `Props type '${name}' has multiple local declarations`,
          "Use one non-merged local props declaration",
        ),
      ],
    };
  }

  if (interfaceDeclarations.length === 1) {
    const declaration = interfaceDeclarations[0];
    if (
      declaration.heritageClauses !== undefined ||
      (declaration.typeParameters?.length ?? 0) > 0
    ) {
      return {
        issues: [
          issueAt(
            sourceFile,
            declaration,
            ComponentSourceIssueCode.unsupportedPropType,
            `Inherited or generic props interface '${name}' is not supported`,
            "Use one flat local interface with property signatures",
          ),
        ],
      };
    }
    return { members: declaration.members, issues: [] };
  }

  const alias = aliasDeclarations[0];
  if ((alias.typeParameters?.length ?? 0) > 0) {
    return {
      issues: [
        unsupportedTypeIssue(
          sourceFile,
          alias,
          `Generic props type '${name}' is not supported`,
        ),
      ],
    };
  }
  if (ts.isIntersectionTypeNode(alias.type)) {
    return {
      issues: [
        unsupportedTypeIssue(
          sourceFile,
          alias.type,
          "Intersection props declarations are not supported",
        ),
      ],
    };
  }
  if (!ts.isTypeLiteralNode(alias.type)) {
    return {
      issues: [
        issueAt(
          sourceFile,
          alias.type,
          ComponentSourceIssueCode.unsupportedPropsDeclaration,
          `Props type alias '${name}' must contain an object type literal`,
          "Use 'type Props = { ... }'",
        ),
      ],
    };
  }

  return { members: alias.type.members, issues: [] };
}

export { propertyNameText };

