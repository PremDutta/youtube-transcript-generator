"use client";

import { useRef, useState } from "react";
import { AlertCircle, Captions, Link2, Loader2, Mic, Search, Sparkles, X } from "lucide-react";
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
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-10 px-6 py-16 sm:py-20">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400 ring-1 ring-inset ring-indigo-500/25">
            <Captions className="h-5 w-5" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-50 sm:text-3xl">
            Free YouTube Transcript Generator
          </h1>
        </div>
        <p className="max-w-xl text-[15px] leading-relaxed text-neutral-400">
          Paste any YouTube video or playlist link. Get the full transcript in
          seconds — free, no sign-up.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900/70 py-3 pl-10 pr-4 text-sm text-neutral-100 outline-none ring-0 transition placeholder:text-neutral-600 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <button
          type="submit"
          disabled={status === "loading"}
          className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-medium text-white shadow-sm shadow-indigo-900/40 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Fetching…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Get transcript
            </>
          )}
        </button>
      </form>

      {status === "error" && error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {status === "success" && result && (
        <section className="space-y-5">
          <div className="space-y-3">
            {result.title && (
              <h2 className="text-[15px] font-medium leading-snug text-neutral-200">
                {result.title}
              </h2>
            )}
            <YouTubePlayer ref={playerRef} videoId={result.videoId} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-900/60 px-3 py-1 text-xs font-medium text-neutral-400">
              {result.source === "captions" ? (
                <Captions className="h-3.5 w-3.5 text-indigo-400" />
              ) : (
                <Mic className="h-3.5 w-3.5 text-indigo-400" />
              )}
              {result.source === "captions" ? "YouTube captions" : "Whisper (auto-generated)"}
              {result.language && (
                <span className="text-neutral-600">· {result.language}</span>
              )}
            </span>
            <ExportButtons segments={result.segments} baseName={`transcript-${result.videoId}`} />
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search this transcript…"
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900/70 py-2.5 pl-10 pr-9 text-sm outline-none transition placeholder:text-neutral-600 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 transition hover:text-neutral-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

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
