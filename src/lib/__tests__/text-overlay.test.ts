import { describe, expect, it } from "vitest";
import { buildTextFilter } from "../text-overlay";
import { TextOverlay } from "../types";

function createOverlay(overrides: Partial<TextOverlay> = {}): TextOverlay {
  return {
    id: "text-1",
    text: "Hello",
    x: 10,
    y: 20,
    fontSize: 48,
    color: "#ffffff",
    fontWeight: "normal",
    fontFamily: "Arial",
    ...overrides,
  };
}

describe("buildTextFilter", () => {
  it("uses an exported custom font file path when available", () => {
    const filter = buildTextFilter(
      createOverlay({
        fontFamily: "CustomFont",
        fontPath: "/tmp/custom-font.ttf",
      }),
      1920,
      1080,
    );

    expect(filter).toContain("fontfile=/tmp/custom-font.ttf");
    expect(filter).not.toContain("fontfile='CustomFont'");
  });

  it("falls back to the sanitized font family when no export path exists", () => {
    const filter = buildTextFilter(
      createOverlay({ fontFamily: "My Font" }),
      1920,
      1080,
    );

    expect(filter).toContain("fontfile='MyFont'");
  });
});
