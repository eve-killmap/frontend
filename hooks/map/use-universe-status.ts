import { useEffect } from "react";
import { API_BASE } from "@/lib/net/endpoints";
import { apiFetch } from "@/lib/api/client";
import { UniverseStatusSchema } from "@/lib/schema/base-schema";
import { useUniverseStatusStore } from "@/stores/map/universe-status-store";

const POLL_MS = 30_000;

export function useUniverseStatus() {
  const setStatus = useUniverseStatusStore((s) => s.setStatus);
  const setStale = useUniverseStatusStore((s) => s.setStale);

  useEffect(() => {
    let canceled = false;
    const controller = new AbortController();

    const poll = () =>
      apiFetch(`${API_BASE}/universe/status`, UniverseStatusSchema, {
        signal: controller.signal,
      })
        .then((status) => {
          if (!canceled) setStatus(status);
        })
        .catch(() => {
          if (!canceled) setStale(true);
        });

    poll();
    const timer = setInterval(poll, POLL_MS);

    return () => {
      canceled = true;
      controller.abort();
      clearInterval(timer);
    };
  }, [setStatus, setStale]);
}
