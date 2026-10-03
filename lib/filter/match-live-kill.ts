import { FilterAttribute, FilterCondition } from "./types";
import { LiveKillBase } from "@/lib/schema/base-schema";

function victimIdFor(
  kill: LiveKillBase,
  attribute: FilterAttribute,
): number | undefined {
  switch (attribute) {
    case "character":
      return kill.v_character_id;
    case "corporation":
      return kill.v_corporation_id;
    case "alliance":
      return kill.v_alliance_id;
    case "faction":
      return kill.v_faction_id;
    case "ship":
      return kill.v_ship_type_id;
    default:
      return undefined;
  }
}

function attackerIdsFor(
  kill: LiveKillBase,
  attribute: FilterAttribute,
): number[] {
  switch (attribute) {
    case "character":
      return kill.a_character_ids;
    case "corporation":
      return kill.a_corporation_ids;
    case "alliance":
      return kill.a_alliance_ids;
    case "faction":
      return kill.a_faction_ids;
    case "ship":
      return kill.a_ship_type_ids;
    case "weapon":
      return kill.a_weapon_type_ids;
    default:
      return [];
  }
}

function conditionMatches(
  kill: LiveKillBase,
  condition: FilterCondition,
): boolean {
  const { attribute, side, values, warAny } = condition;
  if (attribute === "war") {
    if (warAny) return kill.war_id != null;
    if (values.length === 0) return true;
    return kill.war_id != null && values.some((v) => v.id === kill.war_id);
  }
  const ids = new Set(values.map((v) => v.id));
  if (ids.size === 0) return true;
  if (attribute === "weapon")
    return kill.a_weapon_type_ids.some((id) => ids.has(id));

  const checkVictim = side === "victim" || side === "involved";
  const checkAttacker = side === "attacker" || side === "involved";
  if (checkVictim) {
    const vid = victimIdFor(kill, attribute);
    if (vid != null && ids.has(vid)) return true;
  }
  if (checkAttacker) {
    if (attackerIdsFor(kill, attribute).some((id) => ids.has(id))) return true;
  }
  return false;
}

export function killMatchesFilter(
  kill: LiveKillBase,
  conditions: FilterCondition[],
): boolean {
  if (conditions.length === 0) return true;
  return conditions.every((c) => conditionMatches(kill, c));
}
