import { describe, it, expect } from "vitest";
import { buildJumpCutFilterComplex } from "../../lib/ffmpeg";
import { DEFAULT_RECIPE } from "../../lib/constants";

const base = (overrides = {}) => ({ ...DEFAULT_RECIPE, ...overrides });

describe("buildJumpCutFilterComplex", () => {

  it("returns empty filterComplex when no segments are provided", () => {
    const { filterComplex } = buildJumpCutFilterComplex(
      base({ jumpCutSegments: [] }),
      1280, 720, false
    );
    expect(filterComplex).toBe("");
  });

  it("returns empty filterComplex when jumpCutSegments is undefined", () => {
    const { filterComplex } = buildJumpCutFilterComplex(
      base(),
      1280, 720, false
    );
    expect(filterComplex).toBe("");
  });

  it("trims each segment with its own atrim/trim bounds", () => {
    const recipe = base({
      jumpCutSegments: [
        { start: 0, end: 3 },
        { start: 7, end: 12 },
      ],
    });
    const { filterComplex } = buildJumpCutFilterComplex(recipe, 1280, 720, false);
    expect(filterComplex).toContain("trim=start=0:end=3");
    expect(filterComplex).toContain("trim=start=7:end=12");
  });

  it("each segment resets timestamps with setpts=PTS-STARTPTS", () => {
    const recipe = base({
      jumpCutSegments: [{ start: 2, end: 5 }],
    });
    const { filterComplex } = buildJumpCutFilterComplex(recipe, 1280, 720, false);
    expect(filterComplex).toContain("setpts=PTS-STARTPTS");
  });

  it("uses concat filter with correct n= count — 2 segments", () => {
    const recipe = base({
      jumpCutSegments: [
        { start: 0, end: 2 },
        { start: 5, end: 8 },
      ],
    });
    const { filterComplex } = buildJumpCutFilterComplex(recipe, 1280, 720, false);
    expect(filterComplex).toContain("concat=n=2:v=1:a=0");
  });

  it("uses concat filter with correct n= count — 3 segments", () => {
    const recipe = base({
      jumpCutSegments: [
        { start: 0, end: 2 },
        { start: 5, end: 8 },
        { start: 10, end: 14 },
      ],
    });
    const { filterComplex } = buildJumpCutFilterComplex(recipe, 1280, 720, false);
    expect(filterComplex).toContain("concat=n=3:v=1:a=0");
  });

  it("includes a=1 in concat when hasAudio is true", () => {
    const recipe = base({
      jumpCutSegments: [{ start: 0, end: 3 }, { start: 6, end: 10 }],
    });
    const { filterComplex } = buildJumpCutFilterComplex(recipe, 1280, 720, true);
    expect(filterComplex).toContain("concat=n=2:v=1:a=1");
  });

  it("includes atrim for each audio segment when hasAudio is true", () => {
    const recipe = base({
      jumpCutSegments: [
        { start: 1, end: 4 },
        { start: 8, end: 11 },
      ],
    });
    const { filterComplex } = buildJumpCutFilterComplex(recipe, 1280, 720, true);
    expect(filterComplex).toContain("atrim=start=1:end=4");
    expect(filterComplex).toContain("atrim=start=8:end=11");
  });

  it("does NOT include atrim when hasAudio is false", () => {
    const recipe = base({
      jumpCutSegments: [{ start: 0, end: 5 }],
    });
    const { filterComplex } = buildJumpCutFilterComplex(recipe, 1280, 720, false);
    expect(filterComplex).not.toContain("atrim");
  });

  it("applies speed (atempo) to each audio segment", () => {
    const recipe = base({
      jumpCutSegments: [{ start: 0, end: 5 }],
      speed: 1.5,
    });
    const { filterComplex } = buildJumpCutFilterComplex(recipe, 1280, 720, true);
    expect(filterComplex).toContain("atempo=1.5000");
  });

  it("output labels are [vout] and [aout] with audio", () => {
    const recipe = base({
      jumpCutSegments: [{ start: 0, end: 3 }],
    });
    const { videoOut, audioOut } = buildJumpCutFilterComplex(recipe, 1280, 720, true);
    expect(videoOut).toBe("[vout]");
    expect(audioOut).toBe("[aout]");
  });

  it("audioOut is empty string when hasAudio is false", () => {
    const recipe = base({
      jumpCutSegments: [{ start: 0, end: 3 }],
    });
    const { audioOut } = buildJumpCutFilterComplex(recipe, 1280, 720, false);
    expect(audioOut).toBe("");
  });

  it("applies rotation to each segment", () => {
    const recipe = base({
      jumpCutSegments: [{ start: 0, end: 5 }],
      rotate: 90,
    });
    const { filterComplex } = buildJumpCutFilterComplex(recipe, 1280, 720, false);
    expect(filterComplex).toContain("transpose=1");
  });

  it("applies eq filter to each segment when color adjustments are non-neutral", () => {
    const recipe = base({
      jumpCutSegments: [{ start: 0, end: 5 }],
      brightness: 0.2,
      contrast: 1.1,
      saturation: 0.9,
    });
    const { filterComplex } = buildJumpCutFilterComplex(recipe, 1280, 720, false);
    expect(filterComplex).toContain("eq=brightness=0.2:contrast=1.1:saturation=0.9");
  });

  it("applies fit framing (scale+pad) to each segment", () => {
    const recipe = base({
      jumpCutSegments: [{ start: 0, end: 5 }],
      framing: "fit",
    });
    const { filterComplex } = buildJumpCutFilterComplex(recipe, 1280, 720, false);
    expect(filterComplex).toContain("force_original_aspect_ratio=decrease");
    expect(filterComplex).toContain("pad=1280:720");
  });

  it("applies fill framing (scale+crop) to each segment", () => {
    const recipe = base({
      jumpCutSegments: [{ start: 0, end: 5 }],
      framing: "fill",
    });
    const { filterComplex } = buildJumpCutFilterComplex(recipe, 1280, 720, false);
    expect(filterComplex).toContain("force_original_aspect_ratio=increase");
    expect(filterComplex).toContain("crop=1280:720");
  });
});