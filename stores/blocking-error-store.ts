import { create } from "zustand";

interface BlockingErrorState {
  count: number;
  register: () => void;
  unregister: () => void;
}

export const useBlockingErrorStore = create<BlockingErrorState>((set) => ({
  count: 0,
  register: () => set((s) => ({ count: s.count + 1 })),
  unregister: () => set((s) => ({ count: Math.max(0, s.count - 1) })),
}));
