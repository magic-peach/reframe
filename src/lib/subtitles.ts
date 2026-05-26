export interface SubtitleItem {
  id: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  text: string;
}

/**
 * Parses an SRT subtitle file content string into an array of SubtitleItem objects.
 */
export function parseSRT(content: string): SubtitleItem[] {
  if (!content) return [];

  // Normalize line endings to LF
  const normalized = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Split by blank lines (double newlines or more)
  const blocks = normalized.trim().split(/\n\s*\n+/);

  const items: SubtitleItem[] = [];

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length < 2) continue;

    // A block usually looks like:
    // 1
    // 00:00:01,000 --> 00:00:04,000
    // Subtitle text here...
    let timestampLineIndex = 0;
    const firstLine = lines[0];
    if (firstLine && /^\d+$/.test(firstLine.trim())) {
      timestampLineIndex = 1;
    }

    const timestampLine = lines[timestampLineIndex];
    if (!timestampLine || !timestampLine.includes("-->")) continue;

    const parts = timestampLine.split("-->");
    if (parts.length !== 2) continue;

    const part0 = parts[0];
    const part1 = parts[1];
    if (!part0 || !part1) continue;

    const startTime = parseSRTTimestamp(part0.trim());
    const endTime = parseSRTTimestamp(part1.trim());

    if (startTime === null || endTime === null) continue;

    // Subtitle text is the remaining lines
    const textLines = lines.slice(timestampLineIndex + 1);
    const text = textLines.join("\n").trim();
    if (!text) continue;

    items.push({
      id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      startTime,
      endTime,
      text,
    });
  }

  // Sort by startTime to ensure chronological order
  return items.sort((a, b) => a.startTime - b.startTime);
}

/**
 * Parses a single SRT timestamp (HH:MM:SS,mmm or HH:MM:SS.mmm) into seconds.
 */
function parseSRTTimestamp(timestamp: string): number | null {
  const regex = /(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/;
  const match = timestamp.match(regex);
  if (!match) return null;

  const h = match[1];
  const m = match[2];
  const s = match[3];
  const ms = match[4];
  if (!h || !m || !s || !ms) return null;

  const hours = parseInt(h, 10);
  const minutes = parseInt(m, 10);
  const seconds = parseInt(s, 10);
  const milliseconds = parseInt(ms, 10);

  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}
