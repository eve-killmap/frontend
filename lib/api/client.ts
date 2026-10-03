import { z } from "zod";
import { BACKEND_BASE_URL } from "@/lib/net/endpoints";
import { useApiHealthStore } from "@/stores/api-health-store";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ApiUnavailableError extends ApiError {
  constructor() {
    super("API unavailable", 0);
    this.name = "ApiUnavailableError";
  }
}

const STATIC_PREFIX = `${BACKEND_BASE_URL}/static/`;

function assertApiAvailable(url: string): void {
  if (url.startsWith(STATIC_PREFIX)) return;
  if (useApiHealthStore.getState().healthy === false)
    throw new ApiUnavailableError();
}

export function isWarmingUp(e: unknown): boolean {
  return e instanceof ApiError && e.status === 503;
}

let apiGate: Promise<unknown> | null = null;

export function gateApiCalls(promise: Promise<unknown>): void {
  apiGate = promise;
}

async function awaitGate(): Promise<void> {
  if (!apiGate) return;
  try {
    await apiGate;
  } catch {
    // ignore
  }
}

export async function apiFetch<T>(
  url: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  await awaitGate();
  assertApiAvailable(url);
  const res = await fetch(url, init);
  if (!res.ok)
    throw new ApiError(`Request failed (HTTP ${res.status})`, res.status);
  return schema.parse(await res.json());
}

export async function apiFetchBinary(
  url: string,
  init?: RequestInit,
): Promise<{ buffer: ArrayBuffer; headers: Headers }> {
  await awaitGate();
  assertApiAvailable(url);
  const res = await fetch(url, init);
  if (!res.ok)
    throw new ApiError(`Request failed (HTTP ${res.status})`, res.status);
  return { buffer: await res.arrayBuffer(), headers: res.headers };
}

const inFlight = new Map<string, Promise<unknown>>();

export function singleFlight<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const cached = inFlight.get(key);
  if (cached) return cached as Promise<T>;

  const promise = fn().catch((e: unknown) => {
    inFlight.delete(key);
    throw e;
  });
  inFlight.set(key, promise);
  return promise;
}
