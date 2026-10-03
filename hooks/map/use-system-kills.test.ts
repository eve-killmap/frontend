import { describe, it, expect } from "vitest";
import { buildActivityLookup } from "@/hooks/map/use-system-kills";
import { SystemKillsResponse } from "@/lib/schema/map-schema";

const data: SystemKillsResponse = {
  system_ids: [1, 2, 3, 4],
  kills: [10, 5, 100, 0],
};

describe("buildActivityLookup", () => {
  it("aggregates max/total over all systems when no scope is given", () => {
    const lookup = buildActivityLookup(data);
    expect(lookup.max).toBe(100);
    expect(lookup.total).toBe(115);
  });
  it("scopes max/total to the given system-id set", () => {
    const lookup = buildActivityLookup(data, new Set([1, 2]));
    expect(lookup.max).toBe(10);
    expect(lookup.total).toBe(15);
  });
  it("keeps countFor covering every system, even outside the scope", () => {
    const lookup = buildActivityLookup(data, new Set([1, 2]));
    expect(lookup.countFor(3)).toBe(100);
    expect(lookup.countFor(1)).toBe(10);
  });
  it("returns 0 from countFor for an unknown system", () => {
    expect(buildActivityLookup(data).countFor(999)).toBe(0);
  });
  it("yields zero aggregates when the scope excludes every system", () => {
    const lookup = buildActivityLookup(data, new Set<number>());
    expect(lookup.max).toBe(0);
    expect(lookup.total).toBe(0);
    expect(lookup.countFor(3)).toBe(100);
  });
  it("treats a null scope like no scope", () => {
    const lookup = buildActivityLookup(data, null);
    expect(lookup.max).toBe(100);
    expect(lookup.total).toBe(115);
  });
});
