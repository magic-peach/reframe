import { describe, expect, it } from "vitest";
import { buildAutoCropExpression } from "./crop-filter";

describe("buildAutoCropExpression", () => {
  it("returns a centered crop when tracking data is sparse", () => {
    expect(buildAutoCropExpression([], 1080)).toBe("(iw-1080)/2");
  });

  it("builds an escaped timeline expression for FFmpeg filtergraphs", () => {
    const expression = buildAutoCropExpression([
      { time: 0, centerX: 0.25, confidence: 0.8 },
      { time: 1, centerX: 0.75, confidence: 0.8 },
    ], 1080);

    expect(expression).toContain("if(");
    expect(expression).toContain("between(t\\,0\\,1)");
    expect(expression).toContain("max(0\\,min(iw-1080");
    expect(expression).not.toContain("between(t,");
  });
});

