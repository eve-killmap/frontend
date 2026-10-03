import { describe, it, expect } from "vitest";
import { addIcon, getIconsByIDs, clearIcons } from "./icon-store";
import { processSystemData } from "./system-object-name-store";

function seed() {
  processSystemData({
    solarSystemID: 1,
    constellationName: "C",
    farthestObject: 1,
    name: "S",
    radius: 1,
    regionName: "R",
    securityStatus: 0,
    stargates: [
      {
        destName: "A",
        position: { x: 0, y: 0, z: 0 },
        stargateID: 1,
        typeID: 1,
        jumpType: 0,
        position2D: { x: 0, y: 0 },
      },
      {
        destName: "B",
        position: { x: 0, y: 0, z: 0 },
        stargateID: 2,
        typeID: 1,
        jumpType: 0,
        position2D: { x: 0, y: 0 },
      },
    ],
  });
}

describe("icon-store clearIcons", () => {
  it("empties the registry so stale cross-system icons don't leak", () => {
    seed();
    addIcon(1, { iconID: 4, position: [0, 0, 0] });
    addIcon(2, { iconID: 4, position: [0, 0, 0] });
    expect(getIconsByIDs([1, 2]).length).toBe(2);
    clearIcons();
    expect(getIconsByIDs([1, 2]).length).toBe(0);
  });
});
