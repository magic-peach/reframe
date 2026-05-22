import { describe, expect, it } from "vitest";
import { DEFAULT_RECIPE } from "../constants";
import { formatFrameExportFilename, getFrameExportTransform } from "../frame-export";

describe("getFrameExportTransform", () => {
  it("uses the preset output size for built-in presets", () => {
    const result = getFrameExportTransform(
      {
        ...DEFAULT_RECIPE,
        preset: "landscape-16-9",
      },
      1920,
      1080
    );

    expect(result.width).toBe(1920);
    expect(result.height).toBe(1080);
    expect(result.scale).toBe(1);
    expect(result.rotation).toBe(0);
  });

  it("fits rotated source footage into a portrait canvas", () => {
    const result = getFrameExportTransform(
      {
        ...DEFAULT_RECIPE,
        preset: "vertical-9-16",
        framing: "fit",
        rotate: 90,
      },
      1920,
      1080
    );

    expect(result.width).toBe(1080);
    expect(result.height).toBe(1920);
    expect(result.scale).toBe(1);
    expect(result.rotation).toBeCloseTo(Math.PI / 2);
  });

  it("crops more aggressively in fill mode", () => {
    const result = getFrameExportTransform(
      {
        ...DEFAULT_RECIPE,
        preset: "vertical-9-16",
        framing: "fill",
        rotate: 0,
      },
      1920,
      1080
    );

    expect(result.scale).toBeCloseTo(1.7777777778);
  });

  it("uses custom dimensions when the custom preset is active", () => {
    const result = getFrameExportTransform(
      {
        ...DEFAULT_RECIPE,
        preset: "custom",
        customWidth: 640,
        customHeight: 360,
      },
      1280,
      720
    );

    expect(result.width).toBe(640);
    expect(result.height).toBe(360);
  });
});

describe("formatFrameExportFilename", () => {
  it("builds a stable timestamped filename", () => {
    expect(formatFrameExportFilename(new Date("2026-05-19T14:23:55"))).toBe(
      "reframe-frame-20260519-142355.png"
    );
  });
});