import type { TrimSegment } from "./types";

let segIdCounter = 0;

/**
 * Generates a unique ID for a trim segment.
 */
export function generateSegmentId(): string {
  segIdCounter += 1;
  return `seg_${Date.now()}_${segIdCounter}`;
}

/**
 * Determines whether the recipe is using multi-segment trimming.
 * Returns true when there is at least 1 segment, meaning the advanced UI is active.
 */
export function hasMultiSegments(segments: TrimSegment[]): boolean {
  return segments.length > 0;
}

/**
 * Converts a list of "keep" segments into a list of "cut" regions.
 * Useful for rendering the dimmed/removed zones on the timeline.
 */
export function getCutRegions(
  segments: TrimSegment[],
  duration: number
): { start: number; end: number }[] {
  if (segments.length === 0) return [];

  const sorted = [...segments].sort((a, b) => a.start - b.start);
  const cuts: { start: number; end: number }[] = [];

  // Gap before first segment
  const first = sorted[0];
  if (first && first.start > 0) {
    cuts.push({ start: 0, end: first.start });
  }

  // Gaps between segments
  for (let i = 0; i < sorted.length - 1; i++) {
    const currentSeg = sorted[i];
    const nextSeg = sorted[i + 1];
    if (!currentSeg || !nextSeg) continue;
    const gapStart = currentSeg.end;
    const gapEnd = nextSeg.start;
    if (gapEnd > gapStart) {
      cuts.push({ start: gapStart, end: gapEnd });
    }
  }

  // Gap after last segment
  const last = sorted.at(-1);
  if (last && last.end < duration) {
    cuts.push({ start: last.end, end: duration });
  }

  return cuts;
}

/**
 * Builds the initial segments array from legacy trimStart/trimEnd values.
 * Called when upgrading a v1 recipe to v2.
 */
export function segmentsFromLegacyTrim(
  trimStart: number,
  trimEnd: number | null,
  duration: number
): TrimSegment[] {
  const start = Math.max(0, trimStart);
  const end = trimEnd === null ? duration : Math.min(trimEnd, duration);
  if (end <= start) return [];
  return [{ id: generateSegmentId(), start, end }];
}

/**
 * Adds a split point at a given time, dividing a segment into two.
 * Returns a new segments array without mutating the original.
 */
export function addSplitPoint(
  segments: TrimSegment[],
  splitTime: number
): TrimSegment[] {
  const sorted = [...segments].sort((a, b) => a.start - b.start);

  for (let i = 0; i < sorted.length; i++) {
    const seg = sorted[i];
    if (!seg) continue;
    // Reject if either resulting segment would be shorter than the minimum duration
    const minDuration = 0.1;
    if (splitTime > seg.start + minDuration && splitTime < seg.end - minDuration) {
      const left: TrimSegment = {
        id: seg.id,
        start: seg.start,
        end: splitTime,
      };
      const right: TrimSegment = {
        id: generateSegmentId(),
        start: splitTime,
        end: seg.end,
      };
      const newSegments = [...sorted];
      newSegments.splice(i, 1, left, right);
      return newSegments;
    }
  }

  return sorted;
}

/**
 * Merges a segment with the next adjacent segment, effectively removing the split point.
 */
export function mergeWithNextSegment(
  segments: TrimSegment[],
  segId: string
): TrimSegment[] {
  const sorted = [...segments].sort((a, b) => a.start - b.start);
  const idx = sorted.findIndex(s => s.id === segId);
  if (idx === -1 || idx === sorted.length - 1) return segments; // Cannot merge last segment

  const left = sorted[idx];
  const right = sorted[idx + 1];
  
  if (!left || !right) return segments;

  const merged: TrimSegment = {
    id: left.id,
    start: left.start,
    end: right.end
  };

  const newSegments = [...sorted];
  newSegments.splice(idx, 2, merged);
  return newSegments;
}

/**
 * Removes a segment by ID and returns the updated array.
 * The gap left by the removed segment becomes a "cut" zone.
 */
export function removeSegment(
  segments: TrimSegment[],
  segmentId: string
): TrimSegment[] {
  if (segments.length <= 1) return segments; // Must keep at least one segment
  return segments.filter((s) => s.id !== segmentId);
}

/**
 * Updates a segment's start or end time, clamping to valid bounds.
 * Prevents overlapping with adjacent segments.
 */
export function updateSegmentBound(
  segments: TrimSegment[],
  segmentId: string,
  field: "start" | "end",
  value: number,
  duration: number
): TrimSegment[] {
  const sorted = [...segments].sort((a, b) => a.start - b.start);
  const idx = sorted.findIndex((s) => s.id === segmentId);
  if (idx === -1) return sorted;

  const originalSeg = sorted[idx];
  if (!originalSeg) return sorted;

  const seg: TrimSegment = { ...originalSeg };
  const minDuration = 0.1;

  if (field === "start") {
    const prevSeg = sorted[idx - 1];
    const lowerBound = (idx > 0 && prevSeg) ? prevSeg.end : 0;
    seg.start = Math.max(lowerBound, Math.min(value, seg.end - minDuration));
  } else {
    const nextSeg = sorted[idx + 1];
    const upperBound = (idx < sorted.length - 1 && nextSeg) ? nextSeg.start : duration;
    seg.end = Math.min(upperBound, Math.max(value, seg.start + minDuration));
  }

  const result = [...sorted];
  result[idx] = seg;
  return result;
}

/**
 * Calculates the total output duration from all kept segments.
 */
export function totalSegmentsDuration(segments: TrimSegment[]): number {
  return segments.reduce((sum, seg) => sum + (seg.end - seg.start), 0);
}

/**
 * Validates that segments are well-formed for export.
 * Returns null if valid, or an error message string.
 */
export function validateSegments(
  segments: TrimSegment[],
  duration: number
): string | null {
  if (segments.length === 0) {
    return "At least one segment must be kept.";
  }

  for (const seg of segments) {
    if (seg.start < 0) {
      return "Segment start time cannot be negative.";
    }
    if (seg.end > duration + 0.01) {
      return `Segment end time cannot exceed the video duration (${Math.floor(duration)}s).`;
    }
  }

  const sorted = [...segments].sort((a, b) => a.start - b.start);
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    if (current && next && current.end > next.start) {
      return "Segments must not overlap.";
    }
  }

  if (totalSegmentsDuration(segments) <= 0) {
    return "Total output duration must be greater than 0.";
  }

  return null;
}
