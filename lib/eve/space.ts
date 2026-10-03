export function isNewEdenSystem(solarSystemID: number): boolean {
  return solarSystemID >= 30_000_000 && solarSystemID < 31_000_000;
}
