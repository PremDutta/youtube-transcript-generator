"use client";

import { useMemo } from "react";
import { SearchX } from "lucide-react";
import type { TranscriptSegment } from "@/lib/transcript/types";
import { formatTimestamp } from "@/lib/format";

function highlight(text: string, query: string) {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="rounded bg-indigo-500/30 text-indigo-100">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function TranscriptSegmentList({
  segments,
  query,
  onSeek,
}: {
  segments: TranscriptSegment[];
  query?: string;
  onSeek?: (seconds: number) => void;
}) {
  const trimmedQuery = query?.trim() ?? "";

  const filtered = useMemo(() => {
    const q = trimmedQuery.toLowerCase();
    if (!q) return segments;
    return segments.filter((s) => s.text.toLowerCase().includes(q));
  }, [segments, trimmedQuery]);

  if (!filtered.length) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-neutral-800 bg-neutral-900/40 px-4 py-10 text-center">
        <SearchX className="h-5 w-5 text-neutral-600" />
        <p className="text-sm text-neutral-500">No lines match your search.</p>
      </div>
    );
  }

  return (
    <div className="max-h-[60vh] overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-900/40 p-2">
      {filtered.map((segment, i) => (
        <p
          key={i}
          className={`flex gap-3 rounded-lg px-3 py-2 text-[14.5px] leading-relaxed text-neutral-300 transition ${
            onSeek ? "cursor-pointer hover:bg-neutral-800/70 hover:text-neutral-50" : ""
          }`}
          onClick={onSeek ? () => onSeek(segment.start) : undefined}
        >
          <span className="mt-0.5 shrink-0 font-mono text-xs tabular-nums text-neutral-600">
            {formatTimestamp(segment.start)}
          </span>
          <span>{highlight(segment.text, trimmedQuery)}</span>
        </p>
      ))}
    </div>
  );
}
