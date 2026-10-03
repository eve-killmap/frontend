import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LineType, LabelType, useMapStore } from "@/stores/map/map-store";
import {
  colorModeAllowedOn,
  overlayAllowedOn,
  COLOR_MODE_OPTIONS,
  OVERLAY_MODE_OPTIONS,
} from "@/lib/map/system-colors";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useSovStore } from "@/stores/map/sov-store";
import { useDismissablePanel } from "@/hooks/use-dismissable-panel";
import { useGlobalSettingsStore } from "@/stores/global-settings-store";
import { useEffect } from "react";
import { prefetchSystemJumps } from "@/hooks/map/use-system-jumps";

export function MapSettings({
  open,
  onToggle,
  mapType,
}: {
  open: boolean;
  onToggle: () => void;
  mapType: string;
}) {
  const ref = useDismissablePanel(open, onToggle);
  return (
    <div ref={ref} className="relative">
      <Button
        variant="outline"
        size="lg"
        onClick={onToggle}
        aria-expanded={open}
        className="btn-glass"
        title="Settings"
      >
        <Settings />
        <span className="btn-label">Settings</span>
      </Button>
      {open && (
        <Card className="absolute top-full right-0 mt-2 w-70 max-w-[calc(100vw-2rem)] panel-glass">
          <CardContent className="px-3">
            <MapSettingsWindow mapType={mapType} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

const LINE_TYPE_LABELS: Record<LineType, string> = {
  normal: "Normal",
  constellation: "Constellation",
  regional: "Regional",
};

const LABEL_TYPE_LABELS: Record<LabelType, string> = {
  system: "System",
  constellation: "Constellation",
  region: "Region",
};

function MapSettingsWindow({ mapType }: { mapType: string }) {
  const colorModes = COLOR_MODE_OPTIONS.filter((m) =>
    colorModeAllowedOn(m.value, mapType),
  );

  useEffect(() => {
    if (colorModeAllowedOn("jumps", mapType)) prefetchSystemJumps();
  }, [mapType]);
  const showAllLines = useMapStore((s) => s.showAllLines);
  const visibleLines = useMapStore((s) => s.visibleLines);
  const showAllLabels = useMapStore((s) => s.showAllLabels);
  const visibleLabels = useMapStore((s) => s.visibleLabels);
  const enableKillFeed = useMapStore((s) => s.enableKillFeed);
  const showCapsulesInFeed = useMapStore((s) => s.showCapsulesInFeed);
  const showKillFlash = useMapStore((s) => s.showKillFlash);
  const colorMode = useMapStore((s) => s.colorMode);

  const setShowAllLines = useMapStore((s) => s.setShowAllLines);
  const setLineVisibility = useMapStore((s) => s.setLineVisibility);
  const setShowAllLabels = useMapStore((s) => s.setShowAllLabels);
  const setLabelVisibility = useMapStore((s) => s.setLabelVisibility);
  const setEnableKillFeed = useMapStore((s) => s.setEnableKillFeed);
  const setShowCapsulesInFeed = useMapStore((s) => s.setShowCapsulesInFeed);
  const setShowKillFlash = useMapStore((s) => s.setShowKillFlash);
  const setColorMode = useMapStore((s) => s.setColorMode);
  const pointScale = useMapStore((s) => s.pointScale);
  const setPointScale = useMapStore((s) => s.setPointScale);
  const overlay = useMapStore((s) => s.overlay);
  const setOverlay = useMapStore((s) => s.setOverlay);
  const overlayOpacity = useMapStore((s) => s.overlayOpacity);
  const setOverlayOpacity = useMapStore((s) => s.setOverlayOpacity);
  const overlayModes = OVERLAY_MODE_OPTIONS.filter((m) =>
    overlayAllowedOn(m.value, mapType),
  );
  const sovData = useSovStore((s) => s.data);
  const showDebugStats = useGlobalSettingsStore((s) => s.showDebugStats);
  const setShowDebugStats = useGlobalSettingsStore((s) => s.setShowDebugStats);

  return (
    <div className="space-y-1.5">
      <div className="space-y-1">
        <Label className="text-base text-fg-secondary">Color By</Label>
        <div className="grid grid-cols-2 gap-1">
          {colorModes.map((m) => (
            <button
              key={m.value}
              onClick={() => setColorMode(m.value)}
              className={`h-7 border text-2xs transition-colors cursor-pointer ${
                colorMode === m.value
                  ? "border-capsuleer/60 bg-capsuleer/15 text-capsuleer"
                  : "border-border bg-transparent text-fg-muted hover:text-fg-secondary hover:border-border/80"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-base text-fg-secondary">Overlay</Label>
        <div className="grid grid-cols-2 gap-1">
          {overlayModes.map((m) => (
            <button
              key={m.value}
              onClick={() => setOverlay(m.value)}
              className={`h-7 border text-2xs transition-colors cursor-pointer ${
                overlay === m.value
                  ? "border-capsuleer/60 bg-capsuleer/15 text-capsuleer"
                  : "border-border bg-transparent text-fg-muted hover:text-fg-secondary hover:border-border/80"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        {overlay !== "none" && (
          <div
            className="space-y-1 pt-1"
            role="group"
            aria-labelledby="map-overlay-opacity-label"
          >
            <div className="flex items-center justify-between">
              <Label
                id="map-overlay-opacity-label"
                className="text-xs text-fg-muted"
              >
                Overlay Opacity
              </Label>
              <span className="text-2xs text-fg-muted select-none">
                {Math.round(overlayOpacity * 100)}%
              </span>
            </div>
            <Slider
              min={0.1}
              max={1}
              step={0.05}
              value={[overlayOpacity]}
              onValueChange={([v]) => setOverlayOpacity(v)}
              className="cursor-pointer"
            />
            {overlay === "sovereignty" && sovData && !sovData.admAvailable && (
              <p className="text-2xs text-fg-faint italic">
                ADM data unavailable, so territory sizes reflect system count
                only.
              </p>
            )}
          </div>
        )}
      </div>
      <div
        className="space-y-1"
        role="group"
        aria-labelledby="map-point-size-label"
      >
        <div className="flex items-center justify-between">
          <Label
            id="map-point-size-label"
            className="text-base text-fg-secondary"
          >
            Point Size
          </Label>
          <span className="text-2xs text-fg-muted select-none">
            {pointScale.toFixed(1)}x
          </span>
        </div>
        <Slider
          min={0.5}
          max={4}
          step={0.1}
          value={[pointScale]}
          onValueChange={([v]) => setPointScale(v)}
          className="cursor-pointer"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-base text-fg-secondary">Jump Lines</Label>
        <div className="flex items-center justify-between">
          <Label htmlFor="show-all-lines" className="text-xs text-fg-muted">
            Show All
          </Label>
          <Switch
            id="show-all-lines"
            checked={showAllLines}
            onCheckedChange={setShowAllLines}
            className="cursor-pointer"
          />
        </div>
        <div className="space-y-1 pl-2 border-l-2 border-capsuleer/40">
          {(Object.keys(LINE_TYPE_LABELS) as LineType[]).map((type) => (
            <div
              key={`line-${type}`}
              className="flex items-center justify-between"
            >
              <Label
                htmlFor={`show-line-${type}`}
                className="text-xs text-fg-muted"
              >
                {LINE_TYPE_LABELS[type]}
              </Label>
              <Switch
                id={`show-line-${type}`}
                checked={visibleLines[type]}
                onCheckedChange={(checked) => setLineVisibility(type, checked)}
                disabled={!showAllLines}
                className="cursor-pointer"
              />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-base text-fg-secondary">Labels</Label>
        <div className="flex items-center justify-between">
          <Label htmlFor="show-all-labels" className="text-xs text-fg-muted">
            Show All
          </Label>
          <Switch
            id="show-all-labels"
            checked={showAllLabels}
            onCheckedChange={setShowAllLabels}
            className="cursor-pointer"
          />
        </div>
        <div className="space-y-1 pl-2 border-l-2 border-capsuleer/40">
          {(Object.keys(LABEL_TYPE_LABELS) as LabelType[]).map((type) => (
            <div
              key={`label-${type}`}
              className="flex items-center justify-between"
            >
              <Label
                htmlFor={`show-label-${type}`}
                className="text-xs text-fg-muted"
              >
                {LABEL_TYPE_LABELS[type]}
              </Label>
              <Switch
                id={`show-label-${type}`}
                checked={visibleLabels[type]}
                onCheckedChange={(checked) => setLabelVisibility(type, checked)}
                disabled={!showAllLabels}
                className="cursor-pointer"
              />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-base text-fg-secondary">Live Kill Feed</Label>
        <div className="flex items-center justify-between">
          <Label htmlFor="enable-kill-feed" className="text-xs text-fg-muted">
            Enabled
          </Label>
          <Switch
            id="enable-kill-feed"
            checked={enableKillFeed}
            onCheckedChange={setEnableKillFeed}
            className="cursor-pointer"
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="show-capsules" className="text-xs text-fg-muted">
            Show Capsules
          </Label>
          <Switch
            id="show-capsules"
            checked={showCapsulesInFeed}
            onCheckedChange={setShowCapsulesInFeed}
            disabled={!enableKillFeed}
            className="cursor-pointer"
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="show-kill-flash" className="text-xs text-fg-muted">
            Show Live Kill Flashes
          </Label>
          <Switch
            id="show-kill-flash"
            checked={showKillFlash}
            onCheckedChange={setShowKillFlash}
            disabled={!enableKillFeed}
            className="cursor-pointer"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-base text-fg-secondary">Debug</Label>
        <div className="flex items-center justify-between">
          <Label htmlFor="show-debug-stats" className="text-xs text-fg-muted">
            Show Debug Stats
          </Label>
          <Switch
            id="show-debug-stats"
            checked={showDebugStats}
            onCheckedChange={setShowDebugStats}
            className="cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
