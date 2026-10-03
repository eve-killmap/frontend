import { describe, it, expect } from "vitest";
import { propagate, buildAdjacency, PropagateInput } from "./propagate";

function lineInput(over: Partial<PropagateInput> = {}): PropagateInput {
  return {
    systemIds: [0],
    ownerIdx: [0],
    adm: [6.0],
    ownerKinds: [0],
    ownerIds: [1000],
    ownerNames: ["Alpha"],
    ownerTickers: ["A"],
    mapSystemIDs: [0, 1, 2, 3, 4],
    edges: [0, 1, 1, 2, 2, 3, 3, 4],
    securityStatuses: [-0.5, -0.5, -0.5, -0.5, -0.5],
    ...over,
  };
}

function weightAt(
  r: { sources: { systemIndex: number; weight: number }[] },
  sysIdx: number,
): number {
  return r.sources
    .filter((s) => s.systemIndex === sysIdx)
    .reduce((a, s) => a + s.weight, 0);
}

describe("buildAdjacency", () => {
  it("builds an undirected neighbor list from index-pair edges", () => {
    const adj = buildAdjacency([0, 1, 1, 2], 3);
    expect(new Set(adj[1])).toEqual(new Set([0, 2]));
    expect(adj[0]).toEqual([1]);
  });
  it("returns empty lists when edges are absent", () => {
    expect(buildAdjacency(undefined, 3)).toEqual([[], [], []]);
  });
});

describe("propagate hop factors", () => {
  it("ADM 6.0 spreads exactly three hops: 60, 18, 5.4, 1.62", () => {
    const r = propagate(lineInput());
    expect(weightAt(r, 0)).toBeCloseTo(60, 6);
    expect(weightAt(r, 1)).toBeCloseTo(60 * 0.3, 6);
    expect(weightAt(r, 2)).toBeCloseTo(60 * 0.09, 6);
    expect(weightAt(r, 3)).toBeCloseTo(60 * 0.027, 6);
    expect(weightAt(r, 4)).toBe(0);
  });
  it("ADM < 6.0 spreads exactly two hops from a weight of 5*ADM", () => {
    const r = propagate(lineInput({ adm: [4.0] }));
    expect(weightAt(r, 0)).toBeCloseTo(20, 6);
    expect(weightAt(r, 1)).toBeCloseTo(20 * 0.3, 6);
    expect(weightAt(r, 2)).toBeCloseTo(20 * 0.09, 6);
    expect(weightAt(r, 3)).toBe(0);
  });
  it("faction owners seed at W_NPC = 30 and spread two hops", () => {
    const r = propagate(lineInput({ ownerKinds: [2], adm: [1.0] }));
    expect(weightAt(r, 0)).toBeCloseTo(30, 6);
    expect(weightAt(r, 1)).toBeCloseTo(30 * 0.3, 6);
    expect(weightAt(r, 2)).toBeCloseTo(30 * 0.09, 6);
    expect(weightAt(r, 3)).toBe(0);
  });
});

describe("propagate determinism under shuffled adjacency", () => {
  it("assigns the same min-hop weight regardless of edge order (diamond 0-1,0-2,1-3,2-3)", () => {
    const base: Partial<PropagateInput> = {
      mapSystemIDs: [0, 1, 2, 3],
      securityStatuses: [-0.5, -0.5, -0.5, -0.5],
    };
    const a = propagate(
      lineInput({ ...base, edges: [0, 1, 0, 2, 1, 3, 2, 3] }),
    );
    const b = propagate(
      lineInput({ ...base, edges: [2, 3, 1, 3, 0, 2, 0, 1] }),
    );
    expect(weightAt(a, 3)).toBeCloseTo(60 * 0.09, 6);
    expect(weightAt(b, 3)).toBeCloseTo(weightAt(a, 3), 9);
  });
});

describe("propagate owners + seed filtering", () => {
  it("builds the owner table with per-owner system counts", () => {
    const r = propagate(
      lineInput({
        systemIds: [0, 4],
        ownerIdx: [0, 0],
        adm: [6, 6],
      }),
    );
    expect(r.owners).toHaveLength(1);
    expect(r.owners[0]).toMatchObject({
      ownerIndex: 0,
      kind: 0,
      id: 1000,
      systemCount: 2,
    });
  });
  it("excludes a positive-security system from seeding and counts it", () => {
    const r = propagate(
      lineInput({ securityStatuses: [0.5, -0.5, -0.5, -0.5, -0.5] }),
    );
    expect(weightAt(r, 0)).toBe(0);
    expect(r.excludedSeedCount).toBe(1);
  });
});
