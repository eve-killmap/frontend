import { SystemData } from "@/lib/schema/system-schema";

const GROUP = {
  STAR: 0,
  STARGATE: 1,
  DISRUPTED_STARGATE: 2,
  STATION: 3,
  CELESTIAL: 4,
} as const;

const BODY = {
  STAR: 0,
  PLANET: 1,
  BELT: 2,
  MOON: 3,
} as const;

type SortGroup = (typeof GROUP)[keyof typeof GROUP];
type BodyType = (typeof BODY)[keyof typeof BODY];

interface LabelData {
  label: string;
  sortGroup: SortGroup;
  celestialIndex: number;
  bodyType: BodyType;
  orbitIndex: number;
}

const labels = new Map<number, LabelData>();

export function processSystemData(systemData: SystemData): void {
  labels.clear();

  const systemName = systemData.name;

  if (systemData.star) {
    labels.set(systemData.star.starID, {
      label: `${systemName} - Star`,
      sortGroup: GROUP.STAR,
      celestialIndex: 0,
      bodyType: BODY.STAR,
      orbitIndex: 0,
    });
  }

  if (systemData.planets) {
    for (const planet of systemData.planets) {
      const planetName =
        planet.uniqueName ??
        `${systemName} ${getNumeral(planet.celestialIndex)}`;
      const ci = planet.celestialIndex;

      labels.set(planet.planetID, {
        label: planetName,
        sortGroup: GROUP.CELESTIAL,
        celestialIndex: ci,
        bodyType: BODY.PLANET,
        orbitIndex: 0,
      });

      if (planet.asteroidBelts) {
        for (const belt of planet.asteroidBelts) {
          const beltName =
            belt.uniqueName ??
            `${planetName} - Asteroid Belt ${belt.orbitIndex}`;
          labels.set(belt.asteroidBeltID, {
            label: beltName,
            sortGroup: GROUP.CELESTIAL,
            celestialIndex: ci,
            bodyType: BODY.BELT,
            orbitIndex: belt.orbitIndex,
          });
        }
      }

      if (planet.moons) {
        for (const moon of planet.moons) {
          const moonName =
            moon.uniqueName ?? `${planetName} - Moon ${moon.orbitIndex}`;
          labels.set(moon.moonID, {
            label: moonName,
            sortGroup: GROUP.CELESTIAL,
            celestialIndex: ci,
            bodyType: BODY.MOON,
            orbitIndex: moon.orbitIndex,
          });

          if (moon.stations) {
            for (const station of moon.stations) {
              labels.set(station.stationID, {
                label: `${moonName} - ${station.name}`,
                sortGroup: GROUP.STATION,
                celestialIndex: ci,
                bodyType: BODY.MOON,
                orbitIndex: moon.orbitIndex,
              });
            }
          }
        }
      }

      if (planet.stations) {
        for (const station of planet.stations) {
          labels.set(station.stationID, {
            label: `${planetName} - ${station.name}`,
            sortGroup: GROUP.STATION,
            celestialIndex: ci,
            bodyType: BODY.PLANET,
            orbitIndex: 0,
          });
        }
      }
    }
  }

  if (systemData.stargates) {
    for (const stargate of systemData.stargates) {
      labels.set(stargate.stargateID, {
        label: `Stargate (${stargate.destName})`,
        sortGroup: GROUP.STARGATE,
        celestialIndex: 0,
        bodyType: BODY.PLANET,
        orbitIndex: 0,
      });
    }
  }

  if (systemData.disruptedStargates) {
    for (const stargate of systemData.disruptedStargates) {
      labels.set(stargate.stargateID, {
        label: `Disrupted Stargate (${stargate.destName})`,
        sortGroup: GROUP.DISRUPTED_STARGATE,
        celestialIndex: 0,
        bodyType: BODY.PLANET,
        orbitIndex: 0,
      });
    }
  }

  if (systemData.stations) {
    for (const station of systemData.stations) {
      labels.set(station.stationID, {
        label: station.name,
        sortGroup: GROUP.STATION,
        celestialIndex: 0,
        bodyType: BODY.PLANET,
        orbitIndex: 0,
      });
    }
  }
}

export function getLabel(id: number): string {
  return labels.get(id)?.label ?? "Unknown object";
}

function compareLabels(a: LabelData, b: LabelData): number {
  return (
    a.sortGroup - b.sortGroup ||
    a.celestialIndex - b.celestialIndex ||
    a.bodyType - b.bodyType ||
    a.orbitIndex - b.orbitIndex ||
    a.label.localeCompare(b.label)
  );
}

export function getAllLabels(): Array<{ id: number; label: string }> {
  return [...labels.entries()]
    .sort(([, a], [, b]) => compareLabels(a, b))
    .map(([id, { label }]) => ({ id, label }));
}

export function sortObjectIDs(ids: readonly number[]): number[] {
  return [...ids].sort((a, b) => {
    const la = labels.get(a);
    const lb = labels.get(b);
    if (!la && !lb) return 0;
    if (!la) return 1;
    if (!lb) return -1;
    return compareLabels(la, lb);
  });
}

const NUMERALS: [string[], string[]] = [
  ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"],
  ["", "X", "XX", "XXX", "XL", "L"],
];

function getNumeral(number: number): string {
  const tens = Math.floor(number / 10);
  const ones = number % 10;
  return `${NUMERALS[1][tens]}${NUMERALS[0][ones]}`;
}
