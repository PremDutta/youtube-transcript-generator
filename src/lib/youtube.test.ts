import { describe, it, expect } from "vitest";
import { extractVideoId, extractPlaylistId } from "./youtube";

const ID = "dQw4w9WgXcQ";

describe("extractVideoId", () => {
  it("accepts a bare video ID", () => {
    expect(extractVideoId(ID)).toBe(ID);
  });

  it("parses a standard watch URL", () => {
    expect(extractVideoId(`https://www.youtube.com/watch?v=${ID}`)).toBe(ID);
  });

  it("parses a watch URL with extra query params", () => {
    expect(extractVideoId(`https://www.youtube.com/watch?v=${ID}&t=30s`)).toBe(ID);
  });

  it("parses a youtu.be short link", () => {
    expect(extractVideoId(`https://youtu.be/${ID}`)).toBe(ID);
  });

  it("parses a youtu.be link with a query string", () => {
    expect(extractVideoId(`https://youtu.be/${ID}?si=abc123`)).toBe(ID);
  });

  it("parses a shorts URL", () => {
    expect(extractVideoId(`https://www.youtube.com/shorts/${ID}`)).toBe(ID);
  });

  it("parses an embed URL", () => {
    expect(extractVideoId(`https://www.youtube.com/embed/${ID}`)).toBe(ID);
  });

  it("parses a live URL", () => {
    expect(extractVideoId(`https://www.youtube.com/live/${ID}`)).toBe(ID);
  });

  it("parses a URL missing the https:// scheme", () => {
    expect(extractVideoId(`youtube.com/watch?v=${ID}`)).toBe(ID);
    expect(extractVideoId(`www.youtube.com/watch?v=${ID}`)).toBe(ID);
  });

  it("parses a youtube-nocookie.com embed URL", () => {
    expect(extractVideoId(`https://www.youtube-nocookie.com/embed/${ID}`)).toBe(ID);
    expect(extractVideoId(`youtube-nocookie.com/embed/${ID}`)).toBe(ID);
  });

  it("parses an m.youtube.com URL", () => {
    expect(extractVideoId(`https://m.youtube.com/watch?v=${ID}`)).toBe(ID);
  });

  it("rejects a non-YouTube URL", () => {
    expect(extractVideoId("https://vimeo.com/12345")).toBeNull();
  });

  it("rejects plain garbage text", () => {
    expect(extractVideoId("not a url at all")).toBeNull();
    expect(extractVideoId("hello world")).toBeNull();
  });

  it("rejects an empty string", () => {
    expect(extractVideoId("")).toBeNull();
  });

  it("rejects a watch URL with no v= param", () => {
    expect(extractVideoId("https://www.youtube.com/watch")).toBeNull();
  });
});

describe("extractPlaylistId", () => {
  it("parses a bare playlist URL", () => {
    expect(extractPlaylistId("https://www.youtube.com/playlist?list=PLabc123")).toBe("PLabc123");
  });

  it("parses a playlist URL missing the scheme", () => {
    expect(extractPlaylistId("youtube.com/playlist?list=PLabc123")).toBe("PLabc123");
  });

  it("returns null for a watch URL that merely carries a list= param", () => {
    // A video playing inside a playlist is still just that one video —
    // this is the far more common case when pasting a link off a video page.
    expect(
      extractPlaylistId(`https://www.youtube.com/watch?v=${ID}&list=PLabc123`)
    ).toBeNull();
  });

  it("returns null for a non-YouTube URL", () => {
    expect(extractPlaylistId("https://vimeo.com/playlist?list=x")).toBeNull();
  });

  it("returns null for garbage input", () => {
    expect(extractPlaylistId("not a url")).toBeNull();
  });
});
