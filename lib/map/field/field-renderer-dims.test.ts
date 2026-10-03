import { describe, it, expect } from "vitest";
import { ownershipGridDims } from "./field-renderer";
import { OWNERSHIP_GRID_SIZE } from "@/lib/sov/kernel";

describe("ownershipGridDims", () => {
  it("square region: owW === owH === OWNERSHIP_GRID_SIZE and cells are square", () => {
    const worldW = 1000;
    const worldH = 1000;
    const { owW, owH, cellWorld } = ownershipGridDims(worldW, worldH);
    expect(owW).toBe(OWNERSHIP_GRID_SIZE);
    expect(owH).toBe(OWNERSHIP_GRID_SIZE);
    expect(worldW / owW).toBeCloseTo(worldH / owH, 5);
    expect(cellWorld).toBeCloseTo(worldW / OWNERSHIP_GRID_SIZE, 10);
  });

  it("New-Eden-like non-square region: shorter axis scales down, cells stay square", () => {
    const worldW = 1793;
    const worldH = 2048;
    const { owW, owH, cellWorld } = ownershipGridDims(worldW, worldH);
    expect(owH).toBe(OWNERSHIP_GRID_SIZE);
    expect(owW).toBe(Math.round((OWNERSHIP_GRID_SIZE * worldW) / worldH));
    expect(owW).toBeCloseTo(448, 0);
    expect(worldW / owW).toBeCloseTo(worldH / owH, 1);
    expect(cellWorld).toBeCloseTo(worldH / OWNERSHIP_GRID_SIZE, 10);
  });
});
