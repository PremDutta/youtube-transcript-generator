import type { TranscriptSegment } from "@/lib/transcript/types";

function toSrtTimestamp(totalSeconds: number): string {
  const ms = Math.round(totalSeconds * 1000);
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")},${String(millis).padStart(3, "0")}`;
}

function toVttTimestamp(totalSeconds: number): string {
  return toSrtTimestamp(totalSeconds).replace(",", ".");
}

export function toSrt(segments: TranscriptSegment[]): string {
  return segments
    .map((s, i) => {
      const start = toSrtTimestamp(s.start);
      const end = toSrtTimestamp(s.start + s.duration);
      return `${i + 1}\n${start} --> ${end}\n${s.text}\n`;
    })
    .join("\n");
}

export function toVtt(segments: TranscriptSegment[]): string {
  const body = segments
    .map((s) => {
      const start = toVttTimestamp(s.start);
      const end = toVttTimestamp(s.start + s.duration);
      return `${start} --> ${end}\n${s.text}\n`;
    })
    .join("\n");
  return `WEBVTT\n\n${body}`;
}

export function toPlainText(segments: TranscriptSegment[]): string {
  return segments.map((s) => s.text).join(" ");
}
