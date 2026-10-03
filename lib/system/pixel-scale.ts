export function worldPerPixel(
  depth: number,
  halfTanFov: number,
  viewportHeight: number,
): number {
  return (2 * depth * halfTanFov) / viewportHeight;
}

export function pixelToWorld(
  pixels: number,
  depth: number,
  halfTanFov: number,
  viewportHeight: number,
): number {
  return pixels * worldPerPixel(depth, halfTanFov, viewportHeight);
}
