import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { METADATA_TIMEOUT_MS } from "./timeouts";
import { getExtractionArgs } from "./cookies";

const execFileAsync = promisify(execFile);
const MAX_METADATA_BUFFER = 20 * 1024 * 1024;

export interface VideoMetadata {
  title: string | null;
  language: string | null;
  subtitleLangs: string[];
  autoCaptionLangs: string[];
}

export async function getVideoMetadata(videoId: string): Promise<VideoMetadata> {
  const { stdout } = await execFileAsync(
    "yt-dlp",
    ["-J", "--skip-download", ...getExtractionArgs(), `https://www.youtube.com/watch?v=${videoId}`],
    { maxBuffer: MAX_METADATA_BUFFER, timeout: METADATA_TIMEOUT_MS }
  );

  const raw = JSON.parse(stdout) as {
    title?: string | null;
    language?: string | null;
    subtitles?: Record<string, unknown>;
    automatic_captions?: Record<string, unknown>;
  };

  return {
    title: raw.title ?? null,
    language: raw.language ?? null,
    subtitleLangs: Object.keys(raw.subtitles ?? {}),
    autoCaptionLangs: Object.keys(raw.automatic_captions ?? {}),
  };
}

/**
 * Picks which caption language to request. Videos are rarely in English —
 * this app needs to work for any language a video was uploaded in, not
 * just translate everything to English.
 *
 * When a video has few auto-caption entries, the single non-"-orig" key
 * is the real track. But once YouTube generates its full translation
 * matrix (100+ languages), *every* language gets a plain key too —
 * including ones with nothing to do with the video — so "no hyphen" stops
 * meaning "native" and picks garbage (e.g. "ab" for a Hindi video).
 * The reliable signals, in order: real human subtitles > the video's
 * detected `language` field mapped to its untranslated "<lang>-orig" (or
 * plain <lang>) auto-caption track > any "-orig" key at all > (small
 * sets only) a bare key > "en" as a last resort for huge matrices with no
 * other signal.
 */
export function resolveCaptionLanguage(meta: VideoMetadata): string | null {
  if (meta.subtitleLangs.length) return meta.subtitleLangs[0]!;

  const autoLangs = meta.autoCaptionLangs;
  if (!autoLangs.length) return null;

  const detected = meta.language;
  if (detected) {
    if (autoLangs.includes(`${detected}-orig`)) return `${detected}-orig`;
    if (autoLangs.includes(detected)) return detected;
  }

  const origLang = autoLangs.find((l) => l.endsWith("-orig"));
  if (origLang) return origLang;

  if (autoLangs.length <= 5) {
    return autoLangs.find((l) => !l.includes("-")) ?? autoLangs[0]!;
  }

  return autoLangs.includes("en") ? "en" : autoLangs[0]!;
}
