import { useEffect, useRef, useState } from "react";
import { API_BASE } from "@/lib/net/endpoints";
import { apiFetch, isWarmingUp } from "@/lib/api/client";
import { SystemActivityResponse } from "@/lib/schema/map-schema";
import { GlobalKillsSchema } from "@/lib/schema/map-schema.zod";
import {
  systemActivityPath,
  SYSTEM_ACTIVITY_BINS,
} from "@/lib/map/system-kills-query";
import { createDwellScheduler, DwellScheduler } from "@/lib/ui/dwell";
import { createTtlCache } from "@/lib/api/ttl-cache";

export interface SystemActivityState {
  counts: number[] | null;
  computedAt: number | null;
  loading: boolean;
  error: boolean;
}

export const DWELL_MS = 150;
const TTL_MS = 60_000;
const CACHE_CAP = 64;
const WARMING_RETRY_MS = 30_000;
const WARMING_RETRIES = 3;

const cache = createTtlCache<number, SystemActivityResponse>({
  ttlMs: TTL_MS,
  cap: CACHE_CAP,
  load: (solarSystemID, signal) =>
    apiFetch(
      `${API_BASE}${systemActivityPath(solarSystemID, SYSTEM_ACTIVITY_BINS)}`,
      GlobalKillsSchema,
      signal ? { signal } : undefined,
    ),
});

export function fetchSystemActivity(
  solarSystemID: number,
  signal?: AbortSignal,
): Promise<SystemActivityResponse> {
  return cache.get(solarSystemID, signal);
}

export function peekSystemActivity(
  solarSystemID: number,
): SystemActivityResponse | null {
  return cache.peek(solarSystemID);
}

export function resetSystemActivityCache(): void {
  cache.clear();
}

const IDLE: SystemActivityState = {
  counts: null,
  computedAt: null,
  loading: false,
  error: false,
};
const LOADING: SystemActivityState = { ...IDLE, loading: true };
const FAILED: SystemActivityState = { ...IDLE, error: true };

function settled(d: SystemActivityResponse): SystemActivityState {
  return {
    counts: d.counts,
    computedAt: d.computed_at ?? null,
    loading: false,
    error: false,
  };
}

function initialState(solarSystemID: number | null): SystemActivityState {
  if (solarSystemID === null) return IDLE;
  const hit = peekSystemActivity(solarSystemID);
  return hit ? settled(hit) : LOADING;
}

export function useSystemActivity(
  solarSystemID: number | null,
): SystemActivityState {
  const [state, setState] = useState<SystemActivityState>(() =>
    initialState(solarSystemID),
  );
  const schedulerRef = useRef<DwellScheduler | null>(null);
  if (schedulerRef.current === null)
    schedulerRef.current = createDwellScheduler(DWELL_MS);

  useEffect(() => {
    const scheduler = schedulerRef.current;
    if (!scheduler) return;
    return () => scheduler.dispose();
  }, []);

  useEffect(() => {
    const scheduler = schedulerRef.current;
    if (!scheduler) return;
    const next = initialState(solarSystemID);
    setState(next);
    if (solarSystemID === null || !next.loading) {
      scheduler.set(null, () => undefined);
      return;
    }
    scheduler.set(solarSystemID, (id, signal) => {
      let attempts = 0;
      let retry: ReturnType<typeof setTimeout> | undefined;
      signal.addEventListener("abort", () => clearTimeout(retry), {
        once: true,
      });
      const load = () => {
        attempts++;
        fetchSystemActivity(id, signal)
          .then((d) => {
            if (!signal.aborted) setState(settled(d));
          })
          .catch((e: unknown) => {
            if (signal.aborted) return;
            if (isWarmingUp(e) && attempts <= WARMING_RETRIES) {
              retry = setTimeout(load, WARMING_RETRY_MS);
              return;
            }
            setState(FAILED);
          });
      };
      load();
    });
  }, [solarSystemID]);

  return state;
}
