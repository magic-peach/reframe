import { describe, it, expect } from "vitest";
import { buildAudioFilter, buildVideoFilter } from "../ffmpeg";
import { DEFAULT_RECIPE } from "../types";

describe("buildAudioFilter", () => {
  it("should return an empty string for 1.0x speed", () => {
    expect(buildAudioFilter(1, false)).toBe("");
  });

  it("should chain two 0.5x filters for 0.25x speed", () => {
    expect(buildAudioFilter(0.25, false)).toBe("atempo=0.5,atempo=0.5");
  });

  it("should chain two 2.0x filters for 4.0x speed", () => {
    expect(buildAudioFilter(4, false)).toBe("atempo=2.0,atempo=2");
  });

  it("should chain multiple 0.5x filters and a remainder for 0.1x speed", () => {
    // 0.1 / 0.5 = 0.2
    // 0.2 / 0.5 = 0.4
    // 0.4 / 0.5 = 0.8
    // Result should be three 0.5s and one 0.8
    expect(buildAudioFilter(0.1, false)).toBe("atempo=0.5,atempo=0.5,atempo=0.5,atempo=0.8");
  });

  it("should chain multiple 2.0x filters and a remainder for 3.0x speed", () => {
    // 3.0 / 2.0 = 1.5
    expect(buildAudioFilter(3, false)).toBe("atempo=2.0,atempo=1.5");
  });

  it("should handle boundary values inside the 0.5x-2.0x range without chaining", () => {
    expect(buildAudioFilter(0.5, false)).toBe("atempo=0.5");
    expect(buildAudioFilter(2.0, false)).toBe("atempo=2"); // Note: Number(2.0.toFixed(4)) -> 2
    expect(buildAudioFilter(1.5, false)).toBe("atempo=1.5");
    expect(buildAudioFilter(0.75, false)).toBe("atempo=0.75");
  });

  it("should chain properly for very large speeds", () => {
    // 10 / 2.0 = 5
    // 5 / 2.0 = 2.5
    // 2.5 / 2.0 = 1.25
    expect(buildAudioFilter(10, false)).toBe("atempo=2.0,atempo=2.0,atempo=2.0,atempo=1.25");
  });

  it("should append loudnorm filter when normalizeAudio is true", () => {
    const result = buildAudioFilter(1, true);
    expect(result).toContain("loudnorm");
  });
});

describe("buildVideoFilter", () => {
  it("should generate standard letterbox filters when blurBackground is false", () => {
    const recipe = {
      ...DEFAULT_RECIPE,
      framing: "fit" as const,
      blurBackground: false,
    };
    const filter = buildVideoFilter(recipe, 1080, 1920);
    expect(filter).toContain("scale=1080:1920:force_original_aspect_ratio=decrease");
    expect(filter).toContain("pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black");
  });

  it("should generate complex split and blur filters when blurBackground is true", () => {
    const recipe = {
      ...DEFAULT_RECIPE,
      framing: "fit" as const,
      blurBackground: true,
    };
    const filter = buildVideoFilter(recipe, 1080, 1920);
    expect(filter).toContain("split=2[blur][main]");
    expect(filter).toContain("scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=20:20[bg]");
    expect(filter).toContain("scale=1080:1920:force_original_aspect_ratio=decrease[fg]");
    expect(filter).toContain("[bg][fg]overlay=(W-w)/2:(H-h)/2");
  });

  it("should generate crop filters when framing is fill", () => {
    const recipe = {
      ...DEFAULT_RECIPE,
      framing: "fill" as const,
    };
    const filter = buildVideoFilter(recipe, 1080, 1920);
    expect(filter).toContain("scale=1080:1920:force_original_aspect_ratio=increase");
    expect(filter).toContain("crop=1080:1920");
  });
});

