import { create } from "zustand";
import { OwnershipGrid } from "@/lib/sov/blobs";
import { SovData } from "@/lib/sov/build-sov-data";

interface SovStoreState {
  data: SovData | null;
  setData: (d: SovData | null) => void;
  grid: { grid: OwnershipGrid; auPerIu: number; version: number } | null;
  setGrid: (grid: OwnershipGrid, auPerIu: number) => void;
  clearGrid: () => void;
}

export const useSovStore = create<SovStoreState>((set) => ({
  data: null,
  setData: (data) => set({ data }),
  grid: null,
  setGrid: (grid, auPerIu) =>
    set((s) => ({
      grid: { grid, auPerIu, version: (s.grid?.version ?? 0) + 1 },
    })),
  clearGrid: () => set({ grid: null }),
}));
