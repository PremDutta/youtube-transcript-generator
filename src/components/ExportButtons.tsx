"use client";

import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";
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

const buttonClass =
  "inline-flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/50 px-3 py-1.5 text-xs font-medium text-neutral-300 transition hover:border-neutral-700 hover:bg-neutral-800 hover:text-neutral-50";

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
      <button onClick={handleCopy} className={buttonClass}>
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy"}
      </button>
      <button onClick={() => download(`${baseName}.txt`, toPlainText(segments))} className={buttonClass}>
        <Download className="h-3.5 w-3.5" />
        .txt
      </button>
      <button onClick={() => download(`${baseName}.srt`, toSrt(segments))} className={buttonClass}>
        <Download className="h-3.5 w-3.5" />
        .srt
      </button>
      <button onClick={() => download(`${baseName}.vtt`, toVtt(segments))} className={buttonClass}>
        <Download className="h-3.5 w-3.5" />
        .vtt
      </button>
    </div>
  );
}
