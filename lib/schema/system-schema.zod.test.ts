import { describe, it, expect } from "vitest";
import {
  BuildInfoSchema,
  FarthestKillDataSchema,
  KillDetailSchema,
  SlugIndexSchema,
  SovDataSchema,
  SystemDataSchema,
  SystemJumpCountSchema,
  SystemKillsFilteredResponseSchema,
  TypeDataSchema,
} from "./system-schema.zod";
import { BuildInfo } from "./base-schema";
import {
  FarthestKillData,
  KillDetail,
  MoonData,
  PlanetData,
  SlugIndex,
  SystemData,
  TypeData,
} from "./system-schema";

const validSystem: SystemData = {
  solarSystemID: 30000142,
  constellationName: "Kimotoro",
  name: "Jita",
  farthestObject: 123456,
  radius: 987654,
  regionName: "The Forge",
  securityStatus: 0.9459,
  sovFactionName: "Caldari State",
  star: {
    starID: 40000001,
    radius: 500000,
    warpPosition: { x: 0, y: 0, z: 0 },
  },
  stations: [
    {
      stationID: 60003760,
      name: "Jita IV - Moon 4 - Caldari Navy Assembly Plant",
      typeID: 1531,
      position: { x: 1, y: 2, z: 3 },
    },
  ],
  stargates: [
    {
      stargateID: 50000342,
      destName: "Stargate (Perimeter)",
      typeID: 29624,
      jumpType: 1,
      position: { x: 10, y: 20, z: 30 },
      position2D: { x: 1.5, y: -2.5 },
    },
  ],
  disruptedStargates: [
    {
      stargateID: 50000343,
      destName: "Stargate (Urlen)",
      typeID: 29624,
      position: { x: -10, y: -20, z: -30 },
    },
  ],
  planets: [
    {
      planetID: 40000001,
      celestialIndex: 1,
      radius: 4000,
      uniqueName: "Jita I",
      position: { x: 100, y: 200, z: 300 },
      warpPosition: { x: 101, y: 201, z: 301 },
      asteroidBelts: [
        {
          asteroidBeltID: 40000010,
          orbitIndex: 1,
          radius: 500,
          uniqueName: "Jita I - Asteroid Belt 1",
          position: { x: 400, y: 500, z: 600 },
          warpPosition: { x: 401, y: 501, z: 601 },
        },
      ],
      moons: [
        {
          moonID: 40000020,
          radius: 300,
          orbitIndex: 1,
          uniqueName: "Jita I - Moon 1",
          position: { x: 700, y: 800, z: 900 },
          warpPosition: { x: 701, y: 801, z: 901 },
          miningBeacon: { x: 702, y: 802, z: 902 },
          stations: [
            {
              stationID: 60003761,
              name: "Jita I - Moon 1 - Test Station",
              typeID: 1532,
              position: { x: 703, y: 803, z: 903 },
            },
          ],
        },
      ],
      stations: [
        {
          stationID: 60003762,
          name: "Jita I - Test Planet Station",
          typeID: 1533,
          position: { x: 704, y: 804, z: 904 },
        },
      ],
    },
  ],
};

describe("SystemDataSchema", () => {
  it("accepts a well-formed, fully-nested system payload", () => {
    const result = SystemDataSchema.safeParse(validSystem);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(validSystem);
  });

  it("accepts a minimal system payload with all optional fields omitted", () => {
    const minimal: SystemData = {
      solarSystemID: 30000001,
      constellationName: "Some Constellation",
      name: "Some System",
      farthestObject: 1,
      radius: 1,
      regionName: "Some Region",
      securityStatus: 1,
    };
    const result = SystemDataSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });

  it("rejects a system payload missing name", () => {
    const { name: _name, ...rest } = validSystem;
    const result = SystemDataSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects a system payload whose planet is missing position", () => {
    const [planet] = validSystem.planets as PlanetData[];
    const { position: _position, ...planetRest } = planet;
    const result = SystemDataSchema.safeParse({
      ...validSystem,
      planets: [planetRest],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a system payload whose moon is missing warpPosition", () => {
    const [planet] = validSystem.planets as PlanetData[];
    const [moon] = planet.moons as MoonData[];
    const { warpPosition: _warpPosition, ...moonRest } = moon;
    const result = SystemDataSchema.safeParse({
      ...validSystem,
      planets: [{ ...planet, moons: [moonRest] }],
    });
    expect(result.success).toBe(false);
  });
});

const validTypeData: TypeData = {
  brackets: { "1": "small" },
  groupNames: { "25": "Frigate" },
  typeBrackets: { "587": 1 },
  typeNames: { "587": "Rifter" },
  typeTree: { "587": [25, 26, 27] },
  typeRadii: { "587": 35 },
  npcTypes: [1, 2, 3],
};

describe("TypeDataSchema", () => {
  it("accepts a well-formed type-data payload", () => {
    const result = TypeDataSchema.safeParse(validTypeData);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(validTypeData);
  });

  it("rejects a payload whose typeTree value isn't number[]", () => {
    const result = TypeDataSchema.safeParse({
      ...validTypeData,
      typeTree: { "587": "not-an-array" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects a payload missing npcTypes", () => {
    const { npcTypes: _npcTypes, ...rest } = validTypeData;
    const result = TypeDataSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe("SlugIndexSchema", () => {
  it("accepts a well-formed slug index", () => {
    const valid: SlugIndex = { jita: 30000142, amarr: 30002187 };
    const result = SlugIndexSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(valid);
  });

  it("rejects a slug index with a non-numeric value", () => {
    const result = SlugIndexSchema.safeParse({ jita: "30000142" });
    expect(result.success).toBe(false);
  });
});

describe("FarthestKillDataSchema", () => {
  it("accepts a well-formed farthest-kill payload", () => {
    const valid: FarthestKillData = { farthest_kill: 123456.7 };
    const result = FarthestKillDataSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(valid);
  });

  it("rejects a payload missing farthest_kill", () => {
    const result = FarthestKillDataSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("SystemJumpCountSchema", () => {
  it("accepts a zero count", () => {
    expect(SystemJumpCountSchema.parse({ jumps: 0 })).toEqual({ jumps: 0 });
  });

  it("rejects a missing count", () => {
    expect(SystemJumpCountSchema.safeParse({}).success).toBe(false);
  });
});

describe("BuildInfoSchema", () => {
  it("accepts a well-formed build-info payload", () => {
    const valid: BuildInfo = {
      buildNumber: 2_345_678,
      releaseDate: "2026-08-01",
      buildTime: "2026-08-01T12:00:00Z",
    };
    const result = BuildInfoSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(valid);
  });

  it("rejects a payload with a wrong-typed buildNumber", () => {
    const result = BuildInfoSchema.safeParse({
      buildNumber: "2345678",
      releaseDate: "2026-08-01",
      buildTime: "2026-08-01T12:00:00Z",
    });
    expect(result.success).toBe(false);
  });
});

const validKillDetail: KillDetail = {
  victim: {
    character: "Some Victim",
    character_corporation: "Some Corp",
    character_corporation_ticker: "SOME",
    character_alliance: "Some Alliance",
    character_alliance_ticker: "SALI",
    character_faction: "Caldari State",
    damage_taken: 12345,
  },
  final_blow: {
    character: "Final Blower",
    character_corporation: "Attacker Corp",
    ship: "Rifter",
    weapon: "125mm Gatling AutoCannon II",
    damage_done: 6000,
    security_status: -2.1,
  },
  top_damage: {
    character: "Final Blower",
    character_corporation: "Attacker Corp",
    ship: "Rifter",
    weapon: "125mm Gatling AutoCannon II",
    damage_done: 6000,
    security_status: -2.1,
  },
  final_blow_is_top_damage: true,
  attackers: 3,
  war_id: 555,
  war_info: {
    aggressor: {
      alliance: "Aggressor Alliance",
      alliance_ticker: "AGGR",
      ships_killed: 12,
    },
    defender: {
      corporation: "Defender Corp",
      corporation_ticker: "DEF",
      ships_killed: 4,
    },
    declared: 1_700_000_000,
    started: 1_700_100_000,
    mutual: false,
  },
  fitted_value: 15_000_000,
  dropped_value: 5_000_000,
  destroyed_value: 10_000_000,
  total_value: 15_000_000,
  total_droppable_value: 5_000_000,
  npc: false,
  solo: false,
  awox: false,
  labels: ["pvp"],
};

describe("KillDetailSchema", () => {
  it("accepts a well-formed kill-detail payload", () => {
    const result = KillDetailSchema.safeParse(validKillDetail);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(validKillDetail);
  });

  it("accepts a minimal kill-detail payload with all optional fields omitted", () => {
    const minimal: KillDetail = {
      victim: { character: "Some Victim", damage_taken: 100 },
      final_blow: {
        character: "Final Blower",
        damage_done: 100,
        security_status: 0.5,
      },
      top_damage: {
        character: "Final Blower",
        damage_done: 100,
        security_status: 0.5,
      },
      final_blow_is_top_damage: true,
      attackers: 1,
    };
    const result = KillDetailSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });

  it("rejects a payload missing victim", () => {
    const { victim: _victim, ...rest } = validKillDetail;
    const result = KillDetailSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects a payload whose war_info is missing declared", () => {
    const { declared: _declared, ...warInfoRest } = validKillDetail.war_info!;
    const result = KillDetailSchema.safeParse({
      ...validKillDetail,
      war_info: warInfoRest,
    });
    expect(result.success).toBe(false);
  });
});

describe("SystemKillsFilteredResponseSchema", () => {
  it("accepts a valid response", () => {
    const v = { count: 2, killmail_ids: [10, 20] };
    expect(SystemKillsFilteredResponseSchema.parse(v)).toEqual(v);
  });
  it("rejects a wrong-typed id array", () => {
    expect(() =>
      SystemKillsFilteredResponseSchema.parse({
        count: 1,
        killmail_ids: ["x"],
      }),
    ).toThrow();
  });
});

describe("SovDataSchema", () => {
  it("accepts a claimed sov with alliance", () => {
    const v = {
      claimed: true,
      alliance: { id: 99, name: "A", ticker: "AAA" },
      adm: 5,
      vulnerable_start: 1,
      vulnerable_end: 2,
    };
    expect(SovDataSchema.parse(v)).toEqual(v);
  });
  it("accepts an unclaimed sov (optional fields absent)", () => {
    expect(SovDataSchema.parse({ claimed: false })).toEqual({
      claimed: false,
    });
  });
  it("rejects a non-boolean claimed", () => {
    expect(() => SovDataSchema.parse({ claimed: "yes" })).toThrow();
  });
});
