import { WarSearchResult } from "@/lib/schema/war-schema";
import { UniverseName } from "@/lib/api/universe-names";
import { secondsToDate } from "@/lib/formatting/time";

export function warParticipantIds(war: WarSearchResult): number[] {
  const ids = [
    war.aggressor_corporation_id,
    war.aggressor_alliance_id,
    war.defender_corporation_id,
    war.defender_alliance_id,
    ...war.ally_corporation_ids,
    ...war.ally_alliance_ids,
  ].filter((id): id is number => id != null);
  return Array.from(new Set(ids));
}

function sideName(
  allianceId: number | null,
  corporationId: number | null,
  names: Record<number, UniverseName>,
): string | null {
  const id = allianceId ?? corporationId;
  if (id == null) return null;
  return names[id]?.name ?? `#${id}`;
}

export function warLabel(
  war: WarSearchResult,
  names: Record<number, UniverseName>,
): string {
  const aggr = sideName(
    war.aggressor_alliance_id,
    war.aggressor_corporation_id,
    names,
  );
  const def = sideName(
    war.defender_alliance_id,
    war.defender_corporation_id,
    names,
  );
  if (!aggr && !def) return `War #${war.war_id}`;
  return `${aggr ?? "?"} vs ${def ?? "?"}`;
}

export function fmtDay(epoch: number): string {
  const d = secondsToDate(epoch);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export function warDateRange(war: WarSearchResult): string {
  const start = war.started ?? war.declared;
  if (start == null) return "";
  if (war.finished != null) return `${fmtDay(start)} – ${fmtDay(war.finished)}`;
  return `${fmtDay(start)} (Ongoing)`;
}
