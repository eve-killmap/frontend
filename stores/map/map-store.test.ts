import { describe, it, expect, afterEach } from "vitest";
import {
  useMapStore,
  mapPartialize,
  mapMerge,
  DEFAULT_OVERLAY_OPACITY,
} from "./map-store";

afterEach(() => {
  useMapStore.getState().setShow3D(false);
});

describe("map-store show3D", () => {
  it("defaults to false", () => {
    expect(useMapStore.getState().show3D).toBe(false);
  });
  it("setShow3D updates the flag", () => {
    useMapStore.getState().setShow3D(true);
    expect(useMapStore.getState().show3D).toBe(true);
    useMapStore.getState().setShow3D(false);
    expect(useMapStore.getState().show3D).toBe(false);
  });
});

describe("map-store persistence round-trip", () => {
  it("round-trips custom line visibility (under the visibleLines key) and showCapsulesInFeed", () => {
    const base = useMapStore.getState();
    const custom = {
      ...base,
      visibleLines: { normal: false, constellation: true, regional: true },
      showCapsulesInFeed: false,
    };
    const p = mapPartialize(custom);
    expect(p.visibleLines).toEqual(custom.visibleLines);
    expect(p.visibleTypes).toBeUndefined();
    expect(p.showCapsulesInFeed).toBe(false);

    const merged = mapMerge(p, base);
    expect(merged.visibleLines).toEqual(custom.visibleLines);
    expect(merged.showCapsulesInFeed).toBe(false);
  });

  it("omits default line visibility and showCapsulesInFeed from the persisted payload", () => {
    const p = mapPartialize(useMapStore.getState());
    expect(p.visibleLines).toBeUndefined();
    expect(p.showCapsulesInFeed).toBeUndefined();
  });
});

describe("map-store overlay", () => {
  it("defaults to none and is omitted from the persisted payload", () => {
    const base = useMapStore.getState();
    expect(base.overlay).toBe("none");
    const p = mapPartialize(base);
    expect(p.overlay).toBeUndefined();
    expect(p.overlayOpacity).toBeUndefined();
  });

  it("persists a non-default overlay and opacity", () => {
    const base = useMapStore.getState();
    const p = mapPartialize({ ...base, overlay: "hot", overlayOpacity: 0.6 });
    expect(p.overlay).toBe("hot");
    expect(p.overlayOpacity).toBe(0.6);
    const merged = mapMerge(p, base);
    expect(merged.overlay).toBe("hot");
    expect(merged.overlayOpacity).toBe(0.6);
  });

  it("migrates the legacy showSovereignty and sovOpacity keys", () => {
    const base = useMapStore.getState();
    const merged = mapMerge({ showSovereignty: true, sovOpacity: 0.3 }, base);
    expect(merged.overlay).toBe("sovereignty");
    expect(merged.overlayOpacity).toBe(0.3);
    expect(mapMerge({ showSovereignty: false }, base).overlay).toBe("none");
    expect(mapMerge({}, base).overlayOpacity).toBe(DEFAULT_OVERLAY_OPACITY);
  });

  it("prefers the new keys over legacy ones", () => {
    const base = useMapStore.getState();
    const merged = mapMerge(
      {
        overlay: "hot",
        showSovereignty: true,
        overlayOpacity: 0.9,
        sovOpacity: 0.3,
      },
      base,
    );
    expect(merged.overlay).toBe("hot");
    expect(merged.overlayOpacity).toBe(0.9);
  });

  it("rejects an unrecognized persisted overlay value", () => {
    const base = useMapStore.getState();
    expect(mapMerge({ overlay: "bogus" }, base).overlay).toBe("none");
    expect(
      mapMerge({ overlay: "bogus", showSovereignty: true }, base).overlay,
    ).toBe("sovereignty");
  });
});
