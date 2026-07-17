export type FixtureId = "safe-short" | "safe-long" | "runtime-crash";

export interface SampleCardFixtureProps {
  title: string;
  description: string;
  shouldCrash?: boolean;
}

export interface DiagnosticFixture {
  id: FixtureId;
  label: string;
  props: SampleCardFixtureProps;
}

export const DIAGNOSTIC_FIXTURES: Record<FixtureId, DiagnosticFixture> = {
  "safe-short": {
    id: "safe-short",
    label: "Safe short",
    props: {
      title: "Calm state",
      description: "The short Gate 0 fixture rendered successfully.",
    },
  },
  "safe-long": {
    id: "safe-long",
    label: "Safe long",
    props: {
      title: "A visibly different long-content state",
      description:
        "This deliberately longer description proves that replacing JSON-serializable fixture data causes the isolated component preview to rerender with observably different content.",
    },
  },
  "runtime-crash": {
    id: "runtime-crash",
    label: "Runtime crash",
    props: {
      title: "Deliberate crash state",
      description: "This content must not commit because rendering throws first.",
      shouldCrash: true,
    },
  },
};

export function getFixture(fixtureId: FixtureId): DiagnosticFixture {
  return DIAGNOSTIC_FIXTURES[fixtureId];
}
