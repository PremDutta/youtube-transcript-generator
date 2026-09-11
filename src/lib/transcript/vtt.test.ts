import { describe, it, expect } from "vitest";
import { parseVtt } from "./vtt";

describe("parseVtt", () => {
  it("parses a simple cue", () => {
    const vtt = `WEBVTT

00:00:01.360 --> 00:00:03.040
Hello world`;
    expect(parseVtt(vtt)).toEqual([{ text: "Hello world", start: 1.36, duration: 1.68 }]);
  });

  it("parses hour-scale timestamps", () => {
    const vtt = `WEBVTT

01:02:03.000 --> 01:02:05.000
Later in the video`;
    const segments = parseVtt(vtt);
    expect(segments[0]!.start).toBe(3723);
    expect(segments[0]!.duration).toBe(2);
  });

  it("dedupes YouTube's word-by-word roll-up cues into one segment", () => {
    // Real shape from YouTube auto-captions: a word-by-word build (with
    // inline <00:00:00.000><c>word</c> tags), then the same line settled
    // as plain text a moment later.
    const vtt = `WEBVTT

00:00:18.640 --> 00:00:21.790 align:start position:0%
We're<00:00:19.039><c> no</c><00:00:19.359><c> strangers</c><00:00:19.840><c> to</c>

00:00:21.790 --> 00:00:21.800 align:start position:0%
We're no strangers to`;

    const segments = parseVtt(vtt);
    expect(segments).toHaveLength(1);
    expect(segments[0]!.text).toBe("We're no strangers to");
    expect(segments[0]!.start).toBe(18.64);
    // duration extends to cover both cues
    expect(segments[0]!.duration).toBeCloseTo(21.8 - 18.64, 5);
  });

  it("strips &nbsp; and collapses whitespace", () => {
    const vtt = `WEBVTT

00:00:00.000 --> 00:00:01.000
Hello&nbsp;&nbsp;world   foo`;
    expect(parseVtt(vtt)[0]!.text).toBe("Hello world foo");
  });

  it("skips cue blocks with no text", () => {
    const vtt = `WEBVTT

00:00:00.000 --> 00:00:01.000


00:00:01.000 --> 00:00:02.000
Real line`;
    const segments = parseVtt(vtt);
    expect(segments).toHaveLength(1);
    expect(segments[0]!.text).toBe("Real line");
  });

  it("returns an empty array for a header-only file", () => {
    expect(parseVtt("WEBVTT\n")).toEqual([]);
  });

  it("keeps two consecutive cues distinct when their text actually differs", () => {
    const vtt = `WEBVTT

00:00:00.000 --> 00:00:01.000
First line

00:00:01.000 --> 00:00:02.000
Second line`;
    const segments = parseVtt(vtt);
    expect(segments).toHaveLength(2);
    expect(segments.map((s) => s.text)).toEqual(["First line", "Second line"]);
  });
});
