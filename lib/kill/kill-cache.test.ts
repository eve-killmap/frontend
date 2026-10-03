import { describe, it, expect } from "vitest";
import { parseFreshTo, mergeKillsDedup } from "@/lib/kill/kill-cache";
import type { RawKillsResponse } from "@/lib/schema/system-schema";

function mk(ids: number[], times: number[]): RawKillsResponse {
  return {
    count: ids.length,
    killmail_ids: ids,
    x: ids.map(() => 0),
    y: ids.map(() => 0),
    z: ids.map(() => 0),
    killmail_times: times,
    ship_types: ids.map(() => 0),
  };
}

describe("parseFreshTo", () => {
  it("parses a valid epoch integer", () => {
    expect(parseFreshTo("1720000000")).toBe(1720000000);
  });
  it("trims surrounding whitespace", () => {
    expect(parseFreshTo("  1720000000  ")).toBe(1720000000);
  });
  it("returns null for a missing header", () => {
    expect(parseFreshTo(null)).toBeNull();
  });
  it("returns null for empty, non-integer, or negative values", () => {
    expect(parseFreshTo("")).toBeNull();
    expect(parseFreshTo("   ")).toBeNull();
    expect(parseFreshTo("abc")).toBeNull();
    expect(parseFreshTo("12.5")).toBeNull();
    expect(parseFreshTo("-5")).toBeNull();
  });
});

describe("mergeKillsDedup", () => {
  it("drops incoming kills whose killmail_id already exists (overlap), newest-first", () => {
    const existing = mk([3, 1], [30, 10]);
    const incoming = mk([3, 2], [30, 20]);
    const merged = mergeKillsDedup(existing, incoming);
    expect(merged.count).toBe(3);
    expect(merged.killmail_ids).toEqual([3, 2, 1]);
    expect(merged.killmail_times).toEqual([30, 20, 10]);
  });
  it("returns the existing dataset unchanged when incoming is empty", () => {
    const existing = mk([1], [10]);
    expect(mergeKillsDedup(existing, mk([], []))).toBe(existing);
  });
  it("returns the existing dataset when every incoming kill is a duplicate", () => {
    const existing = mk([2, 1], [20, 10]);
    expect(mergeKillsDedup(existing, mk([1, 2], [10, 20]))).toBe(existing);
  });
  it("sorts an unordered (since-delta) incoming batch newest-first before merging", () => {
    const existing = mk([5], [50]);
    const incoming = mk([3, 4, 2], [30, 40, 20]);
    const merged = mergeKillsDedup(existing, incoming);
    expect(merged.killmail_times).toEqual([50, 40, 30, 20]);
    expect(merged.killmail_ids).toEqual([5, 4, 3, 2]);
  });
});
