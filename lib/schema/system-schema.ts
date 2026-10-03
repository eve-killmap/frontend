export type SlugIndex = Record<string, number>;

export interface FarthestKillData {
  farthest_kill: number;
}

export interface SystemJumpCount {
  jumps: number;
}

export interface SystemData {
  solarSystemID: number;
  constellationName: string;
  disruptedStargates?: StargateData[];
  farthestObject: number;
  name: string;
  planets?: PlanetData[];
  radius: number;
  regionName: string;
  securityStatus: number;
  sovFactionName?: string;
  star?: StarData;
  stargates?: IntactStargateData[];
  stations?: StationData[];
  wormholeClassID?: number;
  wormholeEffect?: number;
}

export interface PlanetData {
  planetID: number;
  asteroidBelts?: AsteroidBeltData[];
  moons?: MoonData[];
  stations?: StationData[];
  position: PositionData;
  radius: number;
  celestialIndex: number;
  uniqueName?: string;
  warpPosition: PositionData;
}

export interface AsteroidBeltData {
  asteroidBeltID: number;
  position: PositionData;
  radius?: number;
  orbitIndex: number;
  uniqueName?: string;
  warpPosition?: PositionData;
}

export interface MoonData {
  moonID: number;
  stations?: StationData[];
  position: PositionData;
  radius: number;
  orbitIndex: number;
  uniqueName?: string;
  miningBeacon?: PositionData;
  warpPosition: PositionData;
}

export interface StarData {
  radius: number;
  starID: number;
  warpPosition: PositionData;
}

export interface StationData {
  stationID: number;
  position: PositionData;
  name: string;
  typeID: number;
}

export interface StargateData {
  destName: string;
  position: PositionData;
  stargateID: number;
  typeID: number;
}

export interface IntactStargateData extends StargateData {
  jumpType: number;
  position2D: {
    x: number;
    y: number;
  };
}

export interface PositionData {
  x: number;
  y: number;
  z: number;
}

export interface RawKillsResponse {
  count: number;
  killmail_ids: number[];
  x: number[];
  y: number[];
  z: number[];
  killmail_times: number[];
  ship_types: number[];
}

export interface SystemKillsFilteredResponse {
  count: number;
  killmail_ids: number[];
}

export interface KillDetail {
  victim: KillVictim;
  final_blow: KillAttacker;
  top_damage: KillAttacker;
  final_blow_is_top_damage: boolean;
  attackers: number;
  war_id?: number;
  war_info?: WarInfo;
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

interface KillCharacter {
  character: string;
  character_corporation?: string;
  character_corporation_ticker?: string;
  character_alliance?: string;
  character_alliance_ticker?: string;
  character_faction?: string;
}

export interface KillVictim extends KillCharacter {
  damage_taken: number;
}

export interface KillAttacker extends KillCharacter {
  ship?: string;
  weapon?: string;
  damage_done: number;
  security_status: number;
}

export interface WarParticipant {
  alliance?: string;
  alliance_ticker?: string;
  corporation?: string;
  corporation_ticker?: string;
  ships_killed: number;
}

export interface WarInfo {
  aggressor: WarParticipant;
  defender: WarParticipant;
  declared: number;
  finished?: number;
  mutual: boolean;
  retracted?: number;
  started?: number;
}

export type BracketData = Record<string, string>;

export type GroupNameData = Record<string, string>;

export type TypeBracketData = Record<string, number>;

export type TypeNameData = Record<string, string>;

export type TypeTreeData = Record<string, number[]>;

export type TypeRadiiData = Record<string, number>;

export type NPCTypeData = number[];

export interface TypeData {
  brackets: BracketData;
  groupNames: GroupNameData;
  typeBrackets: TypeBracketData;
  typeNames: TypeNameData;
  typeTree: TypeTreeData;
  typeRadii: TypeRadiiData;
  npcTypes: NPCTypeData;
}

export interface SovData {
  claimed: boolean;
  alliance?: GroupData;
  corporation?: GroupData;
  adm?: number;
  vulnerable_start?: number;
  vulnerable_end?: number;
}

export interface GroupData {
  id: number;
  name: string;
  ticker: string;
}

export interface ZkillSystemStats {
  shipsDestroyed?: number;
  iskDestroyed?: number;
  shipsDestroyedSolo?: number;
  iskDestroyedSolo?: number;
  soloRatio?: number;
  avgGangSize?: number;
  activepvp: {
    characters?: { count: number };
    corporations?: { count: number };
    alliances?: { count: number };
    ships?: { count: number };
    kills?: { count: number };
  };
  months?: Record<
    string,
    {
      year: number;
      month: number;
      shipsDestroyed: number;
      iskDestroyed: number;
    }
  >;
  labels?: Record<
    string,
    {
      shipsDestroyed: number;
    }
  >;
  topAllTime?: Array<{
    type: string;
    data: Array<{
      kills: number;
      shipTypeID?: number;
    }>;
  }>;
  activity?: {
    "0"?: number[] | Record<string, number>;
    "1"?: number[] | Record<string, number>;
    "2"?: number[] | Record<string, number>;
    "3"?: number[] | Record<string, number>;
    "4"?: number[] | Record<string, number>;
    "5"?: number[] | Record<string, number>;
    "6"?: number[] | Record<string, number>;
    max?: number;
    days?: string[];
  };
  topLists: Array<{
    type: string;
    title: string;
    values: Array<{
      kills: number;
      id: number;
      name: string;
    }>;
  }>;
  ranks_history?: {
    weekly: Array<{ date: string; rank: number }>;
    weekly_solo: Array<{ date: string; rank: number }>;
    recent: Array<{ date: string; rank: number }>;
    recent_solo: Array<{ date: string; rank: number }>;
    alltime: Array<{ date: string; rank: number }>;
    alltime_solo: Array<{ date: string; rank: number }>;
  };
}
