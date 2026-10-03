export function revealZoomForArea(
  areaIu2: number,
  maxAreaIu2: number,
  strength: number,
  cap: number,
): number {
  if (areaIu2 <= 0 || maxAreaIu2 <= 0) return cap;
  return Math.min(cap, Math.max(1, strength * Math.sqrt(maxAreaIu2 / areaIu2)));
}
