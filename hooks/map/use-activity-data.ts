import { useMemo } from "react";
import { useTimeRangeStore } from "@/stores/time-range-store";
import { useMapSystemsStore } from "@/stores/map/map-systems-store";
import { useFilterConditions } from "@/stores/filter-store";
import {
  useSystemKills,
  buildActivityLookup,
} from "@/hooks/map/use-system-kills";
import { ActivityLookup } from "@/lib/map/system-colors";

export interface ActivityData {
  lookup: ActivityLookup | null;
  filterActive: boolean;
  loading: boolean;
  error: boolean;
}

export function useActivityData(enableUnfiltered: boolean): ActivityData {
  const mapSystemIDs = useMapSystemsStore((s) => s.systemIDs);
  const conditions = useFilterConditions();
  const filterActive = conditions.length > 0;
  const range = useTimeRangeStore((s) => s.range);

  const {
    data,
    loading: fetching,
    error,
  } = useSystemKills(conditions, range, enableUnfiltered || filterActive);

  const lookup = useMemo(
    () => (data ? buildActivityLookup(data, mapSystemIDs) : null),
    [data, mapSystemIDs],
  );

  return { lookup, filterActive, loading: filterActive && fetching, error };
}
