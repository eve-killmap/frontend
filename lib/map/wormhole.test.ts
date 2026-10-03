import { describe, it, expect } from "vitest";
import {
  wormholeClassLabel,
  displayWormholeClassLabel,
  wormholeEffectLabel,
} from "@/lib/map/wormhole";

describe("wormholeClassLabel", () => {
  it("labels the C1–C6 classes", () => {
    expect(wormholeClassLabel(1)).toBe("C1");
    expect(wormholeClassLabel(6)).toBe("C6");
  });
  it("labels Thera, C13, and the Drifter systems", () => {
    expect(wormholeClassLabel(12)).toBe("Thera");
    expect(wormholeClassLabel(13)).toBe("C13");
    expect(wormholeClassLabel(14)).toBe("Sentinel");
    expect(wormholeClassLabel(15)).toBe("Barbican");
    expect(wormholeClassLabel(16)).toBe("Vidette");
    expect(wormholeClassLabel(17)).toBe("Conflux");
    expect(wormholeClassLabel(18)).toBe("Redoubt");
  });
  it("returns null for an unknown class (0, 7, 25)", () => {
    expect(wormholeClassLabel(0)).toBeNull();
    expect(wormholeClassLabel(7)).toBeNull();
    expect(wormholeClassLabel(25)).toBeNull();
  });
});

describe("displayWormholeClassLabel", () => {
  it("suppresses the label when it repeats the system name (Thera, Drifters)", () => {
    expect(displayWormholeClassLabel(12, "Thera")).toBeNull();
    expect(displayWormholeClassLabel(14, "Sentinel")).toBeNull();
    expect(displayWormholeClassLabel(15, "Barbican")).toBeNull();
    expect(displayWormholeClassLabel(16, "Vidette")).toBeNull();
    expect(displayWormholeClassLabel(17, "Conflux")).toBeNull();
    expect(displayWormholeClassLabel(18, "Redoubt")).toBeNull();
  });
  it("is case-insensitive on the name match", () => {
    expect(displayWormholeClassLabel(12, "THERA")).toBeNull();
  });
  it("keeps the label when it differs from the name (C1–C6, C13)", () => {
    expect(displayWormholeClassLabel(5, "J123456")).toBe("C5");
    expect(displayWormholeClassLabel(13, "J055520")).toBe("C13");
  });
  it("returns null for an unknown class", () => {
    expect(displayWormholeClassLabel(7, "J123456")).toBeNull();
  });
});

describe("wormholeEffectLabel", () => {
  it("labels effects 1–6", () => {
    expect(wormholeEffectLabel(1)).toBe("Magnetar");
    expect(wormholeEffectLabel(2)).toBe("Black Hole");
    expect(wormholeEffectLabel(3)).toBe("Red Giant");
    expect(wormholeEffectLabel(4)).toBe("Pulsar");
    expect(wormholeEffectLabel(5)).toBe("Wolf-Rayet");
    expect(wormholeEffectLabel(6)).toBe("Cataclysmic Variable");
  });
  it("returns null for 0 (no effect) and unknown", () => {
    expect(wormholeEffectLabel(0)).toBeNull();
    expect(wormholeEffectLabel(99)).toBeNull();
  });
});
