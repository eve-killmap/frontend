import { describe, it, expect } from "vitest";
import { findBlobs, fontSizeForArea, OwnershipGrid } from "./blobs";

function grid(
  rows: string[],
  cellIu = 10,
  originIuX = 0,
  originIuY = 0,
): OwnershipGrid {
  const height = rows.length;
  const width = rows[0].length;
  const owner = new Int32Array(width * height).fill(-1);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const ch = rows[y][x];
      if (ch !== ".") owner[y * width + x] = Number(ch);
    }
  }
  return { width, height, owner, originIuX, originIuY, cellIu };
}

describe("fontSizeForArea", () => {
  it("matches Verite's ported √area/24 + 8", () => {
    expect(fontSizeForArea(24 * 24 * 576)).toBeCloseTo(24 + 8, 6);
  });
});

describe("findBlobs", () => {
  it("finds one blob per contiguous same-owner region and computes its area", () => {
    const g = grid(["00..", "00..", "..11"], 10);
    const blobs = findBlobs(g, 0).sort((a, b) => a.ownerIndex - b.ownerIndex);
    expect(blobs).toHaveLength(2);
    expect(blobs[0].ownerIndex).toBe(0);
    expect(blobs[0].areaIu2).toBeCloseTo(4 * 10 * 10, 6);
    expect(blobs[1].ownerIndex).toBe(1);
    expect(blobs[1].areaIu2).toBeCloseTo(2 * 10 * 10, 6);
  });
  it("treats diagonal contact as connected (8-connected)", () => {
    const g = grid(["0.", ".0"], 10);
    expect(findBlobs(g, 0)).toHaveLength(1);
  });
  it("splits one owner into multiple blobs when disjoint", () => {
    const g = grid(["0.0", "0.0"], 10);
    const blobs = findBlobs(g, 0);
    expect(blobs).toHaveLength(2);
  });
  it("places the centroid at the region's iu center", () => {
    const g = grid(["00", "00"], 10, 5, 5);
    const [b] = findBlobs(g, 0);
    expect(b.centroid[0]).toBeCloseTo(10, 6);
    expect(b.centroid[1]).toBeCloseTo(10, 6);
  });
  it("drops blobs below the minimum area", () => {
    const g = grid(["0.", ".."], 10);
    expect(findBlobs(g, 500)).toHaveLength(0);
  });
});
