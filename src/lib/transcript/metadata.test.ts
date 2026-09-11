import { describe, it, expect } from "vitest";
import { resolveCaptionLanguage, type VideoMetadata } from "./metadata";

function meta(partial: Partial<VideoMetadata>): VideoMetadata {
  return { title: null, language: null, subtitleLangs: [], autoCaptionLangs: [], ...partial };
}

describe("resolveCaptionLanguage", () => {
  it("prefers real manual subtitles over anything auto-generated", () => {
    const m = meta({ subtitleLangs: ["fr"], autoCaptionLangs: ["en"], language: "en" });
    expect(resolveCaptionLanguage(m)).toBe("fr");
  });

  it("returns null when there are no captions at all", () => {
    expect(resolveCaptionLanguage(meta({}))).toBeNull();
  });

  it("prefers the detected language's -orig track when present", () => {
    // Real case: a Hindi video where the full translation matrix makes
    // every language code (including "en") ambiguous — "hi-orig" is the
    // one genuinely untranslated track.
    const autoCaptionLangs = ["ab", "en", "hi", "hi-orig", "fr", "es"];
    const m = meta({ language: "hi", autoCaptionLangs });
    expect(resolveCaptionLanguage(m)).toBe("hi-orig");
  });

  it("falls back to the plain detected-language key when no -orig variant exists", () => {
    const m = meta({ language: "ta", autoCaptionLangs: ["ta"] });
    expect(resolveCaptionLanguage(m)).toBe("ta");
  });

  it("uses any -orig key when the detected language doesn't match one", () => {
    const m = meta({ language: null, autoCaptionLangs: ["en", "fr-orig", "es"] });
    expect(resolveCaptionLanguage(m)).toBe("fr-orig");
  });

  it("picks the single non-hyphenated key for a small caption set with no other signal", () => {
    const m = meta({ language: null, autoCaptionLangs: ["ta"] });
    expect(resolveCaptionLanguage(m)).toBe("ta");
  });

  it("falls back to 'en' for a huge translation matrix with no other signal", () => {
    const autoCaptionLangs = Array.from({ length: 50 }, (_, i) => `lang${i}`).concat("en");
    const m = meta({ language: null, autoCaptionLangs });
    expect(resolveCaptionLanguage(m)).toBe("en");
  });

  it("falls back to the first key when a huge matrix has no 'en' and no other signal", () => {
    const autoCaptionLangs = Array.from({ length: 50 }, (_, i) => `lang${i}`);
    const m = meta({ language: null, autoCaptionLangs });
    expect(resolveCaptionLanguage(m)).toBe("lang0");
  });

  it("does not pick a bogus alphabetically-first key over the real detected language", () => {
    // This is the exact bug that shipped: "ab" (Abkhazian) was picked
    // over the real language just because it sorted first and had no
    // hyphen, once the full translation matrix was present.
    const autoCaptionLangs = ["ab", "aa", "af", "hi", "hi-orig", "zz"];
    const m = meta({ language: "hi", autoCaptionLangs });
    expect(resolveCaptionLanguage(m)).not.toBe("ab");
    expect(resolveCaptionLanguage(m)).toBe("hi-orig");
  });
});
