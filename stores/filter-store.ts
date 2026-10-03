import { create } from "zustand";
import { FilterCondition } from "@/lib/filter/types";

interface FilterState {
  conditions: FilterCondition[];
  setConditions: (conditions: FilterCondition[]) => void;
  pruneEmptyConditions: () => void;
}

function hasSelection(c: FilterCondition): boolean {
  return c.values.length > 0 || c.warAny === true;
}

export const useFilterStore = create<FilterState>((set) => ({
  conditions: [],
  setConditions: (conditions) => set({ conditions }),
  pruneEmptyConditions: () =>
    set((s) => {
      const kept = s.conditions.filter(hasSelection);
      return kept.length === s.conditions.length ? {} : { conditions: kept };
    }),
}));

export function useFilterConditions(): FilterCondition[] {
  return useFilterStore((s) => s.conditions);
}
