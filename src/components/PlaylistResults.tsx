"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, Download, ListVideo } from "lucide-react";
import type { PlaylistVideoResult } from "@/lib/transcript/types";
import { TranscriptSegmentList } from "./TranscriptSegmentList";
import { ExportButtons } from "./ExportButtons";

function VideoSection({ video }: { video: PlaylistVideoResult }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/30">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-neutral-900/60"
      >
        {video.transcript ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
        ) : (
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
        )}
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-200">
          {video.title ?? video.videoId}
        </span>
        {video.transcript && (
          <span className="hidden shrink-0 rounded-full border border-neutral-800 px-2 py-0.5 text-[11px] text-neutral-500 sm:inline">
            {video.transcript.source}
            {video.transcript.language ? ` · ${video.transcript.language}` : ""}
          </span>
        )}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-neutral-600 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="space-y-3 border-t border-neutral-800 p-4">
          {video.transcript ? (
            <>
              <ExportButtons segments={video.transcript.segments} baseName={`transcript-${video.videoId}`} />
              <TranscriptSegmentList segments={video.transcript.segments} />
            </>
          ) : (
            <p className="text-sm text-red-400">{video.error}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function PlaylistResults({
  playlistTitle,
  truncated,
  videos,
}: {
  playlistTitle: string | null;
  truncated: boolean;
  videos: PlaylistVideoResult[];
}) {
  const succeeded = videos.filter((v) => v.transcript);

  function downloadAll() {
    const combined = succeeded
      .map((v) => `# ${v.title ?? v.videoId}\n\n${v.transcript!.segments.map((s) => s.text).join(" ")}`)
      .join("\n\n---\n\n");
    const blob = new Blob([combined], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "playlist-transcripts.txt";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <ListVideo className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
          <div>
            <h2 className="text-sm font-medium text-neutral-200">
              {playlistTitle ?? "Playlist"} — {videos.length} video{videos.length === 1 ? "" : "s"}
            </h2>
            {truncated && (
              <p className="text-xs text-neutral-500">
                This playlist has more videos than the 25-video limit; only the first 25 were processed.
              </p>
            )}
          </div>
        </div>
        {succeeded.length > 0 && (
          <button
            onClick={downloadAll}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/50 px-3 py-1.5 text-xs font-medium text-neutral-300 transition hover:border-neutral-700 hover:bg-neutral-800 hover:text-neutral-50"
          >
            <Download className="h-3.5 w-3.5" />
            Download all
          </button>
        )}
      </div>

      <div className="space-y-2">
        {videos.map((v) => (
          <VideoSection key={v.videoId} video={v} />
        ))}
      </div>
    </section>
  );
}
