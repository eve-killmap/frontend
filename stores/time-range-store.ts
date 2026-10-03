import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nowSeconds } from "@/lib/formatting/time";

export const ABSOLUTE_MIN_EPOCH = 1446508800;

export interface PersistedTimeRange {
  start: number | null;
  end: number | "latest";
}

export function resolveTimeRange(
  p: PersistedTimeRange | null | undefined,
): [number, number] | null {
  if (!p) return null;
  const now = nowSeconds();
  const start = p.start ?? ABSOLUTE_MIN_EPOCH;
  const end = p.end === "latest" ? now : p.end;
  if (start <= ABSOLUTE_MIN_EPOCH && end >= now) return null;
  return [start, end];
}

interface TimeRangeState {
  range: PersistedTimeRange | null;
  setRange: (range: PersistedTimeRange | null) => void;
}

let persistPaused = false;
const hasLocalStorage = () => typeof localStorage !== "undefined";
const guardedLocalStorage = {
  getItem: (name: string) =>
    hasLocalStorage() ? localStorage.getItem(name) : null,
  setItem: (name: string, value: string) => {
    if (!persistPaused && hasLocalStorage()) localStorage.setItem(name, value);
  },
  removeItem: (name: string) => {
    if (hasLocalStorage()) localStorage.removeItem(name);
  },
};

export function setTimeRangePersistPaused(paused: boolean): void {
  persistPaused = paused;
}

export const useTimeRangeStore = create<TimeRangeState>()(
  persist(
    (set) => ({
      range: null,
      setRange: (range) => set({ range }),
    }),
    {
      name: "time-range",
      storage: createJSONStorage(() => guardedLocalStorage),
      partialize: (s) => (s.range ? { range: s.range } : {}),
    },
  ),
);

export function snapshotTimeRange(): PersistedTimeRange | null {
  return useTimeRangeStore.getState().range;
}
export function restoreTimeRange(range: PersistedTimeRange | null): void {
  useTimeRangeStore.getState().setRange(range);
}
