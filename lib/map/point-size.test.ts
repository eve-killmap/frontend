import { describe, it, expect } from "vitest";
import {
  pointWorldRadius,
  POINT_GEOMETRY_RADIUS,
  ZOOM_SIZE_COMPENSATION,
} from "./point-size";

describe("point-size", () => {
  it("exposes the documented constants", () => {
    expect(POINT_GEOMETRY_RADIUS).toBe(9000);
    expect(ZOOM_SIZE_COMPENSATION).toBe(0.5);
  });

  it("equals radius*scale at zoom 1", () => {
    expect(pointWorldRadius(1, 1)).toBe(POINT_GEOMETRY_RADIUS);
    expect(pointWorldRadius(1, 2)).toBe(POINT_GEOMETRY_RADIUS * 2);
  });

  it("shrinks with zoom by the compensation exponent", () => {
    expect(pointWorldRadius(4, 1)).toBeCloseTo(
      POINT_GEOMETRY_RADIUS / Math.pow(4, ZOOM_SIZE_COMPENSATION),
      6,
    );
    expect(pointWorldRadius(4, 1)).toBeLessThan(pointWorldRadius(1, 1));
  });

  it("decreases monotonically as zoom increases", () => {
    const radii = [1, 2, 4, 8, 16].map((zoom) => pointWorldRadius(zoom, 1));
    for (let i = 1; i < radii.length; i++) {
      expect(radii[i]).toBeLessThan(radii[i - 1]);
    }
  });
});
