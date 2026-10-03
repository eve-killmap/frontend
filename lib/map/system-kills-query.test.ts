import { describe, it, expect } from "vitest";
import {
  epochToUtcDate,
  buildSystemKillsQuery,
  buildGlobalKillsPath,
  formatActivityRangeLabel,
  systemActivityPath,
  SYSTEM_ACTIVITY_BINS,
} from "@/lib/map/system-kills-query";
import type { FilterCondition } from "@/lib/filter/types";

const D1 = Date.UTC(2024, 0, 1) / 1000;
const D2 = Date.UTC(2024, 2, 1) / 1000;

const shipFilter: FilterCondition[] = [
  {
    uid: "a",
    attribute: "ship",
    side: "victim",
    values: [{ id: 670, name: "Capsule" }],
  },
];

describe("epochToUtcDate", () => {
  it("formats a UTC-midnight epoch", () => {
    expect(epochToUtcDate(D1)).toBe("2024-01-01");
  });
});

describe("buildSystemKillsQuery", () => {
  it("null range, no filter → empty string", () => {
    expect(buildSystemKillsQuery(null, [])).toBe("");
  });
  it("omits start when null and end when 'latest'", () => {
    expect(buildSystemKillsQuery({ start: null, end: "latest" }, [])).toBe("");
  });
  it("start only", () => {
    expect(buildSystemKillsQuery({ start: D1, end: "latest" }, [])).toBe(
      "?start=2024-01-01",
    );
  });
  it("end only", () => {
    expect(buildSystemKillsQuery({ start: null, end: D2 }, [])).toBe(
      "?end=2024-03-01",
    );
  });
  it("both ends", () => {
    expect(buildSystemKillsQuery({ start: D1, end: D2 }, [])).toBe(
      "?start=2024-01-01&end=2024-03-01",
    );
  });
  it("composes the facet filter after the window", () => {
    expect(
      buildSystemKillsQuery({ start: D1, end: "latest" }, shipFilter),
    ).toBe("?start=2024-01-01&f=ship:victim:670");
  });
  it("filter only (all-time)", () => {
    expect(buildSystemKillsQuery(null, shipFilter)).toBe("?f=ship:victim:670");
  });
});

describe("buildGlobalKillsPath", () => {
  it("no filter → just bins + map", () => {
    expect(buildGlobalKillsPath("new-eden", [], 300)).toBe(
      "/stats/global-kills?bins=300&map=new-eden",
    );
  });
  it("appends the facet filter tokens after bins + map", () => {
    expect(buildGlobalKillsPath("anoikis", shipFilter, 300)).toBe(
      "/stats/global-kills?bins=300&map=anoikis&f=ship:victim:670",
    );
  });
});

describe("formatActivityRangeLabel", () => {
  it("null → all-time", () => {
    expect(formatActivityRangeLabel(null)).toBe("all-time");
  });
  it("null start + latest end → all-time", () => {
    expect(formatActivityRangeLabel({ start: null, end: "latest" })).toBe(
      "all-time",
    );
  });
  it("start only → since", () => {
    expect(formatActivityRangeLabel({ start: D1, end: "latest" })).toBe(
      "since 2024-01-01",
    );
  });
  it("end only → until", () => {
    expect(formatActivityRangeLabel({ start: null, end: D2 })).toBe(
      "until 2024-03-01",
    );
  });
  it("both ends → 'start to end'", () => {
    expect(formatActivityRangeLabel({ start: D1, end: D2 })).toBe(
      "2024-01-01 to 2024-03-01",
    );
  });
});

describe("systemActivityPath", () => {
  it("targets the per-system activity endpoint with the bin count", () => {
    expect(systemActivityPath(30000142, 48)).toBe(
      "/systems/30000142/activity?bins=48",
    );
  });
  it("defaults the app to 48 bins (15 minutes over 12 hours)", () => {
    expect(SYSTEM_ACTIVITY_BINS).toBe(48);
  });
});
