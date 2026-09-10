import { NextResponse } from "next/server";
import { z } from "zod";
import { getTranscript, TranscriptUnavailableError } from "@/lib/transcript";
import { checkRateLimit, getClientKey } from "@/lib/rateLimit";

const requestSchema = z.object({
  url: z.string().min(1, "A YouTube URL or video ID is required."),
});

const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  const rate = checkRateLimit(`transcript:${getClientKey(request)}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 }
    );
  }

  try {
    const result = await getTranscript(parsed.data.url);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof TranscriptUnavailableError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    console.error(err);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
