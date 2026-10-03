import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/net/endpoints";
import { apiFetch } from "@/lib/api/client";
import { createTtlCache } from "@/lib/api/ttl-cache";
import { SystemKillsResponse } from "@/lib/schema/map-schema";
import { SystemKillsResponseSchema } from "@/lib/schema/map-schema.zod";
import { ActivityLookup } from "@/lib/map/system-colors";
import { FilterCondition } from "@/lib/filter/types";
import type { PersistedTimeRange } from "@/stores/time-range-store";
import { buildSystemKillsQuery } from "@/lib/map/system-kills-query";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export interface SystemKillsState {
  data: SystemKillsResponse | null;
  loading: boolean;
  error: boolean;
}

const CACHE_CAP = 30;
const TTL_MS = 60_000;

const cache = createTtlCache<string, SystemKillsResponse>({
  ttlMs: TTL_MS,
  cap: CACHE_CAP,
  load: (query) =>
    apiFetch(
      `${API_BASE}/stats/system-kills${query}`,
      SystemKillsResponseSchema,
    ),
});

function fetchSystemKills(query: string): Promise<SystemKillsResponse> {
  return cache.get(query);
}

export function useSystemKills(
  conditions: FilterCondition[],
  range: PersistedTimeRange | null,
  enabled: boolean,
): SystemKillsState {
  const query = buildSystemKillsQuery(range, conditions);
  const debouncedQuery = useDebouncedValue(query, 400);
  const [data, setData] = useState<SystemKillsResponse | null>(null);
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
    fetchSystemKills(debouncedQuery)
      .then((d) => {
        if (active) {
          setData(d);
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
  }, [debouncedQuery, enabled]);

  return { data, loading, error };
}

export function buildActivityLookup(
  data: SystemKillsResponse,
  includeIDs?: Set<number> | null,
): ActivityLookup {
  const ids = data.system_ids;
  const kills = data.kills;
  const map = new Map<number, number>();
  let max = 0;
  let total = 0;
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const c = kills[i];
    map.set(id, c);
    if (includeIDs && !includeIDs.has(id)) continue;
    if (c > max) max = c;
    total += c;
  }
  return { countFor: (id) => map.get(id) ?? 0, max, total };
}
