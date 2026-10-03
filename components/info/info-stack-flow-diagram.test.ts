import { describe, it, expect } from "vitest";
import { buildGraph, TRUNKS } from "./info-stack-flow-diagram";

describe("detailed stack diagram", () => {
  const g = buildGraph();

  it("resolves every trunk endpoint to a laid-out group", () => {
    expect(g.trunks.length).toBe(TRUNKS.length);
    for (const t of g.trunks) {
      expect(g.groups[t.a]).toBeDefined();
      expect(g.groups[t.b]).toBeDefined();
    }
  });

  it("places every trunk label", () => {
    for (const t of g.trunks) expect(t.lw).toBeGreaterThan(0);
  });

  it("carries the leaderboard machinery nodes", () => {
    for (const id of [
      "rollup",
      "lboard",
      "rstate",
      "skd",
      "ekd",
      "elb",
      "eplb",
      "epcomp",
      "flb",
    ])
      expect(g.nodes[id]).toBeDefined();
  });

  it("no longer shows the removed rechecker or the dropped daily matview", () => {
    expect(g.nodes.recheck).toBeUndefined();
    expect(g.nodes.mvdaily).toBeUndefined();
  });

  it("labels the refresh and stats edges with rollups and boards", () => {
    const labels = g.trunks.map((t) => t.label);
    expect(labels).toContain("rollups · boards · REFRESH MV");
    expect(labels).toContain("rankings · boards · histogram");
    expect(labels).toContain("board names");
    expect(labels).toContain("JSON · computed_at");
  });
});
