import React, { useState, useMemo, useCallback } from "react";
import { Search } from "lucide-react";
import { SystemData } from "@/lib/schema/system-schema";
import { useSystemSettingsStore } from "@/stores/system/system-settings-store";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getLabel,
  sortObjectIDs,
} from "@/stores/system/system-object-name-store";
import { formatDistance } from "@/lib/formatting/format-distance";
import { Label } from "@/components/ui/label";

const MIN_RANGE = 100_000;

function rangeToSlider(meters: number, maxMeters: number): number {
  return (100 * Math.log(meters / MIN_RANGE)) / Math.log(maxMeters / MIN_RANGE);
}

function sliderToRange(v: number, maxMeters: number): number {
  return Math.round(MIN_RANGE * (maxMeters / MIN_RANGE) ** (v / 100));
}

function SelectRow({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`w-full flex items-center gap-1.5 py-0.5 px-1 text-left cursor-pointer ${
        selected ? "bg-panel border-l-2 border-capsuleer/40" : "hover:bg-panel"
      }`}
      onClick={onSelect}
    >
      <div
        className={`size-3 rounded-full border shrink-0 flex items-center justify-center ${selected ? "border-capsuleer/60" : "border-foreground/25"}`}
      >
        {selected && <div className="size-1.5 rounded-full bg-primary" />}
      </div>
      <span className="text-xs text-fg-secondary">{label}</span>
    </button>
  );
}

export const RangeSelect = React.memo(function RangeSelect({
  systemData,
}: {
  systemData: SystemData;
}) {
  const rangeSelected = useSystemSettingsStore((s) => s.rangeSelected);
  const setRangeSelected = useSystemSettingsStore((s) => s.setRangeSelected);
  const range = useSystemSettingsStore((s) => s.range);
  const setRange = useSystemSettingsStore((s) => s.setRange);

  const [search, setSearch] = useState("");

  const maxRange = systemData.farthestObject;

  const allIds = useMemo(() => {
    const ids: number[] = [];
    if (systemData.star) ids.push(systemData.star.starID);
    if (systemData.stations) {
      for (const station of systemData.stations) ids.push(station.stationID);
    }
    for (const planet of systemData.planets ?? []) {
      ids.push(planet.planetID);
      for (const moon of planet.moons ?? []) {
        ids.push(moon.moonID);
        for (const s of moon.stations ?? []) ids.push(s.stationID);
      }
      for (const b of planet.asteroidBelts ?? []) ids.push(b.asteroidBeltID);
      for (const s of planet.stations ?? []) ids.push(s.stationID);
    }
    for (const sg of systemData.stargates ?? []) ids.push(sg.stargateID);
    for (const sg of systemData.disruptedStargates ?? [])
      ids.push(sg.stargateID);
    return sortObjectIDs(ids);
  }, [systemData]);

  const selectedId = rangeSelected;

  const selectObject = useCallback(
    (id: number) => {
      setRangeSelected(id === rangeSelected ? null : id);
    },
    [rangeSelected, setRangeSelected],
  );

  const clearSelection = useCallback(() => {
    setRangeSelected(null);
  }, [setRangeSelected]);

  const handleSliderChange = useCallback(
    ([v]: number[]) => {
      setRange(v >= 99.95 ? null : sliderToRange(v, maxRange));
    },
    [setRange, maxRange],
  );

  const q = search.trim().toLowerCase();
  const displayIds = useMemo(
    () =>
      q
        ? allIds.filter((id) => getLabel(id).toLowerCase().includes(q))
        : allIds,
    [allIds, q],
  );

  const sliderValue = range === null ? 100 : rangeToSlider(range, maxRange);
  const rangeLabel = selectedId
    ? range === null
      ? `${formatDistance(maxRange)} (max)`
      : formatDistance(range)
    : "";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-2xs text-fg-muted truncate select-none">
          {selectedId ? `Selected ${getLabel(selectedId)}` : "Nothing selected"}
        </span>
        {selectedId && (
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-2xs text-fg-muted cursor-pointer"
            onClick={clearSelection}
          >
            Clear
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-fg-subtle" />
        <Input
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-7 text-xs pl-6 pr-2 border-border font-mono"
        />
      </div>

      <ScrollArea className="h-56 border border-border bg-elevated-subtle">
        <div className="p-1">
          {displayIds.map((id) => (
            <SelectRow
              key={id}
              label={getLabel(id)}
              selected={id === selectedId}
              onSelect={() => selectObject(id)}
            />
          ))}
          {displayIds.length === 0 && (
            <p className="text-xs text-fg-subtle text-center py-4">
              No results
            </p>
          )}
        </div>
      </ScrollArea>
      <p className="text-2xs text-fg-subtle italic leading-tight">
        Select an object around which to show kills. Kills within the selected
        range of the object will be rendered.
      </p>

      <div
        className={`space-y-1.5 ${!selectedId ? "opacity-40 pointer-events-none" : ""}`}
        role="group"
        aria-labelledby="range-value-label"
      >
        <div className="flex items-center justify-between">
          <Label id="range-value-label" className="text-xs text-fg-muted">
            Range
          </Label>
          <span className="text-2xs text-fg-muted select-none">
            {rangeLabel}
          </span>
        </div>
        <Slider
          min={0}
          max={100}
          step={0.1}
          value={[sliderValue]}
          onValueChange={handleSliderChange}
          disabled={!selectedId}
          className="cursor-pointer"
        />
      </div>
    </div>
  );
});
