import { describe, expect, it } from "vitest";
import { DEFAULT_RECIPE } from "../constants";
import { buildPreviewEffects } from "../previewEffects";

describe("buildPreviewEffects", () => {
  it("returns no inline effects for neutral adjustments", () => {
    expect(buildPreviewEffects(DEFAULT_RECIPE)).toEqual({});
  });

  it("builds transform and filter styles for previewable adjustments", () => {
    const styles = buildPreviewEffects({
      ...DEFAULT_RECIPE,
      rotate: 90,
      brightness: 0.25,
      contrast: 1.5,
      saturation: 1.2,
    });

    expect(styles.transform).toBe("rotate(90deg)");
    expect(styles.filter).toBe("brightness(1.25) contrast(1.5) saturate(1.2)");
  });
});
