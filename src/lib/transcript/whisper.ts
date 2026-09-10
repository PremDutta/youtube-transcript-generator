import { execFile } from "node:child_process";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import OpenAI from "openai";
import { describeExecError } from "./execError";
import { TranscriptUnavailableError, type TranscriptSegment } from "./types";

const execFileAsync = promisify(execFile);

/**
 * ASR fallback for videos with no caption track: pulls audio-only with
 * yt-dlp, transcribes it with OpenAI's Whisper API, and returns
 * word-timed segments. Requires `yt-dlp` (+ ffmpeg) on PATH and
 * OPENAI_API_KEY set — throws a descriptive error otherwise so the UI
 * can surface it instead of failing silently.
 */
export interface WhisperResult {
  segments: TranscriptSegment[];
  language: string | null;
}

export async function transcribeWithWhisper(videoId: string): Promise<WhisperResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new TranscriptUnavailableError(
      "No captions found for this video, and OPENAI_API_KEY is not configured for the Whisper fallback."
    );
  }

  const workDir = await mkdtemp(path.join(tmpdir(), "yt-transcript-"));
  const audioTemplate = path.join(workDir, "audio.%(ext)s");

  try {
    await execFileAsync("yt-dlp", [
      "-f",
      "bestaudio",
      "-x",
      "--audio-format",
      "mp3",
      "--audio-quality",
      "5",
      "-o",
      audioTemplate,
      `https://www.youtube.com/watch?v=${videoId}`,
    ]);

    const files = await readdir(workDir);
    const audioFile = files.find((f) => f.startsWith("audio."));
    if (!audioFile) {
      throw new TranscriptUnavailableError("Audio download produced no output file.");
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const transcription = await client.audio.transcriptions.create({
      file: createReadStream(path.join(workDir, audioFile)),
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
    });

    const result = transcription as unknown as {
      language?: string;
      segments?: Array<{ text: string; start: number; end: number }>;
    };

    return {
      language: result.language ?? null,
      segments: (result.segments ?? []).map((s) => ({
        text: s.text.trim(),
        start: s.start,
        duration: s.end - s.start,
      })),
    };
  } catch (err) {
    if (err instanceof TranscriptUnavailableError) throw err;
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      throw new TranscriptUnavailableError(
        "yt-dlp is not installed on this server. Install it (e.g. `brew install yt-dlp ffmpeg`) to enable the Whisper fallback."
      );
    }
    throw new TranscriptUnavailableError(`Whisper fallback failed: ${describeExecError(err)}`);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
