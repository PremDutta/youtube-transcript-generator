import { execFile } from "node:child_process";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { parseVtt } from "./vtt";
import { describeExecError, isRateLimitError, sleep } from "./execError";
import { CAPTIONS_TIMEOUT_MS } from "./timeouts";
import { getExtractionArgs } from "./cookies";
import { TranscriptUnavailableError, type TranscriptSegment } from "./types";

const execFileAsync = promisify(execFile);
const MAX_ATTEMPTS = 2;
const RATE_LIMIT_BACKOFF_MS = 3_000;

/**
 * Downloads and parses one specific caption track via yt-dlp, which keeps
 * working against YouTube's page-format changes — unlike scraping the
 * timedtext endpoint directly, which breaks whenever YouTube tweaks its
 * player response shape. Returns null (rather than throwing) when the
 * video genuinely has no usable transcript — but throws when YouTube
 * rate-limited the download, since that's a fundamentally different,
 * worth-surfacing-accurately situation than "no captions exist" (and the
 * caller would otherwise silently fall through to a misleading "Whisper
 * fallback not configured" message).
 */
export async function fetchCaptions(
  videoId: string,
  lang: string
): Promise<TranscriptSegment[] | null> {
  const workDir = await mkdtemp(path.join(tmpdir(), "yt-captions-"));

  try {
    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        await execFileAsync("yt-dlp", [
          "--skip-download",
          "--write-subs",
          "--write-auto-subs",
          "--sub-format",
          "vtt",
          "--sub-langs",
          lang,
          "-o",
          path.join(workDir, "%(id)s.%(ext)s"),
          ...getExtractionArgs(),
          `https://www.youtube.com/watch?v=${videoId}`,
        ], { timeout: CAPTIONS_TIMEOUT_MS });
        lastError = undefined;
        break;
      } catch (err) {
        // yt-dlp can exit non-zero on a non-fatal warning (e.g. a transient
        // 429 on a secondary request) after already writing the subtitle
        // file we actually want — fall through and check the directory
        // before giving up.
        lastError = err;
        console.warn(
          `[captions] yt-dlp exited non-zero for ${videoId} (attempt ${attempt}/${MAX_ATTEMPTS}):`,
          describeExecError(err)
        );
        if (attempt < MAX_ATTEMPTS && isRateLimitError(err)) {
          await sleep(RATE_LIMIT_BACKOFF_MS);
        } else {
          break;
        }
      }
    }

    const files = await readdir(workDir);
    const vttFile = files.find((f) => f.endsWith(".vtt"));

    if (!vttFile) {
      if (lastError && isRateLimitError(lastError)) {
        throw new TranscriptUnavailableError(
          "YouTube is rate-limiting caption downloads from this server right now. Please try again in a few minutes."
        );
      }
      console.warn(`[captions] no .vtt written for ${videoId} (lang=${lang}); found: [${files.join(", ")}]`);
      return null;
    }

    const content = await readFile(path.join(workDir, vttFile), "utf-8");
    const segments = parseVtt(content);
    if (!segments.length) {
      console.warn(`[captions] ${vttFile} parsed to 0 segments for ${videoId}`);
    }
    return segments.length ? segments : null;
  } catch (err) {
    if (err instanceof TranscriptUnavailableError) throw err;
    console.warn(`[captions] unexpected failure for ${videoId}:`, describeExecError(err));
    return null;
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
