import { describe, expect, it } from "vitest";
import { createDefaultTextOverlay, buildTextFilter, isTextOverlayActive } from "../text-overlay";

describe("text overlay timing", () => {
  it("defaults overlays to the full timeline", () => {
    const overlay = createDefaultTextOverlay();
    expect(overlay.startTime).toBe(0);
    expect(overlay.endTime).toBeNull();
    expect(isTextOverlayActive(overlay, 0)).toBe(true);
    expect(isTextOverlayActive(overlay, 999)).toBe(true);
  });

  it("limits overlay visibility to the configured time window", () => {
    const overlay = {
      ...createDefaultTextOverlay(),
      startTime: 5,
      endTime: 10,
    };

    expect(isTextOverlayActive(overlay, 4.9)).toBe(false);
    expect(isTextOverlayActive(overlay, 5)).toBe(true);
    expect(isTextOverlayActive(overlay, 10)).toBe(true);
    expect(isTextOverlayActive(overlay, 10.1)).toBe(false);
  });

  it("emits an FFmpeg enable expression for time-limited overlays", () => {
    const result = buildTextFilter(
      {
        ...createDefaultTextOverlay(),
        text: "Hello",
        startTime: 2,
        endTime: 4,
      },
      1920,
      1080
    );

    expect(result).toContain("enable='between(t,2.000,4.000)'");
  });
});
