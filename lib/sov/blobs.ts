export interface OwnershipGrid {
  width: number;
  height: number;
  owner: Int32Array;
  originIuX: number;
  originIuY: number;
  cellIu: number;
}

export interface SovBlob {
  ownerIndex: number;
  areaIu2: number;
  centroid: [number, number];
}

export const MIN_BLOB_AREA = 4000;

export function fontSizeForArea(areaIu2: number): number {
  return Math.sqrt(areaIu2) / 24 + 8;
}

export function findBlobs(
  grid: OwnershipGrid,
  minAreaIu2: number = MIN_BLOB_AREA,
): SovBlob[] {
  const { width, height, owner, originIuX, originIuY, cellIu } = grid;
  const cellArea = cellIu * cellIu;
  const seen = new Uint8Array(width * height);
  const blobs: SovBlob[] = [];
  const stack: number[] = [];

  for (let start = 0; start < owner.length; start++) {
    if (seen[start]) continue;
    const oi = owner[start];
    seen[start] = 1;
    if (oi < 0) continue;

    let count = 0;
    let sumX = 0;
    let sumY = 0;
    stack.length = 0;
    stack.push(start);

    while (stack.length) {
      const p = stack.pop()!;
      const px = p % width;
      const py = (p / width) | 0;
      count++;
      sumX += px;
      sumY += py;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = px + dx;
          const ny = py + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const np = ny * width + nx;
          if (seen[np]) continue;
          if (owner[np] === oi) {
            seen[np] = 1;
            stack.push(np);
          }
        }
      }
    }

    const areaIu2 = count * cellArea;
    if (areaIu2 < minAreaIu2) continue;
    blobs.push({
      ownerIndex: oi,
      areaIu2,
      centroid: [
        originIuX + (sumX / count) * cellIu,
        originIuY + (sumY / count) * cellIu,
      ],
    });
  }

  return blobs;
}
