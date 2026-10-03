import { FilterAttribute, FilterSide } from "./types";

export interface ParsedCondition {
  attribute: FilterAttribute;
  side?: FilterSide;
  ids: number[];
  warAny?: boolean;
}

const ENTITY_ATTRS = new Set([
  "character",
  "corporation",
  "alliance",
  "faction",
  "ship",
]);
const SIDES = new Set(["victim", "attacker", "involved"]);

function parseIds(raw: string): number[] {
  const ids: number[] = [];
  for (const part of raw.split(",")) {
    if (!/^[0-9]+$/.test(part)) continue;
    const n = Number(part);
    if (Number.isInteger(n) && n > 0 && n <= Number.MAX_SAFE_INTEGER)
      ids.push(n);
  }
  return Array.from(new Set(ids)).sort((a, b) => a - b);
}

export function parseFilterParams(params: URLSearchParams): ParsedCondition[] {
  const out: ParsedCondition[] = [];
  for (const raw of params.getAll("f")) {
    const parts = raw.split(":");
    const attr = parts[0];
    if (attr === "war") {
      if (parts[1] === "any") {
        out.push({ attribute: "war", warAny: true, ids: [] });
        continue;
      }
      const ids = parseIds(parts[1] ?? "");
      if (ids.length) out.push({ attribute: "war", ids });
      continue;
    }
    if (attr === "weapon") {
      const ids = parseIds(parts[1] ?? "");
      if (ids.length) out.push({ attribute: "weapon", ids });
      continue;
    }
    if (ENTITY_ATTRS.has(attr) && SIDES.has(parts[1])) {
      const ids = parseIds(parts[2] ?? "");
      if (ids.length)
        out.push({
          attribute: attr as FilterAttribute,
          side: parts[1] as FilterSide,
          ids,
        });
    }
  }
  return out;
}
