import React from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  useSystemSettingsStore,
  DEFAULT_MERGE_PIXELS,
  DEFAULT_KILL_PIXELS,
  DEFAULT_MAX_CLUSTER_PIXELS,
  DEFAULT_MIN_CLUSTER_COUNT,
  DEFAULT_MAX_KILLS,
} from "@/stores/system/system-settings-store";
import { Button } from "@/components/ui/button";

function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="link"
      size="sm"
      className="h-auto p-0 text-2xs text-fg-muted cursor-pointer pr-1"
      onClick={onClick}
    >
      Reset
    </Button>
  );
}

export const RenderSettings = React.memo(function RenderSettings() {
  const mergePixels = useSystemSettingsStore((s) => s.mergePixels);
  const killPixels = useSystemSettingsStore((s) => s.killPixels);
  const maxClusterPixels = useSystemSettingsStore((s) => s.maxClusterPixels);
  const minClusterCount = useSystemSettingsStore((s) => s.minClusterCount);
  const maxKills = useSystemSettingsStore((s) => s.maxKills);

  const setMergePixels = useSystemSettingsStore((s) => s.setMergePixels);
  const setKillPixels = useSystemSettingsStore((s) => s.setKillPixels);
  const setMaxClusterPixels = useSystemSettingsStore(
    (s) => s.setMaxClusterPixels,
  );
  const setMinClusterCount = useSystemSettingsStore(
    (s) => s.setMinClusterCount,
  );
  const setMaxKills = useSystemSettingsStore((s) => s.setMaxKills);

  return (
    <div className="space-y-1.5">
      <div
        className="space-y-1"
        role="group"
        aria-labelledby="render-cluster-threshold-label"
      >
        <div className="flex items-center justify-between">
          <Label
            id="render-cluster-threshold-label"
            className="text-xs text-fg-muted"
          >
            Cluster Threshold
          </Label>
          <div className="flex items-center gap-1">
            {mergePixels !== DEFAULT_MERGE_PIXELS && (
              <ResetButton
                onClick={() => setMergePixels(DEFAULT_MERGE_PIXELS)}
              />
            )}
            <span className="text-2xs text-fg-muted">{mergePixels}px</span>
          </div>
        </div>
        <Slider
          min={2}
          max={32}
          step={2}
          value={[mergePixels]}
          onValueChange={([v]) => setMergePixels(v)}
          className="pb-0.5 cursor-pointer"
        />
      </div>

      <div
        className="space-y-1"
        role="group"
        aria-labelledby="render-kill-dot-size-label"
      >
        <div className="flex items-center justify-between">
          <Label
            id="render-kill-dot-size-label"
            className="text-xs text-fg-muted"
          >
            Kill Dot Size
          </Label>
          <div className="flex items-center gap-1">
            {killPixels !== DEFAULT_KILL_PIXELS && (
              <ResetButton onClick={() => setKillPixels(DEFAULT_KILL_PIXELS)} />
            )}
            <span className="text-2xs text-fg-muted">{killPixels}px</span>
          </div>
        </div>
        <Slider
          min={1}
          max={8}
          step={1}
          value={[killPixels]}
          onValueChange={([v]) => setKillPixels(v)}
          className="pb-0.5 cursor-pointer"
        />
      </div>

      <div
        className="space-y-1"
        role="group"
        aria-labelledby="render-max-cluster-size-label"
      >
        <div className="flex items-center justify-between">
          <Label
            id="render-max-cluster-size-label"
            className="text-xs text-fg-muted"
          >
            Max Cluster Size
          </Label>
          <div className="flex items-center gap-1">
            {maxClusterPixels !== DEFAULT_MAX_CLUSTER_PIXELS && (
              <ResetButton
                onClick={() => setMaxClusterPixels(DEFAULT_MAX_CLUSTER_PIXELS)}
              />
            )}
            <span className="text-2xs text-fg-muted">{maxClusterPixels}px</span>
          </div>
        </div>
        <Slider
          min={4}
          max={64}
          step={4}
          value={[maxClusterPixels]}
          onValueChange={([v]) => setMaxClusterPixels(v)}
          className="pb-0.5 cursor-pointer"
        />
      </div>

      <div
        className="space-y-1"
        role="group"
        aria-labelledby="render-min-cluster-count-label"
      >
        <div className="flex items-center justify-between">
          <Label
            id="render-min-cluster-count-label"
            className="text-xs text-fg-muted"
          >
            Min Cluster Count
          </Label>
          <div className="flex items-center gap-1">
            {minClusterCount !== DEFAULT_MIN_CLUSTER_COUNT && (
              <ResetButton
                onClick={() => setMinClusterCount(DEFAULT_MIN_CLUSTER_COUNT)}
              />
            )}
            <span className="text-2xs text-fg-muted">{minClusterCount}</span>
          </div>
        </div>
        <Slider
          min={2}
          max={100}
          step={1}
          value={[minClusterCount]}
          onValueChange={([v]) => setMinClusterCount(v)}
          className="cursor-pointer"
        />
      </div>

      <div
        className="space-y-1"
        role="group"
        aria-labelledby="render-max-individual-kills-label"
      >
        <div className="flex items-center justify-between">
          <Label
            id="render-max-individual-kills-label"
            className="text-xs text-fg-muted"
          >
            Max Individual Kills
          </Label>
          <div className="flex items-center gap-1">
            {maxKills !== DEFAULT_MAX_KILLS && (
              <ResetButton onClick={() => setMaxKills(DEFAULT_MAX_KILLS)} />
            )}
            <span className="text-2xs text-fg-muted">
              {maxKills.toLocaleString()}
            </span>
          </div>
        </div>
        <Slider
          min={1000}
          max={500000}
          step={1000}
          value={[maxKills]}
          onValueChange={([v]) => setMaxKills(v)}
          className="cursor-pointer"
        />
      </div>
    </div>
  );
});
