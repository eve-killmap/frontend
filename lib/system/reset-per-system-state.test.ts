import { describe, it, expect } from "vitest";
import { resetPerSystemState } from "./reset-per-system-state";
import { useKillHoverStore } from "@/stores/system/kill-hover-store";

describe("resetPerSystemState", () => {
  it("clears the kill-hover state so no stale hover card survives system nav", () => {
    useKillHoverStore.getState().setHovered(123, 456, 789, [1, 2, 3]);
    expect(useKillHoverStore.getState().killId).toBe(123);
    resetPerSystemState();
    expect(useKillHoverStore.getState().killId).toBeNull();
  });
});
