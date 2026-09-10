# Free YouTube Transcript Generator

Paste a YouTube video or playlist URL, get the transcript(s). Captions-first
(free, instant, any language the video actually has), Whisper ASR fallback
for videos with no caption track at all.

## Stack

- Next.js 16 (App Router) + TypeScript
- `yt-dlp` for both caption extraction and (as a fallback) audio download
- OpenAI Whisper API for ASR on caption-less videos
- Tailwind for styling
- YouTube IFrame Player API for the embedded, click-to-seek player

## Setup

```bash
npm install
cp .env.example .env.local   # only needed for the Whisper fallback
npm run dev
```

Open http://localhost:3000.

`yt-dlp` is a **hard dependency**, not just for the Whisper fallback — it's
how captions are fetched too (scraping YouTube's endpoints directly breaks
every time YouTube tweaks its page format; `yt-dlp` is actively maintained
against that).

```bash
pip install --user yt-dlp   # or: brew install yt-dlp
```

### Whisper fallback (optional)

Only kicks in when a video has zero captions at all. Additionally requires:

```bash
brew install ffmpeg
```

...and `OPENAI_API_KEY` set in `.env.local`. Without these, the app still
works for the (large majority of) videos that have captions — it just
returns a clear error for caption-less videos instead of transcribing them.

## Deployment

**This app does not work on serverless platforms** (Vercel, Netlify
Functions, Cloudflare Workers/Pages, AWS Lambda) — it shells out to
`yt-dlp` and `ffmpeg` as system binaries, and serverless runtimes give you
an ephemeral, sandboxed filesystem with no way to install OS packages at
runtime. Deploying there will fail with `spawn yt-dlp ENOENT` regardless of
what's in `package.json`.

Deploy it anywhere that gives you a real container/VM instead — Railway,
Render, Fly.io, or a plain VPS all work identically via the included
`Dockerfile`, which installs `yt-dlp` and `ffmpeg` alongside the app:

```bash
docker build -t yt-transcript .
docker run -p 3000:3000 --env-file .env.local yt-transcript
```

For Railway/Render specifically: connect the GitHub repo, and both
platforms auto-detect the `Dockerfile` and build from it — no extra
config needed beyond setting `OPENAI_API_KEY` as an environment variable
if you want the Whisper fallback. Also make sure the platform's request/
function timeout (if configurable) is comfortably above this app's own
internal timeouts (`src/lib/transcript/timeouts.ts`, up to 180s for the
Whisper API call) — a platform-level timeout shorter than that will cut
off a legitimate long-running request.

## Features

- **Any language** — detects the video's real caption language via its
  metadata rather than assuming English; falls back sensibly when YouTube's
  full auto-translation matrix makes every language code ambiguous.
- **Playlists** — paste a bare playlist link (`/playlist?list=...`) to
  transcribe up to 25 videos at once, each independently.
- **Embedded player with click-to-seek** — click any transcript line to
  jump the video to that timestamp.
- **Search** — filter a transcript to matching lines.
- **Export** — copy, or download as `.txt`, `.srt`, or `.vtt`.
- **Caching** — a video fetched once is served from an in-memory cache for
  an hour, so re-requesting it doesn't re-run `yt-dlp`/Whisper. Process-local
  and resets on restart; a multi-instance deployment would want Redis instead.

## Architecture

```
src/
  app/
    api/transcript/route.ts    # POST { url } -> TranscriptResult
    api/playlist/route.ts      # POST { url } -> { playlistTitle, videos: PlaylistVideoResult[] }
    page.tsx                   # renders <TranscriptApp />
  components/
    TranscriptApp.tsx          # client UI: input, single-video or playlist result
    YouTubePlayer.tsx           # IFrame Player API wrapper, seekTo(seconds)
    TranscriptSegmentList.tsx    # segment list, search filter, click-to-seek
    ExportButtons.tsx             # copy / .txt / .srt / .vtt
    PlaylistResults.tsx            # per-video collapsible sections + "download all"
  lib/
    youtube.ts                 # URL -> video ID / playlist ID parsing
    format.ts                  # timestamp formatting
    export.ts                  # segments -> .srt / .vtt / plain text
    transcript/
      index.ts                 # orchestrator: cache -> captions -> whisper fallback
      metadata.ts                # yt-dlp -J metadata + caption-language resolution
      captions.ts                 # downloads + parses one caption track
      vtt.ts                       # WebVTT parsing (dedupes YouTube's roll-up captions)
      whisper.ts                    # yt-dlp audio + OpenAI Whisper fallback
      playlist.ts                    # playlist listing + concurrency-limited batch fetch
      cache.ts                        # process-local TTL cache
      types.ts                         # shared types + TranscriptUnavailableError
```

## Known limitations

- **Click-to-seek playback**: the seek itself is verified working (the
  player's `currentTime` correctly jumps to the clicked line). Whether the
  video actually *starts playing* after that depends on the browser's
  autoplay policy for that click — a real user's mouse click is a strong,
  trusted gesture and should reliably trigger playback; some automated
  testing/embedding contexts are stricter about what counts as a
  gesture. If a click seeks but doesn't resume playback, hit the player's
  own play button.
- **Playlist cap**: 25 videos per playlist request, to bound how long one
  request runs and (on the Whisper path) how much it could cost.

