import { create } from "zustand";

const DEFAULT_HIDDEN = Object.freeze([]);

type ItemMap = Map<number, number[]>;

type StoreState = {
  items: ItemMap;
  setHiddenNext: (next: Map<number, number[]>) => void;
};

export const useHiddenStore = create<StoreState>((set, get) => ({
  items: new Map(),

  setHiddenNext: (next) => {
    const prev = get().items;

    let changed = prev.size !== next.size;
    const merged = new Map<number, number[]>();

    for (const [id, n] of next) {
      const p = prev.get(id);
      if (p && p.length === n.length && arraysEqual(p, n)) {
        merged.set(id, p);
      } else {
        merged.set(id, n);
        changed = true;
      }
    }

    if (changed) set({ items: merged });
  },
}));

export function useHidden(id: number) {
  return useHiddenStore((s) => s.items.get(id) ?? DEFAULT_HIDDEN);
}

function arraysEqual(array: number[], array2: number[]) {
  if (array.length !== array2.length) return false;

  for (let i = 0; i < array.length; i++) {
    if (array[i] !== array2[i]) return false;
  }

  return true;
}
