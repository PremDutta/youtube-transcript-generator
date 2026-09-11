import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { getCookieArgs, getExtractionArgs } from "./cookies";

const ORIGINAL_PATH = process.env.YTDLP_COOKIES_PATH;

afterEach(() => {
  if (ORIGINAL_PATH === undefined) delete process.env.YTDLP_COOKIES_PATH;
  else process.env.YTDLP_COOKIES_PATH = ORIGINAL_PATH;
});

describe("getCookieArgs", () => {
  it("returns no args when the cookies file doesn't exist", () => {
    process.env.YTDLP_COOKIES_PATH = "/definitely/not/a/real/path.txt";
    expect(getCookieArgs()).toEqual([]);
  });

  it("returns --cookies <path> when the file exists", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "cookie-test-"));
    const cookiesPath = path.join(dir, "cookies.txt");
    writeFileSync(cookiesPath, "# fake cookies file\n");
    process.env.YTDLP_COOKIES_PATH = cookiesPath;

    expect(getCookieArgs()).toEqual(["--cookies", cookiesPath]);

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
    writeFileSync(cookiesPath, "# fake cookies file\n");
    process.env.YTDLP_COOKIES_PATH = cookiesPath;

    expect(getExtractionArgs()).toEqual(["--remote-components", "ejs:github", "--cookies", cookiesPath]);

    rmSync(dir, { recursive: true, force: true });
  });
});
