import { create } from "zustand";

interface MapSystemsState {
  systemIDs: Set<number> | null;
  setSystemIDs: (ids: Set<number> | null) => void;
}

export const useMapSystemsStore = create<MapSystemsState>((set) => ({
  systemIDs: null,
  setSystemIDs: (systemIDs) => set({ systemIDs }),
}));
