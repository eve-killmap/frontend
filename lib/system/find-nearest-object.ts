import { SystemData, TypeRadiiData } from "@/lib/schema/system-schema";
import { getLabel } from "@/stores/system/system-object-name-store";

export interface NearestObject {
  id: number | null;
  name: string;
  distance: number;
}

export function findNearestObject(
  pos: [number, number, number],
  systemData: SystemData,
  typeRadii: TypeRadiiData,
): NearestObject | null {
  let best: NearestObject | null = null;

  function check(
    id: number | null,
    name: string,
    x: number,
    y: number,
    z: number,
    radius = 0,
  ) {
    const d = Math.max(
      0,
      Math.sqrt((pos[0] - x) ** 2 + (pos[1] - y) ** 2 + (pos[2] - z) ** 2) -
        radius,
    );
    if (!best || d < best.distance) best = { id, name, distance: d };
  }

  if (systemData.star) {
    const p = systemData.star.warpPosition;
    const id = systemData.star.starID;
    check(id, getLabel(id), p.x, p.y, p.z);
  }
  for (const gate of systemData.stargates ?? []) {
    check(
      gate.stargateID,
      getLabel(gate.stargateID),
      gate.position.x,
      gate.position.y,
      gate.position.z,
      typeRadii[String(gate.typeID)] ?? 0,
    );
  }
  for (const gate of systemData.disruptedStargates ?? []) {
    check(
      gate.stargateID,
      getLabel(gate.stargateID),
      gate.position.x,
      gate.position.y,
      gate.position.z,
      typeRadii[String(gate.typeID)] ?? 0,
    );
  }
  for (const planet of systemData.planets ?? []) {
    check(
      planet.planetID,
      getLabel(planet.planetID),
      planet.warpPosition.x,
      planet.warpPosition.y,
      planet.warpPosition.z,
    );
    for (const moon of planet.moons ?? []) {
      check(
        moon.moonID,
        getLabel(moon.moonID),
        moon.warpPosition.x,
        moon.warpPosition.y,
        moon.warpPosition.z,
      );
      if (moon.miningBeacon) {
        check(
          null,
          `${getLabel(moon.moonID)} - Mining Beacon`,
          moon.miningBeacon.x,
          moon.miningBeacon.y,
          moon.miningBeacon.z,
        );
      }
      for (const station of moon.stations ?? []) {
        check(
          station.stationID,
          getLabel(station.stationID),
          station.position.x,
          station.position.y,
          station.position.z,
          typeRadii[String(station.typeID)] ?? 0,
        );
      }
    }
    for (const belt of planet.asteroidBelts ?? []) {
      check(
        belt.asteroidBeltID,
        getLabel(belt.asteroidBeltID),
        belt.position.x,
        belt.position.y,
        belt.position.z,
        belt.radius ?? 0,
      );
    }
    for (const station of planet.stations ?? []) {
      check(
        station.stationID,
        getLabel(station.stationID),
        station.position.x,
        station.position.y,
        station.position.z,
        typeRadii[String(station.typeID)] ?? 0,
      );
    }
  }
  return best;
}
