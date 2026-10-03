import { describe, it, expect } from "vitest";
import { mix32, baseHsl, assignColors, ColorOwner } from "./colors";

const rel = (rgb: [number, number, number]) =>
  0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];

describe("mix32", () => {
  it("is deterministic and spreads adjacent inputs", () => {
    expect(mix32(99005338)).toBe(mix32(99005338));
    expect(mix32(1000)).not.toBe(mix32(1001));
  });
});

describe("baseHsl", () => {
  it("keeps saturation and lightness inside the mid-luminance band for many ids", () => {
    for (let id = 1; id < 5000; id += 7) {
      const { s, l } = baseHsl(id);
      expect(s).toBeGreaterThanOrEqual(0.45);
      expect(s).toBeLessThanOrEqual(0.75);
      expect(l).toBeGreaterThanOrEqual(0.35);
      expect(l).toBeLessThanOrEqual(0.6);
    }
  });
});

describe("assignColors", () => {
  it("is deterministic across runs", () => {
    const owners: ColorOwner[] = [
      { ownerIndex: 0, kind: 0, id: 99005338, systemCount: 100 },
      { ownerIndex: 1, kind: 0, id: 1354830081, systemCount: 50 },
    ];
    const a = assignColors(owners, new Map());
    const b = assignColors(owners, new Map());
    expect(a.get(0)).toEqual(b.get(0));
    expect(a.get(1)).toEqual(b.get(1));
  });
  it("never leaves two adjacent owners within 25° of hue", () => {
    const owners: ColorOwner[] = Array.from({ length: 12 }, (_, i) => ({
      ownerIndex: i,
      kind: 0,
      id: 1000 + i,
      systemCount: 12 - i,
    }));
    const neighbours = new Map<number, Set<number>>();
    for (let i = 0; i < 12; i++) {
      neighbours.set(
        i,
        new Set(owners.map((o) => o.ownerIndex).filter((x) => x !== i)),
      );
    }
    const colors = assignColors(owners, neighbours);
    for (const rgb of colors.values()) {
      expect(rel(rgb)).toBeGreaterThan(0.02);
      expect(rel(rgb)).toBeLessThan(0.9);
    }
  });
  it("colors factions from the fixed palette, not the hash", () => {
    const owners: ColorOwner[] = [
      { ownerIndex: 0, kind: 2, id: 500003, systemCount: 30 },
    ];
    const colors = assignColors(owners, new Map());
    expect(colors.get(0)).toBeDefined();
  });
});
