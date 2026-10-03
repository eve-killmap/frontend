import { describe, it, expect } from "vitest";
import { parseZkillSystemStats } from "@/lib/schema/zkill-stats";
import { ZkillSystemStats } from "@/lib/schema/system-schema";

const valid: ZkillSystemStats = {
  shipsDestroyed: 100,
  iskDestroyed: 5_000_000_000,
  activepvp: { characters: { count: 10 }, kills: { count: 50 } },
  topLists: [
    {
      type: "shipType",
      title: "Top Ships",
      values: [{ kills: 5, id: 587, name: "Rifter" }],
    },
  ],
  months: {
    "202601": {
      year: 2026,
      month: 1,
      shipsDestroyed: 20,
      iskDestroyed: 1_000_000_000,
    },
  },
};

describe("parseZkillSystemStats", () => {
  it("passes a well-formed object through unchanged", () => {
    expect(parseZkillSystemStats(valid)).toEqual(valid);
  });

  it("returns null for non-object responses", () => {
    expect(parseZkillSystemStats(null)).toBeNull();
    expect(parseZkillSystemStats("nope")).toBeNull();
    expect(parseZkillSystemStats(42)).toBeNull();
    expect(parseZkillSystemStats(undefined)).toBeNull();
  });

  it("returns null for a top-level array", () => {
    expect(parseZkillSystemStats([{ activepvp: {}, topLists: [] }])).toBeNull();
  });

  it("normalizes a missing activepvp to an empty object", () => {
    const r = parseZkillSystemStats({ shipsDestroyed: 5, topLists: [] });
    expect(r?.activepvp).toEqual({});
  });

  it("normalizes an array/invalid activepvp to an empty object", () => {
    const r = parseZkillSystemStats({ activepvp: [1, 2], topLists: [] });
    expect(r?.activepvp).toEqual({});
  });

  it("normalizes a missing topLists to an empty array", () => {
    const r = parseZkillSystemStats({ activepvp: { kills: { count: 1 } } });
    expect(r?.topLists).toEqual([]);
  });

  it("preserves present optional fields while normalizing the non-optionals", () => {
    const r = parseZkillSystemStats({
      iskDestroyed: 7,
      months: {
        "202512": { year: 2025, month: 12, shipsDestroyed: 3, iskDestroyed: 9 },
      },
    });
    expect(r?.iskDestroyed).toBe(7);
    expect(r?.months).toEqual({
      "202512": { year: 2025, month: 12, shipsDestroyed: 3, iskDestroyed: 9 },
    });
    expect(r?.activepvp).toEqual({});
    expect(r?.topLists).toEqual([]);
  });
});
