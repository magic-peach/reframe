import type { AutoReframePoint } from "@/lib/types";

export const MAX_FILTER_POINTS = 90;
const MAX_FILTER_EXPRESSION_LENGTH = 24000;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0.5;
  return Math.min(1, Math.max(0, value));
}

function formatNumber(value: number): string {
  return Number(value.toFixed(4)).toString();
}

function fn(name: string, args: string[]): string {
  return `${name}(${args.join("\\,")})`;
}

function downsample(points: AutoReframePoint[], maxPoints: number): AutoReframePoint[] {
  if (points.length <= maxPoints) return points;
  const step = (points.length - 1) / (maxPoints - 1);
  return Array.from({ length: maxPoints }, (_, index) => points[Math.round(index * step)]!).filter(Boolean);
}

export function normalizeAutoReframePoints(points: AutoReframePoint[], maxPoints = MAX_FILTER_POINTS): AutoReframePoint[] {
  const sorted = points
    .map((point) => ({
      time: Math.max(0, point.time),
      centerX: clamp01(point.centerX),
      confidence: Number.isFinite(point.confidence) ? Math.max(0, Math.min(1, point.confidence)) : 0,
    }))
    .sort((a, b) => a.time - b.time);

  const deduped: AutoReframePoint[] = [];
  for (const point of sorted) {
    const previous = deduped[deduped.length - 1];
    if (previous && Math.abs(previous.time - point.time) < 0.001) {
      deduped[deduped.length - 1] = point;
    } else {
      deduped.push(point);
    }
  }

  return downsample(deduped, Math.max(2, maxPoints));
}

export function buildAutoCropExpression(points: AutoReframePoint[], cropWidth: number): string {
  const safeCropWidth = Math.max(2, Math.round(cropWidth / 2) * 2);
  const usable = normalizeAutoReframePoints(points);

  if (usable.length < 2) {
    return `(iw-${safeCropWidth})/2`;
  }

  let expression = `(iw-${safeCropWidth})/2`;

  for (let index = usable.length - 2; index >= 0; index -= 1) {
    const current = usable[index]!;
    const next = usable[index + 1]!;
    const duration = Math.max(0.001, next.time - current.time);
    const start = formatNumber(current.time);
    const end = formatNumber(next.time);
    const from = formatNumber(current.centerX);
    const delta = formatNumber(next.centerX - current.centerX);
    const center = `(${from}+(${delta})*((t-${start})/${formatNumber(duration)}))`;
    const x = fn("max", ["0", fn("min", [`iw-${safeCropWidth}`, `${center}*iw-${safeCropWidth / 2}`])]);
    expression = fn("if", [fn("between", ["t", start, end]), x, expression]);
  }

  const last = usable[usable.length - 1]!;
  const lastX = fn("max", ["0", fn("min", [`iw-${safeCropWidth}`, `${formatNumber(last.centerX)}*iw-${safeCropWidth / 2}`])]);
  const finalExpression = fn("if", [fn("gte", ["t", formatNumber(last.time)]), lastX, expression]);

  if (finalExpression.length > MAX_FILTER_EXPRESSION_LENGTH) {
    return `(iw-${safeCropWidth})/2`;
  }

  return finalExpression;
}
