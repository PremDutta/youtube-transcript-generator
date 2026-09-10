export function formatTimestamp(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const parts = hours > 0 ? [hours, minutes, seconds] : [minutes, seconds];
  return parts.map((p) => String(p).padStart(2, "0")).join(":");
}
