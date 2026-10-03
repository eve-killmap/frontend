import { RGB, toLinear } from "@/lib/map/system-colors";
import { KIND_FACTION } from "./kernel";

const GOLDEN_ANGLE = 137.50776405003785;
const HUE_MIN_SEPARATION = 25;
const REPAIR_ATTEMPTS = 8;

export interface ColorOwner {
  ownerIndex: number;
  kind: number;
  id: number;
  systemCount: number;
}

export const FACTION_COLORS: Record<number, RGB> = {
  500001: toLinear([0.36, 0.44, 0.62]),
  500002: toLinear([0.62, 0.38, 0.32]),
  500003: toLinear([0.68, 0.6, 0.36]),
  500004: toLinear([0.4, 0.58, 0.44]),
  500005: toLinear([0.52, 0.52, 0.56]),
  500010: toLinear([0.58, 0.44, 0.58]),
  500011: toLinear([0.6, 0.4, 0.4]),
  500012: toLinear([0.44, 0.52, 0.6]),
  500019: toLinear([0.5, 0.46, 0.62]),
};
export const FACTION_FALLBACK: RGB = toLinear([0.5, 0.5, 0.55]);

export function mix32(x: number): number {
  let h = x >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

export function baseHsl(id: number): { h: number; s: number; l: number } {
  const h = mix32(id);
  const hue = (h % 3600) / 10;
  const s = 0.45 + ((mix32(id ^ 0x9e3779b9) % 1000) / 1000) * 0.3;
  const l = 0.35 + ((mix32(id ^ 0x7f4a7c15) % 1000) / 1000) * 0.25;
  return { h: hue, s, l };
}

function hslToRgb(h: number, s: number, l: number): RGB {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0,
    g = 0,
    b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  return [r + m, g + m, b + m];
}

function hueDist(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

export function assignColors(
  owners: ColorOwner[],
  neighbours: Map<number, Set<number>>,
): Map<number, RGB> {
  const hueByOwner = new Map<number, number>();
  const out = new Map<number, RGB>();

  for (const o of owners) {
    if (o.kind === KIND_FACTION) {
      out.set(o.ownerIndex, FACTION_COLORS[o.id] ?? FACTION_FALLBACK);
    }
  }

  const players = owners
    .filter((o) => o.kind !== KIND_FACTION)
    .sort((a, b) => b.systemCount - a.systemCount || a.id - b.id);

  for (const o of players) {
    const { h, s, l } = baseHsl(o.id);
    let hue = h;
    const nbrs = neighbours.get(o.ownerIndex);
    if (nbrs) {
      for (let attempt = 0; attempt < REPAIR_ATTEMPTS; attempt++) {
        let collides = false;
        for (const nb of nbrs) {
          const nh = hueByOwner.get(nb);
          if (nh !== undefined && hueDist(hue, nh) < HUE_MIN_SEPARATION) {
            collides = true;
            break;
          }
        }
        if (!collides) break;
        hue = (hue + GOLDEN_ANGLE) % 360;
      }
    }
    hueByOwner.set(o.ownerIndex, hue);
    out.set(o.ownerIndex, toLinear(hslToRgb(hue, s, l)));
  }

  return out;
}
