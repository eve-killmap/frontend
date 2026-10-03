import { describe, it, expect } from "vitest";
import {
  processSystemData,
  getLabel,
  getAllLabels,
} from "./system-object-name-store";
import { SystemData } from "@/lib/schema/system-schema";

function baseSystem(overrides: Partial<SystemData> = {}): SystemData {
  return {
    solarSystemID: 30000001,
    constellationName: "Const",
    farthestObject: 1,
    name: "Tarahva",
    radius: 1,
    regionName: "Pochven",
    securityStatus: -1,
    ...overrides,
  };
}

describe("processSystemData: stargate labels", () => {
  it("labels an intact stargate", () => {
    processSystemData(
      baseSystem({
        stargates: [
          {
            destName: "Kaunokka",
            position: { x: 1, y: 2, z: 3 },
            stargateID: 50000001,
            typeID: 29624,
            jumpType: 0,
            position2D: { x: 1, y: 2 },
          },
        ],
      }),
    );
    expect(getLabel(50000001)).toBe("Stargate (Kaunokka)");
  });

  it("orders disrupted stargates after intact stargates but before stations/celestials (star still first)", () => {
    processSystemData(
      baseSystem({
        star: { starID: 1, radius: 1, warpPosition: { x: 0, y: 0, z: 0 } },
        stargates: [
          {
            destName: "A",
            position: { x: 0, y: 0, z: 0 },
            stargateID: 10,
            typeID: 1,
            jumpType: 0,
            position2D: { x: 0, y: 0 },
          },
        ],
        disruptedStargates: [
          {
            destName: "B",
            position: { x: 0, y: 0, z: 0 },
            stargateID: 20,
            typeID: 1,
          },
        ],
        stations: [
          {
            stationID: 30,
            position: { x: 0, y: 0, z: 0 },
            name: "Stn",
            typeID: 1,
          },
        ],
      }),
    );
    const order = getAllLabels().map((l) => l.id);
    expect(order.indexOf(1)).toBeLessThan(order.indexOf(10));
    expect(order.indexOf(10)).toBeLessThan(order.indexOf(20));
    expect(order.indexOf(20)).toBeLessThan(order.indexOf(30));
  });

  it("labels a disrupted stargate distinctly and includes it in getAllLabels", () => {
    processSystemData(
      baseSystem({
        disruptedStargates: [
          {
            destName: "Niarja",
            position: { x: 4, y: 5, z: 6 },
            stargateID: 50000042,
            typeID: 29624,
          },
        ],
      }),
    );
    expect(getLabel(50000042)).toBe("Disrupted Stargate (Niarja)");
    expect(getAllLabels().some((l) => l.id === 50000042)).toBe(true);
  });
});
