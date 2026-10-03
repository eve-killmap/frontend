import { ParsedCondition } from "./parse";
import { FilterCondition, FilterValue } from "./types";
import { makeUid } from "./uid";
import { UniverseName } from "@/lib/api/universe-names";
import { MAX_CONDITIONS, MAX_IDS_PER_CONDITION } from "@/lib/filter/serialize";

export function buildConditionsFromParsed(
  parsed: ParsedCondition[],
  entityNames: Record<number, UniverseName>,
  warValuesById: Map<number, FilterValue>,
): FilterCondition[] {
  const conditions: FilterCondition[] = [];
  for (const p of parsed) {
    if (conditions.length >= MAX_CONDITIONS) break;
    if (p.attribute === "war") {
      if (p.warAny) {
        conditions.push({
          uid: makeUid(),
          attribute: "war",
          side: undefined,
          values: [],
          warAny: true,
        });
        continue;
      }
      const warValues: FilterValue[] = [];
      for (const id of p.ids) {
        if (warValues.length >= MAX_IDS_PER_CONDITION) break;
        warValues.push(warValuesById.get(id) ?? { id, name: `War #${id}` });
      }
      if (warValues.length)
        conditions.push({
          uid: makeUid(),
          attribute: "war",
          side: undefined,
          values: warValues,
        });
      continue;
    }
    const values: FilterValue[] = [];
    for (const id of p.ids) {
      if (values.length >= MAX_IDS_PER_CONDITION) break;
      const entry = entityNames[id];
      if (entry)
        values.push({
          id,
          name: entry.name,
          image_url: entry.image_url,
          ticker: entry.ticker,
        });
    }
    if (values.length)
      conditions.push({
        uid: makeUid(),
        attribute: p.attribute,
        side: p.side,
        values,
      });
  }
  return conditions.slice(0, MAX_CONDITIONS);
}
