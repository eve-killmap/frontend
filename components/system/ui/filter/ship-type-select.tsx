import React, { useState, useMemo, useCallback } from "react";
import { ChevronRight, Search } from "lucide-react";
import { TypeData } from "@/lib/schema/system-schema";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  useSystemSettingsStore,
  EXCLUDED_TYPE_IDS,
} from "@/stores/system/system-settings-store";
import {
  buildTypeGroups,
  filterGroups,
  GroupEntry,
} from "@/lib/system/type-groups";

interface ShipTypeSelectProps {
  typeData: TypeData;
  presentTypes: Set<number> | null;
}

function SoloButton({
  onSolo,
  small,
}: {
  onSolo: () => void;
  small?: boolean;
}) {
  return (
    <button
      className={`shrink-0 ${small ? "size-3.5" : "size-4"} inline-flex items-center justify-center font-mono text-3xs text-fg-subtle hover:text-capsuleer cursor-pointer border border-border hover:bg-panel-elevated hover:border-capsuleer/50`}
      title="Solo this item"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onSolo();
      }}
    >
      S
    </button>
  );
}

export const ShipTypeSelect = React.memo(function ShipTypeSelect({
  typeData,
  presentTypes,
}: ShipTypeSelectProps) {
  const [openGroups, setOpenGroups] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");

  const storeShipTypes = useSystemSettingsStore((s) => s.shipTypes);
  const shipTypes = useMemo(
    () => storeShipTypes ?? new Set<number>(),
    [storeShipTypes],
  );
  const setShipTypes = useSystemSettingsStore((s) => s.setShipTypes);
  const setDeselectedTypeIds = useSystemSettingsStore(
    (s) => s.setDeselectedTypeIds,
  );
  const setShowExcludedTypeIds = useSystemSettingsStore(
    (s) => s.setShowExcludedTypeIds,
  );

  const handleShipTypeChange = useCallback(
    (selected: Set<number>) => {
      setShipTypes(selected);
      if (presentTypes) {
        const newDeselectedTypeIds = [...presentTypes].filter(
          (id) => !EXCLUDED_TYPE_IDS.includes(id) && !selected.has(id),
        );
        const newShowExcludedTypeIds = EXCLUDED_TYPE_IDS.filter(
          (id) => presentTypes.has(id) && selected.has(id),
        );
        setDeselectedTypeIds(newDeselectedTypeIds);
        setShowExcludedTypeIds(newShowExcludedTypeIds);
      }
    },
    [setShipTypes, setDeselectedTypeIds, setShowExcludedTypeIds, presentTypes],
  );

  const { groups, allTypeIds } = useMemo(
    () => buildTypeGroups(typeData, presentTypes),
    [typeData, presentTypes],
  );

  const toggleGroup = useCallback((groupId: number) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  const toggleType = useCallback(
    (typeId: number) => {
      const next = new Set(shipTypes);
      if (next.has(typeId)) next.delete(typeId);
      else next.add(typeId);
      handleShipTypeChange(next);
    },
    [shipTypes, handleShipTypeChange],
  );

  const toggleGroupAll = useCallback(
    (group: GroupEntry) => {
      const groupTypeIds = group.types.map((t) => t.typeId);
      const allSelected = groupTypeIds.every((id) => shipTypes.has(id));
      const next = new Set(shipTypes);
      if (allSelected) {
        for (const id of groupTypeIds) next.delete(id);
      } else {
        for (const id of groupTypeIds) next.add(id);
      }
      handleShipTypeChange(next);
    },
    [shipTypes, handleShipTypeChange],
  );

  const soloGroup = useCallback(
    (group: GroupEntry) => {
      handleShipTypeChange(new Set(group.types.map((t) => t.typeId)));
    },
    [handleShipTypeChange],
  );

  const soloType = useCallback(
    (typeId: number) => {
      handleShipTypeChange(new Set([typeId]));
    },
    [handleShipTypeChange],
  );

  const selectAll = useCallback(() => {
    handleShipTypeChange(new Set(allTypeIds));
  }, [allTypeIds, handleShipTypeChange]);

  const deselectAll = useCallback(() => {
    handleShipTypeChange(new Set());
  }, [handleShipTypeChange]);

  const selectedCount = useMemo(
    () => [...allTypeIds].filter((id) => shipTypes.has(id)).length,
    [allTypeIds, shipTypes],
  );
  const totalCount = allTypeIds.length;

  const filteredGroups = useMemo(
    () => filterGroups(groups, search),
    [groups, search],
  );

  const isSearching = search.trim().length > 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-2xs text-fg-muted select-none">
          {selectedCount}/{totalCount} selected
        </span>
        <div className="flex gap-1">
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-2xs text-fg-muted cursor-pointer"
            onClick={selectAll}
            disabled={selectedCount === totalCount}
          >
            All
          </Button>
          <span className="text-2xs text-fg-subtle select-none">/</span>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-2xs text-fg-muted cursor-pointer"
            onClick={deselectAll}
            disabled={selectedCount === 0}
          >
            None
          </Button>
        </div>
      </div>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-fg-subtle" />
        <Input
          placeholder="Search by name or type ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-7 text-xs pl-6 pr-2 border-border font-mono"
        />
      </div>
      <ScrollArea className="h-48 border border-border bg-elevated-subtle select-none">
        <div className="p-1">
          {filteredGroups.map((group) => {
            const groupTypeIds = group.types.map((t) => t.typeId);
            const checkedCount = groupTypeIds.filter((id) =>
              shipTypes.has(id),
            ).length;
            const allChecked = checkedCount === groupTypeIds.length;
            const someChecked = checkedCount > 0 && !allChecked;
            const isOpen = isSearching || openGroups.has(group.groupId);

            return (
              <Collapsible
                key={group.groupId}
                open={isOpen}
                onOpenChange={() => toggleGroup(group.groupId)}
              >
                <div className="flex items-center gap-1 py-0.5 px-1 hover:bg-panel">
                  <Checkbox
                    checked={someChecked ? "indeterminate" : allChecked}
                    onCheckedChange={() => toggleGroupAll(group)}
                    className="size-3.5 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <SoloButton onSolo={() => soloGroup(group)} />
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center gap-1 flex-1 text-left cursor-pointer">
                      <ChevronRight
                        className={`size-3 text-fg-faint transition-transform ${isOpen ? "rotate-90" : ""}`}
                      />
                      <span className="text-xs text-fg-secondary">
                        {group.groupName}
                      </span>
                      <span className="text-2xs text-fg-subtle ml-auto">
                        {checkedCount}/{groupTypeIds.length}
                      </span>
                    </button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                  <div className="ml-5 border-l border-border/50 pl-2">
                    {group.types.map((type) => (
                      <label
                        key={type.typeId}
                        className="flex items-center gap-1 py-0.5 px-1 hover:bg-panel cursor-pointer"
                      >
                        <Checkbox
                          checked={shipTypes.has(type.typeId)}
                          onCheckedChange={() => toggleType(type.typeId)}
                          className="size-3 cursor-pointer"
                        />
                        <SoloButton
                          onSolo={() => soloType(type.typeId)}
                          small
                        />
                        <span className="text-xs text-fg-secondary">
                          {type.typeName}
                        </span>
                      </label>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>
      <p className="text-2xs text-fg-subtle italic leading-tight">
        Capsules are hidden by default. Only ship types that have been killed in
        this system are shown.
      </p>
    </div>
  );
});
