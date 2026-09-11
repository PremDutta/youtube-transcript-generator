import { existsSync } from "node:fs";

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
  return existsSync(/* turbopackIgnore: true */ cookiesPath) ? ["--cookies", cookiesPath] : [];
}
