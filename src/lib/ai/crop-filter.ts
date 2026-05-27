import type { AutoReframePoint } from "@/lib/types";

const MAX_FILTER_POINTS = 120;

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

export function buildAutoCropExpression(points: AutoReframePoint[], cropWidth: number): string {
  const usable = downsample(points, MAX_FILTER_POINTS)
    .map((point) => ({
      time: Math.max(0, point.time),
      centerX: clamp01(point.centerX),
    }))
    .sort((a, b) => a.time - b.time);

  if (usable.length < 2) {
    return `(iw-${cropWidth})/2`;
  }

  let expression = `(iw-${cropWidth})/2`;

  for (let index = usable.length - 2; index >= 0; index -= 1) {
    const current = usable[index]!;
    const next = usable[index + 1]!;
    const duration = Math.max(0.001, next.time - current.time);
    const start = formatNumber(current.time);
    const end = formatNumber(next.time);
    const from = formatNumber(current.centerX);
    const delta = formatNumber(next.centerX - current.centerX);
    const center = `(${from}+(${delta})*((t-${start})/${formatNumber(duration)}))`;
    const x = fn("max", ["0", fn("min", [`iw-${cropWidth}`, `${center}*iw-${cropWidth / 2}`])]);
    expression = fn("if", [fn("between", ["t", start, end]), x, expression]);
  }

  const last = usable[usable.length - 1]!;
  const lastX = fn("max", ["0", fn("min", [`iw-${cropWidth}`, `${formatNumber(last.centerX)}*iw-${cropWidth / 2}`])]);
  return fn("if", [fn("gte", ["t", formatNumber(last.time)]), lastX, expression]);
}
