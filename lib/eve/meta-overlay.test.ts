import { describe, it, expect, vi, afterEach } from "vitest";
import {
  META_OVERLAYS,
  buildTypeMetaIndex,
  overlayPathForType,
} from "./meta-overlay";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.resetModules();
});

async function freshModule(payload: unknown, ok = true) {
  const fn = vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 503,
    json: async () => payload,
  });
  globalThis.fetch = fn as unknown as typeof fetch;
  vi.resetModules();
  return { mod: await import("./meta-overlay"), fn };
}

const TYPE_METAS = { "2": [11993, 12003], "4": [17703], "53": [47119] };

describe("META_OVERLAYS", () => {
  it("maps every supported meta id to its badge under /overlays", () => {
    expect(META_OVERLAYS).toEqual({
      2: "/overlays/tech2.png",
      3: "/overlays/storyline.png",
      4: "/overlays/faction.png",
      14: "/overlays/tech3.png",
      15: "/overlays/abyssal.png",
      19: "/overlays/timelimited.png",
      52: "/overlays/structureoverlayfaction.png",
      53: "/overlays/structureoverlay.png",
      54: "/overlays/structureoverlayt2.png",
    });
  });
});

describe("buildTypeMetaIndex", () => {
  it("inverts meta to type ids into type id to meta", () => {
    const index = buildTypeMetaIndex(TYPE_METAS);
    expect(index.get(11993)).toBe(2);
    expect(index.get(12003)).toBe(2);
    expect(index.get(17703)).toBe(4);
    expect(index.get(47119)).toBe(53);
    expect(index.size).toBe(4);
  });

  it("returns an empty index for an empty record", () => {
    expect(buildTypeMetaIndex({}).size).toBe(0);
  });
});

describe("overlayPathForType", () => {
  const index = buildTypeMetaIndex(TYPE_METAS);

  it("returns the badge path for a mapped type", () => {
    expect(overlayPathForType(11993, index)).toBe("/overlays/tech2.png");
    expect(overlayPathForType(47119, index)).toBe(
      "/overlays/structureoverlay.png",
    );
  });

  it("returns null for a type absent from the index", () => {
    expect(overlayPathForType(587, index)).toBeNull();
  });

  it("returns null for a meta id that has no badge", () => {
    expect(overlayPathForType(1, buildTypeMetaIndex({ "99": [1] }))).toBeNull();
  });
});

describe("loadTypeMetaIndex", () => {
  it("has nothing to peek at before loading", async () => {
    const { mod } = await freshModule(TYPE_METAS);
    expect(mod.peekTypeMetaIndex()).toBeNull();
  });

  it("fetches typeMetas.json once and exposes the inverted index", async () => {
    const { mod, fn } = await freshModule(TYPE_METAS);
    const index = await mod.loadTypeMetaIndex();
    expect(index.get(11993)).toBe(2);
    expect(mod.peekTypeMetaIndex()).toBe(index);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(String(fn.mock.calls[0][0])).toMatch(
      /\/static\/type\/typeMetas\.json$/,
    );
  });

  it("shares one request across concurrent and later loads", async () => {
    const { mod, fn } = await freshModule(TYPE_METAS);
    const [a, b] = await Promise.all([
      mod.loadTypeMetaIndex(),
      mod.loadTypeMetaIndex(),
    ]);
    expect(a).toBe(b);
    await mod.loadTypeMetaIndex();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("shares the raw record with fetchTypeMetas", async () => {
    const { mod, fn } = await freshModule(TYPE_METAS);
    expect(await mod.fetchTypeMetas()).toEqual(TYPE_METAS);
    await mod.loadTypeMetaIndex();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("rejects on a failed fetch and leaves the index cold", async () => {
    const { mod } = await freshModule({}, false);
    await expect(mod.loadTypeMetaIndex()).rejects.toThrow();
    expect(mod.peekTypeMetaIndex()).toBeNull();
  });
});
