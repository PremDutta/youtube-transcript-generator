import type { TranscriptResult } from "./types";

/**
 * Process-local cache: avoids re-running yt-dlp (and paying for Whisper
 * again) when the same video is requested twice. Resets on server
 * restart and isn't shared across instances — fine for this app's scale;
 * a real multi-instance deployment would swap this for Redis or similar.
 */
const TTL_MS = 60 * 60 * 1000;
const cache = new Map<string, { result: TranscriptResult; expiresAt: number }>();

export function getCachedTranscript(videoId: string): TranscriptResult | null {
  const entry = cache.get(videoId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(videoId);
    return null;
  }
  return entry.result;
}

export function setCachedTranscript(videoId: string, result: TranscriptResult): void {
  cache.set(videoId, { result, expiresAt: Date.now() + TTL_MS });
}
