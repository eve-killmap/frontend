import { API_BASE } from "@/lib/net/endpoints";
import {
  SovereigntyResponse,
  SovereigntyResponseSchema,
} from "@/lib/schema/sov-schema";
import { apiFetch, ApiError } from "@/lib/api/client";
import { createTtlCache } from "@/lib/api/ttl-cache";

export type { SovereigntyResponse };

const TTL_MS = 15 * 60 * 1000;

export function sovereigntyUrl(): string {
  return `${API_BASE}/universe/sov`;
}

function fetchSovereigntyOrThrow(
  signal?: AbortSignal,
): Promise<SovereigntyResponse> {
  return apiFetch(sovereigntyUrl(), SovereigntyResponseSchema, { signal });
}

function nullOn503(e: unknown): null {
  if (e instanceof ApiError && e.status === 503) return null;
  throw e;
}

export async function fetchSovereignty(
  signal?: AbortSignal,
): Promise<SovereigntyResponse | null> {
  return fetchSovereigntyOrThrow(signal).catch(nullOn503);
}

const KEY = "sovereignty";
const cache = createTtlCache<string, SovereigntyResponse>({
  ttlMs: TTL_MS,
  load: () => fetchSovereigntyOrThrow(),
});

export function fetchSovereigntyCached(): Promise<SovereigntyResponse | null> {
  return cache.get(KEY).catch(nullOn503);
}
