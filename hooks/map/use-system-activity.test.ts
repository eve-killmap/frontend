import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";

const originalFetch = globalThis.fetch;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.useRealTimers();
  vi.resetModules();
});

const DATA = { computed_at: 1757700000, counts: [0, 1, 4, 2] };

function stubFetch(payload: unknown, ok = true) {
  const fn = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
    if (init?.signal?.aborted)
      return Promise.reject(new DOMException("aborted", "AbortError"));
    return Promise.resolve({
      ok,
      status: ok ? 200 : 500,
      json: async () => payload,
    });
  });
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}

async function freshModule(payload: unknown = DATA, ok = true) {
  const fn = stubFetch(payload, ok);
  vi.resetModules();
  return { mod: await import("./use-system-activity"), fn };
}

describe("fetchSystemActivity", () => {
  it("requests the per-system activity path with 48 bins", async () => {
    const { mod, fn } = await freshModule();
    await mod.fetchSystemActivity(30000142);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(String(fn.mock.calls[0][0])).toMatch(
      /\/systems\/30000142\/activity\?bins=48$/,
    );
  });

  it("serves a second call for the same system from cache", async () => {
    const { mod, fn } = await freshModule();
    await mod.fetchSystemActivity(30000142);
    await mod.fetchSystemActivity(30000142);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("fetches separately per system", async () => {
    const { mod, fn } = await freshModule();
    await mod.fetchSystemActivity(30000142);
    await mod.fetchSystemActivity(30002187);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("evicts a rejected entry so the next call refetches", async () => {
    const { mod, fn } = await freshModule({}, false);
    await expect(mod.fetchSystemActivity(30000142)).rejects.toThrow();
    stubFetch(DATA);
    await expect(mod.fetchSystemActivity(30000142)).resolves.toEqual(DATA);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("refetches after the TTL expires", async () => {
    const { mod, fn } = await freshModule();
    await mod.fetchSystemActivity(30000142);
    vi.setSystemTime(Date.now() + 60_001);
    await mod.fetchSystemActivity(30000142);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("evicts the oldest system once the cache exceeds 64 entries", async () => {
    const { mod, fn } = await freshModule();
    for (let i = 0; i < 65; i++) await mod.fetchSystemActivity(30000000 + i);
    expect(fn).toHaveBeenCalledTimes(65);
    await mod.fetchSystemActivity(30000000);
    expect(fn).toHaveBeenCalledTimes(66);
    await mod.fetchSystemActivity(30000002);
    expect(fn).toHaveBeenCalledTimes(66);
  });

  it("passes the abort signal through to fetch", async () => {
    const { mod, fn } = await freshModule();
    const controller = new AbortController();
    await mod.fetchSystemActivity(30000142, controller.signal);
    expect((fn.mock.calls[0][1] as RequestInit).signal).toBe(controller.signal);
  });

  it("does not reuse an in-flight promise whose signal was aborted", async () => {
    const { mod } = await freshModule();
    const pending = vi.fn().mockReturnValue(new Promise(() => undefined));
    globalThis.fetch = pending as unknown as typeof fetch;
    const c1 = new AbortController();
    void mod.fetchSystemActivity(30000142, c1.signal);
    c1.abort();
    const c2 = new AbortController();
    void mod.fetchSystemActivity(30000142, c2.signal);
    await vi.waitFor(() => expect(pending).toHaveBeenCalledTimes(2));
    expect((pending.mock.calls[1][1] as RequestInit).signal).toBe(c2.signal);
  });
});

describe("peekSystemActivity", () => {
  it("is null before any fetch", async () => {
    const { mod } = await freshModule();
    expect(mod.peekSystemActivity(30000142)).toBeNull();
  });

  it("returns the settled payload while fresh and null after the TTL", async () => {
    const { mod } = await freshModule();
    await mod.fetchSystemActivity(30000142);
    expect(mod.peekSystemActivity(30000142)).toEqual(DATA);
    vi.setSystemTime(Date.now() + 60_001);
    expect(mod.peekSystemActivity(30000142)).toBeNull();
  });

  it("is null again after resetSystemActivityCache", async () => {
    const { mod } = await freshModule();
    await mod.fetchSystemActivity(30000142);
    mod.resetSystemActivityCache();
    expect(mod.peekSystemActivity(30000142)).toBeNull();
  });
});
