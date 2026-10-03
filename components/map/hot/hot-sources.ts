import { FieldSource } from "@/lib/map/field/field-renderer";
import { SEED_HIGH_WEIGHT } from "@/lib/sov/kernel";

export const HOT_MAX_FLOOR = 10;

export const HOT_MIN_WEIGHT = 15;

export function buildHotSources(
  counts: Map<number, number>,
  max: number,
  indexBySystemId: Map<number, number>,
): FieldSource[] {
  if (max <= 0) return [];
  const denom = Math.log1p(Math.max(max, HOT_MAX_FLOOR));
  const out: FieldSource[] = [];
  for (const [systemId, count] of counts) {
    if (count <= 0) continue;
    const systemIndex = indexBySystemId.get(systemId);
    if (systemIndex === undefined) continue;
    out.push({
      systemIndex,
      groupIndex: 0,
      weight:
        HOT_MIN_WEIGHT +
        ((SEED_HIGH_WEIGHT - HOT_MIN_WEIGHT) * Math.log1p(count)) / denom,
    });
  }
  return out;
}
