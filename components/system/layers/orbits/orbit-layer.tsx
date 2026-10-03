import { PlanetData } from "@/lib/schema/system-schema";
import { Orbit } from "./orbit";
import React, { useMemo } from "react";

const PLANET_CORE_OPACITY = 0.3;
const PLANET_FALLOFF_OPACITY = 0.1;
const PLANET_BEGIN_FADE = 1000000000;
const PLANET_END_FADE = 100000000;
const MOON_CORE_OPACITY = 0.3;
const MOON_FALLOFF_OPACITY = 0.1;
const MOON_BEGIN_FADE = 10000000;
const MOON_END_FADE = 1000000;

interface OrbitData {
  center: [number, number, number];
  celestialPosition: [number, number, number];
  coreOpacity?: number;
  falloffOpacity?: number;
  beginFade?: number;
  endFade?: number;
}

interface OrbitLayerProps {
  planetData: PlanetData[];
  solarSystemCenter?: [number, number, number];
}

export const OrbitLayer = React.memo(function OrbitLayer({
  planetData,
  solarSystemCenter = [0, 0, 0],
}: OrbitLayerProps) {
  const orbits = useMemo(() => {
    const orbits: Map<number, OrbitData> = new Map();

    for (const planet of planetData) {
      const planetPosition: [number, number, number] = [
        planet.position.x,
        planet.position.y,
        planet.position.z,
      ];

      const orbit: OrbitData = {
        center: solarSystemCenter,
        celestialPosition: planetPosition,
        coreOpacity: PLANET_CORE_OPACITY,
        falloffOpacity: PLANET_FALLOFF_OPACITY,
        beginFade: PLANET_BEGIN_FADE,
        endFade: PLANET_END_FADE,
      };

      orbits.set(planet.planetID, orbit);

      if (planet.moons) {
        for (const moon of planet.moons) {
          const moonPosition: [number, number, number] = [
            moon.position.x,
            moon.position.y,
            moon.position.z,
          ];

          const orbit: OrbitData = {
            center: planetPosition,
            celestialPosition: moonPosition,
            coreOpacity: MOON_CORE_OPACITY,
            falloffOpacity: MOON_FALLOFF_OPACITY,
            beginFade: MOON_BEGIN_FADE,
            endFade: MOON_END_FADE,
          };

          orbits.set(moon.moonID, orbit);
        }
      }
    }

    return Array.from(orbits.entries());
  }, [planetData, solarSystemCenter]);

  return (
    <group>
      {orbits.map(([id, orbit]) => (
        <Orbit key={`r:${id}`} {...orbit} />
      ))}
    </group>
  );
});
