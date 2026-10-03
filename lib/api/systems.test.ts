import { describe, it, expect, vi, afterEach } from "vitest";

const DATA = { systemIDs: [30000142, 30002187], systems: ["Jita", "Amarr"] };
const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.resetModules();
});

async function freshModule(payload: unknown, ok = true) {
  const fn = vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: async () => payload,
  });
  globalThis.fetch = fn as unknown as typeof fetch;
  vi.resetModules();
  return { mod: await import("./systems"), fn };
}

describe("fetchSystemsCached", () => {
  it("has nothing to peek at before the first fetch", async () => {
    const { mod } = await freshModule(DATA);
    expect(mod.peekSystems()).toBeNull();
  });

  it("fetches once and serves later calls from the cache", async () => {
    const { mod, fn } = await freshModule(DATA);
    const a = await mod.fetchSystemsCached();
    const b = await mod.fetchSystemsCached();
    expect(a).toEqual(DATA);
    expect(b).toBe(a);
    expect(mod.peekSystems()).toBe(a);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("shares one in-flight request between concurrent callers", async () => {
    const { mod, fn } = await freshModule(DATA);
    const [a, b] = await Promise.all([
      mod.fetchSystemsCached(),
      mod.fetchSystemsCached(),
    ]);
    expect(a).toBe(b);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("rejects on a failed response and leaves the cache cold", async () => {
    const { mod } = await freshModule({}, false);
    await expect(mod.fetchSystemsCached()).rejects.toThrow(/HTTP 500/);
    expect(mod.peekSystems()).toBeNull();
  });

  it("succeeds on retry after a failed response", async () => {
    const { mod } = await freshModule({}, false);
    await expect(mod.fetchSystemsCached()).rejects.toThrow(/HTTP 500/);

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => DATA,
    }) as unknown as typeof fetch;

    await expect(mod.fetchSystemsCached()).resolves.toEqual(DATA);
    expect(mod.peekSystems()).toEqual(DATA);
  });
});
