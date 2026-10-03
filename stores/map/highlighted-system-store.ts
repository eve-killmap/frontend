import { create } from "zustand";

interface HighlightedSystemState {
  highlightedSystemId: number | null;
  setHighlightedSystem: (id: number | null) => void;
}

export const useHighlightedSystemStore = create<HighlightedSystemState>(
  (set) => ({
    highlightedSystemId: null,
    setHighlightedSystem: (highlightedSystemId) => set({ highlightedSystemId }),
  }),
);
