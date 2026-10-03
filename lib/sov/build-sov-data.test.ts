import { describe, it, expect } from "vitest";
import { buildSovData } from "./build-sov-data";
import { SovereigntyResponse } from "@/lib/api/sovereignty";
import { NewEdenMapData } from "@/lib/schema/map-schema";

function mapData(): NewEdenMapData {
  return {
    meta: {
      bbox: { minX: 0, maxX: 2, minY: 0, maxY: 0 },
      span: { x: 2, y: 0 },
      counts: { systems: 3, edges: 2 },
    },
    meta3D: {
      bbox: { minX: 0, maxX: 2, minY: 0, maxY: 0 },
      span: { x: 2, y: 0 },
    },
    systemIDs: [30000001, 30000002, 30000003],
    positions: [0, 0, 3193.611, 0, 6387.222, 0],
    positions3D: [0, 0, 3193.611, 0, 6387.222, 0],
    edges: [0, 1, 1, 2],
    edgeTypes: [1, 1],
    names: ["A", "B", "C"],
    constellationIDs: [1, 1, 1],
    securityStatuses: [-0.5, -0.5, -0.5],
  };
}

const response: SovereigntyResponse = {
  updated_at: 1755345600,
  adm_available: true,
  owner_kinds: [0],
  owner_ids: [99005338],
  owner_names: ["Goonswarm Federation"],
  owner_tickers: ["CONDI"],
  system_ids: [30000001],
  owner_idx: [0],
  adm: [6.0],
};

describe("buildSovData", () => {
  it("propagates from the snapshot and assigns a color per owner", () => {
    const data = buildSovData(response, mapData());
    expect(data.admAvailable).toBe(true);
    expect(data.owners).toHaveLength(1);
    const bySystem = new Map<number, number>();
    for (const s of data.sources)
      bySystem.set(
        s.systemIndex,
        (bySystem.get(s.systemIndex) ?? 0) + s.weight,
      );
    expect(bySystem.get(0)).toBeCloseTo(60, 6);
    expect(bySystem.get(1)).toBeCloseTo(18, 6);
    expect(data.colorByOwner.get(0)).toBeDefined();
  });
});
