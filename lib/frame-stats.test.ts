import { describe, it, expect, beforeEach } from "vitest";
import { frameStats, frameStatsReset, frameStatsTick } from "./frame-stats";

const INFO = {
  render: { calls: 12, triangles: 3400, points: 50000, lines: 12000 },
  memory: { geometries: 7, textures: 3 },
  programs: [{}, {}],
};

const FRAME = 1000 / 60;

beforeEach(() => frameStatsReset());

describe("frameStatsTick fps", () => {
  it("reports 60 fps after sixty evenly spaced frames and a boundary tick", () => {
    for (let i = 0; i < 60; i++) frameStatsTick(i * FRAME, null);
    expect(frameStats.fps1s).toBe(0);
    frameStatsTick(1000, null);
    expect(frameStats.fps1s).toBe(60);
    expect(frameStats.fps30s).toBe(60);
    expect(frameStats.fps1m).toBe(60);
  });

  it("averages the completed seconds for the 30s window", () => {
    for (let i = 0; i < 30; i++) frameStatsTick((i * 1000) / 30, null);
    for (let i = 0; i < 60; i++) frameStatsTick(1000 + (i * 1000) / 60, null);
    frameStatsTick(2000, null);
    expect(frameStats.fps1s).toBe(60);
    expect(frameStats.fps30s).toBe(45);
    expect(frameStats.fps1m).toBe(45);
  });
});

describe("frameStatsTick frame time", () => {
  it("tracks the last delta and publishes the second's maximum at the boundary", () => {
    frameStatsTick(0, null);
    frameStatsTick(30, null);
    frameStatsTick(60, null);
    expect(frameStats.frameMsLast).toBe(30);
    expect(frameStats.frameMsMax1s).toBe(0);
    frameStatsTick(1000, null);
    expect(frameStats.frameMsLast).toBe(940);
    expect(frameStats.frameMsMax1s).toBe(940);
    frameStatsTick(1010, null);
    expect(frameStats.frameMsLast).toBe(10);
    expect(frameStats.frameMsMax1s).toBe(940);
  });
});

describe("frameStatsTick renderer and heap", () => {
  it("mirrors the renderer info on every tick", () => {
    frameStatsTick(0, INFO);
    expect(frameStats.drawCalls).toBe(12);
    expect(frameStats.triangles).toBe(3400);
    expect(frameStats.points).toBe(50000);
    expect(frameStats.lines).toBe(12000);
    expect(frameStats.geometries).toBe(7);
    expect(frameStats.textures).toBe(3);
    expect(frameStats.programs).toBe(2);
  });
  it("counts null programs as zero and keeps the last info when given null", () => {
    frameStatsTick(0, { ...INFO, programs: null });
    expect(frameStats.programs).toBe(0);
    frameStatsTick(16, null);
    expect(frameStats.drawCalls).toBe(12);
  });
  it("reports null heap figures where performance.memory is unavailable", () => {
    frameStatsTick(0, null);
    frameStatsTick(1000, null);
    expect(frameStats.heapUsedMb).toBeNull();
    expect(frameStats.heapTotalMb).toBeNull();
  });
});

describe("frameStatsReset", () => {
  it("zeroes every field", () => {
    for (let i = 0; i < 60; i++) frameStatsTick(i * FRAME, INFO);
    frameStatsTick(1000, INFO);
    frameStatsReset();
    expect(frameStats).toEqual({
      fps1s: 0,
      fps30s: 0,
      fps1m: 0,
      frameMsLast: 0,
      frameMsMax1s: 0,
      drawCalls: 0,
      triangles: 0,
      points: 0,
      lines: 0,
      geometries: 0,
      textures: 0,
      programs: 0,
      heapUsedMb: null,
      heapTotalMb: null,
    });
  });
});
