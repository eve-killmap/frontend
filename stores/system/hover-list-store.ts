import { create } from "zustand";

let clearTimer: ReturnType<typeof setTimeout> | null = null;

type HoverListState = {
  activeId: number | null;
  anchor: [number, number, number];
  setActive: (id: number, anchor: [number, number, number]) => void;
  clear: () => void;
  clearDelayed: () => void;
  cancelClear: () => void;
};

export const useHoverListStore = create<HoverListState>((set) => ({
  activeId: null,
  anchor: [0, 0, 0],
  setActive: (id, anchor) => {
    if (clearTimer !== null) {
      clearTimeout(clearTimer);
      clearTimer = null;
    }
    set({ activeId: id, anchor });
  },
  clear: () => {
    if (clearTimer !== null) {
      clearTimeout(clearTimer);
      clearTimer = null;
    }
    set({ activeId: null });
  },
  clearDelayed: () => {
    if (clearTimer !== null) clearTimeout(clearTimer);
    clearTimer = setTimeout(() => {
      clearTimer = null;
      set({ activeId: null });
    }, 200);
  },
  cancelClear: () => {
    if (clearTimer !== null) {
      clearTimeout(clearTimer);
      clearTimer = null;
    }
  },
}));
