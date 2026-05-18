import { describe, it, expect } from "vitest";
import { buildAudioFilter } from "../ffmpeg";

describe("buildAudioFilter", () => {
  it("should return an empty string for 1.0x speed", () => {
    expect(buildAudioFilter(1)).toBe("");
  });

  it("should chain two 0.5x filters for 0.25x speed", () => {
    expect(buildAudioFilter(0.25)).toBe("atempo=0.5,atempo=0.5");
  });

  it("should chain two 2.0x filters for 4.0x speed", () => {
    expect(buildAudioFilter(4)).toBe("atempo=2.0,atempo=2");
  });

  it("should chain multiple 0.5x filters and a remainder for 0.1x speed", () => {
    // 0.1 / 0.5 = 0.2
    // 0.2 / 0.5 = 0.4
    // 0.4 / 0.5 = 0.8
    // Result should be three 0.5s and one 0.8
    expect(buildAudioFilter(0.1)).toBe("atempo=0.5,atempo=0.5,atempo=0.5,atempo=0.8");
  });

  it("should chain multiple 2.0x filters and a remainder for 3.0x speed", () => {
    // 3.0 / 2.0 = 1.5
    expect(buildAudioFilter(3)).toBe("atempo=2.0,atempo=1.5");
  });

  it("should handle boundary values inside the 0.5x-2.0x range without chaining", () => {
    expect(buildAudioFilter(0.5)).toBe("atempo=0.5");
    expect(buildAudioFilter(2.0)).toBe("atempo=2"); // Note: Number(2.0.toFixed(4)) -> 2
    expect(buildAudioFilter(1.5)).toBe("atempo=1.5");
    expect(buildAudioFilter(0.75)).toBe("atempo=0.75");
  });

  it("should chain properly for very large speeds", () => {
    // 10 / 2.0 = 5
    // 5 / 2.0 = 2.5
    // 2.5 / 2.0 = 1.25
    expect(buildAudioFilter(10)).toBe("atempo=2.0,atempo=2.0,atempo=2.0,atempo=1.25");
  });
});
