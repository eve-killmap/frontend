import { describe, it, expect } from "vitest";
import { legendSpecFor, type LegendInput } from "./legend-spec";
import {
  SECURITY_HEX,
  ACTIVITY_HEX,
  JUMPS_HEX,
  HOT_HEX,
} from "@/lib/map/system-colors";
import { HOT_MAX_FLOOR } from "@/components/map/hot/hot-sources";

function input(over: Partial<LegendInput> = {}): LegendInput {
  return {
    effectiveMode: "none",
    overlay: "none",
    activityMax: null,
    activityError: false,
    activityRangeLabel: "all-time",
    filterActive: false,
    jumpsMax: null,
    jumpsError: false,
    hotMax: 0,
    hotFloor: HOT_MAX_FLOOR,
    admAvailable: null,
    ...over,
  };
}

describe("legendSpecFor", () => {
  it("returns nothing for none / none", () => {
    expect(legendSpecFor(input())).toEqual([]);
  });

  it("security is a gradient from -1.0 to 1.0", () => {
    expect(legendSpecFor(input({ effectiveMode: "security" }))).toEqual([
      {
        type: "gradient",
        title: "Security status",
        stops: SECURITY_HEX,
        min: "-1.0",
        max: "1.0",
      },
    ]);
  });

  it("activity labels max with the count, an ellipsis while loading, or a dash on error", () => {
    const loaded = legendSpecFor(
      input({
        effectiveMode: "activity",
        activityMax: 1234,
        activityRangeLabel: "since 2026-09-01",
      }),
    )[0];
    expect(loaded).toEqual({
      type: "gradient",
      title: "Kills (since 2026-09-01)",
      stops: ACTIVITY_HEX,
      min: "0",
      max: "1,234",
    });
    expect(
      legendSpecFor(input({ effectiveMode: "activity" }))[0],
    ).toMatchObject({ max: "…" });
    expect(
      legendSpecFor(
        input({ effectiveMode: "activity", activityError: true }),
      )[0],
    ).toMatchObject({ max: "-" });
    expect(
      legendSpecFor(
        input({
          effectiveMode: "activity",
          filterActive: true,
          activityMax: 3,
        }),
      )[0],
    ).toMatchObject({ title: "Kills matching filter (all-time)" });
  });

  it("jumps, region, sovereignty, and wormhole modes mirror the screen", () => {
    expect(
      legendSpecFor(input({ effectiveMode: "jumps", jumpsMax: 50 }))[0],
    ).toEqual({
      type: "gradient",
      title: "Ship jumps (past hour)",
      stops: JUMPS_HEX,
      min: "0",
      max: "50",
    });
    expect(legendSpecFor(input({ effectiveMode: "region" }))).toEqual([
      { type: "text", title: "Colored by region" },
    ]);
    expect(legendSpecFor(input({ effectiveMode: "sovereignty" }))).toEqual([
      { type: "text", title: "Colored by sovereignty" },
    ]);
    const wc = legendSpecFor(input({ effectiveMode: "wormhole-class" }))[0];
    expect(wc.type).toBe("swatches");
    if (wc.type === "swatches") {
      expect(wc.entries.map((e) => e.label)).toContain("C5");
      expect(wc.columns).toBe(2);
    }
    const we = legendSpecFor(input({ effectiveMode: "wormhole-effect" }))[0];
    if (we.type === "swatches") {
      expect(we.entries.at(-1)?.label).toBe("None");
      expect(we.columns).toBe(1);
    }
  });

  it("appends the overlay block after the colour block", () => {
    const sov = legendSpecFor(
      input({
        effectiveMode: "security",
        overlay: "sovereignty",
        admAvailable: false,
      }),
    );
    expect(sov).toHaveLength(2);
    expect(sov[1]).toEqual({
      type: "text",
      title: "Sovereignty overlay",
      note: "ADM data unavailable, so territory sizes reflect system count only.",
    });
    const hot = legendSpecFor(input({ overlay: "hot", hotMax: 3 }));
    expect(hot).toEqual([
      {
        type: "gradient",
        title: "Hot areas, kills in the last hour",
        stops: HOT_HEX,
        min: "0",
        max: String(HOT_MAX_FLOOR),
      },
    ]);
    expect(
      legendSpecFor(input({ overlay: "hot", hotMax: 42 }))[0],
    ).toMatchObject({ max: "42" });
  });
});
