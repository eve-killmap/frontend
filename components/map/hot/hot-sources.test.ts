import { describe, it, expect } from "vitest";
import { buildHotSources, HOT_MAX_FLOOR, HOT_MIN_WEIGHT } from "./hot-sources";
import { SEED_HIGH_WEIGHT } from "@/lib/sov/kernel";

const index = new Map([
  [30000142, 0],
  [30002187, 1],
]);

describe("buildHotSources", () => {
  it("gives a lone kill a faint weight, not the full weight", () => {
    const [s] = buildHotSources(new Map([[30000142, 1]]), 1, index);
    expect(s.systemIndex).toBe(0);
    expect(s.groupIndex).toBe(0);
    const expected =
      HOT_MIN_WEIGHT +
      ((SEED_HIGH_WEIGHT - HOT_MIN_WEIGHT) * Math.log1p(1)) /
        Math.log1p(HOT_MAX_FLOOR);
    expect(s.weight).toBeCloseTo(expected, 9);
    expect(s.weight).toBeGreaterThanOrEqual(HOT_MIN_WEIGHT);
    expect(s.weight).toBeLessThan(SEED_HIGH_WEIGHT / 2);
  });

  it("gives the busiest system the full weight once max is at or above the floor", () => {
    const counts = new Map([
      [30000142, 25],
      [30002187, 3],
    ]);
    const out = buildHotSources(counts, 25, index);
    const top = out.find((s) => s.systemIndex === 0)!;
    expect(top.weight).toBeCloseTo(SEED_HIGH_WEIGHT, 9);
    const low = out.find((s) => s.systemIndex === 1)!;
    expect(low.weight).toBeLessThan(top.weight);
    expect(low.weight).toBeGreaterThan(0);
  });

  it("never returns a weight below HOT_MIN_WEIGHT", () => {
    const counts = new Map([
      [30000142, 25],
      [30002187, 1],
    ]);
    const out = buildHotSources(counts, 25, index);
    for (const s of out)
      expect(s.weight).toBeGreaterThanOrEqual(HOT_MIN_WEIGHT);
  });

  it("skips zero counts and systems not on the map", () => {
    const counts = new Map([
      [30000142, 0],
      [99, 5],
    ]);
    expect(buildHotSources(counts, 5, index)).toEqual([]);
  });

  it("returns nothing when max is zero", () => {
    expect(buildHotSources(new Map(), 0, index)).toEqual([]);
  });
});
