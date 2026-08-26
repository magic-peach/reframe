import { describe, expect, it } from "vitest";
import { clampCustomDimension, getLockedCustomDimensions } from "../customDimensions";

describe("customDimensions", () => {
  it("clamps custom dimensions into the supported export range", () => {
    expect(clampCustomDimension(8)).toBe(16);
    expect(clampCustomDimension(9000)).toBe(7680);
    expect(clampCustomDimension(1920)).toBe(1920);
  });

  it("keeps width and height in sync when locking from width", () => {
    expect(getLockedCustomDimensions("width", 1280, 16 / 9, 1920, 1080)).toEqual({
      customWidth: 1280,
      customHeight: 720,
    });
  });

  it("keeps width and height in sync when locking from height", () => {
    expect(getLockedCustomDimensions("height", 720, 16 / 9, 1920, 1080)).toEqual({
      customWidth: 1280,
      customHeight: 720,
    });
  });
});
