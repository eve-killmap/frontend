import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

function fakeLocalStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (n: string) => map.get(n) ?? null,
    setItem: (n: string, v: string) => {
      map.set(n, v);
    },
    removeItem: (n: string) => {
      map.delete(n);
    },
    clear: () => {
      map.clear();
    },
  };
}

describe("resolveTimeRange", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", fakeLocalStorage());
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("returns null for all-time inputs", async () => {
    const { resolveTimeRange } = await import("@/stores/time-range-store");
    expect(resolveTimeRange(null)).toBeNull();
    expect(resolveTimeRange({ start: null, end: "latest" })).toBeNull();
  });
  it("resolves a 'latest' end to now", async () => {
    const { resolveTimeRange } = await import("@/stores/time-range-store");
    const now = Math.floor(Date.parse("2026-01-01T00:00:00Z") / 1000);
    expect(resolveTimeRange({ start: 1700000000, end: "latest" })).toEqual([
      1700000000,
      now,
    ]);
  });
  it("resolves a bounded range as-is", async () => {
    const { resolveTimeRange } = await import("@/stores/time-range-store");
    expect(resolveTimeRange({ start: 1700000000, end: 1700086400 })).toEqual([
      1700000000, 1700086400,
    ]);
  });
  it("collapses a [MIN, now] range to null", async () => {
    const { resolveTimeRange, ABSOLUTE_MIN_EPOCH } =
      await import("@/stores/time-range-store");
    expect(
      resolveTimeRange({ start: ABSOLUTE_MIN_EPOCH, end: "latest" }),
    ).toBeNull();
  });
});

describe("time-range-store persistence + pause", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", fakeLocalStorage());
    vi.resetModules();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("persists a set range, then pauses writes for a shared view and restores", async () => {
    const {
      useTimeRangeStore,
      setTimeRangePersistPaused,
      snapshotTimeRange,
      restoreTimeRange,
    } = await import("@/stores/time-range-store");

    useTimeRangeStore.getState().setRange({ start: 100, end: "latest" });
    const raw = localStorage.getItem("time-range");
    expect(raw).toContain("100");
    expect(raw).toContain("latest");

    setTimeRangePersistPaused(true);
    const snap = snapshotTimeRange();
    useTimeRangeStore.getState().setRange({ start: 999, end: "latest" });
    expect(useTimeRangeStore.getState().range).toEqual({
      start: 999,
      end: "latest",
    });
    expect(localStorage.getItem("time-range")).toBe(raw);

    restoreTimeRange(snap);
    setTimeRangePersistPaused(false);
    expect(useTimeRangeStore.getState().range).toEqual({
      start: 100,
      end: "latest",
    });
  });

  it("omits a null range from the persisted payload", async () => {
    const { useTimeRangeStore } = await import("@/stores/time-range-store");
    useTimeRangeStore.getState().setRange({ start: 5, end: "latest" });
    useTimeRangeStore.getState().setRange(null);
    const raw = localStorage.getItem("time-range");
    expect(raw).not.toContain("latest");
  });
});
