import { useMemo } from "react";
import {
  ConstellationData,
  MapData,
  isAnoikisMapData,
} from "@/lib/schema/map-schema";
import { useMapStore } from "@/stores/map/map-store";
import { buildSystemColors, RGB } from "@/lib/map/system-colors";
import { useActivityData } from "@/hooks/map/use-activity-data";
import { useJumpsData } from "@/hooks/map/use-jumps-data";
import { useSovStore } from "@/stores/map/sov-store";

export type SovOwnerLookup = (
  systemID: number,
) => { name: string | null; ticker: string | null } | undefined;

export interface SystemColors {
  colors: Float32Array;
  sovOwnerFor: SovOwnerLookup | undefined;
}

export function useSystemColors(
  mapData: MapData,
  constellationData: ConstellationData,
): SystemColors {
  const colorMode = useMapStore((s) => s.colorMode);
  const { lookup, filterActive } = useActivityData(colorMode === "activity");

  const effectiveMode = filterActive ? "activity" : colorMode;
  const active = effectiveMode !== "none";
  const isSov = effectiveMode === "sovereignty";
  const { lookup: jumps } = useJumpsData(effectiveMode === "jumps");

  const sovData = useSovStore((s) => s.data);

  const sovColorFor = useMemo(() => {
    if (!isSov || !sovData) return undefined;
    const { response, colorByOwner } = sovData;
    const byId = new Map<number, RGB>();
    for (let i = 0; i < response.system_ids.length; i++) {
      const rgb = colorByOwner.get(response.owner_idx[i]);
      if (rgb) byId.set(response.system_ids[i], rgb);
    }
    return (systemID: number) => byId.get(systemID);
  }, [isSov, sovData]);

  const sovOwnerFor = useMemo<SovOwnerLookup | undefined>(() => {
    if (!isSov || !sovData) return undefined;
    const { response, owners } = sovData;
    const byId = new Map<
      number,
      { name: string | null; ticker: string | null }
    >();
    for (let i = 0; i < response.system_ids.length; i++) {
      const o = owners[response.owner_idx[i]];
      if (o)
        byId.set(response.system_ids[i], { name: o.name, ticker: o.ticker });
    }
    return (systemID: number) => byId.get(systemID);
  }, [isSov, sovData]);

  const colors = useMemo(() => {
    if (!active) {
      return buildSystemColors({ mode: "none", systemIDs: mapData.systemIDs });
    }
    const activity = effectiveMode === "activity" ? lookup : null;
    return buildSystemColors({
      mode: effectiveMode,
      systemIDs: mapData.systemIDs,
      securityStatuses: mapData.securityStatuses,
      regionIDByIndex: (i) =>
        constellationData[mapData.constellationIDs[i]]?.regionID,
      activity,
      jumps: effectiveMode === "jumps" ? jumps : null,
      sovColorFor,
      wormholeClassIDs: isAnoikisMapData(mapData)
        ? mapData.wormholeClassIDs
        : undefined,
      wormholeEffects: isAnoikisMapData(mapData)
        ? mapData.wormholeEffects
        : undefined,
    });
  }, [
    active,
    effectiveMode,
    lookup,
    jumps,
    mapData,
    constellationData,
    sovColorFor,
  ]);

  return { colors, sovOwnerFor };
}
