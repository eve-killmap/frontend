import { create } from "zustand";
import {
  setSettingsPersistPaused,
  restoreCurrentSettings,
  type PerSystemSettings,
} from "@/stores/system/system-settings-store";
import {
  setTimeRangePersistPaused,
  restoreTimeRange,
  type PersistedTimeRange,
} from "@/stores/time-range-store";

interface SharedViewState {
  active: boolean;
  snapshot: PerSystemSettings | null;
  timeRangeSnapshot: PersistedTimeRange | null;
  resetNonce: number;
  enter: (
    snapshot: PerSystemSettings,
    timeRangeSnapshot: PersistedTimeRange | null,
  ) => void;
  exit: (fromReset?: boolean) => void;
}

export const useSharedViewStore = create<SharedViewState>((set, get) => ({
  active: false,
  snapshot: null,
  timeRangeSnapshot: null,
  resetNonce: 0,
  enter: (snapshot, timeRangeSnapshot) =>
    set({ active: true, snapshot, timeRangeSnapshot }),
  exit: (fromReset = false) => {
    if (!get().active) return;
    const snap = get().snapshot;
    if (snap) restoreCurrentSettings(snap);
    restoreTimeRange(get().timeRangeSnapshot);
    setTimeRangePersistPaused(false);
    setSettingsPersistPaused(false);
    set((s) => ({
      active: false,
      snapshot: null,
      timeRangeSnapshot: null,
      resetNonce: fromReset ? s.resetNonce + 1 : s.resetNonce,
    }));
  },
}));
