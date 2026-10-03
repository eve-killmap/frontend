import { describe, it, expect } from "vitest";
import { freshKillsForSystem } from "./use-system-kill-feed";
import type { LiveKillEntry } from "@/stores/live-kill-store";
import type { LiveKill } from "@/lib/schema/base-schema";

function kill(id: number, systemId: number): LiveKill {
  return {
    killmail_id: id,
    killmail_time: 1_700_000_000,
    v_ship_type_id: 587,
    a_character_ids: [],
    a_corporation_ids: [],
    a_alliance_ids: [],
    a_faction_ids: [],
    a_ship_type_ids: [],
    a_weapon_type_ids: [],
    solar_system_id: systemId,
    x: 0,
    y: 0,
    z: 0,
  };
}

const entries: LiveKillEntry[] = [
  { seq: 1, kill: kill(1, 7), receivedAt: 0 },
  { seq: 2, kill: kill(2, 8), receivedAt: 0 },
  { seq: 3, kill: kill(3, 7), receivedAt: 0 },
  { seq: 4, kill: kill(4, 9), receivedAt: 0 },
];

describe("freshKillsForSystem", () => {
  it("returns this system's kills after the cursor, oldest first, and advances to the last seq seen", () => {
    const r = freshKillsForSystem(entries, 1, 7);
    expect(r.kills.map((k) => k.killmail_id)).toEqual([3]);
    expect(r.cursor).toBe(4);
  });

  it("returns nothing and keeps the cursor when no entries are new", () => {
    const r = freshKillsForSystem(entries, 4, 7);
    expect(r.kills).toEqual([]);
    expect(r.cursor).toBe(4);
  });
});
