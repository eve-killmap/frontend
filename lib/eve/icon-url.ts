const ICON_URLS = [
  "brackets/asteroidBelt.png",
  "brackets/beacon.png",
  "brackets/moon.png",
  "brackets/planet.png",
  "brackets/stargate.png",
  "brackets/disruptedStargate.png",
  "brackets/station.png",
  "brackets/sun.png",
] as const;

export const getIconURL = (id: number) => ICON_URLS[id];
