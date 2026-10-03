import { useEffect, useMemo, useRef } from "react";
import { useKillStore } from "@/stores/kill-store";
import { useSystemSettingsStore } from "@/stores/system/system-settings-store";
import { useResolvedTimeRange } from "@/hooks/use-time-range";
import { usePlaybackStore } from "@/stores/system/playback-store";
import {
  filterKills,
  countMissingPositions,
  RangeFilter,
} from "@/lib/kill/kill-filter";
import { buildOctree } from "@/lib/kill/kill-octree";
import { SystemData } from "@/lib/schema/system-schema";

const DEBOUNCE_MS = 300;

export function useKillFiltering(systemData: SystemData) {
  const data = useKillStore((s) => s.data);
  const setOctree = useKillStore((s) => s.setOctree);
  const setFilteredKills = useKillStore((s) => s.setFilteredKills);
  const setFilteredStats = useKillStore((s) => s.setFilteredStats);
  const setMissingPositionCount = useKillStore(
    (s) => s.setMissingPositionCount,
  );
  const allowedIds = useKillStore((s) => s.allowedIds);
  const filterMaskLoading = useKillStore((s) => s.filterMaskLoading);
  const timeRange = useResolvedTimeRange();
  const shipTypes = useSystemSettingsStore((s) => s.shipTypes);
  const maxKills = useSystemSettingsStore((s) => s.maxKills);
  const rangeSelected = useSystemSettingsStore((s) => s.rangeSelected);
  const range = useSystemSettingsStore((s) => s.range);
  const isPlaybackActive = usePlaybackStore((s) => s.isActive);
  const playbackRangeStart = usePlaybackStore((s) => s.rangeStart);
  const playbackRangeEnd = usePlaybackStore((s) => s.rangeEnd);

  const rangeFilter = useMemo((): RangeFilter | null => {
    if (range === null) return null;

    let pos: [number, number, number] | null = null;

    if (systemData.star && rangeSelected === systemData.star.starID) {
      const p = systemData.star.warpPosition;
      pos = [p.x, p.y, p.z];
    }
    if (!pos) {
      outer: for (const planet of systemData.planets ?? []) {
        if (rangeSelected === planet.planetID) {
          pos = [planet.position.x, planet.position.y, planet.position.z];
          break;
        }
        for (const moon of planet.moons ?? []) {
          if (rangeSelected === moon.moonID) {
            pos = [moon.position.x, moon.position.y, moon.position.z];
            break outer;
          }
          for (const st of moon.stations ?? []) {
            if (rangeSelected === st.stationID) {
              pos = [st.position.x, st.position.y, st.position.z];
              break outer;
            }
          }
        }
        for (const belt of planet.asteroidBelts ?? []) {
          if (rangeSelected === belt.asteroidBeltID) {
            pos = [belt.position.x, belt.position.y, belt.position.z];
            break outer;
          }
        }
        for (const st of planet.stations ?? []) {
          if (rangeSelected === st.stationID) {
            pos = [st.position.x, st.position.y, st.position.z];
            break outer;
          }
        }
      }
    }
    if (!pos) {
      for (const gate of systemData.stargates ?? []) {
        if (rangeSelected === gate.stargateID) {
          pos = [gate.position.x, gate.position.y, gate.position.z];
          break;
        }
      }
    }

    if (!pos) return null;
    return { positions: new Float64Array(pos), rangeSq: range * range };
  }, [systemData, rangeSelected, range]);

  const setRangeFilter = useKillStore((s) => s.setRangeFilter);
  useEffect(() => {
    setRangeFilter(rangeFilter);
  }, [rangeFilter, setRangeFilter]);

  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hadDataRef = useRef(false);

  useEffect(() => {
    setMissingPositionCount(data ? countMissingPositions(data) : 0);
  }, [data, setMissingPositionCount]);

  useEffect(() => {
    if (!data || data.count === 0) {
      setOctree(null);
      setFilteredKills(null);
      setFilteredStats(0, null);
      hadDataRef.current = false;
      return;
    }

    if (filterMaskLoading) return;

    const rebuild = () => {
      const effectiveTimeRange: [number, number] | null = isPlaybackActive
        ? [playbackRangeStart, playbackRangeEnd]
        : timeRange;
      const effectiveMaxKills = isPlaybackActive ? data.count : maxKills;
      const filtered = filterKills(
        data,
        effectiveTimeRange,
        shipTypes,
        effectiveMaxKills,
        rangeFilter,
        allowedIds,
      );
      setFilteredKills(filtered);
      const timeRangeResult: [number, number] | null =
        filtered.earliestTime != null && filtered.latestTime != null
          ? [filtered.earliestTime, filtered.latestTime]
          : null;
      setFilteredStats(filtered.count, timeRangeResult);
      if (filtered.count > 0) {
        const octree = buildOctree(
          filtered.x,
          filtered.y,
          filtered.z,
          filtered.killmailIds,
          filtered.shipTypes,
          filtered.killmailTimes,
          filtered.count,
        );
        setOctree(octree);
      } else {
        setOctree(null);
      }
    };

    if (!hadDataRef.current) {
      hadDataRef.current = true;
      rebuild();
      return;
    }

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(rebuild, DEBOUNCE_MS);

    return () => clearTimeout(timerRef.current);
  }, [
    data,
    timeRange,
    shipTypes,
    maxKills,
    rangeFilter,
    allowedIds,
    filterMaskLoading,
    isPlaybackActive,
    playbackRangeStart,
    playbackRangeEnd,
    setOctree,
    setFilteredKills,
    setFilteredStats,
  ]);
}
