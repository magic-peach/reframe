import { describe, it, expect } from "vitest";
import { buildVideoFilter } from "../ffmpeg";
import { buildArguments } from "../video-filters";
import { DEFAULT_RECIPE } from "../constants";

const base = (overrides = {}) => ({ ...DEFAULT_RECIPE, ...overrides });

describe("buildVideoFilter", () => {

  it("should include trim filter when trimStart > 0", () => {
    const result = buildVideoFilter(base({ trimStart: 5 }), 1280, 720);
    expect(result).toContain("trim=start=5");
    expect(result).toContain("setpts=PTS-STARTPTS");
  });

  it("should include trim filter when trimEnd is set", () => {
    const result = buildVideoFilter(base({ trimEnd: 10 }), 1280, 720);
    expect(result).toContain("trim=start=0:end=10");
  });

  it("should not include trim filter when trimStart is 0 and trimEnd is null", () => {
    const result = buildVideoFilter(base({ trimStart: 0, trimEnd: null }), 1280, 720);
    expect(result).not.toContain("trim=");
  });

  it("should include transpose=1 for 90 degree rotation", () => {
    const result = buildVideoFilter(base({ rotate: 90 }), 1280, 720);
    expect(result).toContain("transpose=1");
  });

  it("should include double transpose for 180 degree rotation", () => {
    const result = buildVideoFilter(base({ rotate: 180 }), 1280, 720);
    expect(result).toContain("transpose=1,transpose=1");
  });

  it("should include transpose=2 for 270 degree rotation", () => {
    const result = buildVideoFilter(base({ rotate: 270 }), 1280, 720);
    expect(result).toContain("transpose=2");
  });

  it("should not include transpose for rotation=0", () => {
    const result = buildVideoFilter(base({ rotate: 0 }), 1280, 720);
    expect(result).not.toContain("transpose");
  });

  it("should include setpts filter for speed !== 1", () => {
    const result = buildVideoFilter(base({ speed: 2 }), 1280, 720);
    expect(result).toContain("setpts=0.5000*PTS");
  });

  it("should not include setpts filter for speed=1", () => {
    const result = buildVideoFilter(base({ speed: 1 }), 1280, 720);
    expect(result).not.toContain("setpts=0");
  });

  it("should use fit framing with scale and pad", () => {
    const result = buildVideoFilter(base({ framing: "fit" }), 1280, 720);
    expect(result).toContain("force_original_aspect_ratio=decrease");
    expect(result).toContain("pad=1280:720");
  });

  it("should use fill framing with scale and crop", () => {
    const result = buildVideoFilter(base({ framing: "fill" }), 1280, 720);
    expect(result).toContain("force_original_aspect_ratio=increase");
    expect(result).toContain("crop=1280:720");
  });

  it("should include deshake when stabilization is true", () => {
    const result = buildVideoFilter(base({ stabilization: true }), 1280, 720);
    expect(result).toContain("deshake");
  });

  it("should not include deshake when stabilization is false", () => {
    const result = buildVideoFilter(base({ stabilization: false }), 1280, 720);
    expect(result).not.toContain("deshake");
  });

  it("should include eq filter with brightness, contrast, saturation", () => {
    const result = buildVideoFilter(base({ brightness: 0.5, contrast: 1.2, saturation: 1.5 }), 1280, 720);
    expect(result).toContain("eq=brightness=0.5:contrast=1.2:saturation=1.5");
  });

  it("should skip eq filter when adjustments are neutral", () => {
    const result = buildVideoFilter(base({ brightness: 0, contrast: 1, saturation: 1 }), 1280, 720);
    expect(result).not.toContain("eq=");
  });

  it("should handle trim + speed + rotate all at once", () => {
    const result = buildVideoFilter(base({ trimStart: 2, trimEnd: 8, speed: 2, rotate: 90 }), 1280, 720);
    expect(result).toContain("trim=start=2:end=8");
    expect(result).toContain("transpose=1");
    expect(result).toContain("setpts=0.5000*PTS");
  });
});

describe("buildArguments — overlay positioning", () => {
  const recipe = base();

  const callArgs = (pos: string) =>
    buildArguments(
      recipe, "mp4", "out.mp4", "in.mp4", 1920, 1080,
      false, "", undefined,
      true, "overlay.png",
      { file: null, size: 150, opacity: 100, position: pos as any },
      false, 60
    );

  const joinArgs = (args: string[]) => args.join(" ");

  it("top-right uses main_w-w-20:20", () => {
    const args = callArgs("top-right");
    expect(joinArgs(args)).toContain("main_w-w-20:20");
    expect(joinArgs(args)).not.toContain("W-w-20");
  });

  it("bottom-left uses 20:main_h-h-20", () => {
    const args = callArgs("bottom-left");
    expect(joinArgs(args)).toContain("20:main_h-h-20");
    expect(joinArgs(args)).not.toContain("H-h-20");
  });

  it("bottom-right uses main_w-w-20:main_h-h-20", () => {
    const args = callArgs("bottom-right");
    expect(joinArgs(args)).toContain("main_w-w-20:main_h-h-20");
    expect(joinArgs(args)).not.toContain("W-w-20:H-h-20");
  });

  it("top-left uses 20:20", () => {
    const args = callArgs("top-left");
    expect(joinArgs(args)).toContain("overlay=20:20");
  });

  it("default fallback uses main_w/main_h", () => {
    const args = callArgs("invalid-position" as any);
    expect(joinArgs(args)).toContain("main_w-w-20:main_h-h-20");
    expect(joinArgs(args)).not.toContain(":W-");
  });
});
