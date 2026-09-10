"use client";

import { useState } from "react";
import type { TranscriptSegment } from "@/lib/transcript/types";
import { toPlainText, toSrt, toVtt } from "@/lib/export";

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function ExportButtons({
  segments,
  baseName,
}: {
  segments: TranscriptSegment[];
  baseName: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(toPlainText(segments));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={handleCopy}
        className="rounded-md border border-neutral-800 px-3 py-1.5 text-xs font-medium hover:bg-neutral-900"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      <button
        onClick={() => download(`${baseName}.txt`, toPlainText(segments))}
        className="rounded-md border border-neutral-800 px-3 py-1.5 text-xs font-medium hover:bg-neutral-900"
      >
        .txt
      </button>
      <button
        onClick={() => download(`${baseName}.srt`, toSrt(segments))}
        className="rounded-md border border-neutral-800 px-3 py-1.5 text-xs font-medium hover:bg-neutral-900"
      >
        .srt
      </button>
      <button
        onClick={() => download(`${baseName}.vtt`, toVtt(segments))}
        className="rounded-md border border-neutral-800 px-3 py-1.5 text-xs font-medium hover:bg-neutral-900"
      >
        .vtt
      </button>
    </div>
  );
}
