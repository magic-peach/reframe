import { describe, it, expect } from "vitest";
import {
  colorFilterString,
  fitContain,
  frameScale,
  rotatedSize,
  rotationRadians,
} from "../previewGeometry";

describe("rotatedSize", () => {
  it("leaves dimensions unchanged for 0 and 180", () => {
    expect(rotatedSize(1920, 1080, 0)).toEqual({ width: 1920, height: 1080 });
    expect(rotatedSize(1920, 1080, 180)).toEqual({ width: 1920, height: 1080 });
  });

  it("swaps axes for 90 and 270", () => {
    expect(rotatedSize(1920, 1080, 90)).toEqual({ width: 1080, height: 1920 });
    expect(rotatedSize(1920, 1080, 270)).toEqual({ width: 1080, height: 1920 });
  });
});

describe("rotationRadians", () => {
  it("converts degrees to radians (clockwise)", () => {
    expect(rotationRadians(0)).toBe(0);
    expect(rotationRadians(90)).toBeCloseTo(Math.PI / 2);
    expect(rotationRadians(180)).toBeCloseTo(Math.PI);
    expect(rotationRadians(270)).toBeCloseTo((3 * Math.PI) / 2);
  });
});

describe("fitContain", () => {
  it("pillarboxes a wide target inside a square container (full width)", () => {
    // 2:1 target in a 100x100 box → width 100, height 50.
    expect(fitContain(100, 100, 2, 1)).toEqual({ width: 100, height: 50 });
  });

  it("letterboxes a tall target inside a wide container (full height)", () => {
    // 1:2 target in a 160x90 box → height 90, width 45.
    expect(fitContain(160, 90, 1, 2)).toEqual({ width: 45, height: 90 });
  });

  it("returns the container when aspect ratios match", () => {
    expect(fitContain(160, 90, 16, 9)).toEqual({ width: 160, height: 90 });
  });

  it("guards against zero/negative inputs", () => {
    expect(fitContain(0, 100, 16, 9)).toEqual({ width: 0, height: 0 });
    expect(fitContain(100, 100, 0, 9)).toEqual({ width: 0, height: 0 });
  });
});

describe("frameScale", () => {
  it("fit shrinks to the smaller axis (letterbox)", () => {
    // 200x100 source into 100x100 output → min(0.5, 1) = 0.5.
    expect(frameScale(200, 100, 100, 100, "fit")).toBe(0.5);
  });

  it("fill grows to the larger axis (crop)", () => {
    // 200x100 source into 100x100 output → max(0.5, 1) = 1.
    expect(frameScale(200, 100, 100, 100, "fill")).toBe(1);
  });

  it("returns 0 for a degenerate source", () => {
    expect(frameScale(0, 100, 100, 100, "fit")).toBe(0);
  });
});

describe("colorFilterString", () => {
  it("returns 'none' at default values", () => {
    expect(colorFilterString(0, 1, 1)).toBe("none");
  });

  it("maps additive brightness to a CSS multiplier (1 + b)", () => {
    expect(colorFilterString(0.5, 1, 1)).toBe("brightness(1.500)");
    expect(colorFilterString(-0.5, 1, 1)).toBe("brightness(0.500)");
  });

  it("passes contrast and saturation through unchanged", () => {
    expect(colorFilterString(0, 1.4, 1)).toBe("contrast(1.400)");
    expect(colorFilterString(0, 1, 2)).toBe("saturate(2.000)");
  });

  it("combines all active channels in order", () => {
    expect(colorFilterString(0.2, 1.3, 0.8)).toBe(
      "brightness(1.200) contrast(1.300) saturate(0.800)"
    );
  });
});
