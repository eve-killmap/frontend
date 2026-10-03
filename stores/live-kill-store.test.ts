import { describe, it, expect, beforeEach } from "vitest";
import type { LiveKill } from "@/lib/schema/base-schema";
import {
  useLiveKillStore,
  expireEntries,
  entriesAfter,
  killsForSystem,
  hotCounts,
  HOT_WINDOW_MS,
  LIVE_KILL_CAP,
  type LiveKillEntry,
} from "./live-kill-store";

function kill(id: number, systemId = 30000142): LiveKill {
  return {
    killmail_id: id,
    killmail_time: 1_700_000_000 + id,
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

function entry(
  seq: number,
  receivedAt: number,
  systemId?: number,
): LiveKillEntry {
  return { seq, kill: kill(seq, systemId), receivedAt };
}

beforeEach(() => {
  useLiveKillStore.getState().reset();
});

describe("expireEntries", () => {
  it("drops entries older than the window and keeps the rest in order", () => {
    const now = 10_000_000;
    const entries = [
      entry(1, now - HOT_WINDOW_MS - 1),
      entry(2, now - HOT_WINDOW_MS),
      entry(3, now),
    ];
    expect(expireEntries(entries, now).map((e) => e.seq)).toEqual([2, 3]);
  });

  it("returns the same array reference when nothing expires", () => {
    const entries = [entry(1, 5000)];
    expect(expireEntries(entries, 6000)).toBe(entries);
  });
});

describe("entriesAfter", () => {
  it("returns only entries with seq greater than the cursor", () => {
    const entries = [entry(1, 0), entry(2, 0), entry(3, 0)];
    expect(entriesAfter(entries, 1).map((e) => e.seq)).toEqual([2, 3]);
    expect(entriesAfter(entries, 3)).toEqual([]);
    expect(entriesAfter(entries, 0)).toHaveLength(3);
  });
});

describe("killsForSystem", () => {
  it("filters by system and returns newest first", () => {
    const entries = [entry(1, 0, 1), entry(2, 0, 2), entry(3, 0, 1)];
    expect(killsForSystem(entries, 1).map((k) => k.killmail_id)).toEqual([
      3, 1,
    ]);
  });
});

describe("hotCounts", () => {
  it("counts in-window kills per system on the current map only", () => {
    const now = 10_000_000;
    const entries = [
      entry(1, now, 1),
      entry(2, now, 1),
      entry(3, now, 2),
      entry(4, now, 99),
      entry(5, now - HOT_WINDOW_MS - 1, 1),
    ];
    const r = hotCounts(entries, now, new Set([1, 2]));
    expect(r.counts.get(1)).toBe(2);
    expect(r.counts.get(2)).toBe(1);
    expect(r.counts.has(99)).toBe(false);
    expect(r.max).toBe(2);
    expect(r.tracked).toBe(3);
  });

  it("is empty for no entries", () => {
    const r = hotCounts([], 0, new Set([1]));
    expect(r.counts.size).toBe(0);
    expect(r.max).toBe(0);
    expect(r.tracked).toBe(0);
  });
});

describe("useLiveKillStore", () => {
  it("appends with increasing seq and bumps version", () => {
    const s = useLiveKillStore.getState();
    expect(s.append(kill(1), 100)).toBe(true);
    expect(s.append(kill(2), 200)).toBe(true);
    const { entries, version } = useLiveKillStore.getState();
    expect(entries.map((e) => e.seq)).toEqual([1, 2]);
    expect(entries[1].receivedAt).toBe(200);
    expect(version).toBe(2);
  });

  it("ignores a duplicate killmail id", () => {
    const s = useLiveKillStore.getState();
    s.append(kill(1), 100);
    expect(s.append(kill(1), 200)).toBe(false);
    expect(useLiveKillStore.getState().entries).toHaveLength(1);
    expect(useLiveKillStore.getState().version).toBe(1);
  });

  it("caps the ring at LIVE_KILL_CAP, dropping the oldest, and lets a dropped id return", () => {
    const s = useLiveKillStore.getState();
    for (let i = 1; i <= LIVE_KILL_CAP + 1; i++) s.append(kill(i), i);
    const { entries } = useLiveKillStore.getState();
    expect(entries).toHaveLength(LIVE_KILL_CAP);
    expect(entries[0].kill.killmail_id).toBe(2);
    expect(useLiveKillStore.getState().append(kill(1), 1)).toBe(true);
  });

  it("expire drops old entries and bumps version only when something changed", () => {
    const s = useLiveKillStore.getState();
    s.append(kill(1), 0);
    s.append(kill(2), HOT_WINDOW_MS);
    const v = useLiveKillStore.getState().version;
    useLiveKillStore.getState().expire(HOT_WINDOW_MS + 1);
    expect(useLiveKillStore.getState().entries.map((e) => e.seq)).toEqual([2]);
    expect(useLiveKillStore.getState().version).toBe(v + 1);
    useLiveKillStore.getState().expire(HOT_WINDOW_MS + 2);
    expect(useLiveKillStore.getState().version).toBe(v + 1);
    expect(useLiveKillStore.getState().append(kill(1), HOT_WINDOW_MS + 2)).toBe(
      true,
    );
  });

  it("setConnected and reset", () => {
    useLiveKillStore.getState().setConnected(true);
    useLiveKillStore.getState().append(kill(1), 1);
    expect(useLiveKillStore.getState().connected).toBe(true);
    useLiveKillStore.getState().reset();
    expect(useLiveKillStore.getState()).toMatchObject({
      entries: [],
      connected: false,
      version: 0,
    });
  });
});
