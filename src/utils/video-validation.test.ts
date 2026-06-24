import { describe, expect, it } from "vitest";
import { MAX_4K_PIXELS, MAX_8K_PIXELS, getDownscaledDimensions, validateDimensions } from "./video-validation";

describe("video-validation", () => {
  it("uses the actual 8K UHD pixel cap", () => {
    expect(MAX_8K_PIXELS).toBe(7680 * 4320);
    expect(MAX_8K_PIXELS).toBeGreaterThan(MAX_4K_PIXELS);
  });

  it("blocks videos that exceed 8K UHD pixel count", () => {
    expect(validateDimensions(7680, 7680)).toBe("blocked");
  });

  it("keeps 8K UHD itself in the warning tier", () => {
    expect(validateDimensions(7680, 4320)).toBe("warning");
  });

  it("returns even downscaled dimensions", () => {
    const result = getDownscaledDimensions(7680, 7680);
    expect(result.width % 2).toBe(0);
    expect(result.height % 2).toBe(0);
  });
});