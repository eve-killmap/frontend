import { describe, it, expect } from "vitest";
import { exportTimeMs, timeLabelFor } from "./export-time";

const NOW = Date.UTC(2026, 8, 27, 14, 5, 0);
const PB = 1_757_697_600;

describe("exportTimeMs", () => {
  it("uses wall-clock when playback is inactive and the playback time when active", () => {
    expect(exportTimeMs(false, PB, NOW)).toBe(NOW);
    expect(exportTimeMs(true, PB, NOW)).toBe(PB * 1000);
  });
});

describe("timeLabelFor", () => {
  it("reads 'Screenshot taken' with a UTC minute stamp, marking playback captures", () => {
    expect(timeLabelFor(false, NOW)).toBe(
      "Screenshot taken 2026-09-27 14:05 UTC",
    );
    expect(timeLabelFor(true, PB * 1000)).toBe(
      "Screenshot taken 2025-09-12 17:20 UTC (playback)",
    );
  });
});
