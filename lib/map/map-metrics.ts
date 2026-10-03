export const mapMetrics = {
  x: 0,
  y: 0,
  zoom: 1,
  viewportWidth: 0,
  viewportHeight: 0,
  systems: 0,
  edges: 0,
  visibleLabels: 0,
};

export function resetMapMetrics(): void {
  mapMetrics.x = 0;
  mapMetrics.y = 0;
  mapMetrics.zoom = 1;
  mapMetrics.viewportWidth = 0;
  mapMetrics.viewportHeight = 0;
  mapMetrics.systems = 0;
  mapMetrics.edges = 0;
  mapMetrics.visibleLabels = 0;
}
