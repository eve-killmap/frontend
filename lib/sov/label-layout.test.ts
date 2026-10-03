import { describe, it, expect } from "vitest";
import { revealZoomForArea } from "./label-layout";

describe("revealZoomForArea", () => {
  it("reveals the largest region at the zoom floor (1)", () => {
    expect(revealZoomForArea(1000, 1000, 1, 30)).toBe(1);
  });

  it("scales the reveal zoom by the sqrt of the inverse area ratio", () => {
    expect(revealZoomForArea(250, 1000, 1, 30)).toBe(2);
    expect(revealZoomForArea(10, 1000, 1, 30)).toBeCloseTo(10, 6);
  });

  it("applies the strength multiplier (smaller reveals everything sooner)", () => {
    expect(revealZoomForArea(250, 1000, 0.5, 30)).toBe(1);
    expect(revealZoomForArea(10, 1000, 0.5, 30)).toBeCloseTo(5, 6);
  });

  it("clamps tiny regions to the cap", () => {
    expect(revealZoomForArea(1, 1e9, 1, 30)).toBe(30);
  });

  it("never returns below the zoom floor of 1 (region bigger than the max)", () => {
    expect(revealZoomForArea(2000, 1000, 1, 30)).toBe(1);
  });

  it("returns the cap for degenerate areas", () => {
    expect(revealZoomForArea(0, 1000, 1, 30)).toBe(30);
    expect(revealZoomForArea(100, 0, 1, 30)).toBe(30);
  });
});
