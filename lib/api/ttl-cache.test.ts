import { describe, it, expect, vi } from "vitest";
import { createTtlCache } from "@/lib/api/ttl-cache";

function setup(opts: { ttlMs?: number; cap?: number } = {}) {
  let t = 1_000_000;
  const load = vi.fn((key: string, _signal?: AbortSignal) =>
    Promise.resolve(`value:${key}:${load.mock.calls.length}`),
  );
  const cache = createTtlCache<string, string>({
    ttlMs: opts.ttlMs ?? 1000,
    cap: opts.cap,
    load,
    now: () => t,
  });
  return { cache, load, advance: (ms: number) => (t += ms) };
}

describe("createTtlCache", () => {
  it("loads once and shares the promise while fresh", async () => {
    const { cache, load } = setup();
    const a = await cache.get("k");
    const b = await cache.get("k");
    expect(a).toBe(b);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("reloads after the TTL and keeps separate keys apart", async () => {
    const { cache, load, advance } = setup({ ttlMs: 500 });
    await cache.get("a");
    await cache.get("b");
    expect(load).toHaveBeenCalledTimes(2);
    advance(500);
    await cache.get("a");
    expect(load).toHaveBeenCalledTimes(3);
  });

  it("peeks a settled fresh value, null before settle and after expiry", async () => {
    const { cache, advance } = setup({ ttlMs: 500 });
    expect(cache.peek("k")).toBeNull();
    const p = cache.get("k");
    expect(cache.peek("k")).toBeNull();
    await p;
    expect(cache.peek("k")).toBe("value:k:1");
    advance(500);
    expect(cache.peek("k")).toBeNull();
  });

  it("evicts a rejected entry so the next call reloads", async () => {
    const load = vi
      .fn<(key: string) => Promise<string>>()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValue("ok");
    const cache = createTtlCache<string, string>({ ttlMs: 1000, load });
    await expect(cache.get("k")).rejects.toThrow("boom");
    await expect(cache.get("k")).resolves.toBe("ok");
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("a stale rejection never evicts the newer entry for the same key", async () => {
    let rejectFirst!: (e: Error) => void;
    const load = vi
      .fn<(key: string) => Promise<string>>()
      .mockImplementationOnce(
        () =>
          new Promise<string>((_, reject) => {
            rejectFirst = reject;
          }),
      )
      .mockResolvedValue("second");
    const cache = createTtlCache<string, string>({ ttlMs: 100, load });
    const c1 = new AbortController();
    const first = cache.get("k", c1.signal);
    first.catch(() => undefined);
    c1.abort();
    const second = cache.get("k");
    rejectFirst(new Error("late"));
    await expect(first).rejects.toThrow("late");
    await expect(second).resolves.toBe("second");
    expect(cache.peek("k")).toBe("second");
  });

  it("treats an in-flight entry whose signal was aborted as a miss", () => {
    const pending = vi.fn(
      (_key: string, _signal?: AbortSignal) =>
        new Promise<string>(() => undefined),
    );
    const cache = createTtlCache<string, string>({
      ttlMs: 1000,
      load: pending,
    });
    const c1 = new AbortController();
    void cache.get("k", c1.signal);
    c1.abort();
    const c2 = new AbortController();
    void cache.get("k", c2.signal);
    expect(pending).toHaveBeenCalledTimes(2);
    expect(pending.mock.calls[1][1]).toBe(c2.signal);
  });

  it("keeps sharing a slow in-flight load past the TTL instead of duplicating it", async () => {
    let resolveLoad!: (v: string) => void;
    const load = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveLoad = resolve;
        }),
    );
    let t = 0;
    const cache = createTtlCache<string, string>({
      ttlMs: 100,
      load,
      now: () => t,
    });
    const first = cache.get("k");
    t = 500;
    const second = cache.get("k");
    expect(load).toHaveBeenCalledTimes(1);
    resolveLoad("slow");
    await expect(first).resolves.toBe("slow");
    await expect(second).resolves.toBe("slow");
    void cache.get("k");
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("still shares a settled entry even if its signal was aborted afterwards", async () => {
    const { cache, load } = setup();
    const c = new AbortController();
    await cache.get("k", c.signal);
    c.abort();
    await cache.get("k");
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("drops the least recently loaded key once over the cap", async () => {
    const { cache, load } = setup({ cap: 2 });
    await cache.get("a");
    await cache.get("b");
    await cache.get("c");
    await cache.get("b");
    expect(load).toHaveBeenCalledTimes(3);
    await cache.get("a");
    expect(load).toHaveBeenCalledTimes(4);
    await cache.get("c");
    expect(load).toHaveBeenCalledTimes(4);
  });

  it("invalidate and clear force a reload", async () => {
    const { cache, load } = setup();
    await cache.get("a");
    await cache.get("b");
    cache.invalidate("a");
    await cache.get("a");
    expect(load).toHaveBeenCalledTimes(3);
    cache.clear();
    expect(cache.peek("b")).toBeNull();
    await cache.get("b");
    expect(load).toHaveBeenCalledTimes(4);
  });

  it("passes the signal through to the loader", async () => {
    const { cache, load } = setup();
    const c = new AbortController();
    await cache.get("k", c.signal);
    expect(load.mock.calls[0][1]).toBe(c.signal);
  });
});
