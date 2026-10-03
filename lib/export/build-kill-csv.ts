import type { FilteredKills } from "@/lib/kill/kill-filter";

export const KILL_CSV_HEADER = [
  "killmail_id",
  "time_utc",
  "ship_type_id",
  "ship_name",
  "x",
  "y",
  "z",
  "nearest_object",
  "distance_m",
] as const;

export interface KillCsvOptions {
  shipNames: ReadonlyMap<number, string>;
  nearest: (
    pos: [number, number, number],
  ) => { name: string; distance: number } | null;
}

export function csvField(value: string | number): string {
  const s = String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function isoSeconds(unixSec: number): string {
  return new Date(unixSec * 1000).toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function buildKillCsv(
  rows: FilteredKills,
  options: KillCsvOptions,
): string {
  const lines: string[] = [KILL_CSV_HEADER.join(",")];
  for (let i = 0; i < rows.count; i++) {
    const x = rows.x[i];
    const y = rows.y[i];
    const z = rows.z[i];
    const hasPosition = !(x === 0 && y === 0 && z === 0);
    const near = hasPosition ? options.nearest([x, y, z]) : null;
    lines.push(
      [
        rows.killmailIds[i],
        isoSeconds(rows.killmailTimes[i]),
        rows.shipTypes[i],
        options.shipNames.get(rows.shipTypes[i]) ?? "",
        x,
        y,
        z,
        near?.name ?? "",
        near ? Math.round(near.distance) : "",
      ]
        .map(csvField)
        .join(","),
    );
  }
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}
