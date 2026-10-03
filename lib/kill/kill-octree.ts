import { killTraversalState } from "./kill-traversal-state";
import type { FadeMode } from "@/lib/kill/fade-mode";

const MAX_LEAF_SIZE = 64;
const MAX_DEPTH = 20;
const MIN_NODE_SIZE = 1e3;

export interface KillOctree {
  boundsMinX: Float64Array;
  boundsMinY: Float64Array;
  boundsMinZ: Float64Array;
  boundsMaxX: Float64Array;
  boundsMaxY: Float64Array;
  boundsMaxZ: Float64Array;

  comX: Float64Array;
  comY: Float64Array;
  comZ: Float64Array;

  killCount: Int32Array;

  children: Int32Array;

  leafStart: Int32Array;
  leafEnd: Int32Array;
  isLeaf: Uint8Array;

  sortedKillIndices: Int32Array;
  nodeCount: number;

  srcX: number[];
  srcY: number[];
  srcZ: number[];
  srcKillmailIds: number[];
  srcShipTypes: number[];
  srcKillmailTimes: number[];

  liveKillIndices: number[];

  liveKillIds: Set<number>;

  version: number;

  sortedStaticTimes: Float64Array;
  minTime: Float64Array;
  maxTime: Float64Array;
}

export function buildOctree(
  x: number[],
  y: number[],
  z: number[],
  killmailIds: number[],
  shipTypes: number[],
  killmailTimes: number[],
  count: number,
): KillOctree {
  if (count === 0) {
    return emptyOctree(x, y, z, killmailIds, shipTypes, killmailTimes);
  }

  let minX = x[0],
    minY = y[0],
    minZ = z[0];
  let maxX = x[0],
    maxY = y[0],
    maxZ = z[0];
  for (let i = 1; i < count; i++) {
    if (x[i] < minX) minX = x[i];
    if (x[i] > maxX) maxX = x[i];
    if (y[i] < minY) minY = y[i];
    if (y[i] > maxY) maxY = y[i];
    if (z[i] < minZ) minZ = z[i];
    if (z[i] > maxZ) maxZ = z[i];
  }

  const sizeX = maxX - minX;
  const sizeY = maxY - minY;
  const sizeZ = maxZ - minZ;
  const maxSide = Math.max(sizeX, sizeY, sizeZ, MIN_NODE_SIZE);
  const cx = (minX + maxX) * 0.5;
  const cy = (minY + maxY) * 0.5;
  const cz = (minZ + maxZ) * 0.5;
  const half = maxSide * 0.5;
  minX = cx - half;
  maxX = cx + half;
  minY = cy - half;
  maxY = cy + half;
  minZ = cz - half;
  maxZ = cz + half;

  const capacity = Math.min(count * 2, 4_000_000);
  const octree: KillOctree = {
    boundsMinX: new Float64Array(capacity),
    boundsMinY: new Float64Array(capacity),
    boundsMinZ: new Float64Array(capacity),
    boundsMaxX: new Float64Array(capacity),
    boundsMaxY: new Float64Array(capacity),
    boundsMaxZ: new Float64Array(capacity),
    comX: new Float64Array(capacity),
    comY: new Float64Array(capacity),
    comZ: new Float64Array(capacity),
    killCount: new Int32Array(capacity),
    children: new Int32Array(capacity * 8).fill(-1),
    leafStart: new Int32Array(capacity),
    leafEnd: new Int32Array(capacity),
    isLeaf: new Uint8Array(capacity),
    sortedKillIndices: new Int32Array(count),
    nodeCount: 0,
    srcX: x,
    srcY: y,
    srcZ: z,
    srcKillmailIds: killmailIds,
    srcShipTypes: shipTypes,
    srcKillmailTimes: killmailTimes,
    liveKillIndices: [],
    liveKillIds: new Set(),
    version: 0,
    sortedStaticTimes: Float64Array.from(killmailTimes.slice(0, count)).sort(),
    minTime: new Float64Array(capacity),
    maxTime: new Float64Array(capacity),
  };

  const indices = new Int32Array(count);
  for (let i = 0; i < count; i++) indices[i] = i;
  const tempBuf = new Int32Array(count);

  buildNode(
    octree,
    indices,
    tempBuf,
    0,
    count,
    minX,
    minY,
    minZ,
    maxX,
    maxY,
    maxZ,
    0,
  );

  return octree;
}

function allocNode(octree: KillOctree): number {
  return octree.nodeCount++;
}

function buildNode(
  octree: KillOctree,
  indices: Int32Array,
  tempBuf: Int32Array,
  start: number,
  end: number,
  minX: number,
  minY: number,
  minZ: number,
  maxX: number,
  maxY: number,
  maxZ: number,
  depth: number,
): number {
  const nodeIdx = allocNode(octree);
  const count = end - start;

  octree.boundsMinX[nodeIdx] = minX;
  octree.boundsMinY[nodeIdx] = minY;
  octree.boundsMinZ[nodeIdx] = minZ;
  octree.boundsMaxX[nodeIdx] = maxX;
  octree.boundsMaxY[nodeIdx] = maxY;
  octree.boundsMaxZ[nodeIdx] = maxZ;
  octree.killCount[nodeIdx] = count;

  let sumX = 0,
    sumY = 0,
    sumZ = 0;
  for (let i = start; i < end; i++) {
    const idx = indices[i];
    sumX += octree.srcX[idx];
    sumY += octree.srcY[idx];
    sumZ += octree.srcZ[idx];
  }
  octree.comX[nodeIdx] = sumX / count;
  octree.comY[nodeIdx] = sumY / count;
  octree.comZ[nodeIdx] = sumZ / count;

  const nodeSize = maxX - minX;
  if (
    count <= MAX_LEAF_SIZE ||
    depth >= MAX_DEPTH ||
    nodeSize < MIN_NODE_SIZE
  ) {
    octree.isLeaf[nodeIdx] = 1;
    const leafStart = start;
    for (let i = start; i < end; i++) octree.sortedKillIndices[i] = indices[i];
    octree.leafStart[nodeIdx] = leafStart;
    octree.leafEnd[nodeIdx] = end;
    let mn = Infinity,
      mx = -Infinity;
    for (let i = start; i < end; i++) {
      const t = octree.srcKillmailTimes[indices[i]];
      if (t < mn) mn = t;
      if (t > mx) mx = t;
    }
    octree.minTime[nodeIdx] = mn;
    octree.maxTime[nodeIdx] = mx;
    return nodeIdx;
  }

  const midX = (minX + maxX) * 0.5;
  const midY = (minY + maxY) * 0.5;
  const midZ = (minZ + maxZ) * 0.5;

  const octantCounts = [0, 0, 0, 0, 0, 0, 0, 0];
  for (let i = start; i < end; i++) {
    const idx = indices[i];
    const octant =
      (octree.srcX[idx] >= midX ? 4 : 0) |
      (octree.srcY[idx] >= midY ? 2 : 0) |
      (octree.srcZ[idx] >= midZ ? 1 : 0);
    octantCounts[octant]++;
  }

  const offsets = [start, 0, 0, 0, 0, 0, 0, 0];
  for (let i = 1; i < 8; i++) offsets[i] = offsets[i - 1] + octantCounts[i - 1];

  const writePos = [
    offsets[0],
    offsets[1],
    offsets[2],
    offsets[3],
    offsets[4],
    offsets[5],
    offsets[6],
    offsets[7],
  ];
  for (let i = start; i < end; i++) {
    const idx = indices[i];
    const octant =
      (octree.srcX[idx] >= midX ? 4 : 0) |
      (octree.srcY[idx] >= midY ? 2 : 0) |
      (octree.srcZ[idx] >= midZ ? 1 : 0);
    tempBuf[writePos[octant]++] = idx;
  }

  for (let i = start; i < end; i++) indices[i] = tempBuf[i];

  for (let oct = 0; oct < 8; oct++) {
    if (octantCounts[oct] === 0) continue;

    const octStart = offsets[oct];
    const octEnd = octStart + octantCounts[oct];

    const childMinX = oct & 4 ? midX : minX;
    const childMaxX = oct & 4 ? maxX : midX;
    const childMinY = oct & 2 ? midY : minY;
    const childMaxY = oct & 2 ? maxY : midY;
    const childMinZ = oct & 1 ? midZ : minZ;
    const childMaxZ = oct & 1 ? maxZ : midZ;

    const childIdx = buildNode(
      octree,
      indices,
      tempBuf,
      octStart,
      octEnd,
      childMinX,
      childMinY,
      childMinZ,
      childMaxX,
      childMaxY,
      childMaxZ,
      depth + 1,
    );

    octree.children[nodeIdx * 8 + oct] = childIdx;
  }

  let mn = Infinity,
    mx = -Infinity;
  for (let oct = 0; oct < 8; oct++) {
    const child = octree.children[nodeIdx * 8 + oct];
    if (child === -1) continue;
    if (octree.minTime[child] < mn) mn = octree.minTime[child];
    if (octree.maxTime[child] > mx) mx = octree.maxTime[child];
  }
  octree.minTime[nodeIdx] = mn;
  octree.maxTime[nodeIdx] = mx;

  return nodeIdx;
}

function emptyOctree(
  x: number[],
  y: number[],
  z: number[],
  killmailIds: number[],
  shipTypes: number[],
  killmailTimes: number[],
): KillOctree {
  return {
    boundsMinX: new Float64Array(0),
    boundsMinY: new Float64Array(0),
    boundsMinZ: new Float64Array(0),
    boundsMaxX: new Float64Array(0),
    boundsMaxY: new Float64Array(0),
    boundsMaxZ: new Float64Array(0),
    comX: new Float64Array(0),
    comY: new Float64Array(0),
    comZ: new Float64Array(0),
    killCount: new Int32Array(0),
    children: new Int32Array(0),
    leafStart: new Int32Array(0),
    leafEnd: new Int32Array(0),
    isLeaf: new Uint8Array(0),
    sortedKillIndices: new Int32Array(0),
    nodeCount: 0,
    srcX: x,
    srcY: y,
    srcZ: z,
    srcKillmailIds: killmailIds,
    srcShipTypes: shipTypes,
    srcKillmailTimes: killmailTimes,
    liveKillIndices: [],
    liveKillIds: new Set(),
    version: 0,
    sortedStaticTimes: new Float64Array(0),
    minTime: new Float64Array(0),
    maxTime: new Float64Array(0),
  };
}

export function appendLiveKill(
  octree: KillOctree,
  x: number,
  y: number,
  z: number,
  killmailId: number,
  shipType: number,
  killmailTime: number,
): void {
  if (octree.liveKillIds.has(killmailId)) return;
  octree.liveKillIds.add(killmailId);

  const idx = octree.srcX.length;
  octree.srcX.push(x);
  octree.srcY.push(y);
  octree.srcZ.push(z);
  octree.srcKillmailIds.push(killmailId);
  octree.srcShipTypes.push(shipType);
  octree.srcKillmailTimes.push(killmailTime);
  octree.liveKillIndices.push(idx);
  octree.version++;
}

const traversalStack = new Int32Array(MAX_DEPTH * 8 + 8);
const traversalDepthStack = new Int32Array(MAX_DEPTH * 8 + 8);

function lowerBound(arr: Float64Array, n: number, target: number): number {
  let lo = 0,
    hi = n;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
function upperBound(arr: Float64Array, n: number, target: number): number {
  let lo = 0,
    hi = n;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (arr[mid] <= target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function traverseOctreeImpl(
  octree: KillOctree,
  cameraPosX: number,
  cameraPosY: number,
  cameraPosZ: number,
  worldDirX: number,
  worldDirY: number,
  worldDirZ: number,
  halfTanFov: number,
  viewportHeight: number,
  originX: number,
  originY: number,
  originZ: number,
  mergePixels: number,
  windowed: boolean,
  windowStart: number,
  windowEnd: number,
  windowDuration: number,
  fadeMode: FadeMode,
) {
  const t0 = performance.now();
  const state = killTraversalState;
  state.individualCount = 0;
  state.clusterCount = 0;
  state.clusterKillTotal = 0;
  state.maxClusterKillCount = 0;
  state.nodesVisited = 0;
  state.nodesCulled = 0;
  state.maxDepthReached = 0;

  if (octree.nodeCount === 0) {
    state.traversalTimeMs = performance.now() - t0;
    return;
  }

  let windowCount = 0;
  if (windowed && fadeMode === "cap-triggered") {
    const st = octree.sortedStaticTimes;
    const n = st.length;
    windowCount = upperBound(st, n, windowEnd) - lowerBound(st, n, windowStart);
    for (let i = 0; i < octree.liveKillIndices.length; i++) {
      const t = octree.srcKillmailTimes[octree.liveKillIndices[i]];
      if (t >= windowStart && t <= windowEnd) windowCount++;
    }
  }

  let stackTop = 0;
  traversalStack[stackTop] = 0;
  traversalDepthStack[stackTop] = 0;
  stackTop++;

  while (stackTop > 0) {
    stackTop--;
    const node = traversalStack[stackTop];
    const nodeDepth = traversalDepthStack[stackTop];

    state.nodesVisited++;

    const nodeCenterX =
      (octree.boundsMinX[node] + octree.boundsMaxX[node]) * 0.5 - originX;
    const nodeCenterY =
      (octree.boundsMinY[node] + octree.boundsMaxY[node]) * 0.5 - originY;
    const nodeCenterZ =
      (octree.boundsMinZ[node] + octree.boundsMaxZ[node]) * 0.5 - originZ;

    const toNodeX = nodeCenterX - cameraPosX;
    const toNodeY = nodeCenterY - cameraPosY;
    const toNodeZ = nodeCenterZ - cameraPosZ;

    const depth =
      toNodeX * worldDirX + toNodeY * worldDirY + toNodeZ * worldDirZ;

    const nodeSize = octree.boundsMaxX[node] - octree.boundsMinX[node];
    const nodeHalfDiag = nodeSize * 0.866;

    if (depth + nodeHalfDiag < 0) {
      state.nodesCulled++;
      continue;
    }

    if (nodeDepth > state.maxDepthReached) state.maxDepthReached = nodeDepth;

    const effectiveDepth = Math.max(depth, nodeHalfDiag);
    const pixelSize =
      (nodeSize * viewportHeight) / (2 * effectiveDepth * halfTanFov);

    const isLeaf = octree.isLeaf[node] === 1;

    if (isLeaf && pixelSize >= mergePixels) {
      const s = octree.leafStart[node];
      const e = octree.leafEnd[node];
      for (let i = s; i < e; i++) {
        const killIdx = octree.sortedKillIndices[i];
        if (windowed) {
          const t = octree.srcKillmailTimes[killIdx];
          if (t < windowStart || t > windowEnd) continue;
          if (state.individualCount >= state.individualKillIndices.length)
            continue;
          const slot = state.individualCount++;
          state.individualKillIndices[slot] = killIdx;
          state.individualOpacities[slot] = computeKillOpacity(
            t,
            windowEnd,
            windowDuration,
            windowCount,
            fadeMode,
          );
        } else {
          if (state.individualCount < state.individualKillIndices.length)
            state.individualKillIndices[state.individualCount++] = killIdx;
        }
      }
    } else if (pixelSize < mergePixels || isLeaf) {
      if (windowed) {
        const {
          count: wc,
          comX,
          comY,
          comZ,
        } = computeWindowedCluster(octree, node, windowStart, windowEnd);
        if (wc === 0) continue;
        if (wc === 1) {
          const killIdx = findWindowedKillIndex(
            octree,
            node,
            windowStart,
            windowEnd,
          );
          if (
            killIdx >= 0 &&
            state.individualCount < state.individualKillIndices.length
          ) {
            const slot = state.individualCount++;
            state.individualKillIndices[slot] = killIdx;
            state.individualOpacities[slot] = computeKillOpacity(
              octree.srcKillmailTimes[killIdx],
              windowEnd,
              windowDuration,
              windowCount,
              fadeMode,
            );
          }
        } else {
          if (state.clusterCount < state.clusterX.length) {
            const ci = state.clusterCount++;
            state.clusterX[ci] = comX;
            state.clusterY[ci] = comY;
            state.clusterZ[ci] = comZ;
            state.clusterKillCount[ci] = wc;
            state.clusterKillTotal += wc;
            if (wc > state.maxClusterKillCount) state.maxClusterKillCount = wc;
          }
        }
      } else {
        if (octree.killCount[node] === 1) {
          if (state.individualCount < state.individualKillIndices.length) {
            state.individualKillIndices[state.individualCount++] =
              octree.sortedKillIndices[octree.leafStart[node]];
          }
        } else {
          const kc = octree.killCount[node];
          if (state.clusterCount < state.clusterX.length) {
            const ci = state.clusterCount++;
            state.clusterX[ci] = octree.comX[node];
            state.clusterY[ci] = octree.comY[node];
            state.clusterZ[ci] = octree.comZ[node];
            state.clusterKillCount[ci] = kc;
            state.clusterKillTotal += kc;
            if (kc > state.maxClusterKillCount) state.maxClusterKillCount = kc;
          }
        }
      }
    } else {
      const base = node * 8;
      for (let oct = 0; oct < 8; oct++) {
        const child = octree.children[base + oct];
        if (child !== -1) {
          traversalStack[stackTop] = child;
          traversalDepthStack[stackTop] = nodeDepth + 1;
          stackTop++;
        }
      }
    }
  }

  for (let i = 0; i < octree.liveKillIndices.length; i++) {
    const killIdx = octree.liveKillIndices[i];
    if (windowed) {
      const t = octree.srcKillmailTimes[killIdx];
      if (t < windowStart || t > windowEnd) continue;
      if (state.individualCount >= state.individualKillIndices.length) continue;
      const slot = state.individualCount++;
      state.individualKillIndices[slot] = killIdx;
      state.individualOpacities[slot] = computeKillOpacity(
        t,
        windowEnd,
        windowDuration,
        windowCount,
        fadeMode,
      );
    } else {
      if (state.individualCount < state.individualKillIndices.length)
        state.individualKillIndices[state.individualCount++] = killIdx;
    }
  }

  state.traversalTimeMs = performance.now() - t0;
  state.version++;
}

export function traverseOctree(
  octree: KillOctree,
  cameraPosX: number,
  cameraPosY: number,
  cameraPosZ: number,
  worldDirX: number,
  worldDirY: number,
  worldDirZ: number,
  halfTanFov: number,
  viewportHeight: number,
  originX: number,
  originY: number,
  originZ: number,
  mergePixels: number,
) {
  traverseOctreeImpl(
    octree,
    cameraPosX,
    cameraPosY,
    cameraPosZ,
    worldDirX,
    worldDirY,
    worldDirZ,
    halfTanFov,
    viewportHeight,
    originX,
    originY,
    originZ,
    mergePixels,
    false,
    0,
    0,
    0,
    "always",
  );
}

const windowedSubtreeStack = new Int32Array(MAX_DEPTH * 8 + 8);

function computeWindowedCluster(
  octree: KillOctree,
  node: number,
  windowStart: number,
  windowEnd: number,
): { count: number; comX: number; comY: number; comZ: number } {
  let count = 0,
    sumX = 0,
    sumY = 0,
    sumZ = 0;
  let top = 0;
  windowedSubtreeStack[top++] = node;
  while (top > 0) {
    const n = windowedSubtreeStack[--top];
    if (octree.maxTime[n] < windowStart || octree.minTime[n] > windowEnd)
      continue;
    if (octree.minTime[n] >= windowStart && octree.maxTime[n] <= windowEnd) {
      const kc = octree.killCount[n];
      count += kc;
      sumX += octree.comX[n] * kc;
      sumY += octree.comY[n] * kc;
      sumZ += octree.comZ[n] * kc;
      continue;
    }
    if (octree.isLeaf[n]) {
      for (let i = octree.leafStart[n]; i < octree.leafEnd[n]; i++) {
        const ki = octree.sortedKillIndices[i];
        const t = octree.srcKillmailTimes[ki];
        if (t >= windowStart && t <= windowEnd) {
          sumX += octree.srcX[ki];
          sumY += octree.srcY[ki];
          sumZ += octree.srcZ[ki];
          count++;
        }
      }
    } else {
      const base = n * 8;
      for (let oct = 0; oct < 8; oct++) {
        const child = octree.children[base + oct];
        if (child !== -1) windowedSubtreeStack[top++] = child;
      }
    }
  }
  if (count === 0) return { count: 0, comX: 0, comY: 0, comZ: 0 };
  return { count, comX: sumX / count, comY: sumY / count, comZ: sumZ / count };
}

function findWindowedKillIndex(
  octree: KillOctree,
  node: number,
  windowStart: number,
  windowEnd: number,
): number {
  let top = 0;
  windowedSubtreeStack[top++] = node;
  while (top > 0) {
    const n = windowedSubtreeStack[--top];
    if (octree.maxTime[n] < windowStart || octree.minTime[n] > windowEnd)
      continue;
    if (octree.isLeaf[n]) {
      for (let i = octree.leafStart[n]; i < octree.leafEnd[n]; i++) {
        const ki = octree.sortedKillIndices[i];
        const t = octree.srcKillmailTimes[ki];
        if (t >= windowStart && t <= windowEnd) return ki;
      }
    } else {
      const base = n * 8;
      for (let oct = 0; oct < 8; oct++) {
        const child = octree.children[base + oct];
        if (child !== -1) windowedSubtreeStack[top++] = child;
      }
    }
  }
  return -1;
}

function computeKillOpacity(
  killTime: number,
  windowEnd: number,
  windowDuration: number,
  windowCount: number,
  fadeMode: FadeMode,
): number {
  if (windowDuration <= 0) return 1;
  const ageFraction = (windowEnd - killTime) / windowDuration;
  if (fadeMode === "always") {
    return Math.max(0, 1 - ageFraction);
  }
  if (windowCount < 80_000) return 1;
  const fadeStartFraction = 1 - 80_000 / windowCount;
  if (ageFraction <= fadeStartFraction) return 1;
  return Math.max(
    0,
    1 -
      (ageFraction - fadeStartFraction) / Math.max(1 - fadeStartFraction, 1e-6),
  );
}

export function traverseOctreeWindowed(
  octree: KillOctree,
  cameraPosX: number,
  cameraPosY: number,
  cameraPosZ: number,
  worldDirX: number,
  worldDirY: number,
  worldDirZ: number,
  halfTanFov: number,
  viewportHeight: number,
  originX: number,
  originY: number,
  originZ: number,
  windowStart: number,
  windowEnd: number,
  windowDuration: number,
  fadeMode: FadeMode,
  mergePixels: number,
) {
  traverseOctreeImpl(
    octree,
    cameraPosX,
    cameraPosY,
    cameraPosZ,
    worldDirX,
    worldDirY,
    worldDirZ,
    halfTanFov,
    viewportHeight,
    originX,
    originY,
    originZ,
    mergePixels,
    true,
    windowStart,
    windowEnd,
    windowDuration,
    fadeMode,
  );
}
