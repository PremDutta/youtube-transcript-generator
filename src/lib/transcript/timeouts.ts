/**
 * Every yt-dlp/Whisper subprocess call gets a hard timeout so a stuck
 * process (a hung network request, a video yt-dlp struggles with) fails
 * the request instead of blocking it indefinitely.
 */
export const METADATA_TIMEOUT_MS = 20_000;
export const CAPTIONS_TIMEOUT_MS = 30_000;
export const PLAYLIST_LISTING_TIMEOUT_MS = 30_000;
export const AUDIO_DOWNLOAD_TIMEOUT_MS = 120_000;
export const WHISPER_API_TIMEOUT_MS = 180_000;
