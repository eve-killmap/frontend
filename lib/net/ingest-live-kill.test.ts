import { describe, it, expect, beforeEach } from "vitest";
import { ingestLiveKillFrame } from "./ingest-live-kill";
import { useLiveKillStore } from "@/stores/live-kill-store";

const frame = {
  killmail_id: 42,
  killmail_time: 1_700_000_000,
  v_ship_type_id: 587,
  a_character_ids: [],
  a_corporation_ids: [],
  a_alliance_ids: [],
  a_faction_ids: [],
  a_ship_type_ids: [],
  a_weapon_type_ids: [],
  solar_system_id: 30000142,
  x: 1,
  y: 2,
  z: 3,
};

beforeEach(() => useLiveKillStore.getState().reset());

describe("ingestLiveKillFrame", () => {
  it("appends a valid frame with the given receive time", () => {
    expect(ingestLiveKillFrame(JSON.stringify(frame), 1234)).toBe(true);
    const { entries } = useLiveKillStore.getState();
    expect(entries).toHaveLength(1);
    expect(entries[0].kill.killmail_id).toBe(42);
    expect(entries[0].receivedAt).toBe(1234);
  });

  it("drops malformed JSON and frames that fail validation", () => {
    expect(ingestLiveKillFrame("{not json", 1)).toBe(false);
    const { x: _x, ...noPosition } = frame;
    expect(ingestLiveKillFrame(JSON.stringify(noPosition), 1)).toBe(false);
    expect(useLiveKillStore.getState().entries).toHaveLength(0);
  });

  it("reports false for a duplicate id", () => {
    ingestLiveKillFrame(JSON.stringify(frame), 1);
    expect(ingestLiveKillFrame(JSON.stringify(frame), 2)).toBe(false);
  });
});
