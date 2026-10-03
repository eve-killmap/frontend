import { describe, it, expect, vi, afterEach } from "vitest";
import { z, ZodError } from "zod";
import {
  apiFetch,
  apiFetchBinary,
  ApiError,
  ApiUnavailableError,
  singleFlight,
} from "./client";
import { useApiHealthStore } from "@/stores/api-health-store";
import { BACKEND_BASE_URL } from "@/lib/net/endpoints";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  useApiHealthStore.setState({ healthy: null });
});

function stubFetch(response: {
  ok: boolean;
  status?: number;
  json: () => Promise<unknown>;
}) {
  const fn = vi.fn().mockResolvedValue(response);
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}

describe("apiFetch", () => {
  const PointSchema = z.object({ x: z.number(), y: z.number() });

  it("returns the parsed value on a valid mocked response", async () => {
    stubFetch({ ok: true, status: 200, json: async () => ({ x: 1, y: 2 }) });
    const result = await apiFetch("https://example.test/point", PointSchema);
    expect(result).toEqual({ x: 1, y: 2 });
  });

  it("throws when the response is not ok", async () => {
    stubFetch({ ok: false, status: 500, json: async () => ({}) });
    await expect(
      apiFetch("https://example.test/point", PointSchema),
    ).rejects.toThrow(/HTTP 500/);
  });

  it("throws an ApiError carrying the HTTP status", async () => {
    stubFetch({ ok: false, status: 503, json: async () => ({}) });
    await expect(
      apiFetch("https://example.test/point", PointSchema),
    ).rejects.toMatchObject({ status: 503 });
    stubFetch({ ok: false, status: 503, json: async () => ({}) });
    await expect(
      apiFetch("https://example.test/point", PointSchema),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("throws a ZodError when the JSON doesn't match the schema", async () => {
    stubFetch({
      ok: true,
      status: 200,
      json: async () => ({ x: "not a number", y: 2 }),
    });
    await expect(
      apiFetch("https://example.test/point", PointSchema),
    ).rejects.toBeInstanceOf(ZodError);
  });

  it("forwards init (e.g. signal) to fetch", async () => {
    const fn = stubFetch({
      ok: true,
      status: 200,
      json: async () => ({ x: 1, y: 2 }),
    });
    const controller = new AbortController();
    await apiFetch("https://example.test/point", PointSchema, {
      signal: controller.signal,
    });
    expect(fn).toHaveBeenCalledWith(
      "https://example.test/point",
      expect.objectContaining({ signal: controller.signal }),
    );
  });
});

describe("API health gate", () => {
  const PointSchema = z.object({ x: z.number() });
  const ok = () =>
    stubFetch({ ok: true, status: 200, json: async () => ({ x: 1 }) });

  it("rejects an API call without fetching once the API is known unhealthy", async () => {
    const fn = ok();
    useApiHealthStore.getState().setHealthy(false);
    await expect(
      apiFetch("https://example.test/point", PointSchema),
    ).rejects.toBeInstanceOf(ApiUnavailableError);
    expect(fn).not.toHaveBeenCalled();
  });

  it("the unavailable error is an ApiError with status 0", async () => {
    ok();
    useApiHealthStore.getState().setHealthy(false);
    await expect(
      apiFetch("https://example.test/point", PointSchema),
    ).rejects.toMatchObject({ status: 0, name: "ApiUnavailableError" });
    await expect(
      apiFetch("https://example.test/point", PointSchema),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("still fetches static files when the API is unhealthy", async () => {
    const fn = ok();
    useApiHealthStore.getState().setHealthy(false);
    await expect(
      apiFetch(`${BACKEND_BASE_URL}/static/universe/systems.json`, PointSchema),
    ).resolves.toEqual({ x: 1 });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("fetches while the health result is unknown or healthy", async () => {
    const fn = ok();
    await apiFetch("https://example.test/point", PointSchema);
    useApiHealthStore.getState().setHealthy(true);
    await apiFetch("https://example.test/point", PointSchema);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("gates binary fetches the same way", async () => {
    const fn = vi.fn();
    globalThis.fetch = fn as unknown as typeof fetch;
    useApiHealthStore.getState().setHealthy(false);
    await expect(
      apiFetchBinary("https://example.test/kills"),
    ).rejects.toBeInstanceOf(ApiUnavailableError);
    expect(fn).not.toHaveBeenCalled();
  });
});

describe("apiFetchBinary", () => {
  it("returns the arrayBuffer and headers on an ok response", async () => {
    const bytes = new Uint8Array([1, 2, 3]);
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => bytes.buffer,
      headers: new Headers({ "X-Kills-Fresh-To": "42" }),
    }) as unknown as typeof fetch;
    const res = await apiFetchBinary("https://example.test/kills");
    expect(new Uint8Array(res.buffer)).toEqual(bytes);
    expect(res.headers.get("X-Kills-Fresh-To")).toBe("42");
  });

  it("throws an ApiError carrying the HTTP status on non-ok", async () => {
    const make = () =>
      (globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        arrayBuffer: async () => new ArrayBuffer(0),
        headers: new Headers(),
      }) as unknown as typeof fetch);
    make();
    await expect(
      apiFetchBinary("https://example.test/kills"),
    ).rejects.toBeInstanceOf(ApiError);
    make();
    await expect(
      apiFetchBinary("https://example.test/kills"),
    ).rejects.toMatchObject({ status: 500 });
  });

  it("forwards init (e.g. signal) to fetch", async () => {
    const fn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => new ArrayBuffer(0),
      headers: new Headers(),
    });
    globalThis.fetch = fn as unknown as typeof fetch;
    const controller = new AbortController();
    await apiFetchBinary("https://example.test/kills", {
      signal: controller.signal,
    });
    expect(fn).toHaveBeenCalledWith(
      "https://example.test/kills",
      expect.objectContaining({ signal: controller.signal }),
    );
  });
});

describe("singleFlight", () => {
  it("returns the same in-flight promise for concurrent same-key calls", async () => {
    let calls = 0;
    const fn = () => {
      calls += 1;
      return new Promise<number>((resolve) => setTimeout(() => resolve(42), 0));
    };
    const [a, b] = await Promise.all([
      singleFlight("key-a", fn),
      singleFlight("key-a", fn),
    ]);
    expect(a).toBe(42);
    expect(b).toBe(42);
    expect(calls).toBe(1);
  });

  it("clears the cache when the promise rejects, so a later call retries", async () => {
    let calls = 0;
    const fn = () => {
      calls += 1;
      return Promise.reject(new Error("boom"));
    };
    await expect(singleFlight("key-b", fn)).rejects.toThrow("boom");
    await expect(singleFlight("key-b", fn)).rejects.toThrow("boom");
    expect(calls).toBe(2);
  });

  it("does not share the cache across different keys", async () => {
    let calls = 0;
    const fn = () => {
      calls += 1;
      return Promise.resolve(calls);
    };
    const a = await singleFlight("key-c", fn);
    const b = await singleFlight("key-d", fn);
    expect(a).toBe(1);
    expect(b).toBe(2);
  });
});
