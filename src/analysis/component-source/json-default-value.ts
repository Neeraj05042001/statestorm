import ts from "typescript";

import type { StaticJsonResult, StaticJsonValue } from "./types";

function rejected(reason: string): StaticJsonResult {
  return { accepted: false, reason };
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

export function readStaticJsonValue(expression: ts.Expression): StaticJsonResult {
  if (ts.isStringLiteral(expression)) {
    return { accepted: true, value: expression.text };
  }

  if (ts.isNumericLiteral(expression)) {
    const value = Number(expression.text);
    return Number.isFinite(value)
      ? { accepted: true, value }
      : rejected("numeric default must be finite");
  }

  if (
    ts.isPrefixUnaryExpression(expression) &&
    (expression.operator === ts.SyntaxKind.MinusToken ||
      expression.operator === ts.SyntaxKind.PlusToken) &&
    ts.isNumericLiteral(expression.operand)
  ) {
    const unsigned = Number(expression.operand.text);
    const value =
      expression.operator === ts.SyntaxKind.MinusToken ? -unsigned : unsigned;
    return Number.isFinite(value)
      ? { accepted: true, value: Object.is(value, -0) ? 0 : value }
      : rejected("numeric default must be finite");
  }

  if (expression.kind === ts.SyntaxKind.TrueKeyword) {
    return { accepted: true, value: true };
  }

  if (expression.kind === ts.SyntaxKind.FalseKeyword) {
    return { accepted: true, value: false };
  }

  if (expression.kind === ts.SyntaxKind.NullKeyword) {
    return { accepted: true, value: null };
  }

  if (ts.isArrayLiteralExpression(expression)) {
    const values: StaticJsonValue[] = [];
    for (const element of expression.elements) {
      if (ts.isSpreadElement(element) || ts.isOmittedExpression(element)) {
        return rejected("array defaults cannot contain spreads or omitted values");
      }

      const result = readStaticJsonValue(element);
      if (!result.accepted) {
        return result;
      }
      values.push(result.value);
    }
    return { accepted: true, value: values };
  }

  if (ts.isObjectLiteralExpression(expression)) {
    const value: { [key: string]: StaticJsonValue } = {};
    for (const property of expression.properties) {
      if (!ts.isPropertyAssignment(property)) {
        return rejected(
          "object defaults can contain only explicit property assignments",
        );
      }

      const name = propertyNameText(property.name);
      if (name === undefined) {
        return rejected("object defaults cannot contain computed property names");
      }

      const propertyResult = readStaticJsonValue(property.initializer);
      if (!propertyResult.accepted) {
        return propertyResult;
      }

      Object.defineProperty(value, name, {
        value: propertyResult.value,
        enumerable: true,
        configurable: true,
        writable: true,
      });
    }
    return { accepted: true, value };
  }

  return rejected(
    "default must be a complete JSON literal without identifiers, calls, templates, functions or spreads",
  );
}

