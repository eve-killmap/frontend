import { describe, it, expect } from "vitest";
import {
  AnoikisMapDataSchema,
  ConstellationDataSchema,
  GlobalKillsSchema,
  LeaderboardResponseSchema,
  MapDataSchema,
  NewEdenConstellationDataSchema,
  NewEdenMapDataSchema,
  NewEdenRegionDataSchema,
  RankSystemsResponseSchema,
  RegionDataSchema,
  SystemJumpsResponseSchema,
  SystemKillsResponseSchema,
  SystemsDataSchema,
} from "./map-schema.zod";
import {
  AnoikisMapData,
  ConstellationData,
  MapData,
  NewEdenConstellationData,
  NewEdenMapData,
  NewEdenRegionData,
  RegionData,
  SystemsData,
} from "./map-schema";
import type { SystemActivityResponse } from "@/lib/schema/map-schema";

const validMapData: MapData = {
  meta: {
    bbox: { minX: -100, maxX: 100, minY: -50, maxY: 50 },
    span: { x: 200, y: 100 },
    counts: { systems: 2, edges: 1 },
  },
  systemIDs: [30000142, 30000144],
  positions: [0, 0, 10, 10],
  edges: [0, 1],
  edgeTypes: [0],
  names: ["Jita", "Perimeter"],
  constellationIDs: [20000020, 20000020],
  securityStatuses: [0.9459, 0.9583],
};

describe("MapDataSchema", () => {
  it("accepts a well-formed map-graph payload", () => {
    const result = MapDataSchema.safeParse(validMapData);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(validMapData);
  });

  it("accepts a payload with the optional edges/edgeTypes omitted", () => {
    const { edges: _edges, edgeTypes: _edgeTypes, ...rest } = validMapData;
    const result = MapDataSchema.safeParse(rest);
    expect(result.success).toBe(true);
  });

  it("rejects a payload whose positions array holds a non-number", () => {
    const result = MapDataSchema.safeParse({
      ...validMapData,
      positions: [0, "10", 10, 10],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a payload missing meta", () => {
    const { meta: _meta, ...rest } = validMapData;
    const result = MapDataSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

const validNewEdenMapData: NewEdenMapData = {
  ...validMapData,
  meta3D: {
    bbox: { minX: -100, maxX: 100, minY: -50, maxY: 50 },
    span: { x: 200, y: 100 },
  },
  positions3D: [0, 0, 0, 10, 10, 10],
};

describe("NewEdenMapDataSchema", () => {
  it("accepts a well-formed New Eden map-graph payload with 3D layout", () => {
    const result = NewEdenMapDataSchema.safeParse(validNewEdenMapData);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(validNewEdenMapData);
  });

  it("rejects a New Eden payload missing positions3D", () => {
    const { positions3D: _positions3D, ...rest } = validNewEdenMapData;
    const result = NewEdenMapDataSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

const validAnoikisMapData: AnoikisMapData = {
  ...validMapData,
  wormholeClassIDs: [5, 6],
  wormholeEffects: [0, 1],
};

describe("AnoikisMapDataSchema", () => {
  it("accepts a well-formed Anoikis map-graph payload and preserves the wormhole arrays", () => {
    const result = AnoikisMapDataSchema.safeParse(validAnoikisMapData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validAnoikisMapData);
      expect(result.data.wormholeClassIDs).toEqual([5, 6]);
      expect(result.data.wormholeEffects).toEqual([0, 1]);
    }
  });

  it("rejects an Anoikis payload missing wormholeEffects", () => {
    const { wormholeEffects: _wormholeEffects, ...rest } = validAnoikisMapData;
    const result = AnoikisMapDataSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

const validConstellationData: ConstellationData = {
  "20000020": {
    name: "Kimotoro",
    position: { x: 1, y: 2 },
    regionID: 10000002,
  },
};

describe("ConstellationDataSchema", () => {
  it("accepts a well-formed constellation-locale record", () => {
    const result = ConstellationDataSchema.safeParse(validConstellationData);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(validConstellationData);
  });

  it("rejects a record whose locale is missing regionID", () => {
    const result = ConstellationDataSchema.safeParse({
      "20000020": { name: "Kimotoro", position: { x: 1, y: 2 } },
    });
    expect(result.success).toBe(false);
  });
});

const validNewEdenConstellationData: NewEdenConstellationData = {
  "20000020": {
    name: "Kimotoro",
    position: { x: 1, y: 2 },
    position3D: { x: 1, y: 2 },
    regionID: 10000002,
  },
};

describe("NewEdenConstellationDataSchema", () => {
  it("accepts a well-formed New Eden constellation-locale record", () => {
    const result = NewEdenConstellationDataSchema.safeParse(
      validNewEdenConstellationData,
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(result.data).toEqual(validNewEdenConstellationData);
  });

  it("rejects a record whose locale is missing position3D", () => {
    const result = NewEdenConstellationDataSchema.safeParse({
      "20000020": {
        name: "Kimotoro",
        position: { x: 1, y: 2 },
        regionID: 10000002,
      },
    });
    expect(result.success).toBe(false);
  });
});

const validRegionData: RegionData = {
  "10000002": { name: "The Forge", position: { x: 1, y: 2 } },
};

describe("RegionDataSchema", () => {
  it("accepts a well-formed region-locale record", () => {
    const result = RegionDataSchema.safeParse(validRegionData);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(validRegionData);
  });

  it("rejects a record whose locale is missing name", () => {
    const result = RegionDataSchema.safeParse({
      "10000002": { position: { x: 1, y: 2 } },
    });
    expect(result.success).toBe(false);
  });
});

const validNewEdenRegionData: NewEdenRegionData = {
  "10000002": {
    name: "The Forge",
    position: { x: 1, y: 2 },
    position3D: { x: 1, y: 2 },
  },
};

describe("NewEdenRegionDataSchema", () => {
  it("accepts a well-formed New Eden region-locale record", () => {
    const result = NewEdenRegionDataSchema.safeParse(validNewEdenRegionData);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(validNewEdenRegionData);
  });

  it("rejects a record whose locale is missing position3D", () => {
    const result = NewEdenRegionDataSchema.safeParse({
      "10000002": { name: "The Forge", position: { x: 1, y: 2 } },
    });
    expect(result.success).toBe(false);
  });
});

const validSystemsData: SystemsData = {
  systemIDs: [30000142, 30000144],
  systems: ["Jita", "Perimeter"],
};

describe("SystemsDataSchema", () => {
  it("accepts a well-formed systems-index payload", () => {
    const result = SystemsDataSchema.safeParse(validSystemsData);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(validSystemsData);
  });

  it("rejects a payload whose systems array holds a non-string", () => {
    const result = SystemsDataSchema.safeParse({
      systemIDs: [30000142],
      systems: [42],
    });
    expect(result.success).toBe(false);
  });
});

describe("SystemKillsResponseSchema", () => {
  it("accepts a valid response", () => {
    const v = { system_ids: [1, 2], kills: [3, 0] };
    expect(SystemKillsResponseSchema.parse(v)).toEqual(v);
  });
  it("rejects a wrong-typed field", () => {
    expect(() =>
      SystemKillsResponseSchema.parse({ system_ids: ["x"], kills: [] }),
    ).toThrow();
  });
  it("reads the pre-rename counts column as kills", () => {
    expect(
      SystemKillsResponseSchema.parse({ system_ids: [1, 2], counts: [3, 0] }),
    ).toEqual({ system_ids: [1, 2], kills: [3, 0] });
  });
  it("prefers kills when a cached body carries both", () => {
    expect(
      SystemKillsResponseSchema.parse({
        system_ids: [1],
        kills: [7],
        counts: [3],
      }),
    ).toEqual({ system_ids: [1], kills: [7] });
  });
  it("rejects a response with neither column", () => {
    expect(
      SystemKillsResponseSchema.safeParse({ system_ids: [1] }).success,
    ).toBe(false);
  });
});

describe("SystemJumpsResponseSchema", () => {
  it("accepts index-aligned columns", () => {
    expect(
      SystemJumpsResponseSchema.parse({
        system_ids: [30000142, 30000144],
        jumps: [1247, 88],
      }),
    ).toEqual({ system_ids: [30000142, 30000144], jumps: [1247, 88] });
  });

  it("rejects a missing jumps column", () => {
    expect(
      SystemJumpsResponseSchema.safeParse({ system_ids: [1] }).success,
    ).toBe(false);
  });
});

describe("RankSystemsResponseSchema", () => {
  const rs = { solar_system_id: 30000142, kill_count: 5 };
  const top = {
    all: [rs],
    day: [],
    week: [],
    month: [],
    six_months: [],
    year: [],
  };
  it("accepts a response with a root-level computed_at", () => {
    const v = { computed_at: 1757700000, top };
    expect(RankSystemsResponseSchema.parse(v)).toEqual(v);
  });
  it("accepts a response without computed_at", () => {
    const v = { top };
    expect(RankSystemsResponseSchema.parse(v)).toEqual(v);
  });
  it("rejects a malformed entry", () => {
    expect(() =>
      RankSystemsResponseSchema.parse({
        top: { ...top, all: [{ solar_system_id: "x", kill_count: 1 }] },
      }),
    ).toThrow();
  });
});

describe("GlobalKillsSchema", () => {
  it("accepts an object with computed_at and counts", () => {
    const v = { computed_at: 1757700000, counts: [0, 3, 17] };
    expect(GlobalKillsSchema.parse(v)).toEqual(v);
  });
  it("accepts counts without computed_at", () => {
    expect(GlobalKillsSchema.parse({ counts: [1] })).toEqual({ counts: [1] });
  });
  it("rejects the pre-change bare array", () => {
    expect(GlobalKillsSchema.safeParse([0, 3, 17]).success).toBe(false);
  });
  it("rejects a non-number element", () => {
    expect(() => GlobalKillsSchema.parse({ counts: [0, "x", 2] })).toThrow();
  });
  it("validates the per-system activity response, which shares the shape", () => {
    const v = { computed_at: 1757700000, counts: [0, 3, 17] };
    const parsed: SystemActivityResponse = GlobalKillsSchema.parse(v);
    expect(parsed).toEqual(v);
  });
});

describe("LeaderboardResponseSchema", () => {
  const full = {
    computed_at: 1757700000,
    character: [
      { id: 91000000, name: "Pilot", kills: 42 },
      { id: 91000001, kills: 40 },
    ],
    corporation: [{ id: 98000001, name: "Corp", ticker: "TCK", kills: 40 }],
    alliance: [
      {
        id: 99005338,
        name: "Goonswarm Federation",
        ticker: "CONDI",
        kills: 39,
      },
    ],
    faction: [{ id: 500001, name: "Caldari State", kills: 5 }],
    ship: [{ id: 587, name: "Rifter", kills: 30 }],
    weapon: [],
  };
  it("accepts a full response and preserves optional name and ticker", () => {
    expect(LeaderboardResponseSchema.parse(full)).toEqual(full);
  });
  it("accepts all boards empty with computed_at absent", () => {
    const v = {
      character: [],
      corporation: [],
      alliance: [],
      faction: [],
      ship: [],
      weapon: [],
    };
    expect(LeaderboardResponseSchema.parse(v)).toEqual(v);
  });
  it("rejects a response missing a board", () => {
    const { weapon: _weapon, ...rest } = full;
    expect(LeaderboardResponseSchema.safeParse(rest).success).toBe(false);
  });
  it("rejects an entry with a non-number kills", () => {
    expect(
      LeaderboardResponseSchema.safeParse({
        ...full,
        ship: [{ id: 587, kills: "30" }],
      }).success,
    ).toBe(false);
  });
});
