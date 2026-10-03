export function exportTimeMs(
  playbackActive: boolean,
  playbackSec: number,
  nowMs: number,
): number {
  return playbackActive ? playbackSec * 1000 : nowMs;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function timeLabelFor(playbackActive: boolean, ms: number): string {
  const d = new Date(ms);
  const stamp = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
  return `Screenshot taken ${stamp}${playbackActive ? " (playback)" : ""}`;
}
