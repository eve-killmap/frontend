export const POINT_GEOMETRY_RADIUS = 9000;

export const ZOOM_SIZE_COMPENSATION = 0.5;

export function pointWorldRadius(zoom: number, pointScale: number): number {
  return (
    (POINT_GEOMETRY_RADIUS * pointScale) /
    Math.pow(zoom, ZOOM_SIZE_COMPENSATION)
  );
}
