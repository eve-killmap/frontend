import { describe, it, expect, vi, afterEach } from "vitest";
import { buildJumpsLookup } from "./use-system-jumps";

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
  return { mod: await import("./use-system-jumps"), fn };
}

describe("prefetchSystemJumps", () => {
  it("leaves nothing to peek at before a prefetch", async () => {
    const { mod } = await freshModule(DATA);
    expect(mod.peekSystemJumps()).toBeNull();
  });

  it("makes the payload readable synchronously once warmed", async () => {
    const { mod, fn } = await freshModule(DATA);
    mod.prefetchSystemJumps();
    await vi.waitFor(() => expect(mod.peekSystemJumps()).not.toBeNull());
    expect(mod.peekSystemJumps()).toEqual(DATA);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("serves a later fetch from cache without a second request", async () => {
    const { mod, fn } = await freshModule(DATA);
    mod.prefetchSystemJumps();
    await vi.waitFor(() => expect(mod.peekSystemJumps()).not.toBeNull());
    mod.prefetchSystemJumps();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("swallows a failed prefetch and leaves the cache cold", async () => {
    const { mod } = await freshModule({}, false);
    mod.prefetchSystemJumps();
    await vi.waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    expect(mod.peekSystemJumps()).toBeNull();
  });
});

const DATA = {
  system_ids: [30000142, 30000144, 30002187],
  jumps: [1247, 88, 3],
};

describe("buildJumpsLookup", () => {
  it("looks up counts by system id", () => {
    const lookup = buildJumpsLookup(DATA);
    expect(lookup.countFor(30000142)).toBe(1247);
    expect(lookup.countFor(30002187)).toBe(3);
  });

  it("treats a system absent from the payload as zero", () => {
    expect(buildJumpsLookup(DATA).countFor(30009999)).toBe(0);
  });

  it("computes max and total across every returned system", () => {
    const lookup = buildJumpsLookup(DATA);
    expect(lookup.max).toBe(1247);
    expect(lookup.total).toBe(1338);
  });

  it("restricts max and total to included ids but still resolves excluded ones", () => {
    const lookup = buildJumpsLookup(DATA, new Set([30000144, 30002187]));
    expect(lookup.max).toBe(88);
    expect(lookup.total).toBe(91);
    expect(lookup.countFor(30000142)).toBe(1247);
  });

  it("returns a zeroed lookup for an empty payload", () => {
    const lookup = buildJumpsLookup({ system_ids: [], jumps: [] });
    expect(lookup.max).toBe(0);
    expect(lookup.total).toBe(0);
    expect(lookup.countFor(30000142)).toBe(0);
  });
});
