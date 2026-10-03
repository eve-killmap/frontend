import { describe, it, expect, beforeEach } from "vitest";
import { useKillStore } from "./kill-store";

describe("useKillStore mask fields", () => {
  beforeEach(() => useKillStore.getState().reset());

  it("defaults allowedIds to null and mask flags to false", () => {
    const s = useKillStore.getState();
    expect(s.allowedIds).toBeNull();
    expect(s.filterMaskLoading).toBe(false);
    expect(s.filterMaskError).toBe(false);
  });
  it("sets and resets the mask fields", () => {
    useKillStore.getState().setAllowedIds(new Set([1, 2]));
    useKillStore.getState().setFilterMaskLoading(true);
    useKillStore.getState().setFilterMaskError(true);
    expect(useKillStore.getState().allowedIds?.size).toBe(2);
    useKillStore.getState().reset();
    expect(useKillStore.getState().allowedIds).toBeNull();
    expect(useKillStore.getState().filterMaskLoading).toBe(false);
    expect(useKillStore.getState().filterMaskError).toBe(false);
  });
});
