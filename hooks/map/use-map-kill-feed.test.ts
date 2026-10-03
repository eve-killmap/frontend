import { describe, it, expect } from "vitest";
import { processMapFeedEntries } from "./use-map-kill-feed";
import type { LiveKillEntry } from "@/stores/live-kill-store";
import type { LiveKill } from "@/lib/schema/base-schema";
import type { FilterCondition } from "@/lib/filter/types";

function kill(id: number, victimCorp: number): LiveKill {
  return {
    killmail_id: id,
    killmail_time: 1_700_000_000,
    v_ship_type_id: 587,
    v_corporation_id: victimCorp,
    a_character_ids: [],
    a_corporation_ids: [],
    a_alliance_ids: [],
    a_faction_ids: [],
    a_ship_type_ids: [],
    a_weapon_type_ids: [],
    solar_system_id: 30000142,
    x: 0,
    y: 0,
    z: 0,
  };
}

const entries: LiveKillEntry[] = [
  { seq: 1, kill: kill(1, 100), receivedAt: 0 },
  { seq: 2, kill: kill(2, 200), receivedAt: 0 },
  { seq: 3, kill: kill(3, 100), receivedAt: 0 },
];

const corp100: FilterCondition[] = [
  {
    uid: "c1",
    attribute: "corporation",
    side: "victim",
    values: [{ id: 100, name: "Corp 100" }],
  },
];

describe("processMapFeedEntries", () => {
  it("adds only entries after the cursor and returns the new cursor", () => {
    const added: number[] = [];
    const next = processMapFeedEntries(entries, 1, [], (k) =>
      added.push(k.killmail_id),
    );
    expect(added).toEqual([2, 3]);
    expect(next).toBe(3);
  });

  it("keeps the cursor when nothing is new", () => {
    expect(processMapFeedEntries(entries, 3, [], () => {})).toBe(3);
  });

  it("flashes only kills matching the active filter", () => {
    const flashes: [number, boolean][] = [];
    processMapFeedEntries(entries, 0, corp100, (k, flash) =>
      flashes.push([k.killmail_id, flash]),
    );
    expect(flashes).toEqual([
      [1, true],
      [2, false],
      [3, true],
    ]);
  });
});
