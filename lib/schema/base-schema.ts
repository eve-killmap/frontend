import { z } from "zod";

export interface BuildInfo {
  buildNumber: number;
  releaseDate: string;
  buildTime: string;
}

export interface UniverseStatus {
  online: boolean;
  players?: number;
}

export interface LiveKillBase {
  killmail_id: number;
  killmail_time: number;

  v_ship_type_id: number;
  v_ship_name?: string;
  v_character_id?: number;
  v_character_name?: string;
  v_corporation_id?: number;
  v_corporation_name?: string;
  v_alliance_id?: number;
  v_alliance_name?: string;
  v_faction_id?: number;
  v_faction_name?: string;

  fb_ship_type_id?: number;
  fb_ship_name?: string;
  fb_character_id?: number;
  fb_character_name?: string;
  fb_corporation_id?: number;
  fb_corporation_name?: string;
  fb_alliance_id?: number;
  fb_alliance_name?: string;
  fb_faction_id?: number;
  fb_faction_name?: string;

  war_id?: number;

  a_character_ids: number[];
  a_corporation_ids: number[];
  a_alliance_ids: number[];
  a_faction_ids: number[];
  a_ship_type_ids: number[];
  a_weapon_type_ids: number[];

  fitted_value?: number;
  dropped_value?: number;
  destroyed_value?: number;
  total_value?: number;
  total_droppable_value?: number;
  npc?: boolean;
  solo?: boolean;
  awox?: boolean;
  labels?: string[];
}

export interface LiveKill extends LiveKillBase {
  solar_system_id: number;
  x: number;
  y: number;
  z: number;
}

export type TypeMetas = Record<string, number[]>;

export const liveKillBaseShape = {
  killmail_id: z.number(),
  killmail_time: z.number(),

  v_ship_type_id: z.number(),
  v_ship_name: z.string().optional(),
  v_character_id: z.number().optional(),
  v_character_name: z.string().optional(),
  v_corporation_id: z.number().optional(),
  v_corporation_name: z.string().optional(),
  v_alliance_id: z.number().optional(),
  v_alliance_name: z.string().optional(),
  v_faction_id: z.number().optional(),
  v_faction_name: z.string().optional(),

  fb_ship_type_id: z.number().optional(),
  fb_ship_name: z.string().optional(),
  fb_character_id: z.number().optional(),
  fb_character_name: z.string().optional(),
  fb_corporation_id: z.number().optional(),
  fb_corporation_name: z.string().optional(),
  fb_alliance_id: z.number().optional(),
  fb_alliance_name: z.string().optional(),
  fb_faction_id: z.number().optional(),
  fb_faction_name: z.string().optional(),

  war_id: z.number().optional(),

  a_character_ids: z.array(z.number().int()),
  a_corporation_ids: z.array(z.number().int()),
  a_alliance_ids: z.array(z.number().int()),
  a_faction_ids: z.array(z.number().int()),
  a_ship_type_ids: z.array(z.number().int()),
  a_weapon_type_ids: z.array(z.number().int()),

  fitted_value: z.number().optional(),
  dropped_value: z.number().optional(),
  destroyed_value: z.number().optional(),
  total_value: z.number().optional(),
  total_droppable_value: z.number().optional(),
  npc: z.boolean().optional(),
  solo: z.boolean().optional(),
  awox: z.boolean().optional(),
  labels: z.array(z.string()).optional(),
};

export const LiveKillBaseSchema: z.ZodType<LiveKillBase> =
  z.object(liveKillBaseShape);

export const LiveKillSchema: z.ZodType<LiveKill> = z.object({
  ...liveKillBaseShape,
  solar_system_id: z.number(),
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

export const UniverseStatusSchema: z.ZodType<UniverseStatus> = z.object({
  online: z.boolean(),
  players: z.number().int().nonnegative().optional(),
});

export const TypeMetasSchema: z.ZodType<TypeMetas> = z.record(
  z.string(),
  z.array(z.number().int()),
);
