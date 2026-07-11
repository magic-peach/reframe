import { describe, it, expect } from "vitest";
import { buildPreviewAdjustmentFilter } from "../adjustmentFilters";

describe("buildPreviewAdjustmentFilter", () => {
  it("returns an empty string for neutral adjustments", () => {
    expect(buildPreviewAdjustmentFilter({ brightness: 0, contrast: 1, saturation: 1 })).toBe("");
  });

  it("maps brightness, contrast, and saturation to CSS filters", () => {
    expect(
      buildPreviewAdjustmentFilter({ brightness: 0.5, contrast: 1.2, saturation: 1.5 })
    ).toBe("brightness(1.500) contrast(1.200) saturate(1.500)");
  });

  it("clamps brightness and contrast to non-negative values", () => {
    expect(
      buildPreviewAdjustmentFilter({ brightness: -1, contrast: -2, saturation: 0.25 })
    ).toBe("brightness(0.000) contrast(0.000) saturate(0.250)");
  });
});
