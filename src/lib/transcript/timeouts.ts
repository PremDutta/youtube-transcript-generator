/**
 * Every yt-dlp/Whisper subprocess call gets a hard timeout so a stuck
 * process (a hung network request, a video yt-dlp struggles with) fails
 * the request instead of blocking it indefinitely.
 *
 * Metadata/captions timeouts are higher than you'd expect for what's
 * conceptually a quick lookup: every call now runs a real JS signature
 * challenge solver (see cookies.ts/getExtractionArgs), which is genuinely
 * CPU-bound work — fine on a real machine (~4s), but free-tier hosts
 * often throttle to a fraction of a vCPU (e.g. Render free = 0.1 vCPU),
 * where the same work can take several times longer.
 */
export const METADATA_TIMEOUT_MS = 45_000;
export const CAPTIONS_TIMEOUT_MS = 45_000;
export const PLAYLIST_LISTING_TIMEOUT_MS = 45_000;
export const AUDIO_DOWNLOAD_TIMEOUT_MS = 120_000;
export const WHISPER_API_TIMEOUT_MS = 180_000;
