import { describe, expect, it } from "vitest";
import { MAX_FILTER_POINTS, buildAutoCropExpression, normalizeAutoReframePoints } from "./crop-filter";

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

  it("clamps, sorts, deduplicates, and caps tracking points", () => {
    const points = Array.from({ length: MAX_FILTER_POINTS + 40 }, (_, index) => ({
      time: index % 2 === 0 ? index / 3 : -index,
      centerX: index % 3 === 0 ? 2 : -1,
      confidence: Number.NaN,
    }));

    const normalized = normalizeAutoReframePoints(points);

    expect(normalized.length).toBeLessThanOrEqual(MAX_FILTER_POINTS);
    expect(normalized.every((point) => point.time >= 0)).toBe(true);
    expect(normalized.every((point) => point.centerX >= 0 && point.centerX <= 1)).toBe(true);
    expect(normalized.every((point, index) => index === 0 || point.time >= normalized[index - 1]!.time)).toBe(true);
  });

  it("keeps long FFmpeg crop expressions bounded", () => {
    const expression = buildAutoCropExpression(
      Array.from({ length: 1000 }, (_, index) => ({
        time: index / 3,
        centerX: index % 2 === 0 ? 0.2 : 0.8,
        confidence: 0.9,
      })),
      1080
    );

    expect(expression.length).toBeLessThan(24000);
    expect(expression).not.toContain("NaN");
    expect(expression).not.toContain("Infinity");
  });
});
