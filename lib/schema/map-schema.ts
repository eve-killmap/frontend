export interface SystemsData {
  systemIDs: number[];
  systems: string[];
}

export interface MetaData {
  bbox: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  span: {
    x: number;
    y: number;
  };
  counts: {
    systems: number;
    edges?: number;
  };
}

export type MetaData3D = Omit<MetaData, "counts">;

export interface MapData {
  meta: MetaData;
  systemIDs: number[];
  positions: number[];
  edges?: number[];
  edgeTypes?: number[];
  names: string[];
  constellationIDs: number[];
  securityStatuses: number[];
}

export interface NewEdenMapData extends MapData {
  meta3D: MetaData3D;
  positions3D: number[];
}

export function isNewEdenMapData(map: MapData): map is NewEdenMapData {
  return "positions3D" in map;
}

export interface AnoikisMapData extends MapData {
  wormholeClassIDs: number[];
  wormholeEffects: number[];
}

export function isAnoikisMapData(map: MapData): map is AnoikisMapData {
  return "wormholeClassIDs" in map;
}

export interface Locale {
  name: string;
  position: {
    x: number;
    y: number;
  };
}

export interface NewEdenLocale extends Locale {
  position3D: {
    x: number;
    y: number;
  };
}

export interface ConstellationLocale extends Locale {
  regionID: number;
}

export interface NewEdenConstellationLocale extends NewEdenLocale {
  regionID: number;
}

export type ConstellationData = Record<string, ConstellationLocale>;

export type NewEdenConstellationData = Record<
  string,
  NewEdenConstellationLocale
>;

export type RegionData = Record<string, Locale>;

export type NewEdenRegionData = Record<string, NewEdenLocale>;

export interface SystemKillsResponse {
  system_ids: number[];
  kills: number[];
}

export interface SystemJumpsResponse {
  system_ids: number[];
  jumps: number[];
}

export interface RankSystem {
  solar_system_id: number;
  kill_count: number;
}

export interface TopSystemsResponse {
  all: RankSystem[];
  day: RankSystem[];
  week: RankSystem[];
  month: RankSystem[];
  six_months: RankSystem[];
  year: RankSystem[];
}

export interface LeaderboardEntry {
  id: number;
  name?: string;
  ticker?: string;
  kills: number;
}

export interface LeaderboardResponse {
  computed_at?: number;
  character: LeaderboardEntry[];
  corporation: LeaderboardEntry[];
  alliance: LeaderboardEntry[];
  faction: LeaderboardEntry[];
  ship: LeaderboardEntry[];
  weapon: LeaderboardEntry[];
}

export interface RankSystemsResponse {
  computed_at?: number;
  top: TopSystemsResponse;
}

export interface GlobalKillsResponse {
  computed_at?: number;
  counts: number[];
}

export type SystemActivityResponse = GlobalKillsResponse;
