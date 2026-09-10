"use client";

import { useRef, useState } from "react";
import type { TranscriptResult, PlaylistVideoResult } from "@/lib/transcript/types";
import { extractPlaylistId } from "@/lib/youtube";
import { YouTubePlayer, type YouTubePlayerHandle } from "./YouTubePlayer";
import { TranscriptSegmentList } from "./TranscriptSegmentList";
import { ExportButtons } from "./ExportButtons";
import { PlaylistResults } from "./PlaylistResults";

type Status = "idle" | "loading" | "error" | "success";

interface PlaylistResponse {
  playlistTitle: string | null;
  truncated: boolean;
  videos: PlaylistVideoResult[];
}

export function TranscriptApp() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TranscriptResult | null>(null);
  const [playlist, setPlaylist] = useState<PlaylistResponse | null>(null);
  const [query, setQuery] = useState("");
  const playerRef = useRef<YouTubePlayerHandle>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || status === "loading") return;

    setStatus("loading");
    setError(null);
    setResult(null);
    setPlaylist(null);
    setQuery("");

    const isPlaylist = Boolean(extractPlaylistId(url));

    try {
      const res = await fetch(isPlaylist ? "/api/playlist" : "/api/transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong.");
      }

      if (isPlaylist) {
        setPlaylist(data as PlaylistResponse);
      } else {
        setResult(data as TranscriptResult);
      }
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Free YouTube Transcript Generator
        </h1>
        <p className="text-neutral-400">
          Paste any YouTube video or playlist link. Get the full transcript in seconds — free, no sign-up.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm outline-none placeholder:text-neutral-600 focus:border-neutral-600"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-lg bg-neutral-100 px-5 py-3 text-sm font-medium text-neutral-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "loading" ? "Fetching…" : "Get transcript"}
        </button>
      </form>

      {status === "error" && error && (
        <div className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {status === "success" && result && (
        <section className="space-y-4">
          <div className="space-y-3">
            {result.title && <h2 className="text-sm font-medium text-neutral-300">{result.title}</h2>}
            <YouTubePlayer ref={playerRef} videoId={result.videoId} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs uppercase tracking-wide text-neutral-500">
              Source: {result.source === "captions" ? "YouTube captions" : "Whisper (auto-generated)"}
              {result.language ? ` · ${result.language}` : ""}
            </span>
            <ExportButtons segments={result.segments} baseName={`transcript-${result.videoId}`} />
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search this transcript…"
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm outline-none placeholder:text-neutral-600 focus:border-neutral-600"
          />

          <TranscriptSegmentList
            segments={result.segments}
            query={query}
            onSeek={(seconds) => playerRef.current?.seekTo(seconds)}
          />
        </section>
      )}

      {status === "success" && playlist && (
        <PlaylistResults
          playlistTitle={playlist.playlistTitle}
          truncated={playlist.truncated}
          videos={playlist.videos}
        />
      )}
    </main>
  );
}
