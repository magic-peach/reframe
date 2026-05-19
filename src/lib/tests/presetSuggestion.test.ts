import { describe, it, expect } from "vitest";
import { suggestPreset } from "../presetSuggestion";

describe("suggestPreset", () => {
  it("suggests vertical 9:16 for a tall video", () => {
    expect(suggestPreset(1080, 1920)).toBe("vertical-9-16");
  });

  it("suggests landscape 16:9 for a wide video", () => {
    expect(suggestPreset(1920, 1080)).toBe("landscape-16-9");
  });

  it("suggests square 1:1 for a square video", () => {
    expect(suggestPreset(1080, 1080)).toBe("square-1-1");
  });

  it("falls back to vertical 9:16 when no close ratio matches", () => {
    expect(suggestPreset(1440, 900)).toBe("vertical-9-16");
  });
});
