import { describe, expect, it } from "vitest";
import { canUseAutoReframe, getAutoReframeUnavailableReason, supportsAutoReframeRotation } from "./auto-reframe";

describe("auto reframe safety", () => {
  it("allows unrotated and 180 degree AI tracking", () => {
    expect(supportsAutoReframeRotation(0)).toBe(true);
    expect(supportsAutoReframeRotation(180)).toBe(true);
  });

  it("blocks 90 and 270 degree AI tracking", () => {
    expect(supportsAutoReframeRotation(90)).toBe(false);
    expect(supportsAutoReframeRotation(270)).toBe(false);
  });

  it("requires fill framing and supported rotation", () => {
    expect(canUseAutoReframe({ autoReframe: true, framing: "fill", rotate: 0 })).toBe(true);
    expect(canUseAutoReframe({ autoReframe: true, framing: "fit", rotate: 0 })).toBe(false);
    expect(canUseAutoReframe({ autoReframe: true, framing: "fill", rotate: 90 })).toBe(false);
    expect(getAutoReframeUnavailableReason({ framing: "fill", rotate: 90 })).toContain("90");
  });
});
