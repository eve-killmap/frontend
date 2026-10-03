import { describe, it, expect } from "vitest";
import {
  AU_PER_IU_3D,
  AU_PER_IU_2D,
  INSENSITIVITY,
  VALIDINF,
  influenceAt,
  alphaFor,
  auPerIu,
} from "./kernel";

describe("unit constants", () => {
  it("U_3D matches Verite's meters-per-pixel over AU", () => {
    expect(AU_PER_IU_3D).toBeCloseTo(3193.611, 2);
  });
  it("U_2D is U_3D scaled by the measured stargate-length ratio", () => {
    expect(AU_PER_IU_2D).toBeCloseTo(3097.32, 1);
  });
});

describe("influenceAt", () => {
  it("ADM 6.0 seed (weight 60) at the source is 60/500 = 0.12", () => {
    const I = influenceAt([{ x: 0, y: 0, weight: 60 }], 0, 0);
    expect(I).toBeCloseTo(60 / INSENSITIVITY, 6);
  });
  it("ADM 1.0 seed (weight 5) at the source is 0.01, below the visibility floor", () => {
    const I = influenceAt([{ x: 0, y: 0, weight: 5 }], 0, 0);
    expect(I).toBeCloseTo(0.01, 6);
    expect(I).toBeLessThan(VALIDINF);
  });
  it("rejects sources beyond the R = 400 iu cutoff", () => {
    const I = influenceAt([{ x: 0, y: 0, weight: 60 }], 401, 0);
    expect(I).toBe(0);
  });
  it("sums contributions from multiple sources", () => {
    const I = influenceAt(
      [
        { x: 0, y: 0, weight: 60 },
        { x: 10, y: 0, weight: 60 },
      ],
      0,
      0,
    );
    expect(I).toBeCloseTo(60 / 500 + 60 / (500 + 100), 6);
  });
});

describe("alphaFor (Java Math.min(190,(int)(log(log(I+1)+1)*700)))", () => {
  it("floors to 15 at the visibility threshold", () => {
    expect(Math.floor(alphaFor(0.023))).toBe(15);
  });
  it("floors to 75 for an isolated ADM 6.0 source (I = 0.12)", () => {
    expect(Math.floor(alphaFor(0.12))).toBe(75);
  });
  it("clamps to 190 for large influence", () => {
    expect(alphaFor(10)).toBe(190);
  });
});

describe("auPerIu", () => {
  it("returns the 2D scale at rest in 2D", () => {
    expect(auPerIu(0)).toBeCloseTo(AU_PER_IU_2D, 6);
  });
  it("returns the 3D scale at rest in 3D", () => {
    expect(auPerIu(1)).toBeCloseTo(AU_PER_IU_3D, 6);
  });
});
