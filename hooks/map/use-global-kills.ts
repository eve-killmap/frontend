import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/net/endpoints";
import { apiFetch } from "@/lib/api/client";
import { createTtlCache } from "@/lib/api/ttl-cache";
import { GlobalKillsResponse } from "@/lib/schema/map-schema";
import { GlobalKillsSchema } from "@/lib/schema/map-schema.zod";
import { FilterCondition } from "@/lib/filter/types";
import { buildGlobalKillsPath } from "@/lib/map/system-kills-query";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export interface GlobalKillsState {
  counts: number[] | null;
  computedAt: number | null;
  loading: boolean;
  error: boolean;
}

const GLOBAL_BINS = 300;
const CACHE_CAP = 30;
const TTL_MS = 60_000;

const cache = createTtlCache<string, GlobalKillsResponse>({
  ttlMs: TTL_MS,
  cap: CACHE_CAP,
  load: (path) => apiFetch(`${API_BASE}${path}`, GlobalKillsSchema),
});

function fetchGlobalKills(path: string): Promise<GlobalKillsResponse> {
  return cache.get(path);
}

export function useGlobalKills(
  mapType: string,
  conditions: FilterCondition[],
  enabled: boolean,
): GlobalKillsState {
  const path = buildGlobalKillsPath(mapType, conditions, GLOBAL_BINS);
  const debouncedPath = useDebouncedValue(path, 400);
  const [counts, setCounts] = useState<number[] | null>(null);
  const [computedAt, setComputedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(false);
    fetchGlobalKills(debouncedPath)
      .then((d) => {
        if (active) {
          setCounts(d.counts);
          setComputedAt(d.computed_at ?? null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [debouncedPath, enabled]);

  return { counts, computedAt, loading, error };
}
