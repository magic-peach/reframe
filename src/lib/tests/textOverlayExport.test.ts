import { describe, expect, it } from "vitest";
import { buildTextFilter, createDefaultTextOverlay } from "../text-overlay";

describe("text overlay export", () => {
  it("uses the FFmpeg bold flag for bold text instead of an invalid fontweight parameter", () => {
    const filter = buildTextFilter(
      {
        ...createDefaultTextOverlay(),
        text: "Hello",
        fontWeight: "bold",
      },
      1920,
      1080
    );

    expect(filter).toContain(":bold=1");
    expect(filter).not.toContain(":fontweight=");
  });

  it("only appends a fontfile argument for real custom font paths", () => {
    const filter = buildTextFilter(
      {
        ...createDefaultTextOverlay(),
        text: "Hello",
        fontFamily: "Arial",
      },
      1920,
      1080
    );

    expect(filter).not.toContain(":fontfile='Arial'");
    expect(filter).not.toContain(":fontfile=Arial");
  });
});
