import { describe, expect, it } from "vitest";

import {
  categorizeImageSource,
  detectBrokenImages,
  type ImageCandidate,
} from "../detect-broken-images";

function imageCandidate(
  overrides: Partial<ImageCandidate> = {},
): ImageCandidate {
  return {
    complete: true,
    naturalWidth: 0,
    alt: "Product image",
    source: "/missing-product.png",
    ...overrides,
  };
}

describe("detectBrokenImages", () => {
  it("detects a completed image with no natural width", () => {
    expect(detectBrokenImages([imageCandidate()])).toMatchObject([
      {
        kind: "broken-image",
        evidence: {
          imageAltPresent: true,
          imageSourceKind: "relative",
        },
      },
    ]);
  });

  it("does not report healthy or pending images", () => {
    expect(
      detectBrokenImages([
        imageCandidate({ naturalWidth: 160 }),
        imageCandidate({ complete: false }),
      ]),
    ).toEqual([]);
  });

  it("classifies sources without returning the full URL and records alt presence", () => {
    const externalUrl = "https://images.example.test/private/product.png?token=secret";
    const [finding] = detectBrokenImages([
      imageCandidate({ source: externalUrl, alt: "" }),
    ]);

    expect(finding?.evidence).toMatchObject({
      imageSourceKind: "external",
      imageAltPresent: false,
    });
    expect(JSON.stringify(finding)).not.toContain(externalUrl);
    expect(categorizeImageSource("")).toBe("empty");
    expect(categorizeImageSource("data:image/png;base64,abc")).toBe("data");
  });

  it("caps confirmed broken-image findings at five", () => {
    expect(
      detectBrokenImages(
        Array.from({ length: 8 }, (_, index) =>
          imageCandidate({ elementHint: `#image-${index}` }),
        ),
      ),
    ).toHaveLength(5);
  });
});
