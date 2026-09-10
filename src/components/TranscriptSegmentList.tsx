"use client";

import { useMemo } from "react";
import type { TranscriptSegment } from "@/lib/transcript/types";
import { formatTimestamp } from "@/lib/format";

export function TranscriptSegmentList({
  segments,
  query,
  onSeek,
}: {
  segments: TranscriptSegment[];
  query?: string;
  onSeek?: (seconds: number) => void;
}) {
  const filtered = useMemo(() => {
    const q = query?.trim().toLowerCase();
    if (!q) return segments;
    return segments.filter((s) => s.text.toLowerCase().includes(q));
  }, [segments, query]);

  if (!filtered.length) {
    return <p className="p-4 text-sm text-neutral-500">No lines match your search.</p>;
  }

  return (
    <div className="max-h-[60vh] space-y-3 overflow-y-auto rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
      {filtered.map((segment, i) => (
        <p
          key={i}
          className={`text-sm leading-relaxed ${onSeek ? "cursor-pointer hover:text-white" : ""}`}
          onClick={onSeek ? () => onSeek(segment.start) : undefined}
        >
          <span className="mr-3 text-neutral-500">{formatTimestamp(segment.start)}</span>
          {segment.text}
        </p>
      ))}
    </div>
  );
}
