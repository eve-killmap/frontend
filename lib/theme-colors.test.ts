import { describe, it, expect } from "vitest";
import { CAPSULEER, CHART } from "@/lib/theme-colors";

describe("theme-colors", () => {
  it("exposes the capsuleer gold used by JS color consumers", () => {
    expect(CAPSULEER).toBe("#c08a1e");
  });
  it("exposes chart axis/grid tokens as rgba strings", () => {
    expect(CHART.AXIS_LINE).toMatch(/^rgba\(/);
    expect(CHART.GRID).toMatch(/^rgba\(/);
  });
});

describe("theme-colors ↔ globals.css drift guard", () => {
  it("CAPSULEER matches --color-capsuleer in globals.css", async () => {
    const { readFileSync } = await import("node:fs");
    const { fileURLToPath } = await import("node:url");
    const cssPath = fileURLToPath(new URL("../globals.css", import.meta.url));
    const css = readFileSync(cssPath, "utf8");
    const match = css.match(/--color-capsuleer:\s*(#[0-9a-fA-F]{6})/);
    expect(match?.[1]?.toLowerCase()).toBe(CAPSULEER.toLowerCase());
  });
});
