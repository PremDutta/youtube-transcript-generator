export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

export type TranscriptSource = "captions" | "whisper";

export interface TranscriptResult {
  videoId: string;
  title: string | null;
  source: TranscriptSource;
  language: string | null;
  segments: TranscriptSegment[];
}

export class TranscriptUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TranscriptUnavailableError";
  }
}
