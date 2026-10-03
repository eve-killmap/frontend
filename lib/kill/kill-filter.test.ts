import { describe, it, expect } from "vitest";
import {
  countMissingPositions,
  filterKills,
  maskKillmailTimes,
  withinRangeFilter,
  killPassesViewFilters,
  RangeFilter,
} from "@/lib/kill/kill-filter";
import { RawKillsResponse } from "@/lib/schema/system-schema";

function src(): RawKillsResponse {
  return {
    count: 4,
    killmail_ids: [1, 2, 3, 4],
    x: [0, 100, 200, 0],
    y: [0, 0, 0, 0],
    z: [0, 0, 0, 0],
    killmail_times: [400, 300, 200, 100],
    ship_types: [10, 20, 10, 30],
  };
}

describe("countMissingPositions", () => {
  it("counts rows at the origin", () => {
    expect(countMissingPositions(src())).toBe(2);
  });
});

describe("filterKills", () => {
  it("fast path returns copies of the source arrays with latest/earliest", () => {
    const s = src();
    const r = filterKills(s, null, null, 1000, null);
    expect(r.count).toBe(4);
    expect(r.x).toEqual(s.x);
    expect(r.x).not.toBe(s.x);
    expect(r.killmailIds).toEqual(s.killmail_ids);
    expect(r.killmailIds).not.toBe(s.killmail_ids);
    expect(r.latestTime).toBe(400);
    expect(r.earliestTime).toBe(100);
  });

  it("filters by time range", () => {
    const r = filterKills(src(), [200, 350], null, 1000, null);
    expect(r.count).toBe(2);
    expect(r.killmailIds).toEqual([2, 3]);
    expect(r.latestTime).toBe(300);
    expect(r.earliestTime).toBe(200);
  });

  it("filters by ship type set", () => {
    const r = filterKills(src(), null, new Set([10]), 1000, null);
    expect(r.count).toBe(2);
    expect(r.killmailIds).toEqual([1, 3]);
  });

  it("truncates to maxKills keeping newest", () => {
    const r = filterKills(src(), [0, 1000], null, 2, null);
    expect(r.count).toBe(2);
    expect(r.killmailIds).toEqual([1, 2]);
  });

  it("applies a spatial range filter", () => {
    const rf: RangeFilter = {
      positions: new Float64Array([0, 0, 0]),
      rangeSq: 150 * 150,
    };
    const r = filterKills(src(), null, null, 1000, rf);
    expect(r.killmailIds.sort()).toEqual([1, 2, 4]);
  });

  it("returns nothing when the range filter has no positions", () => {
    const rf: RangeFilter = { positions: new Float64Array([]), rangeSq: 100 };
    const r = filterKills(src(), null, null, 1000, rf);
    expect(r.count).toBe(0);
    expect(r.latestTime).toBeNull();
  });
});

describe("filterKills allowedIds mask", () => {
  function srcForMask(): RawKillsResponse {
    return {
      count: 3,
      killmail_ids: [100, 200, 300],
      x: [1, 2, 3],
      y: [0, 0, 0],
      z: [0, 0, 0],
      killmail_times: [3000, 2000, 1000],
      ship_types: [587, 588, 587],
    };
  }

  it("keeps only kills whose killmail id is in the allowed set", () => {
    const out = filterKills(
      srcForMask(),
      null,
      null,
      1000,
      null,
      new Set([100, 300]),
    );
    expect(out.count).toBe(2);
    expect(out.killmailIds).toEqual([100, 300]);
  });
  it("an empty allowed set yields zero kills", () => {
    const out = filterKills(srcForMask(), null, null, 1000, null, new Set());
    expect(out.count).toBe(0);
  });
  it("AND's with the ship-type filter", () => {
    const out = filterKills(
      srcForMask(),
      null,
      new Set([587]),
      1000,
      null,
      new Set([100, 200, 300]),
    );
    expect(out.killmailIds).toEqual([100, 300]);
  });
  it("a mask forces the compacting path even under the cap (no uncopied fast-path)", () => {
    const s = srcForMask();
    const out = filterKills(
      s,
      null,
      null,
      1000,
      null,
      new Set([100, 200, 300]),
    );
    expect(out.killmailIds).not.toBe(s.killmail_ids);
    expect(out.killmailIds).toEqual([100, 200, 300]);
  });
  it("null mask leaves results unfiltered (fast-path)", () => {
    const s = srcForMask();
    const out = filterKills(s, null, null, 1000, null, null);
    expect(out.count).toBe(3);
  });
});

describe("maskKillmailTimes", () => {
  function srcForMask(): RawKillsResponse {
    return {
      count: 3,
      killmail_ids: [100, 200, 300],
      x: [1, 2, 3],
      y: [0, 0, 0],
      z: [0, 0, 0],
      killmail_times: [3000, 2000, 1000],
      ship_types: [587, 588, 587],
    };
  }

  it("returns the full times array (no copy) when all masks are null", () => {
    const s = srcForMask();
    expect(maskKillmailTimes(s, null, null, null)).toBe(s.killmail_times);
  });
  it("projects the times of only the allowed ids, in source order", () => {
    expect(
      maskKillmailTimes(srcForMask(), new Set([100, 300]), null, null),
    ).toEqual([3000, 1000]);
  });
  it("masks by ship types", () => {
    expect(maskKillmailTimes(srcForMask(), null, new Set([587]), null)).toEqual(
      [3000, 1000],
    );
  });
  it("masks by the spatial range filter", () => {
    const rf: RangeFilter = {
      positions: new Float64Array([1, 0, 0]),
      rangeSq: 0.25,
    };
    expect(maskKillmailTimes(srcForMask(), null, null, rf)).toEqual([3000]);
  });
  it("intersects all three masks", () => {
    const rf: RangeFilter = {
      positions: new Float64Array([1, 0, 0]),
      rangeSq: 0.25,
    };
    expect(
      maskKillmailTimes(srcForMask(), new Set([100, 300]), new Set([587]), rf),
    ).toEqual([3000]);
  });
  it("returns [] when the range filter has no selected object", () => {
    const rf: RangeFilter = { positions: new Float64Array([]), rangeSq: 1 };
    expect(maskKillmailTimes(srcForMask(), null, null, rf)).toEqual([]);
  });
});

describe("withinRangeFilter", () => {
  const rf: RangeFilter = {
    positions: new Float64Array([0, 0, 0, 100, 0, 0]),
    rangeSq: 25,
  };
  it("is true within radius of any selected object (boundary inclusive)", () => {
    expect(withinRangeFilter(3, 0, 0, rf)).toBe(true);
    expect(withinRangeFilter(98, 0, 0, rf)).toBe(true);
    expect(withinRangeFilter(5, 0, 0, rf)).toBe(true);
  });
  it("is false when out of range of every object", () => {
    expect(withinRangeFilter(50, 0, 0, rf)).toBe(false);
  });
  it("is false when no object is selected", () => {
    expect(
      withinRangeFilter(0, 0, 0, {
        positions: new Float64Array([]),
        rangeSq: 1,
      }),
    ).toBe(false);
  });
});

describe("killPassesViewFilters", () => {
  const near: RangeFilter = {
    positions: new Float64Array([0, 0, 0]),
    rangeSq: 25,
  };
  it("passes when no view filters are active", () => {
    expect(
      killPassesViewFilters(
        { v_ship_type_id: 587, x: 999, y: 0, z: 0 },
        null,
        null,
      ),
    ).toBe(true);
  });
  it("fails when the ship type is not selected", () => {
    expect(
      killPassesViewFilters(
        { v_ship_type_id: 588, x: 0, y: 0, z: 0 },
        new Set([587]),
        null,
      ),
    ).toBe(false);
  });
  it("fails when out of the spatial range", () => {
    expect(
      killPassesViewFilters(
        { v_ship_type_id: 587, x: 999, y: 0, z: 0 },
        null,
        near,
      ),
    ).toBe(false);
  });
  it("passes when it satisfies both view filters", () => {
    expect(
      killPassesViewFilters(
        { v_ship_type_id: 587, x: 3, y: 0, z: 0 },
        new Set([587]),
        near,
      ),
    ).toBe(true);
  });
});
