import { extractVideoId } from "@/lib/youtube";
import { fetchCaptions } from "./captions";
import { transcribeWithWhisper } from "./whisper";
import { getVideoMetadata, resolveCaptionLanguage, type VideoMetadata } from "./metadata";
import { getCachedTranscript, setCachedTranscript } from "./cache";
import { describeExecError } from "./execError";
import { TranscriptUnavailableError, type TranscriptResult } from "./types";

export * from "./types";

/**
 * Captions-first, Whisper-on-fallback. Captions are free and near-instant;
 * ASR only runs when the video has no caption track at all, since it's
 * slower and costs OpenAI API credits.
 */
export async function getTranscript(urlOrId: string): Promise<TranscriptResult> {
  const videoId = extractVideoId(urlOrId);
  if (!videoId) {
    throw new TranscriptUnavailableError("Could not parse a YouTube video ID from that input.");
  }

  const cached = getCachedTranscript(videoId);
  if (cached) return cached;

  let meta: VideoMetadata;
  try {
    meta = await getVideoMetadata(videoId);
  } catch (err) {
    throw new TranscriptUnavailableError(
      `Could not fetch info for this video (it may be private, region-locked, age-restricted, or removed): ${describeExecError(err)}`
    );
  }

  const captionLang = resolveCaptionLanguage(meta);
  const captionSegments = captionLang ? await fetchCaptions(videoId, captionLang) : null;

  const result: TranscriptResult = captionSegments
    ? {
        videoId,
        title: meta.title,
        source: "captions",
        language: captionLang,
        segments: captionSegments,
      }
    : await (async () => {
        const whisper = await transcribeWithWhisper(videoId);
        return {
          videoId,
          title: meta.title,
          source: "whisper" as const,
          language: whisper.language,
          segments: whisper.segments,
        };
      })();

  setCachedTranscript(videoId, result);
  return result;
}
