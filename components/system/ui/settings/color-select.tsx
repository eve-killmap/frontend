import React, { useState, useMemo, useCallback } from "react";
import { ChevronRight, Search, X } from "lucide-react";
import { TypeData } from "@/lib/schema/system-schema";
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
  DEFAULT_KILL_COLOR,
  DEFAULT_CLUSTER_COLOR,
} from "@/stores/system/system-settings-store";
import { buildTypeGroups, filterGroups } from "@/lib/system/type-groups";
import { KillColorPicker } from "./kill-color-picker";

function ColorSwatch({
  color,
  inherited,
  enabled,
  onChange,
  onReset,
}: {
  color: string;
  inherited: boolean;
  enabled: boolean;
  onChange: (color: string) => void;
  onReset: () => void;
}) {
  return (
    <div className="relative shrink-0 flex items-center group/swatch">
      <KillColorPicker color={color} onChange={onChange} enabled={enabled}>
        <button
          className="size-3.5 rounded-full cursor-pointer"
          style={{
            backgroundColor: color,
            outline: inherited
              ? "1.5px dashed rgba(255,255,255,0.25)"
              : "1.5px solid rgba(255,255,255,0.35)",
            outlineOffset: "1px",
          }}
          onClick={(e) => e.stopPropagation()}
          title={
            inherited
              ? "Inherited (click to set custom color)"
              : "Click to change color"
          }
        />
      </KillColorPicker>
      {!inherited && (
        <button
          className="absolute -top-1 -right-1.5 opacity-0 group-hover/swatch:opacity-100 transition-opacity bg-panel rounded-full cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onReset();
          }}
          title="Reset to inherited"
        >
          <X className="size-2 text-fg-secondary" />
        </button>
      )}
    </div>
  );
}

interface ColorSelectProps {
  typeData: TypeData;
  presentTypes: Set<number> | null;
  enabled: boolean;
}

export const ColorSelect = React.memo(function ColorSelect({
  typeData,
  presentTypes,
  enabled,
}: ColorSelectProps) {
  const defaultColor = useSystemSettingsStore((s) => s.defaultColor);
  const clusterColor = useSystemSettingsStore((s) => s.clusterColor);
  const groupColors = useSystemSettingsStore((s) => s.groupColors);
  const typeColors = useSystemSettingsStore((s) => s.typeColors);

  const setDefaultColor = useSystemSettingsStore((s) => s.setDefaultColor);
  const setClusterColor = useSystemSettingsStore((s) => s.setClusterColor);
  const setGroupColor = useSystemSettingsStore((s) => s.setGroupColor);
  const setTypeColor = useSystemSettingsStore((s) => s.setTypeColor);

  const [openGroups, setOpenGroups] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");

  const { groups } = useMemo(
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

  const filteredGroups = useMemo(
    () => filterGroups(groups, search),
    [groups, search],
  );

  const isSearching = search.trim().length > 0;

  const resetAll = useCallback(() => {
    for (const g of groups) {
      setGroupColor(g.groupId, null);
      for (const t of g.types) setTypeColor(t.typeId, null);
    }
  }, [groups, setGroupColor, setTypeColor]);

  const hasAnyCustom =
    Object.keys(groupColors).length > 0 || Object.keys(typeColors).length > 0;

  return (
    <div className="space-y-1.5">
      <SingleColorSelect
        color={defaultColor}
        enabled={enabled}
        showReset={defaultColor !== DEFAULT_KILL_COLOR || hasAnyCustom}
        setColor={setDefaultColor}
        resetColor={() => {
          setDefaultColor(DEFAULT_KILL_COLOR);
          resetAll();
        }}
      >
        <span className="text-2xs text-fg-muted select-none">Default</span>
      </SingleColorSelect>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-fg-subtle" />
        <Input
          placeholder="Search by name or type ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-7 text-xs pl-6 pr-2 border-border font-mono"
        />
      </div>
      <ScrollArea className="h-48 border border-border bg-elevated-subtle">
        <div className="p-1">
          {filteredGroups.map((group) => {
            const groupHasCustom = group.groupId in groupColors;
            const effectiveGroupColor =
              groupColors[group.groupId] ?? defaultColor;
            const isOpen = isSearching || openGroups.has(group.groupId);

            return (
              <Collapsible
                key={group.groupId}
                open={isOpen}
                onOpenChange={() => toggleGroup(group.groupId)}
              >
                <div className="flex items-center gap-1 py-0.5 px-1 hover:bg-panel">
                  <ColorSwatch
                    color={effectiveGroupColor}
                    inherited={!groupHasCustom}
                    enabled={enabled}
                    onChange={(c) => setGroupColor(group.groupId, c)}
                    onReset={() => setGroupColor(group.groupId, null)}
                  />
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center gap-1 flex-1 text-left cursor-pointer">
                      <ChevronRight
                        className={`size-3 text-fg-faint transition-transform ${isOpen ? "rotate-90" : ""}`}
                      />
                      <span className="text-xs text-fg-strong">
                        {group.groupName}
                      </span>
                    </button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                  <div className="ml-5 border-l border-border/50 pl-2">
                    {group.types.map((type) => {
                      const typeHasCustom = type.typeId in typeColors;
                      const effectiveTypeColor =
                        typeColors[type.typeId] ?? effectiveGroupColor;
                      return (
                        <div
                          key={type.typeId}
                          className="flex items-center gap-1.5 py-0.5 px-1 hover:bg-panel"
                        >
                          <ColorSwatch
                            color={effectiveTypeColor}
                            inherited={!typeHasCustom}
                            enabled={enabled}
                            onChange={(c) => setTypeColor(type.typeId, c)}
                            onReset={() => setTypeColor(type.typeId, null)}
                          />
                          <span className="text-xs text-fg-secondary">
                            {type.typeName}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>
      <p className="text-2xs text-fg-subtle italic leading-tight">
        Group colors apply to all types in the group. Type colors override the
        group. Dashed swatches are inherited.
      </p>
      <SingleColorSelect
        color={clusterColor}
        enabled={enabled}
        showReset={clusterColor !== DEFAULT_CLUSTER_COLOR}
        setColor={setClusterColor}
        resetColor={() => setClusterColor(DEFAULT_CLUSTER_COLOR)}
      >
        <span className="text-xs text-fg-muted select-none">Cluster Color</span>
      </SingleColorSelect>
    </div>
  );
});

interface SingleColorSelectProps {
  color: string;
  enabled: boolean;
  showReset: boolean;
  setColor: (color: string) => void;
  resetColor: () => void;
  children: React.ReactNode;
}

function SingleColorSelect({
  color,
  enabled,
  showReset,
  setColor,
  resetColor,
  children,
}: SingleColorSelectProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {children}
        <KillColorPicker color={color} onChange={setColor} enabled={enabled}>
          <button
            className="size-3.5 rounded-full cursor-pointer"
            style={{
              backgroundColor: color,
              outline: "1.5px solid rgba(255,255,255,0.35)",
              outlineOffset: "1px",
            }}
            aria-label="Change color"
          />
        </KillColorPicker>
      </div>
      {showReset && (
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 text-2xs text-fg-muted cursor-pointer"
          onClick={resetColor}
        >
          Reset
        </Button>
      )}
    </div>
  );
}
