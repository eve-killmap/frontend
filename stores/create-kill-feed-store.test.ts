import { describe, it, expect } from "vitest";
import { createKillFeedStore } from "@/stores/create-kill-feed-store";

interface TestKill {
  killmail_id: number;
  ship: number;
}
interface TestFlash {
  id: number;
  ship: number;
}

function makeStore(maxKills?: number) {
  return createKillFeedStore<TestKill, TestFlash>({
    maxKills,
    makeFlash: (k) => ({ id: k.killmail_id, ship: k.ship }),
  });
}

describe("createKillFeedStore", () => {
  it("prepends newest kills and caps at maxKills", () => {
    const useStore = makeStore(3);
    for (let i = 1; i <= 5; i++)
      useStore.getState().addKill({ killmail_id: i, ship: 100 });
    expect(useStore.getState().kills.map((k) => k.killmail_id)).toEqual([
      5, 4, 3,
    ]);
  });

  it("defaults maxKills to 50", () => {
    const useStore = makeStore();
    for (let i = 0; i < 60; i++)
      useStore.getState().addKill({ killmail_id: i, ship: 1 });
    expect(useStore.getState().kills.length).toBe(50);
  });

  it("flashes by default and derives the flash via makeFlash", () => {
    const useStore = makeStore();
    useStore.getState().addKill({ killmail_id: 7, ship: 42 });
    expect(useStore.getState().flashes).toEqual([{ id: 7, ship: 42 }]);
  });

  it("does not flash when shouldFlash is false but still adds the kill", () => {
    const useStore = makeStore();
    useStore.getState().addKill({ killmail_id: 7, ship: 42 }, false);
    expect(useStore.getState().flashes).toEqual([]);
    expect(useStore.getState().kills.length).toBe(1);
  });

  it("removeFlash drops only the matching flash", () => {
    const useStore = makeStore();
    useStore.getState().addKill({ killmail_id: 1, ship: 1 });
    useStore.getState().addKill({ killmail_id: 2, ship: 2 });
    useStore.getState().removeFlash(1);
    expect(useStore.getState().flashes.map((f) => f.id)).toEqual([2]);
  });

  it("reset clears kills and flashes", () => {
    const useStore = makeStore();
    useStore.getState().addKill({ killmail_id: 1, ship: 1 });
    useStore.getState().reset();
    expect(useStore.getState()).toMatchObject({ kills: [], flashes: [] });
  });
});

describe("createKillFeedStore flashes cap", () => {
  it("caps flashes at maxKills, holding the most recent", () => {
    const useStore = createKillFeedStore<{ id: number }, { id: number }>({
      maxKills: 3,
      makeFlash: (k) => ({ id: k.id }),
    });
    for (let i = 1; i <= 5; i++) useStore.getState().addKill({ id: i }, true);
    const flashes = useStore.getState().flashes;
    expect(flashes).toHaveLength(3);
    expect(flashes.map((f) => f.id)).toEqual([3, 4, 5]);
  });
});
