import { describe, it, expect } from "vitest";
import {
  isTriglavianSystem,
  isTriglavianConstellation,
  isTriglavianRegion,
  TRIG_SYSTEM_ID_MIN,
  TRIG_SYSTEM_ID_MAX,
  TRIG_CONSTELLATION_ID_MIN,
  TRIG_CONSTELLATION_ID_MAX,
  TRIG_REGION_ID_MIN,
  TRIG_REGION_ID_MAX,
} from "@/lib/map/triglavian";

describe("isTriglavianSystem", () => {
  it("is true within the abyssal system-id floor/max", () => {
    expect(isTriglavianSystem(TRIG_SYSTEM_ID_MIN)).toBe(true);
    expect(isTriglavianSystem(TRIG_SYSTEM_ID_MAX)).toBe(true);
    expect(isTriglavianSystem(TRIG_SYSTEM_ID_MIN + 1)).toBe(true);
    expect(isTriglavianSystem(TRIG_SYSTEM_ID_MAX - 1)).toBe(true);
  });

  it("is false below/above the floor (e.g. a Pochven/known-space id)", () => {
    expect(isTriglavianSystem(TRIG_SYSTEM_ID_MIN - 1)).toBe(false);
    expect(isTriglavianSystem(TRIG_SYSTEM_ID_MAX + 1)).toBe(false);
    expect(isTriglavianSystem(30_000_142)).toBe(false);
  });
});

describe("isTriglavianConstellation", () => {
  it("is true within the abyssal constellation-id floor/max", () => {
    expect(isTriglavianConstellation(TRIG_CONSTELLATION_ID_MIN)).toBe(true);
    expect(isTriglavianConstellation(TRIG_CONSTELLATION_ID_MAX)).toBe(true);
    expect(isTriglavianConstellation(TRIG_CONSTELLATION_ID_MIN + 1)).toBe(true);
    expect(isTriglavianConstellation(TRIG_CONSTELLATION_ID_MAX - 1)).toBe(true);
  });

  it("is false below/above the floor", () => {
    expect(isTriglavianConstellation(TRIG_CONSTELLATION_ID_MIN - 1)).toBe(
      false,
    );
    expect(isTriglavianConstellation(TRIG_CONSTELLATION_ID_MAX + 1)).toBe(
      false,
    );
    expect(isTriglavianConstellation(20_000_020)).toBe(false);
  });
});

describe("isTriglavianRegion", () => {
  it("is true within the abyssal region-id floor/max", () => {
    expect(isTriglavianRegion(TRIG_REGION_ID_MIN)).toBe(true);
    expect(isTriglavianRegion(TRIG_REGION_ID_MAX)).toBe(true);
    expect(isTriglavianRegion(TRIG_REGION_ID_MIN + 1)).toBe(true);
    expect(isTriglavianRegion(TRIG_REGION_ID_MAX - 1)).toBe(true);
  });

  it("is false below/above the floor", () => {
    expect(isTriglavianRegion(TRIG_REGION_ID_MIN - 1)).toBe(false);
    expect(isTriglavianRegion(TRIG_REGION_ID_MAX + 1)).toBe(false);
    expect(isTriglavianRegion(10_000_002)).toBe(false);
  });
});
