import { describe, it, expect } from "vitest";
import { fitHalfExtents } from "@/lib/map/map-camera";

describe("fitHalfExtents", () => {
  it("widens the horizontal extent on a wide viewport", () => {
    expect(fitHalfExtents(100, 100, 1, 2)).toEqual({ halfW: 100, halfH: 50 });
  });

  it("widens the vertical extent on a tall viewport", () => {
    expect(fitHalfExtents(100, 100, 1, 0.5)).toEqual({ halfW: 50, halfH: 100 });
  });

  it("applies the margin", () => {
    const { halfW, halfH } = fitHalfExtents(100, 100, 1.1, 1);
    expect(halfW).toBeCloseTo(55, 9);
    expect(halfH).toBeCloseTo(55, 9);
  });

  it("always keeps the full margined span visible in both axes", () => {
    const cases: [number, number, number, number][] = [
      [100, 100, 1.1, 2],
      [100, 100, 1.1, 0.5],
      [800, 200, 1.1, 1.6],
      [200, 800, 1.1, 1.6],
    ];
    for (const [spanX, spanY, margin, aspect] of cases) {
      const { halfW, halfH } = fitHalfExtents(spanX, spanY, margin, aspect);
      expect(halfW * 2).toBeGreaterThanOrEqual(spanX * margin - 1e-9);
      expect(halfH * 2).toBeGreaterThanOrEqual(spanY * margin - 1e-9);
      expect(halfW / halfH).toBeCloseTo(aspect, 9);
    }
  });

  it("scales linearly with span, so a larger span yields proportionally larger extents", () => {
    const small = fitHalfExtents(100, 100, 1.1, 1.5);
    const large = fitHalfExtents(150, 150, 1.1, 1.5);
    expect(large.halfW / small.halfW).toBeCloseTo(1.5, 9);
    expect(large.halfH / small.halfH).toBeCloseTo(1.5, 9);
  });
});
