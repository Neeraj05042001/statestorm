import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { ComponentAnalysisApiResponseSchema } from "../../../domain";
import { analyzeSubmission } from "../analyze-submission.server";

const supportedSubmission = {
  id: "submission-service-test",
  prompt: "Render a status card",
  language: "tsx" as const,
  componentCode: `
    import React from "react";

    interface StatusCardProps {
      title: string;
      count: number;
      active: boolean;
      tone?: "calm" | "urgent";
    }

    export default function StatusCard({
      title,
      count,
      active,
      tone = "calm",
    }: StatusCardProps) {
      return <section>{title} {count} {active ? tone : "inactive"}</section>;
    }
  `,
};

describe("analyzeSubmission", () => {
  it("returns an accepted contract for supported TSX", () => {
    const result = analyzeSubmission(supportedSubmission);

    expect(result.accepted).toBe(true);
    if (result.accepted) {
      expect(result.contract.componentName).toBe("StatusCard");
      expect(result.contract.props.map((prop) => prop.name)).toEqual([
        "title",
        "count",
        "active",
        "tone",
      ]);
    }
  });

  it("returns issues for an unsupported import", () => {
    const result = analyzeSubmission({
      ...supportedSubmission,
      componentCode: `
        import clsx from "clsx";
        interface Props { label: string; }
        export default function StatusCard({ label }: Props) {
          return <div className={clsx("card")}>{label}</div>;
        }
      `,
    });

    expect(result.accepted).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain(
      "UNSUPPORTED_IMPORT",
    );
  });

  it("returns issues for a source syntax error", () => {
    const result = analyzeSubmission({
      ...supportedSubmission,
      componentCode:
        "export default function StatusCard(props: { title: string }) { return <div>{props.title}</div>;",
    });

    expect(result.accepted).toBe(false);
    expect(result.issues[0]?.code).toBe("SOURCE_SYNTAX_ERROR");
  });

  it("rejects an invalid submission schema", () => {
    const result = analyzeSubmission({
      ...supportedSubmission,
      prompt: "",
    });

    expect(result.accepted).toBe(false);
    expect(result.issues[0]).toMatchObject({
      code: "CONTRACT_VALIDATION_FAILED",
      path: ["submission", "prompt"],
    });
  });

  it("returns schema-valid data without raw Error objects", () => {
    const result = analyzeSubmission({ language: "tsx" });

    expect(result).not.toBeInstanceOf(Error);
    expect(ComponentAnalysisApiResponseSchema.safeParse(result).success).toBe(
      true,
    );
    expect(JSON.stringify(result)).not.toContain('"stack"');
  });
});
