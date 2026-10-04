import { describe, it, expect } from "vitest";
import { mapTitle, mapScreenshotTitle } from "@/lib/map/map-title";

describe("mapTitle", () => {
  it("names each map", () => {
    expect(mapTitle("new-eden")).toBe("New Eden");
    expect(mapTitle("anoikis")).toBe("Anoikis");
    expect(mapTitle("abyssal-deadspace")).toBe("Abyssal Deadspace");
    expect(mapTitle("tutorials")).toBe("Tutorials");
  });

  it("falls back to New Eden for an unknown type", () => {
    expect(mapTitle("nope")).toBe("New Eden");
  });
});

describe("mapScreenshotTitle", () => {
  it("spells out the tutorials map and otherwise matches the page title", () => {
    expect(mapScreenshotTitle("tutorials")).toBe("Tutorial Systems");
    expect(mapScreenshotTitle("anoikis")).toBe("Anoikis");
    expect(mapScreenshotTitle("nope")).toBe("New Eden");
  });
});
