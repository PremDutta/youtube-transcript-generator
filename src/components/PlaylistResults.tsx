"use client";

import { useState } from "react";
import type { PlaylistVideoResult } from "@/lib/transcript/types";
import { TranscriptSegmentList } from "./TranscriptSegmentList";
import { ExportButtons } from "./ExportButtons";

function VideoSection({ video }: { video: PlaylistVideoResult }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-neutral-800">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="truncate text-sm font-medium">{video.title ?? video.videoId}</span>
        <span className="shrink-0 text-xs text-neutral-500">
          {video.transcript
            ? `${video.transcript.source}${video.transcript.language ? ` · ${video.transcript.language}` : ""}`
            : "failed"}
        </span>
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
        <div>
          <h2 className="text-sm font-medium text-neutral-300">
            {playlistTitle ?? "Playlist"} — {videos.length} video{videos.length === 1 ? "" : "s"}
          </h2>
          {truncated && (
            <p className="text-xs text-neutral-500">
              This playlist has more videos than the 25-video limit; only the first 25 were processed.
            </p>
          )}
        </div>
        {succeeded.length > 0 && (
          <button
            onClick={downloadAll}
            className="shrink-0 rounded-md border border-neutral-800 px-3 py-1.5 text-xs font-medium hover:bg-neutral-900"
          >
            Download all (.txt)
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
