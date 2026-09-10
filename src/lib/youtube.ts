const VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Extracts an 11-char YouTube video ID from any common URL shape
 * (watch, youtu.be, embed, shorts) or accepts a bare ID.
 */
export function extractVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (VIDEO_ID_PATTERN.test(trimmed)) return trimmed;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return id && VIDEO_ID_PATTERN.test(id) ? id : null;
  }

  if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
    if (url.pathname === "/watch") {
      const id = url.searchParams.get("v");
      return id && VIDEO_ID_PATTERN.test(id) ? id : null;
    }
    const embedMatch = url.pathname.match(/^\/(embed|shorts|live)\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch?.[2]) return embedMatch[2];
  }

  return null;
}

/**
 * A bare playlist link (`/playlist?list=...`, no `v=`) means "transcribe
 * the whole playlist." A watch link that happens to carry a `list=` param
 * (a video playing inside a playlist) still means "just this video" —
 * that's the far more common case when pasting a link off a video page.
 */
export function extractPlaylistId(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");
  if (host !== "youtube.com" && host !== "m.youtube.com" && host !== "music.youtube.com") {
    return null;
  }

  if (url.pathname !== "/playlist") return null;
  return url.searchParams.get("list");
}
