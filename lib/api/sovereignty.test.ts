import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { sovereigntyUrl, fetchSovereignty } from "./sovereignty";
import type { SovereigntyResponse } from "@/lib/schema/sov-schema";

describe("sovereigntyUrl", () => {
  it("targets the deployed /universe/sov endpoint", () => {
    expect(sovereigntyUrl()).toMatch(/\/universe\/sov$/);
  });
});

const originalFetch = globalThis.fetch;

function stubFetch(response: {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}) {
  globalThis.fetch = vi
    .fn()
    .mockResolvedValue(response) as unknown as typeof fetch;
}

const validSnapshot: SovereigntyResponse = {
  updated_at: 1,
  adm_available: true,
  owner_kinds: [1],
  owner_ids: [2],
  owner_names: ["x"],
  owner_tickers: [null],
  system_ids: [3],
  owner_idx: [0],
  adm: [6],
};

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("fetchSovereignty", () => {
  it("returns the parsed snapshot on a valid response", async () => {
    stubFetch({ ok: true, status: 200, json: async () => validSnapshot });
    expect(await fetchSovereignty()).toEqual(validSnapshot);
  });

  it("returns null on HTTP 503 (warming up)", async () => {
    stubFetch({ ok: false, status: 503, json: async () => ({}) });
    expect(await fetchSovereignty()).toBeNull();
  });

  it("throws on other non-ok statuses", async () => {
    stubFetch({ ok: false, status: 500, json: async () => ({}) });
    await expect(fetchSovereignty()).rejects.toThrow(/HTTP 500/);
  });
});

describe("fetchSovereigntyCached", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns null on a 503 and allows a later call to retry", async () => {
    stubFetch({ ok: false, status: 503, json: async () => ({}) });
    const { fetchSovereigntyCached } = await import("./sovereignty");
    expect(await fetchSovereigntyCached()).toBeNull();

    stubFetch({ ok: true, status: 200, json: async () => validSnapshot });
    expect(await fetchSovereigntyCached()).toEqual(validSnapshot);
  });

  it("dedupes concurrent calls into a single fetch", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => validSnapshot,
    });
    globalThis.fetch = fetchFn as unknown as typeof fetch;
    const { fetchSovereigntyCached } = await import("./sovereignty");
    const [a, b] = await Promise.all([
      fetchSovereigntyCached(),
      fetchSovereigntyCached(),
    ]);
    expect(a).toEqual(validSnapshot);
    expect(b).toEqual(validSnapshot);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});
