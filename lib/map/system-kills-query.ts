import type { PersistedTimeRange } from "@/stores/time-range-store";
import { FilterCondition } from "@/lib/filter/types";
import { filterTokens } from "@/lib/filter/serialize";
import { secondsToDate } from "@/lib/formatting/time";

export function epochToUtcDate(epoch: number): string {
  const d = secondsToDate(epoch);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(
    d.getUTCDate(),
  )}`;
}

export function buildSystemKillsQuery(
  range: PersistedTimeRange | null,
  conditions: FilterCondition[],
): string {
  const parts: string[] = [];
  if (range && range.start != null)
    parts.push(`start=${epochToUtcDate(range.start)}`);
  if (range && range.end !== "latest")
    parts.push(`end=${epochToUtcDate(range.end)}`);
  for (const tok of filterTokens(conditions)) parts.push(tok);
  return parts.length ? `?${parts.join("&")}` : "";
}

export function buildGlobalKillsPath(
  mapType: string,
  conditions: FilterCondition[],
  bins: number,
): string {
  const tokens = filterTokens(conditions);
  const filter = tokens.length ? `&${tokens.join("&")}` : "";
  return `/stats/global-kills?bins=${bins}&map=${mapType}${filter}`;
}

export function formatActivityRangeLabel(
  range: PersistedTimeRange | null,
): string {
  if (!range) return "all-time";
  const startTxt = range.start != null ? epochToUtcDate(range.start) : null;
  const endTxt = range.end !== "latest" ? epochToUtcDate(range.end) : null;
  if (!startTxt && !endTxt) return "all-time";
  if (startTxt && !endTxt) return `since ${startTxt}`;
  if (!startTxt && endTxt) return `until ${endTxt}`;
  return `${startTxt} to ${endTxt}`;
}

export const SYSTEM_ACTIVITY_BINS = 48;

export function systemActivityPath(
  solarSystemID: number,
  bins: number,
): string {
  return `/systems/${solarSystemID}/activity?bins=${bins}`;
}
