import { useEffect, useRef } from "react";
import { useKillStore } from "@/stores/kill-store";
import {
  getCachedKills,
  setCachedKills,
  mergeKillsDedup,
  parseFreshTo,
} from "@/lib/kill/kill-cache";
import { decodeKillsBinary } from "@/lib/kill/kill-binary-decoder";
import { API_BASE } from "@/lib/net/endpoints";
import { apiFetchBinary } from "@/lib/api/client";

export function useKills(solarSystemId: number) {
  const setData = useKillStore((s) => s.setData);
  const setLoading = useKillStore((s) => s.setLoading);
  const reset = useKillStore((s) => s.reset);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;

    async function fetchKills() {
      setLoading(true);

      try {
        const cached = await getCachedKills(solarSystemId);

        if (cached && !controller.signal.aborted) setData(cached.data);

        const url = new URL(`${API_BASE}/systems/${solarSystemId}/kills`);
        if (cached) url.searchParams.set("since", String(cached.freshTo));

        const { buffer, headers } = await apiFetchBinary(url.toString(), {
          signal: controller.signal,
        });

        const freshTo = parseFreshTo(headers.get("X-Kills-Fresh-To"));

        const incoming = decodeKillsBinary(buffer);
        const merged = cached
          ? mergeKillsDedup(cached.data, incoming)
          : incoming;
        if (!controller.signal.aborted) setData(merged);
        if (freshTo !== null)
          await setCachedKills(solarSystemId, merged, freshTo);
      } catch {
        // ignore
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    fetchKills();

    return () => {
      controller.abort();
      reset();
    };
  }, [solarSystemId, setData, setLoading, reset]);
}
