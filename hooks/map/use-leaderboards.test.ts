import { describe, it, expect, vi, afterEach } from "vitest";

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
  return { mod: await import("./use-leaderboards"), fn };
}

const DATA = {
  computed_at: 1757700000,
  character: [{ id: 1, name: "Pilot", kills: 2 }],
  corporation: [],
  alliance: [],
  faction: [],
  ship: [],
  weapon: [],
};

describe("fetchLeaderboards / peekLeaderboards", () => {
  it("leaves nothing to peek at on a fresh module", async () => {
    const { mod } = await freshModule(DATA);
    expect(mod.peekLeaderboards("all", "attacker", "all")).toBeNull();
  });

  it("makes the payload readable synchronously once fetched", async () => {
    const { mod, fn } = await freshModule(DATA);
    const result = await mod.fetchLeaderboards("all", "attacker", "all");
    expect(result).toEqual(DATA);
    expect(mod.peekLeaderboards("all", "attacker", "all")).toEqual(result);
    const [url] = fn.mock.calls[0];
    expect(String(url)).toMatch(
      /\/stats\/leaderboards\?window=all&role=attacker&scope=all&limit=10$/,
    );
  });

  it("serves a second fetch from cache without a second request", async () => {
    const { mod, fn } = await freshModule(DATA);
    const first = await mod.fetchLeaderboards("all", "attacker", "all");
    const second = await mod.fetchLeaderboards("all", "attacker", "all");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
  });

  it("leaves the cache cold after a failed fetch", async () => {
    const { mod } = await freshModule({}, false);
    await expect(
      mod.fetchLeaderboards("all", "attacker", "all"),
    ).rejects.toThrow();
    expect(mod.peekLeaderboards("all", "attacker", "all")).toBeNull();
  });

  it("keeps windows and roles independent in the cache", async () => {
    const { mod, fn } = await freshModule(DATA);
    await mod.fetchLeaderboards("all", "attacker", "all");
    expect(mod.peekLeaderboards("all", "victim", "all")).toBeNull();
    await mod.fetchLeaderboards("all", "victim", "all");
    expect(fn).toHaveBeenCalledTimes(2);
    const [url] = fn.mock.calls[1];
    expect(String(url)).toContain("role=victim");
  });

  it("keeps the two scopes independent in the cache", async () => {
    const { mod, fn } = await freshModule(DATA);
    await mod.fetchLeaderboards("all", "attacker", "all");
    expect(mod.peekLeaderboards("all", "attacker", "players")).toBeNull();
    await mod.fetchLeaderboards("all", "attacker", "players");
    expect(fn).toHaveBeenCalledTimes(2);
    const [url] = fn.mock.calls[1];
    expect(String(url)).toContain("scope=players");
    expect(mod.peekLeaderboards("all", "attacker", "all")).toEqual(DATA);
  });
});
