import { describe, it, expect } from "vitest";
import { mapMetrics, resetMapMetrics } from "./map-metrics";

describe("mapMetrics", () => {
  it("starts at the idle values", () => {
    resetMapMetrics();
    expect(mapMetrics).toEqual({
      x: 0,
      y: 0,
      zoom: 1,
      viewportWidth: 0,
      viewportHeight: 0,
      systems: 0,
      edges: 0,
      visibleLabels: 0,
    });
  });
  it("resets every field after mutation", () => {
    mapMetrics.x = 12;
    mapMetrics.zoom = 4;
    mapMetrics.systems = 8000;
    mapMetrics.visibleLabels = 30;
    resetMapMetrics();
    expect(mapMetrics.x).toBe(0);
    expect(mapMetrics.zoom).toBe(1);
    expect(mapMetrics.systems).toBe(0);
    expect(mapMetrics.visibleLabels).toBe(0);
  });
});
