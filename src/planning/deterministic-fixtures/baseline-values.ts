import type {
  JsonObject,
  JsonValue,
  PropDefinition,
} from "../../domain";

export const DETERMINISTIC_LONG_STRING = [
  "StateStorm checks how a component responds when readable content becomes unusually long, wraps across several lines, and presses against constrained layouts.",
  "This stable value keeps meaningful words so overflow, truncation, spacing, and text wrapping stay easy to inspect without random filler.",
].join(" ");

function defineJsonProperty(
  target: JsonObject,
  key: string,
  value: JsonValue,
): void {
  Object.defineProperty(target, key, {
    value,
    enumerable: true,
    configurable: true,
    writable: true,
  });
}

export function cloneJsonValue(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map(cloneJsonValue);
  }

  if (value !== null && typeof value === "object") {
    return cloneJsonObject(value);
  }

  return value;
}

export function cloneJsonObject(value: JsonObject): JsonObject {
  const clone: JsonObject = {};
  for (const [key, entry] of Object.entries(value)) {
    defineJsonProperty(clone, key, cloneJsonValue(entry));
  }
  return clone;
}

function canonicalizeJsonValue(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map(canonicalizeJsonValue);
  }

  if (value !== null && typeof value === "object") {
    const canonical: JsonObject = {};
    for (const key of Object.keys(value).sort()) {
      defineJsonProperty(
        canonical,
        key,
        canonicalizeJsonValue(value[key]),
      );
    }
    return canonical;
  }

  return value;
}

export function canonicalJson(value: JsonValue): string {
  return JSON.stringify(canonicalizeJsonValue(value));
}

export function jsonValuesEqual(left: JsonValue, right: JsonValue): boolean {
  return canonicalJson(left) === canonicalJson(right);
}

export function hasExplicitDefault(
  prop: PropDefinition,
): prop is PropDefinition & { defaultValue: JsonValue } {
  return Object.prototype.hasOwnProperty.call(prop, "defaultValue");
}

export function isValueCompatibleWithProp(
  prop: PropDefinition,
  value: JsonValue,
): boolean {
  switch (prop.kind) {
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "boolean":
      return typeof value === "boolean";
    case "enum":
      return (
        prop.enumValues?.some((entry) => jsonValuesEqual(entry, value)) ?? false
      );
    case "array":
      return Array.isArray(value);
    case "object":
      return value !== null && typeof value === "object" && !Array.isArray(value);
    case "unknown":
      return false;
  }
}

export function representativeValue(
  prop: PropDefinition,
): JsonValue | undefined {
  if (hasExplicitDefault(prop)) {
    return cloneJsonValue(prop.defaultValue);
  }

  switch (prop.kind) {
    case "string":
      return "Sample text";
    case "number":
      return 1;
    case "boolean":
      return true;
    case "enum":
      return prop.enumValues?.[0] === undefined
        ? undefined
        : cloneJsonValue(prop.enumValues[0]);
    case "array":
      return [];
    case "object":
      return {};
    case "unknown":
      return undefined;
  }
}
