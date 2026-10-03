import { create } from "zustand";

interface LocatedKillState {
  position: [number, number, number] | null;
  setLocated: (position: [number, number, number]) => void;
  clearLocated: () => void;
}

export const useLocatedKillStore = create<LocatedKillState>((set) => ({
  position: null,
  setLocated: (position) => set({ position }),
  clearLocated: () => set({ position: null }),
}));
