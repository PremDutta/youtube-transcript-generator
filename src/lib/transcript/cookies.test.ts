import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync, readFileSync, existsSync, chmodSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { getCookieArgs, getExtractionArgs } from "./cookies";

const ORIGINAL_PATH = process.env.YTDLP_COOKIES_PATH;
const FAKE_CONTENT = "# fake cookies file\n";

afterEach(() => {
  if (ORIGINAL_PATH === undefined) delete process.env.YTDLP_COOKIES_PATH;
  else process.env.YTDLP_COOKIES_PATH = ORIGINAL_PATH;
});

describe("getCookieArgs", () => {
  it("returns no args when the cookies file doesn't exist", () => {
    process.env.YTDLP_COOKIES_PATH = "/definitely/not/a/real/path.txt";
    expect(getCookieArgs()).toEqual([]);
  });

  it("returns --cookies <writable copy>, not the original path", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "cookie-test-"));
    const cookiesPath = path.join(dir, "cookies.txt");
    writeFileSync(cookiesPath, FAKE_CONTENT);
    process.env.YTDLP_COOKIES_PATH = cookiesPath;

    const args = getCookieArgs();
    expect(args[0]).toBe("--cookies");
    const returnedPath = args[1]!;

    // Copied to a writable location (e.g. a read-only Secret File mount
    // would make yt-dlp's own cookie-jar write-back fail otherwise), not
    // the original source path.
    expect(returnedPath).not.toBe(cookiesPath);
    expect(existsSync(returnedPath)).toBe(true);
    expect(readFileSync(returnedPath, "utf-8")).toBe(FAKE_CONTENT);

    rmSync(dir, { recursive: true, force: true });
  });

  it("makes the copy actually writable even when the source is read-only", () => {
    // Regression test: fs.copyFileSync preserves the source's permission
    // bits, so a naive copy of a read-only secret-file mount is itself
    // read-only — yt-dlp's cookie-jar write-back would fail identically
    // on the "writable" copy, exactly the bug this function exists to fix.
    const dir = mkdtempSync(path.join(tmpdir(), "cookie-test-"));
    const cookiesPath = path.join(dir, "cookies.txt");
    writeFileSync(cookiesPath, FAKE_CONTENT);
    chmodSync(cookiesPath, 0o444);
    process.env.YTDLP_COOKIES_PATH = cookiesPath;

    const [, returnedPath] = getCookieArgs();
    const mode = statSync(returnedPath!).mode & 0o200;
    expect(mode).not.toBe(0); // owner-write bit must be set

    chmodSync(cookiesPath, 0o644);
    rmSync(dir, { recursive: true, force: true });
  });
});

describe("getExtractionArgs", () => {
  it("always includes the JS-challenge-solver flag", () => {
    process.env.YTDLP_COOKIES_PATH = "/definitely/not/a/real/path.txt";
    expect(getExtractionArgs()).toEqual(["--remote-components", "ejs:github"]);
  });

  it("appends cookie args after the solver flag when a cookies file exists", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "cookie-test-"));
    const cookiesPath = path.join(dir, "cookies.txt");
    writeFileSync(cookiesPath, FAKE_CONTENT);
    process.env.YTDLP_COOKIES_PATH = cookiesPath;

    const args = getExtractionArgs();
    expect(args.slice(0, 2)).toEqual(["--remote-components", "ejs:github"]);
    expect(args[2]).toBe("--cookies");
    expect(existsSync(args[3]!)).toBe(true);

    rmSync(dir, { recursive: true, force: true });
  });
});
