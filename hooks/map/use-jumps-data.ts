import { useMemo } from "react";
import { useMapSystemsStore } from "@/stores/map/map-systems-store";
import { useSystemJumps, buildJumpsLookup } from "@/hooks/map/use-system-jumps";
import { ActivityLookup } from "@/lib/map/system-colors";

export interface JumpsData {
  lookup: ActivityLookup | null;
  loading: boolean;
  error: boolean;
}

export function useJumpsData(enabled: boolean): JumpsData {
  const mapSystemIDs = useMapSystemsStore((s) => s.systemIDs);
  const { data, loading, error } = useSystemJumps(enabled);

  const lookup = useMemo(
    () => (data ? buildJumpsLookup(data, mapSystemIDs) : null),
    [data, mapSystemIDs],
  );

  return { lookup, loading, error };
}
