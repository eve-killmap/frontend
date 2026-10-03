import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface GlobalSettingsState {
  triglavianFont: boolean;
  showDebugStats: boolean;
  setTriglavianFont: (v: boolean) => void;
  setShowDebugStats: (v: boolean) => void;
}

const DEFAULT_TRIGLAVIAN_FONT = true;
const DEFAULT_SHOW_DEBUG_STATS = false;

export function globalSettingsPartialize(
  s: GlobalSettingsState,
): Record<string, unknown> {
  return { triglavianFont: s.triglavianFont, showDebugStats: s.showDebugStats };
}

export function globalSettingsMerge(
  persisted: unknown,
  current: GlobalSettingsState,
): GlobalSettingsState {
  const p = (persisted ?? {}) as Record<string, unknown>;
  return {
    ...current,
    triglavianFont:
      typeof p.triglavianFont === "boolean"
        ? p.triglavianFont
        : current.triglavianFont,
    showDebugStats:
      typeof p.showDebugStats === "boolean"
        ? p.showDebugStats
        : current.showDebugStats,
  };
}

export const useGlobalSettingsStore = create<GlobalSettingsState>()(
  persist(
    (set) => ({
      triglavianFont: DEFAULT_TRIGLAVIAN_FONT,
      showDebugStats: DEFAULT_SHOW_DEBUG_STATS,
      setTriglavianFont: (triglavianFont) => set({ triglavianFont }),
      setShowDebugStats: (showDebugStats) => set({ showDebugStats }),
    }),
    {
      name: "global-settings",
      storage: createJSONStorage(() => localStorage),
      partialize: globalSettingsPartialize,
      merge: globalSettingsMerge,
    },
  ),
);
