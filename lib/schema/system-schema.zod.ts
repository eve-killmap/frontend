import { z } from "zod";
import { BuildInfo } from "./base-schema";
import {
  AsteroidBeltData,
  FarthestKillData,
  GroupData,
  IntactStargateData,
  KillAttacker,
  KillDetail,
  KillVictim,
  MoonData,
  PlanetData,
  PositionData,
  SlugIndex,
  SovData,
  StarData,
  StargateData,
  StationData,
  SystemData,
  SystemJumpCount,
  SystemKillsFilteredResponse,
  TypeData,
  WarInfo,
  WarParticipant,
} from "./system-schema";

export const PositionDataSchema: z.ZodType<PositionData> = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

export const StationDataSchema: z.ZodType<StationData> = z.object({
  stationID: z.number(),
  position: PositionDataSchema,
  name: z.string(),
  typeID: z.number(),
});

export const StarDataSchema: z.ZodType<StarData> = z.object({
  radius: z.number(),
  starID: z.number(),
  warpPosition: PositionDataSchema,
});

export const AsteroidBeltDataSchema: z.ZodType<AsteroidBeltData> = z.object({
  asteroidBeltID: z.number(),
  position: PositionDataSchema,
  radius: z.number().optional(),
  orbitIndex: z.number(),
  uniqueName: z.string().optional(),
  warpPosition: PositionDataSchema.optional(),
});

export const MoonDataSchema: z.ZodType<MoonData> = z.object({
  moonID: z.number(),
  stations: z.array(StationDataSchema).optional(),
  position: PositionDataSchema,
  radius: z.number(),
  orbitIndex: z.number(),
  uniqueName: z.string().optional(),
  miningBeacon: PositionDataSchema.optional(),
  warpPosition: PositionDataSchema,
});

export const StargateDataSchema: z.ZodType<StargateData> = z.object({
  destName: z.string(),
  position: PositionDataSchema,
  stargateID: z.number(),
  typeID: z.number(),
});

export const IntactStargateDataSchema: z.ZodType<IntactStargateData> = z.object(
  {
    destName: z.string(),
    position: PositionDataSchema,
    stargateID: z.number(),
    typeID: z.number(),
    jumpType: z.number(),
    position2D: z.object({
      x: z.number(),
      y: z.number(),
    }),
  },
);

export const PlanetDataSchema: z.ZodType<PlanetData> = z.object({
  planetID: z.number(),
  asteroidBelts: z.array(AsteroidBeltDataSchema).optional(),
  moons: z.array(MoonDataSchema).optional(),
  stations: z.array(StationDataSchema).optional(),
  position: PositionDataSchema,
  radius: z.number(),
  celestialIndex: z.number(),
  uniqueName: z.string().optional(),
  warpPosition: PositionDataSchema,
});

export const SystemDataSchema: z.ZodType<SystemData> = z.object({
  solarSystemID: z.number(),
  constellationName: z.string(),
  disruptedStargates: z.array(StargateDataSchema).optional(),
  farthestObject: z.number(),
  name: z.string(),
  planets: z.array(PlanetDataSchema).optional(),
  radius: z.number(),
  regionName: z.string(),
  securityStatus: z.number(),
  sovFactionName: z.string().optional(),
  star: StarDataSchema.optional(),
  stargates: z.array(IntactStargateDataSchema).optional(),
  stations: z.array(StationDataSchema).optional(),
  wormholeClassID: z.number().optional(),
  wormholeEffect: z.number().optional(),
});

export const TypeDataSchema: z.ZodType<TypeData> = z.object({
  brackets: z.record(z.string(), z.string()),
  groupNames: z.record(z.string(), z.string()),
  typeBrackets: z.record(z.string(), z.number()),
  typeNames: z.record(z.string(), z.string()),
  typeTree: z.record(z.string(), z.array(z.number())),
  typeRadii: z.record(z.string(), z.number()),
  npcTypes: z.array(z.number()),
});

export const SlugIndexSchema: z.ZodType<SlugIndex> = z.record(
  z.string(),
  z.number(),
);

export const FarthestKillDataSchema: z.ZodType<FarthestKillData> = z.object({
  farthest_kill: z.number(),
});

export const SystemJumpCountSchema: z.ZodType<SystemJumpCount> = z.object({
  jumps: z.number(),
});

export const BuildInfoSchema: z.ZodType<BuildInfo> = z.object({
  buildNumber: z.number(),
  releaseDate: z.string(),
  buildTime: z.string(),
});

const killCharacterShape = {
  character: z.string(),
  character_corporation: z.string().optional(),
  character_corporation_ticker: z.string().optional(),
  character_alliance: z.string().optional(),
  character_alliance_ticker: z.string().optional(),
  character_faction: z.string().optional(),
};

export const KillVictimSchema: z.ZodType<KillVictim> = z.object({
  ...killCharacterShape,
  damage_taken: z.number(),
});

export const KillAttackerSchema: z.ZodType<KillAttacker> = z.object({
  ...killCharacterShape,
  ship: z.string().optional(),
  weapon: z.string().optional(),
  damage_done: z.number(),
  security_status: z.number(),
});

export const WarParticipantSchema: z.ZodType<WarParticipant> = z.object({
  alliance: z.string().optional(),
  alliance_ticker: z.string().optional(),
  corporation: z.string().optional(),
  corporation_ticker: z.string().optional(),
  ships_killed: z.number(),
});

export const WarInfoSchema: z.ZodType<WarInfo> = z.object({
  aggressor: WarParticipantSchema,
  defender: WarParticipantSchema,
  declared: z.number(),
  finished: z.number().optional(),
  mutual: z.boolean(),
  retracted: z.number().optional(),
  started: z.number().optional(),
});

export const KillDetailSchema: z.ZodType<KillDetail> = z.object({
  victim: KillVictimSchema,
  final_blow: KillAttackerSchema,
  top_damage: KillAttackerSchema,
  final_blow_is_top_damage: z.boolean(),
  attackers: z.number(),
  war_id: z.number().optional(),
  war_info: WarInfoSchema.optional(),
  fitted_value: z.number().optional(),
  dropped_value: z.number().optional(),
  destroyed_value: z.number().optional(),
  total_value: z.number().optional(),
  total_droppable_value: z.number().optional(),
  npc: z.boolean().optional(),
  solo: z.boolean().optional(),
  awox: z.boolean().optional(),
  labels: z.array(z.string()).optional(),
});

export const SystemKillsFilteredResponseSchema: z.ZodType<SystemKillsFilteredResponse> =
  z.object({
    count: z.number(),
    killmail_ids: z.array(z.number()),
  });

export const GroupDataSchema: z.ZodType<GroupData> = z.object({
  id: z.number(),
  name: z.string(),
  ticker: z.string(),
});

export const SovDataSchema: z.ZodType<SovData> = z.object({
  claimed: z.boolean(),
  alliance: GroupDataSchema.optional(),
  corporation: GroupDataSchema.optional(),
  adm: z.number().optional(),
  vulnerable_start: z.number().optional(),
  vulnerable_end: z.number().optional(),
});
