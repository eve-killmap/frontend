import { describe, it, expect, vi, afterEach } from "vitest";
import { checkApiHealth } from "@/lib/api/health";

function mockFetch(res: Partial<Response> | Error) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      if (res instanceof Error) throw res;
      return res as Response;
    }),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("checkApiHealth", () => {
  it("returns true when the API responds with status ok", async () => {
    mockFetch({ ok: true, status: 200, json: async () => ({ status: "ok" }) });
    expect(await checkApiHealth()).toBe(true);
  });

  it("returns false when the status field is not ok", async () => {
    mockFetch({
      ok: true,
      status: 200,
      json: async () => ({ status: "degraded" }),
    });
    expect(await checkApiHealth()).toBe(false);
  });

  it("returns false on a non-ok HTTP response", async () => {
    mockFetch({ ok: false, status: 503, json: async () => ({}) });
    expect(await checkApiHealth()).toBe(false);
  });

  it("returns false when the request throws (unreachable)", async () => {
    mockFetch(new TypeError("Failed to fetch"));
    expect(await checkApiHealth()).toBe(false);
  });

  it("returns false on an unexpected body shape", async () => {
    mockFetch({ ok: true, status: 200, json: async () => ({ nope: 1 }) });
    expect(await checkApiHealth()).toBe(false);
  });
});

describe("startHealthCheck", () => {
  it("records the result on the api-health store and runs once", async () => {
    vi.resetModules();
    const fetchFn = vi.fn(async () => ({
      ok: false,
      status: 503,
      json: async () => ({}),
    }));
    vi.stubGlobal("fetch", fetchFn);
    const { startHealthCheck } = await import("@/lib/api/health");
    const { useApiHealthStore } = await import("@/stores/api-health-store");
    expect(useApiHealthStore.getState().healthy).toBeNull();
    const first = startHealthCheck();
    const second = startHealthCheck();
    expect(second).toBe(first);
    expect(await first).toBe(false);
    expect(useApiHealthStore.getState().healthy).toBe(false);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});
