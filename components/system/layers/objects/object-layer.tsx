import {
  SystemData,
  PlanetData,
  StarData,
  MoonData,
  AsteroidBeltData,
} from "@/lib/schema/system-schema";
import { Star } from "./star";
import { Planet } from "./planet";
import { Moon } from "./moon";
import { AsteroidBelt } from "./asteroid-belt";
import { ObjectLODManager } from "./object-lod-manager";
import React, { useMemo } from "react";

const OBJECT_COLOR = "white";

interface ObjectLayerProps {
  systemData: SystemData;
}

export const ObjectLayer = React.memo(function ObjectLayer({
  systemData,
}: ObjectLayerProps) {
  const { star, planets, moons, asteroidBelts } = useMemo(() => {
    const star: StarData | undefined = systemData.star;

    const planets: PlanetData[] | undefined = systemData.planets;

    const moons: MoonData[] = [];
    const asteroidBelts: AsteroidBeltData[] = [];

    if (planets) {
      for (const planet of planets) {
        if (planet.moons) moons.push(...planet.moons);

        if (planet.asteroidBelts) asteroidBelts.push(...planet.asteroidBelts);
      }
    }

    return { star, planets, moons, asteroidBelts };
  }, [systemData]);

  return (
    <>
      <ObjectLODManager />
      <group>
        {star && <Star starData={star} color={OBJECT_COLOR} />}
        {planets?.map((planet) => (
          <Planet
            key={`o:${planet.planetID}`}
            planetData={planet}
            color={OBJECT_COLOR}
          />
        ))}
        {moons.map((moon) => (
          <Moon key={`o:${moon.moonID}`} moonData={moon} color={OBJECT_COLOR} />
        ))}
        {asteroidBelts.map((asteroidBelt) => (
          <AsteroidBelt
            key={`o:${asteroidBelt.asteroidBeltID}`}
            asteroidBeltData={asteroidBelt}
            color={OBJECT_COLOR}
          />
        ))}
      </group>
    </>
  );
});
