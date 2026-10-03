export const TRIGLAVIAN_FONT = "/fonts/Triglavian-Completed.otf";

export const TRIG_SYSTEM_ID_MIN = 32_000_000;
export const TRIG_SYSTEM_ID_MAX = 32_999_999;
export const TRIG_CONSTELLATION_ID_MIN = 22_000_000;
export const TRIG_CONSTELLATION_ID_MAX = 22_999_999;
export const TRIG_REGION_ID_MIN = 12_000_000;
export const TRIG_REGION_ID_MAX = 12_999_999;

export const isTriglavianSystem = (systemID: number): boolean =>
  systemID >= TRIG_SYSTEM_ID_MIN && systemID <= TRIG_SYSTEM_ID_MAX;

export const isTriglavianConstellation = (constellationID: number): boolean =>
  constellationID >= TRIG_CONSTELLATION_ID_MIN &&
  constellationID <= TRIG_CONSTELLATION_ID_MAX;

export const isTriglavianRegion = (regionID: number): boolean =>
  regionID >= TRIG_REGION_ID_MIN && regionID <= TRIG_REGION_ID_MAX;
