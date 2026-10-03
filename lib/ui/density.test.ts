import { describe, it, expect } from "vitest";
import {
  binTimes,
  gaussianSmooth,
  monotoneCubicPath,
  densityPaths,
} from "@/lib/ui/density";

describe("binTimes", () => {
  it("buckets values across [min,max] into n bins", () => {
    const c = binTimes([0, 3, 5, 9], 0, 10, 5);
    expect(Array.from(c)).toEqual([1, 1, 1, 0, 1]);
  });
  it("clamps out-of-range values into the end bins", () => {
    const c = binTimes([-100, 999], 0, 10, 4);
    expect(c[0]).toBe(1);
    expect(c[3]).toBe(1);
  });
  it("returns all-zero for empty input", () => {
    expect(Array.from(binTimes([], 0, 10, 3))).toEqual([0, 0, 0]);
  });
  it("returns all-zero when span <= 0", () => {
    expect(Array.from(binTimes([5], 10, 10, 3))).toEqual([0, 0, 0]);
  });
});

describe("gaussianSmooth", () => {
  it("preserves length and accepts a plain number[]", () => {
    const out = gaussianSmooth([0, 10, 0], 0.5);
    expect(out.length).toBe(3);
    expect(out[1]).toBeGreaterThan(out[0]);
  });
});

describe("monotoneCubicPath", () => {
  it("starts with a move command at the first point", () => {
    const p = monotoneCubicPath(new Float64Array([10, 20, 15]));
    expect(p.startsWith("M ")).toBe(true);
  });
});

describe("densityPaths", () => {
  it("returns null for empty input", () => {
    expect(densityPaths([], 40)).toBeNull();
  });

  it("returns null for a single bin, which cannot form a curve", () => {
    expect(densityPaths([5], 32)).toBeNull();
  });

  it("returns null when every count is zero", () => {
    expect(densityPaths([0, 0, 0, 0], 40)).toBeNull();
  });

  it("puts a lone spike at the top inset and closes the area along the baseline", () => {
    const paths = densityPaths([0, 0, 0, 5, 0, 0, 0, 0], 32)!;
    expect(paths.linePath).toContain("3.50 2.00");
    expect(paths.linePath.startsWith("M 0.50 ")).toBe(true);
    expect(paths.areaPath.endsWith(" L 7.50 32 L 0.5 32 Z")).toBe(true);
    expect(paths.areaPath.startsWith(paths.linePath)).toBe(true);
  });

  it("draws any bin count as-is", () => {
    const five = densityPaths([1, 2, 3, 2, 1], 32)!;
    expect(five.areaPath.endsWith(" L 4.50 32 L 0.5 32 Z")).toBe(true);
  });

  it("matches the timeline's original composition exactly", () => {
    const counts = [0, 2, 9, 4, 4, 1, 0, 7, 3, 0];
    const N = counts.length;
    const smoothed = gaussianSmooth(counts, 0.5);
    let maxVal = 0;
    let minVal = Infinity;
    for (let i = 0; i < N; i++) {
      if (smoothed[i] > maxVal) maxVal = smoothed[i];
      if (counts[i] < minVal) minVal = counts[i];
    }
    const range = maxVal - minVal;
    const H = 40;
    const yVals = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      const norm = range > 0 ? (smoothed[i] - minVal) / range : 0;
      yVals[i] = H - 2 - norm * (H - 4);
    }
    const linePath = monotoneCubicPath(yVals);
    const areaPath = `${linePath} L ${(N - 0.5).toFixed(2)} ${H} L 0.5 ${H} Z`;
    expect(densityPaths(counts, 40)).toEqual({ linePath, areaPath });
  });
});
