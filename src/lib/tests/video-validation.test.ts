import { describe, it, expect } from "vitest";
import {
  getDownscaledDimensions,
  MAX_4K_HEIGHT,
  MAX_4K_WIDTH,
  MAX_8K_HEIGHT,
  MAX_8K_WIDTH,
  validateDimensions,
} from "@/utils/video-validation";

describe("video-validation", () => {
  it("treats standard 4K and under as safe", () => {
    expect(validateDimensions(3840, 2160)).toBe("safe");
    expect(validateDimensions(1920, 1080)).toBe("safe");
  });

  it("warns on dimensions that exceed 4K but stay within 8K", () => {
    expect(validateDimensions(MAX_4K_WIDTH + 1, 2160)).toBe("warning");
    expect(validateDimensions(3840, MAX_4K_HEIGHT + 1)).toBe("warning");
  });

  it("blocks dimensions that exceed the 8K width or height cap", () => {
    expect(validateDimensions(MAX_8K_WIDTH + 1, 2160)).toBe("blocked");
    expect(validateDimensions(3840, MAX_8K_HEIGHT + 1)).toBe("blocked");
    expect(validateDimensions(9000, 3000)).toBe("blocked");
    expect(validateDimensions(3000, 9000)).toBe("blocked");
  });

  it("downscales blocked videos to fit within 4K bounds", () => {
    const downscaled = getDownscaledDimensions(9000, 4000);

    expect(downscaled.width).toBeLessThanOrEqual(MAX_4K_WIDTH);
    expect(downscaled.height).toBeLessThanOrEqual(MAX_4K_HEIGHT);
    expect(downscaled.width % 2).toBe(0);
    expect(downscaled.height % 2).toBe(0);
  });

  it("exposes pixel caps derived from real 4K and 8K frame dimensions", () => {
    expect(MAX_4K_WIDTH * MAX_4K_HEIGHT).toBe(3840 * 2160);
    expect(MAX_8K_WIDTH * MAX_8K_HEIGHT).toBe(7680 * 4320);
  });
});
