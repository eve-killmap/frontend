import { describe, it, expect } from "vitest";
import { resolveCsvRows } from "./use-export";
import type { FilteredKills } from "@/lib/kill/kill-filter";

const someRows: FilteredKills = {
  x: [1],
  y: [2],
  z: [3],
  killmailIds: [100],
  shipTypes: [200],
  killmailTimes: [1_700_000_000],
  count: 1,
  earliestTime: 1_700_000_000,
  latestTime: 1_700_000_000,
};

describe("resolveCsvRows", () => {
  it("passes through the filtered rows when they exist", () => {
    expect(resolveCsvRows(someRows, true)).toBe(someRows);
  });

  it("throws when the dataset has never loaded", () => {
    expect(() => resolveCsvRows(null, false)).toThrow("Kills not loaded yet");
  });

  it("falls back to an empty, header-only row set for a loaded zero-kill dataset", () => {
    const rows = resolveCsvRows(null, true);
    expect(rows.count).toBe(0);
    expect(rows).toEqual({
      x: [],
      y: [],
      z: [],
      killmailIds: [],
      shipTypes: [],
      killmailTimes: [],
      count: 0,
      earliestTime: null,
      latestTime: null,
    });
  });
});
