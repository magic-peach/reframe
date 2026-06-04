import { describe, expect, it } from "vitest";
import { buildTextFilter } from "../text-overlay";
import { TextOverlay } from "../types";

function overlay(overrides: Partial<TextOverlay> = {}): TextOverlay {
  return {
    id: "text-1",
    text: "Title",
    x: 50,
    y: 25,
    fontSize: 48,
    color: "#ffffff",
    fontWeight: "bold",
    fontFamily: "Arial",
    ...overrides,
  };
}

describe("buildTextFilter", () => {
  it("builds a drawtext filter without unsupported font options for built-in fonts", () => {
    const filter = buildTextFilter(overlay(), 1920, 1080);

    expect(filter).toBe("drawtext=text='Title':x=960:y=270:fontsize=48:fontcolor=#ffffff");
    expect(filter).not.toContain("fontweight=");
    expect(filter).not.toContain("fontfile='Arial'");
  });

  it("escapes drawtext separators inside overlay text", () => {
    const filter = buildTextFilter(
      overlay({ text: "It's 10:30, go\\now; 50%", x: 10, y: 20 }),
      1000,
      500
    );

    expect(filter).toContain("text='It\\'s 10\\:30\\, go\\\\now\\; 50\\%'");
    expect(filter).toContain("x=100:y=100");
  });
});
