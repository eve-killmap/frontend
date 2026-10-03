import { describe, it, expect } from "vitest";
import {
  resolveFocusObject,
  CENTERED_TOLERANCE_M,
} from "@/lib/export/focus-object";
import type { SystemData } from "@/lib/schema/system-schema";

const systemData = {
  star: { starID: 40000001, radius: 1, warpPosition: { x: 0, y: 0, z: 0 } },
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

const icons = [
  { id: 40000001, iconID: 7, position: [0, 0, 0] as [number, number, number] },
  {
    id: 40000002,
    iconID: 3,
    position: [0, 0, 5_000_000] as [number, number, number],
  },
  {
    id: 40000003,
    iconID: 2,
    position: [0, 0, 5_100_000] as [number, number, number],
  },
];

describe("resolveFocusObject", () => {
  it("reports the celestial whose icon sits on the camera target as centered", () => {
    const f = resolveFocusObject(
      [0, 0, 5_000_000 + CENTERED_TOLERANCE_M / 2],
      icons,
      systemData,
      {},
    )!;
    expect(f.kind).toBe("centered");
    expect(f.id).toBe(40000002);
    expect(f.iconID).toBe(3);
    expect(f.distance).toBeUndefined();
  });

  it("falls back to the nearest celestial, with its icon, when nothing is centered", () => {
    const f = resolveFocusObject([0, 0, 4_000_000], icons, systemData, {})!;
    expect(f.kind).toBe("nearest");
    expect(f.id).toBe(40000002);
    expect(f.iconID).toBe(3);
    expect(f.distance).toBe(1_000_000);
  });

  it("reports a nearest mining beacon without an icon", () => {
    const f = resolveFocusObject([0, 0, 5_149_000], icons, systemData, {})!;
    expect(f.kind).toBe("nearest");
    expect(f.id).toBeNull();
    expect(f.iconID).toBeNull();
    expect(f.name).toContain("Mining Beacon");
  });

  it("prefers the closest icon when two are within tolerance", () => {
    const close = [
      ...icons,
      {
        id: 99,
        iconID: 6,
        position: [0, 0, 5_000_300] as [number, number, number],
      },
    ];
    const f = resolveFocusObject([0, 0, 5_000_200], close, systemData, {})!;
    expect(f.kind).toBe("centered");
    expect(f.id).toBe(99);
  });

  it("returns null for an empty system", () => {
    expect(
      resolveFocusObject([0, 0, 0], [], {} as unknown as SystemData, {}),
    ).toBeNull();
  });
});
