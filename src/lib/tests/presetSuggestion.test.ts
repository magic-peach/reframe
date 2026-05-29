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

  it("falls back to landscape-16-9 for wide videos that don't closely match 16:9", () => {
    expect(suggestPreset(1440, 900)).toBe("landscape-16-9");  // 16:10
    expect(suggestPreset(1024, 768)).toBe("landscape-16-9");  // 4:3
    expect(suggestPreset(1280, 800)).toBe("landscape-16-9");  // 16:10
  });

  it("falls back to vertical-9-16 for tall videos that don't closely match 9:16", () => {
    expect(suggestPreset(900, 1440)).toBe("vertical-9-16");   // 10:16
    expect(suggestPreset(768, 1024)).toBe("vertical-9-16");   // 3:4
  });
});
