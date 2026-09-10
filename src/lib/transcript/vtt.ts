import type { TranscriptSegment } from "./types";

function parseTimestamp(raw: string): number {
  const parts = raw.trim().split(":").map(Number);
  if (parts.length === 3) {
    const [h = 0, m = 0, s = 0] = parts;
    return h * 3600 + m * 60 + s;
  }
  const [m = 0, s = 0] = parts;
  return m * 60 + s;
}

function stripMarkup(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * YouTube's auto-generated VTT renders each line twice: once as a
 * word-by-word "roll-up" build (with inline <00:00:00.000><c>word</c>
 * tags) and once as the settled plain-text cue. Stripping tags collapses
 * both into identical text, so consecutive duplicates are merged into a
 * single segment spanning both cues' time range.
 */
export function parseVtt(content: string): TranscriptSegment[] {
  const blocks = content.replace(/\r/g, "").split(/\n\n+/);
  const segments: TranscriptSegment[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").filter(Boolean);
    const timeLineIndex = lines.findIndex((l) => l.includes("-->"));
    if (timeLineIndex === -1) continue;

    const [startRaw, endRaw] = lines[timeLineIndex]!.split("-->") as [string, string];
    const start = parseTimestamp(startRaw);
    const end = parseTimestamp(endRaw.trim().split(" ")[0] ?? "0");
    const text = stripMarkup(lines.slice(timeLineIndex + 1).join(" "));
    if (!text) continue;

    const previous = segments[segments.length - 1];
    if (previous && previous.text === text) {
      previous.duration = end - previous.start;
      continue;
    }

    segments.push({ text, start, duration: end - start });
  }

  return segments;
}
