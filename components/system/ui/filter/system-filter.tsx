import React, { useMemo } from "react";
import { Filter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { FilterBuilder } from "@/components/filter/filter-builder";
import { FILTER_ATTRIBUTES } from "@/components/filter/filter-attributes";
import { useFilterStore } from "@/stores/filter-store";
import { useKillStore } from "@/stores/kill-store";
import { SystemData, TypeData } from "@/lib/schema/system-schema";
import { ShipTypeSelect } from "@/components/system/ui/filter/ship-type-select";
import { RangeSelect } from "@/components/system/ui/filter/range-select";
import { useDismissablePanel } from "@/hooks/use-dismissable-panel";
import { usePruneEmptyConditionsOnClose } from "@/hooks/use-prune-empty-conditions-on-close";

interface SystemFilterProps {
  open: boolean;
  onToggle: () => void;
  systemData: SystemData;
  typeData: TypeData;
}

export const SystemFilter = React.memo(function SystemFilter({
  open,
  onToggle,
  systemData,
  typeData,
}: SystemFilterProps) {
  const conditions = useFilterStore((s) => s.conditions);
  const setConditions = useFilterStore((s) => s.setConditions);
  usePruneEmptyConditionsOnClose(open);
  const data = useKillStore((s) => s.data);
  const allowedIds = useKillStore((s) => s.allowedIds);
  const loading = useKillStore((s) => s.filterMaskLoading);
  const error = useKillStore((s) => s.filterMaskError);
  const matchCount =
    conditions.length > 0 && allowedIds ? allowedIds.size : null;

  const presentTypes = useMemo(
    () => (data && data.count > 0 ? new Set(data.ship_types) : null),
    [data],
  );

  const ref = useDismissablePanel(open, onToggle);

  return (
    <div ref={ref} className="relative pointer-events-auto">
      <Button
        variant="outline"
        size="lg"
        onClick={onToggle}
        aria-expanded={open}
        className="btn-glass"
        title="Filter"
      >
        <Filter />
        <span className="btn-label">Filter</span>
        {conditions.length > 0 && (
          <span className="ml-0.5 rounded bg-capsuleer/25 px-1.5 text-2xs tabular-nums">
            {conditions.length}
          </span>
        )}
      </Button>
      <Tabs
        defaultValue="conditions"
        className={`absolute top-full gap-1 right-0 w-84 mt-2 max-w-[calc(100vw-2rem)] ${open ? "" : "hidden"}`}
      >
        <TabsList className="bg-panel border border-border h-10 w-full">
          {[
            { value: "conditions", label: "Conditions" },
            { value: "view", label: "View filters" },
          ].map(({ value, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="px-5 py-1.5 text-sm data-[state=active]:bg-panel-elevated data-[state=active]:text-capsuleer data-[state=active]:shadow-none text-fg-muted cursor-pointer"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="bg-panel border border-border">
          <TabsContent value="conditions" className="m-0">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <div className="flex items-center gap-2">
                {loading && (
                  <Loader2 className="size-3.5 animate-spin text-fg-subtle" />
                )}
                <span className="text-2xs text-fg-muted tabular-nums">
                  {error
                    ? "error"
                    : matchCount != null
                      ? `${matchCount.toLocaleString()} match`
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
            </div>
            <div className="p-2 max-h-[55vh] overflow-y-auto">
              <FilterBuilder
                available={FILTER_ATTRIBUTES}
                value={conditions}
                onChange={setConditions}
              />
            </div>
          </TabsContent>
          <TabsContent value="view" className="m-0">
            <div className="p-3 space-y-2 max-h-[60vh] overflow-y-auto">
              <div
                className="space-y-1.5"
                role="group"
                aria-labelledby="ship-types-label"
              >
                <Label
                  id="ship-types-label"
                  className="text-sm text-fg-secondary"
                >
                  Ship Types
                </Label>
                <ShipTypeSelect
                  typeData={typeData}
                  presentTypes={presentTypes}
                />
              </div>
              <div
                className="space-y-1.5"
                role="group"
                aria-labelledby="range-filter-label"
              >
                <Label
                  id="range-filter-label"
                  className="text-sm text-fg-secondary"
                >
                  Range Filter
                </Label>
                <RangeSelect systemData={systemData} />
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
});
