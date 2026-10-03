import { FilterAttribute, FilterCondition, FilterSide } from "./types";
import { ParsedCondition } from "./parse";

export const MAX_CONDITIONS = 8;
export const MAX_IDS_PER_CONDITION = 50;

const ATTRIBUTE_ORDER: FilterAttribute[] = [
  "character",
  "corporation",
  "alliance",
  "faction",
  "ship",
  "weapon",
  "war",
];
const SIDE_ORDER: FilterSide[] = ["victim", "attacker", "involved"];

function normalize(conditions: FilterCondition[]): ParsedCondition[] {
  const out: ParsedCondition[] = [];
  for (const c of conditions) {
    if (c.attribute === "war" && c.warAny) {
      out.push({ attribute: "war", warAny: true, ids: [] });
      continue;
    }
    const ids = Array.from(
      new Set(
        c.values
          .map((v) => v.id)
          .filter((id) => Number.isInteger(id) && id > 0),
      ),
    )
      .sort((a, b) => a - b)
      .slice(0, MAX_IDS_PER_CONDITION);
    if (ids.length === 0) continue;
    out.push({ attribute: c.attribute, side: c.side, ids });
  }
  out.sort((a, b) => {
    const byAttr =
      ATTRIBUTE_ORDER.indexOf(a.attribute) -
      ATTRIBUTE_ORDER.indexOf(b.attribute);
    if (byAttr !== 0) return byAttr;
    const sa = a.side ? SIDE_ORDER.indexOf(a.side) : -1;
    const sb = b.side ? SIDE_ORDER.indexOf(b.side) : -1;
    if (sa !== sb) return sa - sb;
    const n = Math.min(a.ids.length, b.ids.length);
    for (let i = 0; i < n; i++)
      if (a.ids[i] !== b.ids[i]) return a.ids[i] - b.ids[i];
    return a.ids.length - b.ids.length;
  });
  return out.slice(0, MAX_CONDITIONS);
}

function tokenFor(c: ParsedCondition): string {
  if (c.attribute === "war")
    return c.warAny ? "war:any" : `war:${c.ids.join(",")}`;
  if (c.attribute === "weapon") return `weapon:${c.ids.join(",")}`;
  return `${c.attribute}:${c.side}:${c.ids.join(",")}`;
}

export function serializeFilter(conditions: FilterCondition[]): string[] {
  return normalize(conditions).map(tokenFor);
}

export function filterTokens(conditions: FilterCondition[]): string[] {
  return serializeFilter(conditions).map((t) => `f=${t}`);
}

export function appendFilterTokens(
  existingQuery: string,
  conditions: FilterCondition[],
): string {
  const tokens = filterTokens(conditions);
  return tokens.length === 0
    ? ""
    : (existingQuery ? "&" : "?") + tokens.join("&");
}

export function filterToSearch(conditions: FilterCondition[]): string {
  return appendFilterTokens("", conditions);
}
