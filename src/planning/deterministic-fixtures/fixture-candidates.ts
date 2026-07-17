import type {
  ComponentContract,
  JsonObject,
  JsonValue,
  PropKind,
} from "../../domain";
import {
  cloneJsonObject,
  cloneJsonValue,
  DETERMINISTIC_LONG_STRING,
  representativeValue,
} from "./baseline-values";
import type { FixtureCandidate } from "./types";

interface CandidateDescription {
  id: string;
  label: string;
  intent: string;
}

function setJsonProperty(
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

export function createHappyPathProps(
  contract: ComponentContract,
): JsonObject | undefined {
  const props: JsonObject = {};

  for (const prop of contract.props) {
    const value = representativeValue(prop);
    if (value === undefined) {
      return undefined;
    }
    setJsonProperty(props, prop.name, value);
  }

  return props;
}

function candidate(
  description: CandidateDescription,
  props: JsonObject,
): FixtureCandidate {
  return { ...description, props: cloneJsonObject(props) };
}

function varyKind(
  contract: ComponentContract,
  happyPathProps: JsonObject,
  description: CandidateDescription,
  kinds: ReadonlySet<PropKind>,
  valueFor: (propName: string, kind: PropKind, current: JsonValue) => JsonValue,
): FixtureCandidate | undefined {
  const matchingProps = contract.props.filter((prop) => kinds.has(prop.kind));
  if (matchingProps.length === 0) {
    return undefined;
  }

  const props = cloneJsonObject(happyPathProps);
  for (const prop of matchingProps) {
    setJsonProperty(
      props,
      prop.name,
      cloneJsonValue(valueFor(prop.name, prop.kind, props[prop.name])),
    );
  }

  return candidate(description, props);
}

export function createFixtureCandidates(
  contract: ComponentContract,
  happyPathProps: JsonObject,
): FixtureCandidate[] {
  const candidates: FixtureCandidate[] = [
    candidate(
      {
        id: "det-happy-path",
        label: "Happy path",
        intent: "Render every declared prop with representative valid values.",
      },
      happyPathProps,
    ),
  ];

  const minimalProps: JsonObject = {};
  for (const prop of contract.props) {
    if (prop.required) {
      setJsonProperty(
        minimalProps,
        prop.name,
        cloneJsonValue(happyPathProps[prop.name]),
      );
    }
  }
  candidates.push(
    candidate(
      {
        id: "det-minimal-required",
        label: "Minimal required",
        intent: "Verify the component when every optional prop is omitted.",
      },
      minimalProps,
    ),
  );

  const strategyCandidates = [
    varyKind(
      contract,
      happyPathProps,
      {
        id: "det-empty-strings",
        label: "Empty text",
        intent: "Exercise declared string props with empty content.",
      },
      new Set(["string"]),
      () => "",
    ),
    varyKind(
      contract,
      happyPathProps,
      {
        id: "det-whitespace-strings",
        label: "Whitespace text",
        intent: "Exercise declared string props with one whitespace character.",
      },
      new Set(["string"]),
      () => " ",
    ),
    varyKind(
      contract,
      happyPathProps,
      {
        id: "det-long-strings",
        label: "Long text",
        intent: "Stress text wrapping and overflow with unusually long content.",
      },
      new Set(["string"]),
      () => DETERMINISTIC_LONG_STRING,
    ),
    varyKind(
      contract,
      happyPathProps,
      {
        id: "det-zero-numbers",
        label: "Zero numbers",
        intent: "Exercise declared numeric props at zero.",
      },
      new Set(["number"]),
      () => 0,
    ),
    varyKind(
      contract,
      happyPathProps,
      {
        id: "det-negative-numbers",
        label: "Negative numbers",
        intent: "Exercise declared numeric props with a small negative value.",
      },
      new Set(["number"]),
      () => -1,
    ),
    varyKind(
      contract,
      happyPathProps,
      {
        id: "det-large-numbers",
        label: "Large numbers",
        intent: "Exercise declared numeric props with a large finite value.",
      },
      new Set(["number"]),
      () => 999999,
    ),
    varyKind(
      contract,
      happyPathProps,
      {
        id: "det-inverted-booleans",
        label: "Inverted booleans",
        intent: "Exercise the opposite value for every declared boolean prop.",
      },
      new Set(["boolean"]),
      (_name, _kind, current) => !current,
    ),
    varyKind(
      contract,
      happyPathProps,
      {
        id: "det-last-enum-values",
        label: "Final enum values",
        intent: "Exercise the final declared value for every enum prop.",
      },
      new Set(["enum"]),
      (name) => {
        const prop = contract.props.find((entry) => entry.name === name);
        return cloneJsonValue(prop?.enumValues?.at(-1) as JsonValue);
      },
    ),
    varyKind(
      contract,
      happyPathProps,
      {
        id: "det-empty-collections",
        label: "Empty collections",
        intent: "Exercise array and object props with empty containers.",
      },
      new Set(["array", "object"]),
      (_name, kind) => (kind === "array" ? [] : {}),
    ),
    varyKind(
      contract,
      happyPathProps,
      {
        id: "det-combined-stress",
        label: "Combined stress",
        intent: "Combine deterministic empty and boundary values across prop groups.",
      },
      new Set(["string", "number", "boolean", "enum", "array", "object"]),
      (name, kind) => {
        if (kind === "string") return "";
        if (kind === "number") return 0;
        if (kind === "boolean") return false;
        if (kind === "array") return [];
        if (kind === "object") return {};
        const prop = contract.props.find((entry) => entry.name === name);
        return cloneJsonValue(prop?.enumValues?.at(-1) as JsonValue);
      },
    ),
  ];

  for (const strategyCandidate of strategyCandidates) {
    if (strategyCandidate !== undefined) {
      candidates.push(strategyCandidate);
    }
  }

  return candidates;
}
