import { describe, expect, it } from "vitest";
import { buildTextFilter } from "../text-overlay";

describe("buildTextFilter", () => {
  it("does not add a fontfile for built-in fonts", () => {
    const result = buildTextFilter(
      {
        id: "overlay-1",
        text: "Hello",
        x: 50,
        y: 50,
        fontSize: 48,
        color: "#ffffff",
        fontWeight: "normal",
        fontFamily: "Arial",
      },
      1920,
      1080
    );

    expect(result).not.toContain("fontfile='Arial'");
    expect(result).not.toContain("fontfile=Arial");
  });

  it("keeps the custom fontfile argument for uploaded fonts", () => {
    const result = buildTextFilter(
      {
        id: "overlay-2",
        text: "Hello",
        x: 50,
        y: 50,
        fontSize: 48,
        color: "#ffffff",
        fontWeight: "normal",
        fontFamily: "CustomFont",
        fontPath: "/tmp/CustomFont.ttf",
      },
      1920,
      1080
    );

    expect(result).toContain("fontfile=/tmp/CustomFont.ttf");
  });
});
