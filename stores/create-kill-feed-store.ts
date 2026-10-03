import { create, StoreApi, UseBoundStore } from "zustand";

export interface KillFeedStore<TKill, TFlash> {
  kills: TKill[];
  flashes: TFlash[];
  addKill: (kill: TKill, shouldFlash?: boolean) => void;
  removeFlash: (id: number) => void;
  reset: () => void;
}

export function createKillFeedStore<
  TKill,
  TFlash extends { id: number },
>(opts: {
  maxKills?: number;
  makeFlash: (kill: TKill) => TFlash;
}): UseBoundStore<StoreApi<KillFeedStore<TKill, TFlash>>> {
  const maxKills = opts.maxKills ?? 50;

  return create<KillFeedStore<TKill, TFlash>>((set) => ({
    kills: [],
    flashes: [],

    addKill: (kill, shouldFlash = true) =>
      set((state) => ({
        kills: [kill, ...state.kills].slice(0, maxKills),
        flashes: shouldFlash
          ? [...state.flashes, opts.makeFlash(kill)].slice(-maxKills)
          : state.flashes,
      })),

    removeFlash: (id) =>
      set((state) => ({ flashes: state.flashes.filter((f) => f.id !== id) })),

    reset: () => set({ kills: [], flashes: [] }),
  }));
}
