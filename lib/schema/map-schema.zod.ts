import { z } from "zod";
import {
  AnoikisMapData,
  ConstellationData,
  ConstellationLocale,
  GlobalKillsResponse,
  LeaderboardEntry,
  LeaderboardResponse,
  Locale,
  MapData,
  MetaData,
  MetaData3D,
  NewEdenConstellationData,
  NewEdenConstellationLocale,
  NewEdenLocale,
  NewEdenMapData,
  NewEdenRegionData,
  RankSystem,
  RankSystemsResponse,
  RegionData,
  SystemJumpsResponse,
  SystemKillsResponse,
  SystemsData,
  TopSystemsResponse,
} from "./map-schema";

const bboxShape = {
  minX: z.number(),
  maxX: z.number(),
  minY: z.number(),
  maxY: z.number(),
};

const spanShape = {
  x: z.number(),
  y: z.number(),
};

export const MetaData3DSchema: z.ZodType<MetaData3D> = z.object({
  bbox: z.object(bboxShape),
  span: z.object(spanShape),
});

export const MetaDataSchema: z.ZodType<MetaData> = z.object({
  bbox: z.object(bboxShape),
  span: z.object(spanShape),
  counts: z.object({
    systems: z.number(),
    edges: z.number().optional(),
  }),
});

export const SystemsDataSchema: z.ZodType<SystemsData> = z.object({
  systemIDs: z.array(z.number()),
  systems: z.array(z.string()),
});

const mapDataShape = {
  meta: MetaDataSchema,
  systemIDs: z.array(z.number()),
  positions: z.array(z.number()),
  edges: z.array(z.number()).optional(),
  edgeTypes: z.array(z.number()).optional(),
  names: z.array(z.string()),
  constellationIDs: z.array(z.number()),
  securityStatuses: z.array(z.number()),
};

export const MapDataSchema: z.ZodType<MapData> = z.object(mapDataShape);

export const NewEdenMapDataSchema: z.ZodType<NewEdenMapData> = z.object({
  ...mapDataShape,
  meta3D: MetaData3DSchema,
  positions3D: z.array(z.number()),
});

export const AnoikisMapDataSchema: z.ZodType<AnoikisMapData> = z.object({
  ...mapDataShape,
  wormholeClassIDs: z.array(z.number()),
  wormholeEffects: z.array(z.number()),
});

const localeShape = {
  name: z.string(),
  position: z.object(spanShape),
};

export const LocaleSchema: z.ZodType<Locale> = z.object(localeShape);

const newEdenLocaleShape = {
  ...localeShape,
  position3D: z.object(spanShape),
};

export const NewEdenLocaleSchema: z.ZodType<NewEdenLocale> =
  z.object(newEdenLocaleShape);

export const ConstellationLocaleSchema: z.ZodType<ConstellationLocale> =
  z.object({
    ...localeShape,
    regionID: z.number(),
  });

export const NewEdenConstellationLocaleSchema: z.ZodType<NewEdenConstellationLocale> =
  z.object({
    ...newEdenLocaleShape,
    regionID: z.number(),
  });

export const ConstellationDataSchema: z.ZodType<ConstellationData> = z.record(
  z.string(),
  ConstellationLocaleSchema,
);

export const NewEdenConstellationDataSchema: z.ZodType<NewEdenConstellationData> =
  z.record(z.string(), NewEdenConstellationLocaleSchema);

export const RegionDataSchema: z.ZodType<RegionData> = z.record(
  z.string(),
  LocaleSchema,
);

export const NewEdenRegionDataSchema: z.ZodType<NewEdenRegionData> = z.record(
  z.string(),
  NewEdenLocaleSchema,
);

export const SystemKillsResponseSchema: z.ZodType<SystemKillsResponse> = z
  .object({
    system_ids: z.array(z.number()),
    kills: z.array(z.number()).optional(),
    counts: z.array(z.number()).optional(),
  })
  .transform((d, ctx) => {
    const kills = d.kills ?? d.counts;
    if (!kills) {
      ctx.addIssue({ code: "custom", message: "missing kills column" });
      return z.NEVER;
    }
    return { system_ids: d.system_ids, kills };
  });

export const SystemJumpsResponseSchema: z.ZodType<SystemJumpsResponse> =
  z.object({
    system_ids: z.array(z.number()),
    jumps: z.array(z.number()),
  });

export const RankSystemSchema: z.ZodType<RankSystem> = z.object({
  solar_system_id: z.number(),
  kill_count: z.number(),
});

export const TopSystemsResponseSchema: z.ZodType<TopSystemsResponse> = z.object(
  {
    all: z.array(RankSystemSchema),
    day: z.array(RankSystemSchema),
    week: z.array(RankSystemSchema),
    month: z.array(RankSystemSchema),
    six_months: z.array(RankSystemSchema),
    year: z.array(RankSystemSchema),
  },
);

export const RankSystemsResponseSchema: z.ZodType<RankSystemsResponse> =
  z.object({
    computed_at: z.number().optional(),
    top: TopSystemsResponseSchema,
  });

export const LeaderboardEntrySchema: z.ZodType<LeaderboardEntry> = z.object({
  id: z.number(),
  name: z.string().optional(),
  ticker: z.string().optional(),
  kills: z.number(),
});

export const LeaderboardResponseSchema: z.ZodType<LeaderboardResponse> =
  z.object({
    computed_at: z.number().optional(),
    character: z.array(LeaderboardEntrySchema),
    corporation: z.array(LeaderboardEntrySchema),
    alliance: z.array(LeaderboardEntrySchema),
    faction: z.array(LeaderboardEntrySchema),
    ship: z.array(LeaderboardEntrySchema),
    weapon: z.array(LeaderboardEntrySchema),
  });

export const GlobalKillsSchema: z.ZodType<GlobalKillsResponse> = z.object({
  computed_at: z.number().optional(),
  counts: z.array(z.number()),
});
