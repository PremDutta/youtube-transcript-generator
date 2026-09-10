/**
 * yt-dlp's stderr is full of noise (Python deprecation notices, "no JS
 * runtime" warnings) that has nothing to do with why a call actually
 * failed. Pull out just the real ERROR/WARNING lines so user-facing
 * messages stay readable instead of dumping the whole blob.
 */
export function describeExecError(err: unknown): string {
  if (err && typeof err === "object" && "code" in err && (err as { code?: string }).code === "ENOENT") {
    return "yt-dlp is not installed (or not on PATH) on this server. Install it — e.g. `brew install yt-dlp` or `pip install --user yt-dlp` — and restart the server.";
  }
  if (err && typeof err === "object" && "killed" in err && (err as { killed?: boolean }).killed) {
    return "The command timed out.";
  }
  if (err && typeof err === "object" && "stderr" in err) {
    const stderr = String((err as { stderr?: unknown }).stderr ?? "").trim();
    const lines = stderr.split("\n").map((l) => l.trim());
    const errorLines = lines.filter((l) => l.startsWith("ERROR"));
    if (errorLines.length) return errorLines.slice(-2).join(" | ");
    const warningLines = lines.filter((l) => l.startsWith("WARNING"));
    if (warningLines.length) return warningLines.slice(-2).join(" | ");
    if (stderr) return lines.slice(-2).join(" | ");
  }
  return err instanceof Error ? err.message : String(err);
}
