import { useCallback, useEffect, useRef } from "react";
import { useKillStore, type LiveListEntry } from "@/stores/kill-store";
import { useSystemKillFeedStore } from "@/stores/system/system-kill-feed-store";
import { getSystemSettingsState } from "@/stores/system/system-settings-store";
import { useTimeRangeStore, resolveTimeRange } from "@/stores/time-range-store";
import { LiveKill } from "@/lib/schema/base-schema";
import { appendLiveKill } from "@/lib/kill/kill-octree";
import { RangeFilter, killPassesViewFilters } from "@/lib/kill/kill-filter";
import { usePlaybackStore } from "@/stores/system/playback-store";
import { useFilterStore } from "@/stores/filter-store";
import { killMatchesFilter } from "@/lib/filter/match-live-kill";
import { FilterCondition } from "@/lib/filter/types";
import {
  useLiveKillStore,
  entriesAfter,
  killsForSystem,
  type LiveKillEntry,
} from "@/stores/live-kill-store";

const SESSION_KILLS_CAP = 2000;

interface PendingKill {
  kill: LiveKill;
  flash: boolean;
}

function passesFilter(
  kill: LiveKill,
  conditions: FilterCondition[],
  timeRange: [number, number] | null,
  shipTypes: Set<number> | null,
  rangeFilter: RangeFilter | null,
): boolean {
  if (!killMatchesFilter(kill, conditions)) return false;
  if (
    timeRange &&
    (kill.killmail_time < timeRange[0] || kill.killmail_time > timeRange[1])
  )
    return false;
  return killPassesViewFilters(kill, shipTypes, rangeFilter);
}

export function freshKillsForSystem(
  entries: LiveKillEntry[],
  cursor: number,
  solarSystemId: number,
): { kills: LiveKill[]; cursor: number } {
  const fresh = entriesAfter(entries, cursor);
  const kills: LiveKill[] = [];
  for (const e of fresh)
    if (e.kill.solar_system_id === solarSystemId) kills.push(e.kill);
  return {
    kills,
    cursor: fresh.length ? fresh[fresh.length - 1].seq : cursor,
  };
}

export function useSystemKillFeed(solarSystemId: number) {
  const addKillToFeed = useSystemKillFeedStore((s) => s.addKill);
  const isLoading = useKillStore((s) => s.isLoading);
  const octree = useKillStore((s) => s.octree);

  const knownIdsRef = useRef(new Set<number>());
  const pendingKillsRef = useRef<PendingKill[]>([]);
  const sessionKillsRef = useRef<LiveKill[]>([]);
  const dataReadyRef = useRef(false);
  const cursorRef = useRef(0);

  const processKill = useCallback(
    (kill: LiveKill, flash: boolean) => {
      knownIdsRef.current.add(kill.killmail_id);

      sessionKillsRef.current.push(kill);
      if (sessionKillsRef.current.length > SESSION_KILLS_CAP)
        sessionKillsRef.current.splice(
          0,
          sessionKillsRef.current.length - SESSION_KILLS_CAP,
        );

      const { shipTypes } = getSystemSettingsState();
      const timeRange = resolveTimeRange(useTimeRangeStore.getState().range);
      const conditions = useFilterStore.getState().conditions;
      const rangeFilter = useKillStore.getState().rangeFilter;
      const passes = passesFilter(
        kill,
        conditions,
        timeRange,
        shipTypes,
        rangeFilter,
      );

      if (passes) {
        const currentOctree = useKillStore.getState().octree;
        if (currentOctree) {
          appendLiveKill(
            currentOctree,
            kill.x,
            kill.y,
            kill.z,
            kill.killmail_id,
            kill.v_ship_type_id,
            kill.killmail_time,
          );
        }
        useKillStore.getState().prependLiveKills([
          {
            id: kill.killmail_id,
            time: kill.killmail_time,
            ship: kill.v_ship_type_id,
            x: kill.x,
            y: kill.y,
            z: kill.z,
          },
        ]);
      }

      const shouldFlash =
        flash && passes && !usePlaybackStore.getState().isActive;
      addKillToFeed(kill, shouldFlash);
    },
    [addKillToFeed],
  );

  useEffect(() => {
    const { entries } = useLiveKillStore.getState();
    const backlog = killsForSystem(entries, solarSystemId).reverse();
    for (const kill of backlog)
      pendingKillsRef.current.push({ kill, flash: false });
    cursorRef.current = entries.length ? entries[entries.length - 1].seq : 0;
  }, [solarSystemId]);

  useEffect(() => {
    if (isLoading) return;

    const data = useKillStore.getState().data;
    if (data) knownIdsRef.current = new Set(data.killmail_ids);

    if (!dataReadyRef.current) {
      dataReadyRef.current = true;
      const pending = pendingKillsRef.current.splice(0);
      for (const { kill, flash } of pending) {
        if (!knownIdsRef.current.has(kill.killmail_id))
          processKill(kill, flash);
      }
    }
  }, [isLoading, processKill]);

  useEffect(() => {
    if (!octree || sessionKillsRef.current.length === 0) return;
    const { shipTypes } = getSystemSettingsState();
    const timeRange = resolveTimeRange(useTimeRangeStore.getState().range);
    const conditions = useFilterStore.getState().conditions;
    const rangeFilter = useKillStore.getState().rangeFilter;
    const listAdds: LiveListEntry[] = [];
    for (const kill of sessionKillsRef.current) {
      if (passesFilter(kill, conditions, timeRange, shipTypes, rangeFilter)) {
        appendLiveKill(
          octree,
          kill.x,
          kill.y,
          kill.z,
          kill.killmail_id,
          kill.v_ship_type_id,
          kill.killmail_time,
        );
        listAdds.push({
          id: kill.killmail_id,
          time: kill.killmail_time,
          ship: kill.v_ship_type_id,
          x: kill.x,
          y: kill.y,
          z: kill.z,
        });
      }
    }
    if (listAdds.length > 0) {
      listAdds.reverse();
      useKillStore.getState().prependLiveKills(listAdds);
    }
  }, [octree]);

  useEffect(
    () =>
      useLiveKillStore.subscribe((s, prev) => {
        if (s.entries === prev.entries) return;
        const { kills, cursor } = freshKillsForSystem(
          s.entries,
          cursorRef.current,
          solarSystemId,
        );
        cursorRef.current = cursor;
        for (const kill of kills) {
          if (knownIdsRef.current.has(kill.killmail_id)) continue;
          if (!dataReadyRef.current)
            pendingKillsRef.current.push({ kill, flash: true });
          else processKill(kill, true);
        }
      }),
    [solarSystemId, processKill],
  );
}
