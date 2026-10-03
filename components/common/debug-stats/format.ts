import { secondsToDate } from "@/lib/formatting/time";

export function fmtDuration(s: number): string {
  if (s < 60) return `${Math.round(s)}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
  if (s < 86400)
    return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  return `${Math.floor(s / 86400)}d ${Math.floor((s % 86400) / 3600)}h`;
}

export function fmtTime(epoch: number): string {
  const d = secondsToDate(epoch);
  return d
    .toISOString()
    .replace("T", " ")
    .replace(/\.\d+Z$/, " UTC");
}

export function fmtPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export function fmtMb(n: number | null): string {
  return n == null ? "–" : `${n.toFixed(1)} MB`;
}

export function fmtMs(n: number): string {
  return `${n.toFixed(1)} ms`;
}
