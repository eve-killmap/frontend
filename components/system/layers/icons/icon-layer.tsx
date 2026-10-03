import {
  AsteroidBeltData,
  MoonData,
  PlanetData,
  StarData,
  StargateData,
  StationData,
  SystemData,
} from "@/lib/schema/system-schema";
import { IconLayoutManager } from "./icon-layout-manager";
import { StarIcon } from "./star-icon";
import { PlanetIcon } from "./planet-icon";
import { MoonIcon } from "./moon-icon";
import { AsteroidBeltIcon } from "./asteroid-belt-icon";
import { StationIcon } from "./station-icon";
import { StargateIcon } from "./stargate-icon";
import { HoverListOverlay } from "@/components/system/ui/hover-list-overlay";
import React, { useMemo } from "react";

const HOVER_COLOR = "white";

interface IconLayerProps {
  systemData: SystemData;
}

export const IconLayer = React.memo(function IconLayer({
  systemData,
}: IconLayerProps) {
  const {
    star,
    stargates,
    disruptedStargates,
    planets,
    moons,
    asteroidBelts,
    stations,
  } = useMemo(() => {
    const star: StarData | undefined = systemData.star;

    const stargates: StargateData[] | undefined = systemData.stargates;
    const disruptedStargates: StargateData[] | undefined =
      systemData.disruptedStargates;

    const planets: PlanetData[] | undefined = systemData.planets;

    const moons: MoonData[] = [];
    const asteroidBelts: AsteroidBeltData[] = [];
    const stations: StationData[] = [];

    if (planets) {
      for (const planet of planets) {
        if (planet.moons) {
          for (const moon of planet.moons) {
            moons.push(moon);

            if (moon.stations) {
              for (const station of moon.stations) {
                stations.push(station);
              }
            }
          }
        }

        if (planet.asteroidBelts) {
          for (const asteroidBelt of planet.asteroidBelts) {
            asteroidBelts.push(asteroidBelt);
          }
        }

        if (planet.stations) {
          for (const station of planet.stations) {
            stations.push(station);
          }
        }
      }
    }

    if (systemData.stations) {
      for (const station of systemData.stations) {
        stations.push(station);
      }
    }

    return {
      star,
      stargates,
      disruptedStargates,
      planets,
      moons,
      asteroidBelts,
      stations,
    };
  }, [systemData]);

  return (
    <>
      <IconLayoutManager />
      <group>
        {star && <StarIcon starData={star} hoverColor={HOVER_COLOR} />}
        {planets &&
          planets.map((planet) => (
            <PlanetIcon
              key={`i:${planet.planetID}`}
              planetData={planet}
              hoverColor={HOVER_COLOR}
            />
          ))}
        {moons.map((moon) => (
          <MoonIcon
            key={`i:${moon.moonID}`}
            moonData={moon}
            hoverColor={HOVER_COLOR}
          />
        ))}
        {asteroidBelts.map((asteroidBelt) => (
          <AsteroidBeltIcon
            key={`i:${asteroidBelt.asteroidBeltID}`}
            asteroidBeltData={asteroidBelt}
            hoverColor={HOVER_COLOR}
          />
        ))}
        {stations.map((station) => (
          <StationIcon
            key={`i:${station.stationID}`}
            stationData={station}
            hoverColor={HOVER_COLOR}
          />
        ))}
        {stargates?.map((stargate) => (
          <StargateIcon
            key={`i:${stargate.stargateID}`}
            stargateData={stargate}
            hoverColor={HOVER_COLOR}
            disrupted={false}
          />
        ))}
        {disruptedStargates?.map((stargate) => (
          <StargateIcon
            key={`i:${stargate.stargateID}`}
            stargateData={stargate}
            hoverColor={HOVER_COLOR}
            disrupted={true}
          />
        ))}
        <HoverListOverlay />
      </group>
    </>
  );
});
