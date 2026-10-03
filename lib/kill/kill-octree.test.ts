import { describe, it, expect } from "vitest";
import {
  buildOctree,
  traverseOctree,
  traverseOctreeWindowed,
  appendLiveKill,
} from "@/lib/kill/kill-octree";
import { killTraversalState } from "@/lib/kill/kill-traversal-state";
import { filterKills } from "@/lib/kill/kill-filter";
import type { RawKillsResponse } from "@/lib/schema/system-schema";

function datasetA() {
  const x = [0, 1_000_000, 0];
  const y = [0, 0, 1_000_000];
  const z = [0, 0, 0];
  const ids = [10, 11, 12];
  const shipTypes = [100, 101, 102];
  const times = [300, 200, 100];
  return buildOctree(x, y, z, ids, shipTypes, times, 3);
}

describe("buildOctree", () => {
  it("returns an empty octree for count 0", () => {
    const o = buildOctree([], [], [], [], [], [], 0);
    expect(o.nodeCount).toBe(0);
  });

  it("builds a single leaf for a sub-leaf-size set", () => {
    const o = datasetA();
    expect(o.nodeCount).toBe(1);
    expect(o.isLeaf[0]).toBe(1);
    expect(o.killCount[0]).toBe(3);
    expect(o.leafStart[0]).toBe(0);
    expect(o.leafEnd[0]).toBe(3);
    expect(o.comX[0]).toBeCloseTo(1_000_000 / 3, 3);
    expect(o.comY[0]).toBeCloseTo(1_000_000 / 3, 3);
    expect(o.comZ[0]).toBe(0);
    expect(Array.from(o.sortedKillIndices)).toEqual([0, 1, 2]);
  });

  it("subdivides when count exceeds MAX_LEAF_SIZE", () => {
    const n = 100;
    const x: number[] = [],
      y: number[] = [],
      z: number[] = [];
    const ids: number[] = [],
      st: number[] = [],
      t: number[] = [];
    for (let i = 0; i < n; i++) {
      x.push((i % 5) * 2_000_000);
      y.push((((i / 5) | 0) % 5) * 2_000_000);
      z.push(((i / 25) | 0) * 2_000_000);
      ids.push(i);
      st.push(200);
      t.push(1000 - i);
    }
    const o = buildOctree(x, y, z, ids, st, t, n);
    expect(o.nodeCount).toBeGreaterThan(1);
    expect(o.isLeaf[0]).toBe(0);
    expect(o.killCount[0]).toBe(n);

    let leafTotal = 0;
    const seen = new Set<number>();
    for (let node = 0; node < o.nodeCount; node++) {
      if (o.isLeaf[node] === 1) {
        for (let i = o.leafStart[node]; i < o.leafEnd[node]; i++) {
          seen.add(o.sortedKillIndices[i]);
          leafTotal++;
        }
      }
    }
    expect(leafTotal).toBe(n);
    expect(seen.size).toBe(n);
  });

  it("appendLiveKill appends to source arrays and liveKillIndices", () => {
    const o = datasetA();
    appendLiveKill(o, 5, 5, 5, 99, 300, 250);
    expect(o.liveKillIndices).toEqual([3]);
    expect(o.srcX[3]).toBe(5);
    expect(o.srcKillmailIds[3]).toBe(99);
  });

  it("appendLiveKill is idempotent per octree (no double-append)", () => {
    const o = datasetA();
    appendLiveKill(o, 5, 5, 5, 99, 300, 250);
    appendLiveKill(o, 5, 5, 5, 99, 300, 250);
    expect(o.liveKillIndices).toEqual([3]);
    expect(o.srcKillmailIds.filter((id) => id === 99).length).toBe(1);
  });

  it("appendLiveKill still adds distinct live kills", () => {
    const o = datasetA();
    appendLiveKill(o, 5, 5, 5, 99, 300, 250);
    appendLiveKill(o, 6, 6, 6, 100, 301, 251);
    expect(o.liveKillIndices).toEqual([3, 4]);
    expect(o.srcKillmailIds[3]).toBe(99);
    expect(o.srcKillmailIds[4]).toBe(100);
  });

  it("appendLiveKill does not mutate the source arrays (fast path)", () => {
    const source: RawKillsResponse = {
      count: 2,
      killmail_ids: [10, 11],
      killmail_times: [100, 90],
      x: [1, 2],
      y: [3, 4],
      z: [5, 6],
      ship_types: [670, 671],
    };
    const f = filterKills(source, null, null, 200);
    const oc = buildOctree(
      f.x,
      f.y,
      f.z,
      f.killmailIds,
      f.shipTypes,
      f.killmailTimes,
      f.count,
    );
    appendLiveKill(oc, 9, 9, 9, 12, 670, 110);
    expect(source.killmail_ids).toEqual([10, 11]);
    expect(source.x).toEqual([1, 2]);
  });

  it("appendLiveKill bumps octree.version once per new id", () => {
    const oc = buildOctree([1], [2], [3], [10], [670], [100], 1);
    const v = oc.version;
    appendLiveKill(oc, 9, 9, 9, 11, 670, 110);
    expect(oc.version).toBe(v + 1);
    appendLiveKill(oc, 9, 9, 9, 11, 670, 110);
    expect(oc.version).toBe(v + 1);
  });
});

const VH = 1000;
const HTF = 0.5;

describe("traverseOctree", () => {
  it("emits individuals when the leaf is large on screen", () => {
    const o = datasetA();
    const v0 = killTraversalState.version;
    traverseOctree(o, 5e5, 5e5, 1e6, 0, 0, -1, HTF, VH, 0, 0, 0, 4);
    const s = killTraversalState;
    expect(s.individualCount).toBe(3);
    expect(Array.from(s.individualKillIndices.subarray(0, 3))).toEqual([
      0, 1, 2,
    ]);
    expect(s.clusterCount).toBe(0);
    expect(s.nodesCulled).toBe(0);
    expect(s.version).toBe(v0 + 1);
  });

  it("collapses to a cluster when the leaf is small on screen", () => {
    const o = datasetA();
    traverseOctree(o, 5e5, 5e5, 1e6, 0, 0, -1, HTF, VH, 0, 0, 0, 2000);
    const s = killTraversalState;
    expect(s.individualCount).toBe(0);
    expect(s.clusterCount).toBe(1);
    expect(s.clusterKillCount[0]).toBe(3);
    expect(s.clusterKillTotal).toBe(3);
    expect(s.maxClusterKillCount).toBe(3);
    expect(s.clusterX[0]).toBeCloseTo(1_000_000 / 3, 3);
    expect(s.clusterY[0]).toBeCloseTo(1_000_000 / 3, 3);
    expect(s.clusterZ[0]).toBe(0);
  });

  it("culls a node entirely behind the camera", () => {
    const o = datasetA();
    traverseOctree(o, 5e5, 5e5, -1e7, 0, 0, -1, HTF, VH, 0, 0, 0, 4);
    const s = killTraversalState;
    expect(s.nodesCulled).toBe(1);
    expect(s.individualCount).toBe(0);
    expect(s.clusterCount).toBe(0);
  });

  it("always emits live kills as individuals", () => {
    const o = datasetA();
    appendLiveKill(o, 5, 5, 5, 99, 300, 250);
    traverseOctree(o, 5e5, 5e5, 1e6, 0, 0, -1, HTF, VH, 0, 0, 0, 2000);
    const s = killTraversalState;
    expect(s.clusterCount).toBe(1);
    expect(s.individualCount).toBe(1);
    expect(s.individualKillIndices[0]).toBe(3);
  });
});

describe("traverseOctreeWindowed", () => {
  it('emits only in-window kills as individuals with "always" fade opacity', () => {
    const o = datasetA();
    traverseOctreeWindowed(
      o,
      5e5,
      5e5,
      1e6,
      0,
      0,
      -1,
      HTF,
      VH,
      0,
      0,
      0,
      150,
      250,
      100,
      "always",
      4,
    );
    const s = killTraversalState;
    expect(s.individualCount).toBe(1);
    expect(s.individualKillIndices[0]).toBe(1);
    expect(s.individualOpacities[0]).toBeCloseTo(0.5, 6);
  });

  it("uses full opacity under cap-triggered fade when under the cap", () => {
    const o = datasetA();
    traverseOctreeWindowed(
      o,
      5e5,
      5e5,
      1e6,
      0,
      0,
      -1,
      HTF,
      VH,
      0,
      0,
      0,
      150,
      250,
      100,
      "cap-triggered",
      4,
    );
    const s = killTraversalState;
    expect(s.individualCount).toBe(1);
    expect(s.individualOpacities[0]).toBe(1);
  });

  it("collapses a multi-kill in-window subtree to a windowed cluster", () => {
    const o = datasetA();
    traverseOctreeWindowed(
      o,
      5e5,
      5e5,
      1e6,
      0,
      0,
      -1,
      HTF,
      VH,
      0,
      0,
      0,
      50,
      350,
      300,
      "always",
      2000,
    );
    const s = killTraversalState;
    expect(s.clusterCount).toBe(1);
    expect(s.clusterKillCount[0]).toBe(3);
    expect(s.clusterX[0]).toBeCloseTo(1_000_000 / 3, 3);
    expect(s.individualCount).toBe(0);
  });

  it("emits a single in-window kill as an individual even when collapsing", () => {
    const o = datasetA();
    traverseOctreeWindowed(
      o,
      5e5,
      5e5,
      1e6,
      0,
      0,
      -1,
      HTF,
      VH,
      0,
      0,
      0,
      150,
      250,
      100,
      "always",
      2000,
    );
    const s = killTraversalState;
    expect(s.clusterCount).toBe(0);
    expect(s.individualCount).toBe(1);
    expect(s.individualKillIndices[0]).toBe(1);
  });

  it("skips a collapsed subtree with no in-window kills (wc === 0)", () => {
    const o = datasetA();
    traverseOctreeWindowed(
      o,
      5e5,
      5e5,
      1e6,
      0,
      0,
      -1,
      HTF,
      VH,
      0,
      0,
      0,
      1000,
      2000,
      1000,
      "always",
      2000,
    );
    const s = killTraversalState;
    expect(s.individualCount).toBe(0);
    expect(s.clusterCount).toBe(0);
  });
});

describe("traverseOctreeWindowed: time-bounds short-circuit", () => {
  it("fully-inside window: collapsed cluster equals the whole-subtree count/COM", () => {
    const o = datasetA();
    traverseOctreeWindowed(
      o,
      5e5,
      5e5,
      1e6,
      0,
      0,
      -1,
      HTF,
      VH,
      0,
      0,
      0,
      50,
      350,
      300,
      "always",
      2000,
    );
    const s = killTraversalState;
    expect(s.clusterCount).toBe(1);
    expect(s.clusterKillCount[0]).toBe(3);
    expect(s.clusterX[0]).toBeCloseTo(1_000_000 / 3, 3);
    expect(s.clusterY[0]).toBeCloseTo(1_000_000 / 3, 3);
    expect(s.clusterZ[0]).toBe(0);
    expect(s.individualCount).toBe(0);
  });

  it("fully-outside window: nothing emitted", () => {
    const o = datasetA();
    traverseOctreeWindowed(
      o,
      5e5,
      5e5,
      1e6,
      0,
      0,
      -1,
      HTF,
      VH,
      0,
      0,
      0,
      1000,
      2000,
      1000,
      "always",
      2000,
    );
    const s = killTraversalState;
    expect(s.clusterCount).toBe(0);
    expect(s.individualCount).toBe(0);
  });

  it("partial window with a single in-window kill emits one individual", () => {
    const o = datasetA();
    traverseOctreeWindowed(
      o,
      5e5,
      5e5,
      1e6,
      0,
      0,
      -1,
      HTF,
      VH,
      0,
      0,
      0,
      150,
      250,
      100,
      "always",
      2000,
    );
    const s = killTraversalState;
    expect(s.individualCount).toBe(1);
    expect(s.individualKillIndices[0]).toBe(1);
    expect(s.clusterCount).toBe(0);
  });
});
