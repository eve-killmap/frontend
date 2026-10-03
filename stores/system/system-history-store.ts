import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const MAX_RECENTS = 8;

export function addRecent(
  recents: string[],
  slug: string,
  max = MAX_RECENTS,
): string[] {
  return [slug, ...recents.filter((s) => s !== slug)].slice(0, max);
}

export function togglePinned(pinned: string[], slug: string): string[] {
  return pinned.includes(slug)
    ? pinned.filter((s) => s !== slug)
    : [...pinned, slug];
}

interface SystemHistoryState {
  recents: string[];
  pinned: string[];
  recordVisit: (slug: string) => void;
  togglePin: (slug: string) => void;
}

export const useSystemHistoryStore = create<SystemHistoryState>()(
  persist(
    (set) => ({
      recents: [],
      pinned: [],
      recordVisit: (slug) =>
        set((s) => ({ recents: addRecent(s.recents, slug) })),
      togglePin: (slug) =>
        set((s) => ({ pinned: togglePinned(s.pinned, slug) })),
    }),
    {
      name: "system-history",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export function useIsPinned(slug: string): boolean {
  return useSystemHistoryStore((s) => s.pinned.includes(slug));
}
