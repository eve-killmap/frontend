import type { SystemData } from "@/lib/schema/system-schema";
import {
  SECURITY_HEX,
  WORMHOLE_CLASS_HEX,
  formatSecurity,
  securityIndex,
  wormholeEffectHex,
} from "@/lib/map/system-colors";
import {
  displayWormholeClassLabel,
  wormholeEffectLabel,
} from "@/lib/map/wormhole";

export interface SystemHeaderSpec {
  name: string;
  classLabel: string | null;
  classHex?: string;
  securityLabel: string;
  securityHex: string;
  constellation: string;
  region: string;
  effectLabel: string | null;
  effectHex?: string;
  connections: string;
  focus?: ExportFocus;
}

export interface ExportFocus {
  kind: "centered" | "nearest";
  name: string;
  distanceLabel?: string;
  icon?: CanvasImageSource;
}

export function connectionsLabel(stargateCount: number): string {
  if (stargateCount === 0) return "0 Connections";
  return `${stargateCount} ${stargateCount === 1 ? "connection" : "connections"}`;
}

export function systemHeaderSpec(
  systemData: Pick<
    SystemData,
    | "name"
    | "securityStatus"
    | "constellationName"
    | "regionName"
    | "wormholeClassID"
    | "wormholeEffect"
  >,
  stargateCount: number,
): SystemHeaderSpec {
  const classID = systemData.wormholeClassID;
  const classLabel =
    classID != null
      ? displayWormholeClassLabel(classID, systemData.name)
      : null;
  const effectID = systemData.wormholeEffect ?? 0;
  const effectLabel = classID != null ? wormholeEffectLabel(effectID) : null;
  return {
    name: systemData.name,
    classLabel,
    classHex:
      classLabel && classID != null ? WORMHOLE_CLASS_HEX[classID] : undefined,
    securityLabel: formatSecurity(systemData.securityStatus),
    securityHex: SECURITY_HEX[securityIndex(systemData.securityStatus)],
    constellation: systemData.constellationName,
    region: systemData.regionName,
    effectLabel,
    effectHex: effectLabel ? wormholeEffectHex(effectID) : undefined,
    connections: connectionsLabel(stargateCount),
  };
}
