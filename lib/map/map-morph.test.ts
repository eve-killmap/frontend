import { describe, it, expect } from "vitest";
import { smoothstep, stepToward, lerpPositionsInto } from "@/lib/map/map-morph";

describe("smoothstep", () => {
  it("clamps below 0 and above 1", () => {
    expect(smoothstep(-0.5)).toBe(0);
    expect(smoothstep(1.5)).toBe(1);
  });
  it("is 0, 0.5, 1 at the endpoints and midpoint", () => {
    expect(smoothstep(0)).toBe(0);
    expect(smoothstep(0.5)).toBeCloseTo(0.5, 10);
    expect(smoothstep(1)).toBe(1);
  });
  it("is monotonically increasing", () => {
    expect(smoothstep(0.25)).toBeLessThan(smoothstep(0.75));
  });
});

describe("stepToward", () => {
  it("moves toward a higher target by dt/duration", () => {
    expect(stepToward(0, 1, 0.3, 0.6)).toBeCloseTo(0.5, 10);
  });
  it("moves toward a lower target", () => {
    expect(stepToward(1, 0, 0.15, 0.6)).toBeCloseTo(0.75, 10);
  });
  it("snaps exactly to target within one step (no overshoot)", () => {
    expect(stepToward(0.9, 1, 1, 0.6)).toBe(1);
    expect(stepToward(0.1, 0, 1, 0.6)).toBe(0);
  });
  it("returns target immediately when already there", () => {
    expect(stepToward(1, 1, 0.016, 0.6)).toBe(1);
  });
  it("returns target when duration is non-positive", () => {
    expect(stepToward(0, 1, 0.016, 0)).toBe(1);
  });
});

describe("lerpPositionsInto", () => {
  it("writes a at e=0 and b at e=1", () => {
    const a = new Float32Array([0, 0, 10, 10]);
    const b = new Float32Array([2, 4, 20, 30]);
    const out = new Float32Array(4);
    lerpPositionsInto(a, b, 0, out);
    expect(Array.from(out)).toEqual([0, 0, 10, 10]);
    lerpPositionsInto(a, b, 1, out);
    expect(Array.from(out)).toEqual([2, 4, 20, 30]);
  });
  it("writes the midpoint at e=0.5", () => {
    const a = new Float32Array([0, 0]);
    const b = new Float32Array([2, 8]);
    const out = new Float32Array(2);
    lerpPositionsInto(a, b, 0.5, out);
    expect(Array.from(out)).toEqual([1, 4]);
  });
});
