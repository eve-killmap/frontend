import { describe, it, expect } from "vitest";
import { mapSubtitle } from "@/lib/export/map-subtitle";

describe("mapSubtitle", () => {
  it("names the colour mode alone when there is no overlay", () => {
    expect(mapSubtitle("activity", "none")).toBe("Kill Activity");
    expect(mapSubtitle("wormhole-class", "none")).toBe("Wormhole Class");
  });

  it("joins the colour mode and overlay with a middle dot", () => {
    expect(mapSubtitle("security", "hot")).toBe("Security · Hot Areas");
    expect(mapSubtitle("region", "sovereignty")).toBe("Region · Sovereignty");
  });

  it("names only the overlay when colouring is off", () => {
    expect(mapSubtitle("none", "hot")).toBe("Hot Areas");
  });

  it("is null when neither is active", () => {
    expect(mapSubtitle("none", "none")).toBeNull();
  });
});
