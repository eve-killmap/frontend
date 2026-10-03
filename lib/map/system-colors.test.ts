import { describe, it, expect } from "vitest";
import {
  hexToRgb,
  toLinear,
  roundSecurity,
  securityIndex,
  securityColor,
  formatSecurity,
  activityColor,
  jumpsColor,
  JUMPS_HEX,
  regionColor,
  buildSystemColors,
  BASE_GRAY,
  ACTIVITY_HEX,
  wormholeClassColor,
  wormholeEffectColor,
  wormholeEffectHex,
  colorModeAllowedOn,
  overlayAllowedOn,
  HOT_HEX,
  hotRampColor,
  type ActivityLookup,
} from "@/lib/map/system-colors";

describe("colorModeAllowedOn", () => {
  it("allows unrestricted modes on any map type", () => {
    for (const m of ["none", "security", "activity", "region"] as const) {
      expect(colorModeAllowedOn(m, "new-eden")).toBe(true);
      expect(colorModeAllowedOn(m, "anoikis")).toBe(true);
      expect(colorModeAllowedOn(m, "abyssal-deadspace")).toBe(true);
    }
  });
  it("restricts wormhole modes to the anoikis map", () => {
    expect(colorModeAllowedOn("wormhole-class", "anoikis")).toBe(true);
    expect(colorModeAllowedOn("wormhole-effect", "anoikis")).toBe(true);
    expect(colorModeAllowedOn("wormhole-class", "new-eden")).toBe(false);
    expect(colorModeAllowedOn("wormhole-effect", "abyssal-deadspace")).toBe(
      false,
    );
  });
  it("restricts sovereignty to the new-eden map", () => {
    expect(colorModeAllowedOn("sovereignty", "new-eden")).toBe(true);
    expect(colorModeAllowedOn("sovereignty", "anoikis")).toBe(false);
  });
});

describe("hexToRgb", () => {
  it("converts hex to 0..1 RGB", () => {
    expect(hexToRgb("#000000")).toEqual([0, 0, 0]);
    expect(hexToRgb("#ffffff")).toEqual([1, 1, 1]);
    expect(hexToRgb("#808080")).toEqual([128 / 255, 128 / 255, 128 / 255]);
  });
});

describe("securityIndex", () => {
  it("maps 1.0…0.1 to 10…1", () => {
    expect(securityIndex(1.0)).toBe(10);
    expect(securityIndex(0.9453)).toBe(9);
    expect(securityIndex(0.4521)).toBe(5);
    expect(securityIndex(0.1)).toBe(1);
  });
  it("floors positive-but-tiny to 1 (never the null bucket)", () => {
    expect(securityIndex(0.02)).toBe(1);
  });
  it("maps 0.0 and below to 0", () => {
    expect(securityIndex(0)).toBe(0);
    expect(securityIndex(-1)).toBe(0);
  });
  it("maps non-finite (missing) security to 0", () => {
    expect(securityIndex(NaN)).toBe(0);
  });
  it("clamps above 1.0 to 10", () => {
    expect(securityIndex(1.5)).toBe(10);
  });
});

describe("roundSecurity", () => {
  it("rounds normally to a tenth", () => {
    expect(roundSecurity(1.0)).toBe(1);
    expect(roundSecurity(0.9453)).toBe(0.9);
    expect(roundSecurity(0.4521)).toBe(0.5);
    expect(roundSecurity(-0.7)).toBe(-0.7);
  });
  it("rounds a positive-but-tiny status (0 < x < 0.05) up to 0.1", () => {
    expect(roundSecurity(0.04)).toBe(0.1);
    expect(roundSecurity(0.001)).toBe(0.1);
  });
  it("collapses a rounded-to-zero result to +0 (no -0)", () => {
    expect(roundSecurity(0)).toBe(0);
    expect(roundSecurity(-0.04)).toBe(0);
  });
});

describe("formatSecurity", () => {
  it("shows a positive-but-tiny status as 0.1, never 0.0", () => {
    expect(formatSecurity(0.02)).toBe("0.1");
    expect(formatSecurity(0.049)).toBe("0.1");
  });
  it("formats to one decimal without a spurious -0.0", () => {
    expect(formatSecurity(-0.04)).toBe("0.0");
    expect(formatSecurity(0)).toBe("0.0");
    expect(formatSecurity(1.0)).toBe("1.0");
    expect(formatSecurity(-1.0)).toBe("-1.0");
    expect(formatSecurity(0.5)).toBe("0.5");
  });
});

describe("securityColor", () => {
  it("returns the (linearized) palette color for the index", () => {
    expect(securityColor(1.0)).toEqual(toLinear(hexToRgb("#2c75e1")));
    expect(securityColor(0.5)).toEqual(toLinear(hexToRgb("#f5ff83")));
    expect(securityColor(-1)).toEqual(toLinear(hexToRgb("#8d3163")));
  });
});

describe("activityColor", () => {
  it("returns the gray zero color for no kills", () => {
    expect(activityColor(0, 1000)).toEqual(toLinear(hexToRgb("#4d4d4d")));
  });
  it("returns the top of the ramp at the max count", () => {
    expect(activityColor(1000, 1000)).toEqual(toLinear(hexToRgb("#ffe070")));
  });
  it("is monotonic in count (more kills → hotter, higher red channel)", () => {
    const low = activityColor(2, 1000);
    const high = activityColor(500, 1000);
    expect(high[0]).toBeGreaterThan(low[0]);
  });
  it("does not divide by zero when maxCount is 0", () => {
    const c = activityColor(0, 0);
    expect(c.every((v) => Number.isFinite(v))).toBe(true);
  });
});

describe("ACTIVITY_HEX / activity ramp", () => {
  it("exposes 5 sRGB hex stops", () => {
    expect(ACTIVITY_HEX).toHaveLength(5);
    expect(ACTIVITY_HEX[0]).toBe("#3a2a6b");
    expect(ACTIVITY_HEX[4]).toBe("#ffe070");
  });
  it("returns the linear of the top stop at count === maxCount", () => {
    const top = toLinear(hexToRgb("#ffe070"));
    expect(activityColor(100, 100)).toEqual(top);
  });
});

describe("regionColor", () => {
  it("is deterministic per regionID", () => {
    expect(regionColor(10000002)).toEqual(regionColor(10000002));
  });
  it("gives different regions different colors", () => {
    expect(regionColor(10000002)).not.toEqual(regionColor(10000043));
  });
  it("returns finite 0..1 components", () => {
    const c = regionColor(10000030);
    expect(c.every((v) => v >= 0 && v <= 1)).toBe(true);
  });
});

describe("buildSystemColors", () => {
  const systemIDs = [30000142, 30002187, 30000001];

  function expectColorAt(out: Float32Array, i: number, rgb: number[]) {
    expect(out[i * 3]).toBeCloseTo(rgb[0], 5);
    expect(out[i * 3 + 1]).toBeCloseTo(rgb[1], 5);
    expect(out[i * 3 + 2]).toBeCloseTo(rgb[2], 5);
  }

  it("fills BASE_GRAY for mode none", () => {
    const out = buildSystemColors({ mode: "none", systemIDs });
    expect(out.length).toBe(9);
    expectColorAt(out, 0, BASE_GRAY);
    expectColorAt(out, 1, BASE_GRAY);
  });

  it("colors by security using the parallel array", () => {
    const out = buildSystemColors({
      mode: "security",
      systemIDs,
      securityStatuses: [1.0, 0.5, -1],
    });
    expectColorAt(out, 0, securityColor(1.0));
    expectColorAt(out, 1, securityColor(0.5));
    expectColorAt(out, 2, securityColor(-1));
  });

  it("colors by region via the index resolver, falling back to gray when unknown", () => {
    const regionIDByIndex = (i: number) => (i === 2 ? undefined : 10000002 + i);
    const out = buildSystemColors({
      mode: "region",
      systemIDs,
      regionIDByIndex,
    });
    expectColorAt(out, 0, regionColor(10000002));
    expectColorAt(out, 2, BASE_GRAY);
  });

  it("colors by activity via the lookup", () => {
    const activity: ActivityLookup = {
      countFor: (id) => (id === 30000142 ? 1000 : id === 30002187 ? 0 : 5),
      max: 1000,
      total: 1005,
    };
    const out = buildSystemColors({ mode: "activity", systemIDs, activity });
    expectColorAt(out, 0, activityColor(1000, 1000));
    expectColorAt(out, 1, activityColor(0, 1000));
    expectColorAt(out, 2, activityColor(5, 1000));
  });

  it("colors by sovereignty via the owner-color lookup, gray for the unowned", () => {
    const red: [number, number, number] = [1, 0, 0];
    const blue: [number, number, number] = [0, 0, 1];
    const sovColorFor = (id: number) =>
      id === 30000142 ? red : id === 30002187 ? blue : undefined;
    const out = buildSystemColors({
      mode: "sovereignty",
      systemIDs,
      sovColorFor,
    });
    expectColorAt(out, 0, red);
    expectColorAt(out, 1, blue);
    expectColorAt(out, 2, BASE_GRAY);
  });

  it("falls back to gray when the mode's data is missing", () => {
    const out = buildSystemColors({ mode: "security", systemIDs });
    expectColorAt(out, 0, BASE_GRAY);
  });

  it("falls back to gray for jumps when the fetch failed (jumps: null)", () => {
    const out = buildSystemColors({ mode: "jumps", systemIDs, jumps: null });
    expectColorAt(out, 0, BASE_GRAY);
    expectColorAt(out, 1, BASE_GRAY);
    expectColorAt(out, 2, BASE_GRAY);
  });

  it("colors by wormhole class, gray for an unknown class", () => {
    const out = buildSystemColors({
      mode: "wormhole-class",
      systemIDs,
      wormholeClassIDs: [5, 12, 999],
    });
    expectColorAt(out, 0, wormholeClassColor(5));
    expectColorAt(out, 1, wormholeClassColor(12));
    expectColorAt(out, 2, BASE_GRAY);
  });

  it("colors by wormhole effect, gray for no effect (0)", () => {
    const out = buildSystemColors({
      mode: "wormhole-effect",
      systemIDs,
      wormholeEffects: [4, 0, 1],
    });
    expectColorAt(out, 0, wormholeEffectColor(4));
    expectColorAt(out, 1, BASE_GRAY);
    expectColorAt(out, 2, wormholeEffectColor(1));
  });
});

describe("wormholeClassColor", () => {
  it("colors a known class from the palette", () => {
    expect(wormholeClassColor(5)).toEqual(toLinear(hexToRgb("#a85400")));
    expect(wormholeClassColor(12)).toEqual(toLinear(hexToRgb("#ffffff")));
    expect(wormholeClassColor(13)).toEqual(toLinear(hexToRgb("#a800a8")));
  });
  it("falls back to gray for an unknown class", () => {
    expect(wormholeClassColor(0)).toEqual(BASE_GRAY);
    expect(wormholeClassColor(7)).toEqual(BASE_GRAY);
  });
});

describe("wormholeEffectColor", () => {
  it("is deterministic and non-gray for a real effect", () => {
    expect(wormholeEffectColor(1)).toEqual(wormholeEffectColor(1));
    expect(wormholeEffectColor(1)).not.toEqual(BASE_GRAY);
  });
  it("gives different effects different colors", () => {
    expect(wormholeEffectColor(1)).not.toEqual(wormholeEffectColor(2));
  });
  it("is gray for no effect (0)", () => {
    expect(wormholeEffectColor(0)).toEqual(BASE_GRAY);
  });
});

describe("wormholeEffectHex", () => {
  it("is a 6-digit hex for a real effect and gray for none", () => {
    expect(wormholeEffectHex(1)).toMatch(/^#[0-9a-f]{6}$/);
    expect(wormholeEffectHex(0)).toBe("#808080");
  });
});

describe("jumpsColor", () => {
  it("returns the zero color for no jumps", () => {
    const zero = jumpsColor(0, 1000);
    expect(zero).toEqual(toLinear(hexToRgb("#4d4d4d")));
    expect(jumpsColor(-5, 1000)).toEqual(zero);
  });

  it("returns the ramp top at the maximum", () => {
    expect(jumpsColor(1000, 1000)).toEqual(
      toLinear(hexToRgb(JUMPS_HEX[JUMPS_HEX.length - 1])),
    );
  });

  it("increases monotonically in luminance with jump count", () => {
    const lum = (c: number) => {
      const [r, g, b] = jumpsColor(c, 1000);
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    expect(lum(1)).toBeLessThan(lum(50));
    expect(lum(50)).toBeLessThan(lum(500));
    expect(lum(500)).toBeLessThan(lum(1000));
  });

  it("does not divide by zero when the maximum is zero", () => {
    expect(() => jumpsColor(5, 0)).not.toThrow();
    expect(jumpsColor(5, 0)).toEqual(toLinear(hexToRgb(JUMPS_HEX[0])));
  });
});

describe("overlayAllowedOn", () => {
  it("allows none and hot everywhere", () => {
    for (const map of [
      "new-eden",
      "anoikis",
      "abyssal-deadspace",
      "tutorials",
    ]) {
      expect(overlayAllowedOn("none", map)).toBe(true);
      expect(overlayAllowedOn("hot", map)).toBe(true);
    }
  });
  it("restricts sovereignty to new-eden", () => {
    expect(overlayAllowedOn("sovereignty", "new-eden")).toBe(true);
    expect(overlayAllowedOn("sovereignty", "anoikis")).toBe(false);
  });
});

describe("jumps color mode", () => {
  it("is allowed only on the New Eden map", () => {
    expect(colorModeAllowedOn("jumps", "new-eden")).toBe(true);
    expect(colorModeAllowedOn("jumps", "anoikis")).toBe(false);
    expect(colorModeAllowedOn("jumps", "abyssal-deadspace")).toBe(false);
    expect(colorModeAllowedOn("jumps", "tutorials")).toBe(false);
  });

  it("colors systems from the jumps lookup and zero-fills absent systems", () => {
    const lookup: ActivityLookup = {
      countFor: (id) => (id === 30000142 ? 1000 : 0),
      max: 1000,
      total: 1000,
    };
    const out = buildSystemColors({
      mode: "jumps",
      systemIDs: [30000142, 30000144],
      jumps: lookup,
    });
    const top = toLinear(hexToRgb(JUMPS_HEX[JUMPS_HEX.length - 1]));
    const zero = toLinear(hexToRgb("#4d4d4d"));
    for (let c = 0; c < 3; c++) {
      expect(out[c]).toBeCloseTo(top[c], 5);
      expect(out[3 + c]).toBeCloseTo(zero[c], 5);
    }
  });
});

describe("hot ramp", () => {
  it("has four stops and ends at the given colours", () => {
    expect(HOT_HEX).toHaveLength(4);
    expect(hotRampColor(0)).toEqual(toLinear(hexToRgb(HOT_HEX[0])));
    expect(hotRampColor(1)).toEqual(toLinear(hexToRgb(HOT_HEX[3])));
  });
  it("clamps outside [0, 1]", () => {
    expect(hotRampColor(-1)).toEqual(hotRampColor(0));
    expect(hotRampColor(2)).toEqual(hotRampColor(1));
  });
});
