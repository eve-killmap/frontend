import { NewEdenMapData } from "@/lib/schema/map-schema";
import { SovereigntyResponse } from "@/lib/api/sovereignty";
import { RGB } from "@/lib/map/system-colors";
import { AU_PER_IU_3D, INSENSITIVITY } from "./kernel";
import { propagate, SovSource, SovOwner } from "./propagate";
import { assignColors, ColorOwner } from "./colors";

export interface SovData {
  response: SovereigntyResponse;
  sources: SovSource[];
  owners: SovOwner[];
  colorByOwner: Map<number, RGB>;
  admAvailable: boolean;
  updatedAt: number;
}

const NEIGHBOUR_RADIUS_IU = 2 * Math.sqrt(INSENSITIVITY);
const NEIGHBOUR_RADIUS2_IU = NEIGHBOUR_RADIUS_IU * NEIGHBOUR_RADIUS_IU;

export function buildSovData(
  response: SovereigntyResponse,
  mapData: NewEdenMapData,
): SovData {
  const { sources, owners } = propagate({
    systemIds: response.system_ids,
    ownerIdx: response.owner_idx,
    adm: response.adm,
    ownerKinds: response.owner_kinds,
    ownerIds: response.owner_ids,
    ownerNames: response.owner_names,
    ownerTickers: response.owner_tickers,
    mapSystemIDs: mapData.systemIDs,
    edges: mapData.edges,
    securityStatuses: mapData.securityStatuses,
  });

  const indexById = new Map<number, number>();
  for (let i = 0; i < mapData.systemIDs.length; i++)
    indexById.set(mapData.systemIDs[i], i);

  const ownerSystemsIu = new Map<number, [number, number][]>();
  for (let s = 0; s < response.system_ids.length; s++) {
    const idx = indexById.get(response.system_ids[s]);
    if (idx === undefined) continue;
    const oi = response.owner_idx[s];
    const list = ownerSystemsIu.get(oi) ?? [];
    list.push([
      mapData.positions3D[idx * 2] / AU_PER_IU_3D,
      mapData.positions3D[idx * 2 + 1] / AU_PER_IU_3D,
    ]);
    ownerSystemsIu.set(oi, list);
  }

  const neighbours = buildNeighbourGraph(ownerSystemsIu);

  const colorOwners: ColorOwner[] = owners.map((o) => ({
    ownerIndex: o.ownerIndex,
    kind: o.kind,
    id: o.id,
    systemCount: o.systemCount,
  }));
  const colorByOwner = assignColors(colorOwners, neighbours);

  return {
    response,
    sources,
    owners,
    colorByOwner,
    admAvailable: response.adm_available,
    updatedAt: response.updated_at,
  };
}

function buildNeighbourGraph(
  ownerSystemsIu: Map<number, [number, number][]>,
): Map<number, Set<number>> {
  const ids = [...ownerSystemsIu.keys()];
  const out = new Map<number, Set<number>>();
  for (const id of ids) out.set(id, new Set());
  for (let a = 0; a < ids.length; a++) {
    for (let b = a + 1; b < ids.length; b++) {
      if (
        withinRadius(ownerSystemsIu.get(ids[a])!, ownerSystemsIu.get(ids[b])!)
      ) {
        out.get(ids[a])!.add(ids[b]);
        out.get(ids[b])!.add(ids[a]);
      }
    }
  }
  return out;
}

function withinRadius(pa: [number, number][], pb: [number, number][]): boolean {
  for (const [ax, ay] of pa) {
    for (const [bx, by] of pb) {
      const dx = ax - bx;
      const dy = ay - by;
      if (dx * dx + dy * dy <= NEIGHBOUR_RADIUS2_IU) return true;
    }
  }
  return false;
}
