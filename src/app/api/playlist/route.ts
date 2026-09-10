import { NextResponse } from "next/server";
import { z } from "zod";
import { extractPlaylistId } from "@/lib/youtube";
import { getTranscript, type PlaylistVideoResult } from "@/lib/transcript";
import { listPlaylistVideos, runWithConcurrencyLimit } from "@/lib/transcript/playlist";

const requestSchema = z.object({
  url: z.string().min(1, "A YouTube playlist URL is required."),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 }
    );
  }

  const playlistId = extractPlaylistId(parsed.data.url);
  if (!playlistId) {
    return NextResponse.json(
      { error: "Could not parse a YouTube playlist ID from that input." },
      { status: 400 }
    );
  }

  try {
    const playlist = await listPlaylistVideos(playlistId);

    const videos: PlaylistVideoResult[] = await runWithConcurrencyLimit(
      playlist.entries.map((entry) => async () => {
        try {
          const transcript = await getTranscript(entry.videoId);
          return { videoId: entry.videoId, title: entry.title, transcript, error: null };
        } catch (err) {
          return {
            videoId: entry.videoId,
            title: entry.title,
            transcript: null,
            error: err instanceof Error ? err.message : String(err),
          };
        }
      }),
      3
    );

    return NextResponse.json({
      playlistTitle: playlist.title,
      truncated: playlist.truncated,
      videos,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: `Could not read this playlist: ${err instanceof Error ? err.message : String(err)}` },
      { status: 422 }
    );
  }
}
