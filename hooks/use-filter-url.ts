import { useEffect } from "react";
import { useFilterStore } from "@/stores/filter-store";
import { parseFilterParams } from "@/lib/filter/parse";
import { stripFilterParams } from "@/lib/filter/url";
import { buildConditionsFromParsed } from "@/lib/filter/rehydrate";
import { resolveNames, UniverseName } from "@/lib/api/universe-names";
import { warDetails } from "@/lib/api/wars";
import {
  warLabel,
  warDateRange,
  warParticipantIds,
} from "@/lib/filter/war-label";
import { WarSearchResult } from "@/lib/schema/war-schema";
import { FilterValue } from "@/lib/filter/types";

export function useFilterUrl(): void {
  const setConditions = useFilterStore((s) => s.setConditions);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("f")) return;
    const parsed = parseFilterParams(params);
    const storeEmpty = useFilterStore.getState().conditions.length === 0;
    if (!storeEmpty && parsed.length > 0) return;
    const cleanedSearch = stripFilterParams(window.location.search);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${cleanedSearch}${window.location.hash}`,
    );
    if (!storeEmpty || parsed.length === 0) return;

    let canceled = false;
    const nameIds = parsed
      .filter((p) => p.attribute !== "war")
      .flatMap((p) => p.ids);
    const warIds = parsed
      .filter((p) => p.attribute === "war" && !p.warAny)
      .flatMap((p) => p.ids);
    (async () => {
      try {
        const wars = await warDetails(warIds).catch(
          () => [] as WarSearchResult[],
        );
        if (canceled) return;
        const allIds = [...nameIds, ...wars.flatMap(warParticipantIds)];
        const names: Record<number, UniverseName> = allIds.length
          ? await resolveNames(allIds).catch(() => ({}))
          : {};
        if (canceled) return;
        const warValuesById = new Map<number, FilterValue>(
          wars.map((w) => [
            w.war_id,
            { id: w.war_id, name: warLabel(w, names), detail: warDateRange(w) },
          ]),
        );
        const built = buildConditionsFromParsed(parsed, names, warValuesById);
        if (built.length) setConditions(built);
      } catch {
        // ignore
      }
    })();
    return () => {
      canceled = true;
    };
  }, [setConditions]);
}
