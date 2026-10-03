import { CAPSULE_IDS } from "@/lib/eve/capsule-ids";
import { createJSONStorage } from "zustand/middleware";
import { createPerSystemStore } from "../create-per-system-store";

export const DEFAULT_CLUSTER_COLOR = "#88ccff";
export const DEFAULT_KILL_COLOR = "#88ccff";
export const EXCLUDED_TYPE_IDS = CAPSULE_IDS;

export const DEFAULT_KILL_OPACITY = 0.4;
export const DEFAULT_MAX_KILLS = 200_000;
export const DEFAULT_MERGE_PIXELS = 8;
export const DEFAULT_KILL_PIXELS = 2;
export const DEFAULT_MAX_CLUSTER_PIXELS = 16;
export const DEFAULT_MIN_CLUSTER_COUNT = 8;
export const DEFAULT_CLUSTER_OPACITY = 0.4;

export interface PerSystemSettings {
  defaultColor: string;
  killOpacity: number;
  clusterColor: string;
  groupColors: Record<number, string>;
  typeColors: Record<number, string>;

  typeGroupMap: Record<number, number>;
  colorVersion: number;
  clusterColorVersion: number;

  shipTypes: Set<number> | null;

  maxKills: number;
  deselectedTypeIds: number[];
  showExcludedTypeIds: number[];

  mergePixels: number;
  killPixels: number;
  maxClusterPixels: number;
  minClusterCount: number;
  clusterOpacity: number;

  allMeshesShown: boolean;
  starMeshShown: boolean;
  planetMeshesShown: boolean;
  moonMeshesShown: boolean;
  beltMeshesShown: boolean;

  enableKillFeed: boolean;
  showCapsulesInFeed: boolean;
  showKillFlash: boolean;

  rangeSelected: number | null;
  range: number | null;
}

interface SystemSettingsActions {
  setDefaultColor: (color: string) => void;
  setKillOpacity: (opacity: number) => void;
  setClusterColor: (color: string) => void;
  setGroupColor: (groupId: number, color: string | null) => void;
  setTypeColor: (typeId: number, color: string | null) => void;
  setTypeGroupMap: (map: Record<number, number>) => void;
  setShipTypes: (types: Set<number> | null) => void;
  setMaxKills: (max: number) => void;
  setMergePixels: (pixels: number) => void;
  setKillPixels: (pixels: number) => void;
  setMaxClusterPixels: (pixels: number) => void;
  setMinClusterCount: (count: number) => void;
  setClusterOpacity: (opacity: number) => void;
  setDeselectedTypeIds: (ids: number[]) => void;
  setShowExcludedTypeIds: (ids: number[]) => void;
  setAllShown: (shown: boolean) => void;
  setStarMeshShown: (shown: boolean) => void;
  setPlanetMeshesShown: (shown: boolean) => void;
  setMoonMeshesShown: (shown: boolean) => void;
  setBeltMeshesShown: (shown: boolean) => void;
  setEnableKillFeed: (enable: boolean) => void;
  setShowCapsulesInFeed: (show: boolean) => void;
  setShowKillFlash: (show: boolean) => void;
  setRangeSelected: (id: number | null) => void;
  setRange: (range: number | null) => void;
}

export type SystemSettingsView = PerSystemSettings & SystemSettingsActions;

const DEFAULT_PER_SYSTEM: PerSystemSettings = {
  defaultColor: DEFAULT_KILL_COLOR,
  killOpacity: DEFAULT_KILL_OPACITY,
  clusterColor: DEFAULT_CLUSTER_COLOR,
  groupColors: {},
  typeColors: {},
  typeGroupMap: {},
  colorVersion: 0,
  clusterColorVersion: 0,
  shipTypes: null,
  maxKills: DEFAULT_MAX_KILLS,
  mergePixels: DEFAULT_MERGE_PIXELS,
  killPixels: DEFAULT_KILL_PIXELS,
  maxClusterPixels: DEFAULT_MAX_CLUSTER_PIXELS,
  minClusterCount: DEFAULT_MIN_CLUSTER_COUNT,
  clusterOpacity: DEFAULT_CLUSTER_OPACITY,
  deselectedTypeIds: [],
  showExcludedTypeIds: [],
  allMeshesShown: true,
  starMeshShown: true,
  planetMeshesShown: true,
  moonMeshesShown: true,
  beltMeshesShown: true,
  enableKillFeed: true,
  showCapsulesInFeed: true,
  showKillFlash: true,
  rangeSelected: null,
  range: null,
};

interface PersistedPerSystem {
  defaultColor?: string;
  killOpacity?: number;
  clusterColor?: string;
  groupColors?: Record<number, string>;
  typeColors?: Record<number, string>;
  maxKills?: number;
  mergePixels?: number;
  killPixels?: number;
  maxClusterPixels?: number;
  minClusterCount?: number;
  clusterOpacity?: number;
  deselectedTypeIds?: number[];
  showExcludedTypeIds?: number[];
  allMeshesShown?: boolean;
  starMeshShown?: boolean;
  planetMeshesShown?: boolean;
  moonMeshesShown?: boolean;
  beltMeshesShown?: boolean;
  enableKillFeed?: boolean;
  showCapsulesInFeed?: boolean;
  showKillFlash?: boolean;
  rangeSelected?: number | null;
  range?: number | null;
}

function hydratePerSystem(p: PersistedPerSystem): PerSystemSettings {
  return {
    ...DEFAULT_PER_SYSTEM,
    ...p,
    typeGroupMap: {},
    colorVersion: 0,
    clusterColorVersion: 0,
    shipTypes: null,
    deselectedTypeIds: p.deselectedTypeIds ?? [],
    showExcludedTypeIds: p.showExcludedTypeIds ?? [],
    rangeSelected: p.rangeSelected ?? null,
    range: p.range ?? null,
  };
}

function partializeSystems(state: {
  systems: Record<string, PerSystemSettings>;
}): { systems: Record<string, PersistedPerSystem> } {
  return {
    systems: Object.fromEntries(
      Object.entries(state.systems).flatMap(([slug, s]) => {
        const p: PersistedPerSystem = {};
        if (s.defaultColor !== DEFAULT_KILL_COLOR)
          p.defaultColor = s.defaultColor;
        if (s.killOpacity !== DEFAULT_KILL_OPACITY)
          p.killOpacity = s.killOpacity;
        if (s.clusterColor !== DEFAULT_CLUSTER_COLOR)
          p.clusterColor = s.clusterColor;
        if (Object.keys(s.groupColors).length > 0)
          p.groupColors = s.groupColors;
        if (Object.keys(s.typeColors).length > 0) p.typeColors = s.typeColors;
        if (s.maxKills !== DEFAULT_MAX_KILLS) p.maxKills = s.maxKills;
        if (s.mergePixels !== DEFAULT_MERGE_PIXELS)
          p.mergePixels = s.mergePixels;
        if (s.killPixels !== DEFAULT_KILL_PIXELS) p.killPixels = s.killPixels;
        if (s.maxClusterPixels !== DEFAULT_MAX_CLUSTER_PIXELS)
          p.maxClusterPixels = s.maxClusterPixels;
        if (s.minClusterCount !== DEFAULT_MIN_CLUSTER_COUNT)
          p.minClusterCount = s.minClusterCount;
        if (s.clusterOpacity !== DEFAULT_CLUSTER_OPACITY)
          p.clusterOpacity = s.clusterOpacity;
        if (s.deselectedTypeIds.length > 0)
          p.deselectedTypeIds = s.deselectedTypeIds;
        if (s.showExcludedTypeIds.length > 0)
          p.showExcludedTypeIds = s.showExcludedTypeIds;
        if (!s.allMeshesShown) p.allMeshesShown = false;
        if (!s.starMeshShown) p.starMeshShown = false;
        if (!s.planetMeshesShown) p.planetMeshesShown = false;
        if (!s.moonMeshesShown) p.moonMeshesShown = false;
        if (!s.beltMeshesShown) p.beltMeshesShown = false;
        if (!s.enableKillFeed) p.enableKillFeed = false;
        if (!s.showCapsulesInFeed) p.showCapsulesInFeed = false;
        if (!s.showKillFlash) p.showKillFlash = false;
        if (s.rangeSelected !== null) p.rangeSelected = s.rangeSelected;
        if (s.range !== null) p.range = s.range;
        if (Object.keys(p).length === 0) return [];
        return [[slug, p]];
      }),
    ),
  };
}

function mergeSystems(
  persisted: unknown,
  current: { systems: Record<string, PerSystemSettings> },
): { systems: Record<string, PerSystemSettings> } {
  const p =
    (persisted as { systems?: Record<string, PersistedPerSystem> }) ?? {};
  const systems: Record<string, PerSystemSettings> = {};
  for (const [slug, ps] of Object.entries(p.systems ?? {})) {
    systems[slug] = hydratePerSystem(ps);
  }
  return { ...current, systems };
}

let persistPaused = false;
const guardedLocalStorage = {
  getItem: (name: string) => localStorage.getItem(name),
  setItem: (name: string, value: string) => {
    if (!persistPaused) localStorage.setItem(name, value);
  },
  removeItem: (name: string) => localStorage.removeItem(name),
};

export function setSettingsPersistPaused(paused: boolean): void {
  persistPaused = paused;
}

const per = createPerSystemStore<PerSystemSettings>({
  name: "system-settings",
  defaultValue: DEFAULT_PER_SYSTEM,
  maxSystems: 200,
  persistOptions: {
    storage: createJSONStorage(() => guardedLocalStorage),
    partialize: partializeSystems,
    merge: mergeSystems,
  },
});

export function snapshotCurrentSettings(): PerSystemSettings {
  return per.ensureCurrent();
}

export function restoreCurrentSettings(snapshot: PerSystemSettings): void {
  per.setCurrent(snapshot);
}

export const setCurrentSystemSlug = per.setCurrentSlug;

export const systemSettingsActions: SystemSettingsActions = {
  setDefaultColor: (color) =>
    per.updateCurrent((c) => ({
      defaultColor: color,
      colorVersion: c.colorVersion + 1,
    })),
  setKillOpacity: (killOpacity) => per.updateCurrent(() => ({ killOpacity })),
  setClusterColor: (color) =>
    per.updateCurrent((c) => ({
      clusterColor: color,
      clusterColorVersion: c.clusterColorVersion + 1,
    })),
  setGroupColor: (groupId, color) =>
    per.updateCurrent((c) => {
      const next = { ...c.groupColors };
      if (color === null) delete next[groupId];
      else next[groupId] = color;
      return { groupColors: next, colorVersion: c.colorVersion + 1 };
    }),
  setTypeColor: (typeId, color) =>
    per.updateCurrent((c) => {
      const next = { ...c.typeColors };
      if (color === null) delete next[typeId];
      else next[typeId] = color;
      return { typeColors: next, colorVersion: c.colorVersion + 1 };
    }),
  setTypeGroupMap: (typeGroupMap) =>
    per.updateCurrent(() => ({ typeGroupMap })),
  setShipTypes: (shipTypes) => per.updateCurrent(() => ({ shipTypes })),
  setMaxKills: (maxKills) => per.updateCurrent(() => ({ maxKills })),
  setMergePixels: (mergePixels) => per.updateCurrent(() => ({ mergePixels })),
  setKillPixels: (killPixels) => per.updateCurrent(() => ({ killPixels })),
  setMaxClusterPixels: (maxClusterPixels) =>
    per.updateCurrent(() => ({ maxClusterPixels })),
  setMinClusterCount: (minClusterCount) =>
    per.updateCurrent(() => ({ minClusterCount })),
  setClusterOpacity: (clusterOpacity) =>
    per.updateCurrent(() => ({ clusterOpacity })),
  setDeselectedTypeIds: (deselectedTypeIds) =>
    per.updateCurrent(() => ({ deselectedTypeIds })),
  setShowExcludedTypeIds: (showExcludedTypeIds) =>
    per.updateCurrent(() => ({ showExcludedTypeIds })),
  setAllShown: (allMeshesShown) =>
    per.updateCurrent(() => ({ allMeshesShown })),
  setStarMeshShown: (starMeshShown) =>
    per.updateCurrent(() => ({ starMeshShown })),
  setPlanetMeshesShown: (planetMeshesShown) =>
    per.updateCurrent(() => ({ planetMeshesShown })),
  setMoonMeshesShown: (moonMeshesShown) =>
    per.updateCurrent(() => ({ moonMeshesShown })),
  setBeltMeshesShown: (beltMeshesShown) =>
    per.updateCurrent(() => ({ beltMeshesShown })),
  setEnableKillFeed: (enableKillFeed) =>
    per.updateCurrent(() => ({ enableKillFeed })),
  setShowCapsulesInFeed: (showCapsulesInFeed) =>
    per.updateCurrent(() => ({ showCapsulesInFeed })),
  setShowKillFlash: (showKillFlash) =>
    per.updateCurrent(() => ({ showKillFlash })),
  setRangeSelected: (rangeSelected) =>
    per.updateCurrent(() => ({ rangeSelected })),
  setRange: (range) => per.updateCurrent(() => ({ range })),
};

export function useSystemSettingsStore<T>(
  selector: (s: SystemSettingsView) => T,
): T {
  const slug = per.getCurrentSlug()!;
  return per.store((state) => {
    const settings = state.systems[slug] ?? DEFAULT_PER_SYSTEM;
    return selector(
      Object.assign({}, settings, systemSettingsActions) as SystemSettingsView,
    );
  });
}

export function getSystemSettingsState(): PerSystemSettings {
  return per.ensureCurrent();
}

declare global {
  interface Window {
    systemSettingsStore?: typeof per.store;
  }
}

if (typeof window !== "undefined") {
  window.systemSettingsStore = per.store;
}
