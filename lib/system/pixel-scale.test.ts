import { describe, it, expect } from "vitest";
import { worldPerPixel, pixelToWorld } from "./pixel-scale";

describe("pixel-scale", () => {
  it("worldPerPixel: world units per screen pixel at a depth", () => {
    expect(worldPerPixel(1_000_000, 0.5, 1000)).toBeCloseTo(1000, 6);
  });
  it("pixelToWorld: scales a pixel size by worldPerPixel", () => {
    expect(pixelToWorld(16, 1_000_000, 0.5, 1000)).toBeCloseTo(16000, 6);
  });
});
