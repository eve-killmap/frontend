import { describe, it, expect } from "vitest";
import {
  KILL_COLOR_PRESETS,
  PRESETS_PER_ROW,
} from "@/lib/system/kill-color-presets";

function hsvToHex(h: number, s: number, v: number): string {
  const sat = s / 100;
  const val = v / 100;
  const c = val * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = val - c;
  const sector = Math.floor(h / 60) % 6;
  const [r, g, b] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ][sector];
  return (
    "#" +
    [r, g, b]
      .map((q) =>
        Math.round((q + m) * 255)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}

const HUES = Array.from({ length: 16 }, (_, i) => i * 22.5);

describe("KILL_COLOR_PRESETS", () => {
  it("open with two pastel rows sweeping the hue circle at 22.5° steps", () => {
    const pastel = KILL_COLOR_PRESETS.slice(0, 16);
    expect(pastel).toEqual(HUES.map((h) => hsvToHex(h, 45, 100)));
  });

  it("follow with two vivid rows on the same hues", () => {
    const vivid = KILL_COLOR_PRESETS.slice(16, 32);
    expect(vivid).toEqual(HUES.map((h) => hsvToHex(h, 100, 100)));
  });

  it("are all lowercase 6-digit hex strings", () => {
    for (const c of KILL_COLOR_PRESETS) expect(c).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("contain no duplicates", () => {
    expect(new Set(KILL_COLOR_PRESETS).size).toBe(KILL_COLOR_PRESETS.length);
  });

  it("fill whole swatch rows", () => {
    expect(KILL_COLOR_PRESETS.length).toBe(40);
    expect(KILL_COLOR_PRESETS.length % PRESETS_PER_ROW).toBe(0);
  });

  it("end with a neutral row from white to dark grey", () => {
    const neutrals = KILL_COLOR_PRESETS.slice(-PRESETS_PER_ROW);
    expect(neutrals[0]).toBe("#ffffff");
    for (const c of neutrals) {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
      expect(r).toBe(g);
      expect(g).toBe(b);
    }
    const values = neutrals.map((c) => parseInt(c.slice(1, 3), 16));
    expect([...values].sort((a, b) => b - a)).toEqual(values);
  });
});
