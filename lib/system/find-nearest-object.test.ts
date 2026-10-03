import { describe, it, expect } from "vitest";
import { findNearestObject } from "@/lib/system/find-nearest-object";
import type { SystemData } from "@/lib/schema/system-schema";

const systemData = {
  star: { starID: 40000001, radius: 1, warpPosition: { x: 0, y: 0, z: 0 } },
  stargates: [
    {
      stargateID: 50000001,
      typeID: 29624,
      destName: "X",
      jumpType: 0,
      position: { x: 1_000_000, y: 0, z: 0 },
      position2D: { x: 0, y: 0 },
    },
  ],
  planets: [
    {
      planetID: 40000002,
      radius: 1,
      celestialIndex: 1,
      position: { x: 0, y: 0, z: 5_000_000 },
      warpPosition: { x: 0, y: 0, z: 5_000_000 },
      moons: [
        {
          moonID: 40000003,
          radius: 1,
          orbitIndex: 1,
          position: { x: 0, y: 0, z: 5_100_000 },
          warpPosition: { x: 0, y: 0, z: 5_100_000 },
          miningBeacon: { x: 0, y: 0, z: 5_150_000 },
        },
      ],
    },
  ],
} as unknown as SystemData;

describe("findNearestObject", () => {
  it("returns the id of the nearest celestial along with its distance", () => {
    const near = findNearestObject([900_000, 0, 0], systemData, {
      "29624": 10_000,
    })!;
    expect(near.id).toBe(50000001);
    expect(near.distance).toBe(90_000);
  });

  it("returns a null id for a mining beacon, which has no icon of its own", () => {
    const near = findNearestObject([0, 0, 5_149_000], systemData, {})!;
    expect(near.id).toBeNull();
    expect(near.name).toContain("Mining Beacon");
  });

  it("returns null when the system has no objects", () => {
    expect(
      findNearestObject([0, 0, 0], {} as unknown as SystemData, {}),
    ).toBeNull();
  });
});
