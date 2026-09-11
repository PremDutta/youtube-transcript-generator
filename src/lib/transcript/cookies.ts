import { existsSync, copyFileSync, chmodSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// Keyed by source path so tests using different env-configured paths
// don't collide, and repeated calls for the same real deployment only
// copy once per process.
const writableCopyCache = new Map<string, string>();

/**
 * yt-dlp treats --cookies as a live cookie jar: it can try to write
 * updated cookies back to the same file after a request. Secret-file
 * mounts (Render, etc.) are read-only, so that write fails outright with
 * EROFS and takes the whole extraction down with it — copying to a
 * writable location once avoids that.
 */
function resolveWritableCookiesPath(sourcePath: string): string {
  const cached = writableCopyCache.get(sourcePath);
  if (cached) return cached;

  // A guaranteed-unique directory per copy, rather than a deterministic
  // counter-based name — a fixed name can collide with a stale leftover
  // file from a previous process run (which is exactly how this bit us
  // once already: copying onto an existing read-only leftover failed).
  const dir = mkdtempSync(path.join(tmpdir(), "yt-cookies-"));
  const writablePath = path.join(dir, "cookies.txt");
  copyFileSync(sourcePath, writablePath);
  // copyFileSync preserves the source's permission bits — a read-only
  // secret-file mount produces a read-only copy too, so the write-back
  // this whole function exists to avoid would still fail identically.
  chmodSync(writablePath, 0o600);
  writableCopyCache.set(sourcePath, writablePath);
  return writablePath;
}

/**
 * YouTube increasingly rate-limits or bot-checks requests from shared/
 * datacenter IPs (common on free hosting tiers) — yt-dlp calls start
 * failing with 429s or "Sign in to confirm you're not a bot" even though
 * the exact same request works fine from a residential IP. Passing a
 * cookies file from a real logged-in browser session works around this.
 *
 * The path is configurable so this isn't tied to one host's convention;
 * defaults to Render's Secret Files mount point. If the file isn't
 * present (local dev, a host without cookies configured), this is a
 * no-op and yt-dlp runs exactly as before.
 */
export function getCookieArgs(): string[] {
  const cookiesPath = process.env.YTDLP_COOKIES_PATH ?? "/etc/secrets/youtube-cookies.txt";
  if (!existsSync(/* turbopackIgnore: true */ cookiesPath)) return [];
  return ["--cookies", resolveWritableCookiesPath(cookiesPath)];
}

/**
 * Every yt-dlp call needs this. YouTube requires solving a JS signature
 * challenge to resolve real (non-storyboard-only) formats — without it,
 * yt-dlp falls back to "Only images are available for download" and
 * errors out entirely. Harmless when no challenge is actually needed;
 * required once a cookies file is present (the authenticated path hits
 * this far more often than the anonymous one). Needs a JS runtime (Deno)
 * on PATH — see the Dockerfile.
 */
export function getExtractionArgs(): string[] {
  return ["--remote-components", "ejs:github", ...getCookieArgs()];
}
