import { describe, it, expect } from "vitest";
import { toSrt, toVtt, toPlainText } from "./export";
import type { TranscriptSegment } from "./transcript/types";

const segments: TranscriptSegment[] = [
  { text: "Hello world", start: 0, duration: 1.5 },
  { text: "Second line", start: 1.5, duration: 2 },
];

describe("toPlainText", () => {
  it("joins segment text with spaces", () => {
    expect(toPlainText(segments)).toBe("Hello world Second line");
  });

  it("returns an empty string for no segments", () => {
    expect(toPlainText([])).toBe("");
  });
});

describe("toSrt", () => {
  it("numbers cues sequentially starting at 1", () => {
    const srt = toSrt(segments);
    expect(srt).toContain("1\n00:00:00,000 --> 00:00:01,500\nHello world");
    expect(srt).toContain("2\n00:00:01,500 --> 00:00:03,500\nSecond line");
  });

  it("formats an hour-scale timestamp correctly", () => {
    const srt = toSrt([{ text: "late", start: 3661, duration: 1 }]);
    expect(srt).toContain("01:01:01,000 --> 01:01:02,000");
  });
});

describe("toVtt", () => {
  it("starts with the WEBVTT header", () => {
    expect(toVtt(segments).startsWith("WEBVTT\n\n")).toBe(true);
  });

  it("uses '.' instead of ',' as the millisecond separator", () => {
    const vtt = toVtt(segments);
    expect(vtt).toContain("00:00:00.000 --> 00:00:01.500");
    expect(vtt).not.toContain(",");
  });
});
