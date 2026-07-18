import { describe, expect, it } from "vitest";

import {
  detectOverflow,
  type OverflowCandidate,
} from "../detect-overflow";

function candidate(
  overrides: Partial<OverflowCandidate> = {},
): OverflowCandidate {
  return {
    elementTag: "DIV",
    clientWidth: 200,
    scrollWidth: 200,
    clientHeight: 100,
    scrollHeight: 100,
    visible: true,
    infrastructure: false,
    ...overrides,
  };
}

describe("detectOverflow", () => {
  it("detects root horizontal overflow", () => {
    const findings = detectOverflow([
      candidate({
        elementTag: "MAIN",
        elementHint: "#statestorm-fixture-root",
        scrollWidth: 240,
      }),
    ]);

    expect(findings).toMatchObject([
      {
        kind: "layout-overflow",
        evidence: { axis: "horizontal", clientWidth: 200, scrollWidth: 240 },
      },
    ]);
  });

  it("detects element text clipping without retaining text or HTML", () => {
    const [finding] = detectOverflow([
      candidate({
        elementTag: "H2",
        elementHint: '[data-testid="product-title"]',
        clientWidth: 180,
        scrollWidth: 640,
      }),
    ]);

    expect(finding?.evidence.elementTag).toBe("H2");
    expect(JSON.stringify(finding)).not.toContain("textContent");
    expect(JSON.stringify(finding)).not.toContain("innerHTML");
  });

  it("ignores fitting, hidden, zero-sized, and infrastructure elements", () => {
    expect(
      detectOverflow([
        candidate(),
        candidate({ visible: false, scrollWidth: 400 }),
        candidate({ clientWidth: 0, scrollWidth: 400 }),
        candidate({ infrastructure: true, scrollWidth: 400 }),
      ]),
    ).toEqual([]);
  });

  it("caps overflow findings at five", () => {
    const findings = detectOverflow(
      Array.from({ length: 8 }, (_, index) =>
        candidate({ elementHint: `#element-${index}`, scrollWidth: 400 }),
      ),
    );

    expect(findings).toHaveLength(5);
  });
});
