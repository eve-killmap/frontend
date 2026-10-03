import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/net/endpoints";
import { apiFetch, isWarmingUp } from "@/lib/api/client";
import { createTtlCache } from "@/lib/api/ttl-cache";
import { SystemJumpsResponse } from "@/lib/schema/map-schema";
import { SystemJumpsResponseSchema } from "@/lib/schema/map-schema.zod";
import { ActivityLookup } from "@/lib/map/system-colors";

export interface SystemJumpsState {
  data: SystemJumpsResponse | null;
  loading: boolean;
  error: boolean;
}

const TTL_MS = 15 * 60 * 1000;

const WARMING_RETRY_MS = 30_000;
const WARMING_RETRIES = 3;

const KEY = "system-jumps";
const cache = createTtlCache<string, SystemJumpsResponse>({
  ttlMs: TTL_MS,
  load: () =>
    apiFetch(`${API_BASE}/stats/system-jumps`, SystemJumpsResponseSchema),
});

function fetchSystemJumps(): Promise<SystemJumpsResponse> {
  return cache.get(KEY);
}

export function peekSystemJumps(): SystemJumpsResponse | null {
  return cache.peek(KEY);
}

export function prefetchSystemJumps(): void {
  fetchSystemJumps().catch(() => {});
}

export function useSystemJumps(enabled: boolean): SystemJumpsState {
  const [data, setData] = useState<SystemJumpsResponse | null>(peekSystemJumps);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let active = true;
    let attempts = 0;
    let retry: ReturnType<typeof setTimeout> | undefined;
    setLoading(true);
    setError(false);

    const load = () => {
      attempts++;
      fetchSystemJumps()
        .then((d) => {
          if (!active) return;
          setData(d);
          setLoading(false);
        })
        .catch((e: unknown) => {
          if (!active) return;
          if (isWarmingUp(e) && attempts <= WARMING_RETRIES) {
            retry = setTimeout(load, WARMING_RETRY_MS);
            return;
          }
          setError(true);
          setLoading(false);
        });
    };
    load();

    return () => {
      active = false;
      clearTimeout(retry);
    };
  }, [enabled]);

  const ready = data ?? (enabled ? peekSystemJumps() : null);
  return { data: ready, loading: loading && !ready, error: error && !ready };
}

export function buildJumpsLookup(
  data: SystemJumpsResponse,
  includeIDs?: Set<number> | null,
): ActivityLookup {
  const ids = data.system_ids;
  const counts = data.jumps;
  const map = new Map<number, number>();
  let max = 0;
  let total = 0;
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const c = counts[i];
    map.set(id, c);
    if (includeIDs && !includeIDs.has(id)) continue;
    if (c > max) max = c;
    total += c;
  }
  return { countFor: (id) => map.get(id) ?? 0, max, total };
}
