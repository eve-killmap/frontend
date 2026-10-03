import { create } from "zustand";
import { RawKillsResponse } from "@/lib/schema/system-schema";
import { KillOctree } from "@/lib/kill/kill-octree";
import { RangeFilter, FilteredKills } from "@/lib/kill/kill-filter";

export interface LiveListEntry {
  id: number;
  time: number;
  ship: number;
  x: number;
  y: number;
  z: number;
}

interface KillStoreState {
  data: RawKillsResponse | null;
  octree: KillOctree | null;
  filteredKills: FilteredKills | null;
  rangeFilter: RangeFilter | null;
  isLoading: boolean;
  filteredCount: number;
  filteredTimeRange: [number, number] | null;
  missingPositionCount: number;
  allowedIds: Set<number> | null;
  filterMaskLoading: boolean;
  filterMaskError: boolean;

  setData: (data: RawKillsResponse | null) => void;
  setOctree: (octree: KillOctree | null) => void;
  setFilteredKills: (filteredKills: FilteredKills | null) => void;
  prependLiveKills: (kills: LiveListEntry[]) => void;
  setRangeFilter: (rangeFilter: RangeFilter | null) => void;
  setLoading: (loading: boolean) => void;
  setFilteredStats: (count: number, timeRange: [number, number] | null) => void;
  setMissingPositionCount: (count: number) => void;
  setAllowedIds: (ids: Set<number> | null) => void;
  setFilterMaskLoading: (loading: boolean) => void;
  setFilterMaskError: (error: boolean) => void;
  reset: () => void;
}

export const useKillStore = create<KillStoreState>((set) => ({
  data: null,
  octree: null,
  filteredKills: null,
  rangeFilter: null,
  isLoading: false,
  filteredCount: 0,
  filteredTimeRange: null,
  missingPositionCount: 0,
  allowedIds: null,
  filterMaskLoading: false,
  filterMaskError: false,

  setData: (data) => set({ data }),
  setOctree: (octree) => set({ octree }),
  setFilteredKills: (filteredKills) => set({ filteredKills }),
  prependLiveKills: (kills) =>
    set((state) => {
      const fk = state.filteredKills;
      if (!fk || kills.length === 0) return {};
      const next: FilteredKills = {
        killmailIds: [...kills.map((k) => k.id), ...fk.killmailIds],
        x: [...kills.map((k) => k.x), ...fk.x],
        y: [...kills.map((k) => k.y), ...fk.y],
        z: [...kills.map((k) => k.z), ...fk.z],
        shipTypes: [...kills.map((k) => k.ship), ...fk.shipTypes],
        killmailTimes: [...kills.map((k) => k.time), ...fk.killmailTimes],
        count: fk.count + kills.length,
        latestTime: Math.max(fk.latestTime ?? kills[0].time, kills[0].time),
        earliestTime: fk.earliestTime ?? kills[kills.length - 1].time,
      };
      return {
        filteredKills: next,
        filteredCount: next.count,
        filteredTimeRange:
          next.earliestTime != null && next.latestTime != null
            ? [next.earliestTime, next.latestTime]
            : state.filteredTimeRange,
      };
    }),
  setRangeFilter: (rangeFilter) => set({ rangeFilter }),
  setLoading: (loading) => set({ isLoading: loading }),
  setFilteredStats: (count, timeRange) =>
    set({ filteredCount: count, filteredTimeRange: timeRange }),
  setMissingPositionCount: (missingPositionCount) =>
    set({ missingPositionCount }),
  setAllowedIds: (allowedIds) => set({ allowedIds }),
  setFilterMaskLoading: (filterMaskLoading) => set({ filterMaskLoading }),
  setFilterMaskError: (filterMaskError) => set({ filterMaskError }),
  reset: () =>
    set({
      data: null,
      octree: null,
      filteredKills: null,
      rangeFilter: null,
      isLoading: false,
      filteredCount: 0,
      filteredTimeRange: null,
      missingPositionCount: 0,
      allowedIds: null,
      filterMaskLoading: false,
      filterMaskError: false,
    }),
}));
