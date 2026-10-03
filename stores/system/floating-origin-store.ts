import { create } from "zustand";

interface FloatingOriginState {
  origin: [number, number, number];
  setOrigin: (o: [number, number, number]) => void;
  shiftOrigin: (d: [number, number, number]) => void;
}

export const useFloatingOriginStore = create<FloatingOriginState>(
  (set, get) => ({
    origin: [0, 0, 0],
    setOrigin: (o) => set({ origin: o }),
    shiftOrigin: (d) => {
      const [ox, oy, oz] = get().origin;
      const [dx, dy, dz] = d;
      set({ origin: [ox + dx, oy + dy, oz + dz] });
    },
  }),
);
