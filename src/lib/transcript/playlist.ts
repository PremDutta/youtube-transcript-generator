import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const MAX_METADATA_BUFFER = 20 * 1024 * 1024;

export interface PlaylistEntry {
  videoId: string;
  title: string | null;
}

export interface PlaylistInfo {
  title: string | null;
  entries: PlaylistEntry[];
  truncated: boolean;
}

/**
 * Lists a playlist's videos without downloading anything. Capped at
 * `limit` videos — a full unbounded playlist could mean hundreds of
 * yt-dlp/Whisper calls from a single request, which is both slow and, on
 * the Whisper fallback, expensive.
 */
export async function listPlaylistVideos(playlistId: string, limit = 25): Promise<PlaylistInfo> {
  const { stdout } = await execFileAsync(
    "yt-dlp",
    [
      "--flat-playlist",
      "-J",
      "--skip-download",
      `https://www.youtube.com/playlist?list=${playlistId}`,
    ],
    { maxBuffer: MAX_METADATA_BUFFER }
  );

  const raw = JSON.parse(stdout) as {
    title?: string | null;
    entries?: Array<{ id?: string; title?: string | null }>;
  };

  const allEntries = (raw.entries ?? []).filter(
    (e): e is { id: string; title?: string | null } => Boolean(e.id)
  );

  return {
    title: raw.title ?? null,
    entries: allEntries.slice(0, limit).map((e) => ({ videoId: e.id, title: e.title ?? null })),
    truncated: allEntries.length > limit,
  };
}

/**
 * Runs `tasks` with at most `concurrency` in flight at once, so a large
 * playlist doesn't spawn dozens of simultaneous yt-dlp/Whisper processes.
 */
export async function runWithConcurrencyLimit<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const i = nextIndex++;
      if (i >= tasks.length) return;
      results[i] = await tasks[i]!();
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, worker));
  return results;
}
