import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/net/endpoints";
import { apiFetch, isWarmingUp } from "@/lib/api/client";
import { SystemJumpCountSchema } from "@/lib/schema/system-schema.zod";
import { isNewEdenSystem } from "@/lib/eve/space";

const WARMING_RETRY_MS = 30_000;
const WARMING_RETRIES = 3;

export function useSystemJumpCount(solarSystemID: number): number | null {
  const [jumps, setJumps] = useState<number | null>(null);

  useEffect(() => {
    setJumps(null);
    if (!isNewEdenSystem(solarSystemID)) return;

    let canceled = false;
    let attempts = 0;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();

    const load = () => {
      attempts++;
      apiFetch(
        `${API_BASE}/systems/${solarSystemID}/jumps`,
        SystemJumpCountSchema,
        { signal: controller.signal },
      )
        .then((d) => {
          if (!canceled) setJumps(d.jumps);
        })
        .catch((e: unknown) => {
          if (!canceled && isWarmingUp(e) && attempts <= WARMING_RETRIES)
            retry = setTimeout(load, WARMING_RETRY_MS);
        });
    };
    load();

    return () => {
      canceled = true;
      controller.abort();
      clearTimeout(retry);
    };
  }, [solarSystemID]);

  return jumps;
}
