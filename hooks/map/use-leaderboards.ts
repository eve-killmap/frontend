import { useCallback, useEffect, useState } from "react";
import { API_BASE } from "@/lib/net/endpoints";
import { apiFetch } from "@/lib/api/client";
import { createTtlCache } from "@/lib/api/ttl-cache";
import { LeaderboardResponse } from "@/lib/schema/map-schema";
import { LeaderboardResponseSchema } from "@/lib/schema/map-schema.zod";
import {
  LeaderboardRole,
  LeaderboardScope,
  LeaderboardWindow,
  leaderboardsPath,
} from "@/lib/map/leaderboards";

export interface LeaderboardsState {
  data: LeaderboardResponse | null;
  loading: boolean;
  error: boolean;
  retry: () => void;
}

const TTL_MS = 15 * 60 * 1000;

function cacheKey(
  timeWindow: LeaderboardWindow,
  role: LeaderboardRole,
  scope: LeaderboardScope,
) {
  return leaderboardsPath(timeWindow, role, scope);
}

const cache = createTtlCache<string, LeaderboardResponse>({
  ttlMs: TTL_MS,
  load: (path) => apiFetch(`${API_BASE}${path}`, LeaderboardResponseSchema),
});

export function fetchLeaderboards(
  timeWindow: LeaderboardWindow,
  role: LeaderboardRole,
  scope: LeaderboardScope,
): Promise<LeaderboardResponse> {
  return cache.get(cacheKey(timeWindow, role, scope));
}

export function peekLeaderboards(
  timeWindow: LeaderboardWindow,
  role: LeaderboardRole,
  scope: LeaderboardScope,
): LeaderboardResponse | null {
  return cache.peek(cacheKey(timeWindow, role, scope));
}

interface KeyedState {
  key: string;
  data: LeaderboardResponse | null;
  loading: boolean;
  error: boolean;
}

function idleState(
  timeWindow: LeaderboardWindow,
  role: LeaderboardRole,
  scope: LeaderboardScope,
): KeyedState {
  return {
    key: cacheKey(timeWindow, role, scope),
    data: peekLeaderboards(timeWindow, role, scope),
    loading: false,
    error: false,
  };
}

export function useLeaderboards(
  timeWindow: LeaderboardWindow,
  role: LeaderboardRole,
  scope: LeaderboardScope,
): LeaderboardsState {
  const key = cacheKey(timeWindow, role, scope);
  const [state, setState] = useState<KeyedState>(() =>
    idleState(timeWindow, role, scope),
  );
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const cached = peekLeaderboards(timeWindow, role, scope);
    if (cached) {
      setState({ key, data: cached, loading: false, error: false });
      return;
    }
    let active = true;
    setState({ key, data: null, loading: true, error: false });
    fetchLeaderboards(timeWindow, role, scope)
      .then((d) => {
        if (active) setState({ key, data: d, loading: false, error: false });
      })
      .catch(() => {
        if (active) setState({ key, data: null, loading: false, error: true });
      });
    return () => {
      active = false;
    };
  }, [timeWindow, role, scope, key, nonce]);

  const retry = useCallback(() => {
    cache.invalidate(cacheKey(timeWindow, role, scope));
    setNonce((n) => n + 1);
  }, [timeWindow, role, scope]);

  const current =
    state.key === key ? state : idleState(timeWindow, role, scope);
  return {
    data: current.data,
    loading: current.loading,
    error: current.error,
    retry,
  };
}
