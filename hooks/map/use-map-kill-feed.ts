import { useEffect } from "react";
import { useKillFeedStore } from "@/stores/map/kill-feed-store";
import {
  useLiveKillStore,
  entriesAfter,
  type LiveKillEntry,
} from "@/stores/live-kill-store";
import { useFilterStore } from "@/stores/filter-store";
import { killMatchesFilter } from "@/lib/filter/match-live-kill";
import { FilterCondition } from "@/lib/filter/types";
import { LiveKill } from "@/lib/schema/base-schema";

export function processMapFeedEntries(
  entries: LiveKillEntry[],
  cursor: number,
  conditions: FilterCondition[],
  addKill: (kill: LiveKill, matchesFilter: boolean) => void,
): number {
  const fresh = entriesAfter(entries, cursor);
  for (const e of fresh) addKill(e.kill, killMatchesFilter(e.kill, conditions));
  return fresh.length ? fresh[fresh.length - 1].seq : cursor;
}

let cursor = 0;

export function useMapKillFeed(): void {
  useEffect(() => {
    const drain = (flash: boolean) => {
      const { entries } = useLiveKillStore.getState();
      const conditions = useFilterStore.getState().conditions;
      const addKill = useKillFeedStore.getState().addKill;
      cursor = processMapFeedEntries(entries, cursor, conditions, (kill, ok) =>
        addKill(kill, flash && ok),
      );
    };
    drain(false);
    return useLiveKillStore.subscribe((s, prev) => {
      if (s.entries !== prev.entries) drain(true);
    });
  }, []);
}
