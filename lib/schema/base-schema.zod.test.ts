import { describe, it, expect } from "vitest";
import {
  LiveKillSchema,
  TypeMetasSchema,
  UniverseStatusSchema,
  type LiveKill,
} from "./base-schema";

describe("UniverseStatusSchema", () => {
  it("accepts the online frame with a player count", () => {
    expect(
      UniverseStatusSchema.parse({ online: true, players: 28431 }),
    ).toEqual({ online: true, players: 28431 });
  });

  it("accepts the offline frame with no player count", () => {
    expect(UniverseStatusSchema.parse({ online: false })).toEqual({
      online: false,
    });
  });

  it("rejects a missing online flag and a non-numeric player count", () => {
    expect(UniverseStatusSchema.safeParse({ players: 1 }).success).toBe(false);
    expect(
      UniverseStatusSchema.safeParse({ online: true, players: "many" }).success,
    ).toBe(false);
  });
});

describe("TypeMetasSchema", () => {
  it("accepts a meta id to type ids record", () => {
    const v = { "2": [11993, 12003], "53": [47119] };
    expect(TypeMetasSchema.parse(v)).toEqual(v);
  });

  it("accepts an empty record", () => {
    expect(TypeMetasSchema.parse({})).toEqual({});
  });

  it("rejects a non-array value and non-integer type ids", () => {
    expect(TypeMetasSchema.safeParse({ "2": 11993 }).success).toBe(false);
    expect(TypeMetasSchema.safeParse({ "2": [11993.5] }).success).toBe(false);
    expect(TypeMetasSchema.safeParse({ "2": ["11993"] }).success).toBe(false);
  });
});

const validLiveKill: LiveKill = {
  killmail_id: 123456789,
  killmail_time: 1_700_000_000,
  v_ship_type_id: 587,
  a_character_ids: [],
  a_corporation_ids: [],
  a_alliance_ids: [],
  a_faction_ids: [],
  a_ship_type_ids: [],
  a_weapon_type_ids: [],
  solar_system_id: 30002813,
  x: 1.5,
  y: -2.5,
  z: 3e12,
};

describe("LiveKillSchema (unified)", () => {
  it("accepts the shared base plus system id and position", () => {
    const result = LiveKillSchema.safeParse(validLiveKill);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(validLiveKill);
  });

  it.each(["solar_system_id", "x", "y", "z", "killmail_id"] as const)(
    "rejects a frame missing %s",
    (key) => {
      const frame: Record<string, unknown> = { ...validLiveKill };
      delete frame[key];
      expect(LiveKillSchema.safeParse(frame).success).toBe(false);
    },
  );

  it("rejects a wrong-typed field", () => {
    expect(
      LiveKillSchema.safeParse({ ...validLiveKill, v_ship_type_id: "x" })
        .success,
    ).toBe(false);
  });

  it("accepts a frame with every optional field populated", () => {
    const populated: LiveKill = {
      ...validLiveKill,
      v_ship_name: "Rifter",
      v_character_id: 111,
      v_character_name: "Some Pilot",
      v_corporation_id: 222,
      v_corporation_name: "Some Corp",
      v_alliance_id: 333,
      v_alliance_name: "Some Alliance",
      v_faction_id: 444,
      v_faction_name: "Some Faction",
      fb_ship_type_id: 555,
      fb_ship_name: "Punisher",
      fb_character_id: 666,
      fb_character_name: "Final Blow Pilot",
      fb_corporation_id: 777,
      fb_corporation_name: "Final Blow Corp",
      fb_alliance_id: 888,
      fb_alliance_name: "Final Blow Alliance",
      fb_faction_id: 999,
      fb_faction_name: "Final Blow Faction",
      war_id: 1010,
      a_character_ids: [111, 666],
      a_corporation_ids: [222, 777],
      a_alliance_ids: [333, 888],
      a_faction_ids: [444, 999],
      a_ship_type_ids: [587, 597],
      a_weapon_type_ids: [2456, 2488],
      fitted_value: 1_000_000,
      dropped_value: 500_000,
      destroyed_value: 1_500_000,
      total_value: 2_000_000,
      total_droppable_value: 500_000,
      npc: false,
      solo: true,
      awox: false,
      labels: ["cat:5", "loc:lowsec"],
    };
    const result = LiveKillSchema.safeParse(populated);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(populated);
  });
});
