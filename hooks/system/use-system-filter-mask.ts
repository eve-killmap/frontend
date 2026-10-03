import { useEffect } from "react";
import { API_BASE } from "@/lib/net/endpoints";
import { apiFetch } from "@/lib/api/client";
import { SystemKillsFilteredResponseSchema } from "@/lib/schema/system-schema.zod";
import { useFilterConditions } from "@/stores/filter-store";
import { useKillStore } from "@/stores/kill-store";
import { filterToSearch } from "@/lib/filter/serialize";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export function useSystemFilterMask(solarSystemId: number): void {
  const conditions = useFilterConditions();
  const search = useDebouncedValue(filterToSearch(conditions), 300);
  const setAllowedIds = useKillStore((s) => s.setAllowedIds);
  const setFilterMaskLoading = useKillStore((s) => s.setFilterMaskLoading);
  const setFilterMaskError = useKillStore((s) => s.setFilterMaskError);

  useEffect(() => {
    if (search === "") {
      setAllowedIds(null);
      setFilterMaskLoading(false);
      setFilterMaskError(false);
      return;
    }
    const controller = new AbortController();
    setFilterMaskLoading(true);
    setFilterMaskError(false);
    apiFetch(
      `${API_BASE}/systems/${solarSystemId}/kills/filtered${search}`,
      SystemKillsFilteredResponseSchema,
      { signal: controller.signal },
    )
      .then((d) => {
        setAllowedIds(new Set(d.killmail_ids));
        setFilterMaskLoading(false);
      })
      .catch((e) => {
        if ((e as Error).name === "AbortError") return;
        setFilterMaskError(true);
        setFilterMaskLoading(false);
      });
    return () => controller.abort();
  }, [
    solarSystemId,
    search,
    setAllowedIds,
    setFilterMaskLoading,
    setFilterMaskError,
  ]);
}
