import { Panel, PanelHeader } from "@/components/common/panel";
import { FilterBuilder } from "@/components/filter/filter-builder";
import { FILTER_ATTRIBUTES } from "@/components/filter/filter-attributes";
import { useFilterStore } from "@/stores/filter-store";
import { useMapStore } from "@/stores/map/map-store";
import { useActivityData } from "@/hooks/map/use-activity-data";
import { Loader2 } from "lucide-react";

export function MapFilterPanel() {
  const conditions = useFilterStore((s) => s.conditions);
  const setConditions = useFilterStore((s) => s.setConditions);
  const colorMode = useMapStore((s) => s.colorMode);
  const { lookup, filterActive, loading } = useActivityData(
    colorMode === "activity",
  );

  return (
    <Panel className="shrink-0">
      <PanelHeader>
        <div className="flex items-center gap-2">
          {loading && (
            <Loader2 className="size-3.5 animate-spin text-fg-subtle" />
          )}
          <span className="text-2xs text-fg-muted tabular-nums">
            {filterActive
              ? lookup
                ? `${lookup.total.toLocaleString()} match`
                : "…"
              : "–"}
          </span>
        </div>
        {conditions.length > 0 && (
          <button
            onClick={() => setConditions([])}
            className="text-2xs text-fg-subtle hover:text-fg-secondary cursor-pointer"
          >
            Clear
          </button>
        )}
      </PanelHeader>
      <div className="p-2 max-h-[45vh] overflow-y-auto">
        <FilterBuilder
          available={FILTER_ATTRIBUTES}
          value={conditions}
          onChange={setConditions}
        />
      </div>
    </Panel>
  );
}
