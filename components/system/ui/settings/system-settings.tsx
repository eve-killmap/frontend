import { TypeData } from "@/lib/schema/system-schema";
import { Settings } from "lucide-react";
import React, { useMemo } from "react";
import { useKillStore } from "@/stores/kill-store";
import { useSystemSettingsStore } from "@/stores/system/system-settings-store";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { ColorSelect } from "./color-select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { VisibilityToggle } from "@/components/system/ui/settings/visibility-toggle";
import { Switch } from "@/components/ui/switch";
import { RenderSettings } from "./render-settings";
import { SharedViewNotice } from "../share/shared-view-notice";
import { useDismissablePanel } from "@/hooks/use-dismissable-panel";
import { useGlobalSettingsStore } from "@/stores/global-settings-store";

interface SystemSettingsProps {
  typeData: TypeData;
  open: boolean;
  onToggle: () => void;
}

export const SystemSettings = React.memo(function SystemSettings({
  typeData,
  open,
  onToggle,
}: SystemSettingsProps) {
  const data = useKillStore((s) => s.data);
  const ref = useDismissablePanel(open, onToggle);

  const presentTypes = useMemo(() => {
    if (!data || data.count === 0) return null;
    return new Set(data.ship_types);
  }, [data]);

  return (
    <div ref={ref} className="relative pointer-events-auto">
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
      <Tabs
        defaultValue="colors"
        className={`absolute top-full gap-1 right-0 w-84 mt-2 max-w-[calc(100vw-2rem)] ${open ? "" : "hidden"}`}
      >
        <div className="flex flex-col gap-1">
          <TabsList className="bg-panel border border-border h-10 w-full">
            {[
              { value: "colors", label: "Colors" },
              { value: "other", label: "Other" },
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
          <SharedViewNotice />
        </div>
        <div className="bg-panel border border-border px-3 py-3">
          <TabsContent value="colors" className="m-0">
            <ColorsTab
              typeData={typeData}
              presentTypes={presentTypes}
              enabled={open}
            />
          </TabsContent>
          <TabsContent value="other" className="m-0">
            <OtherTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
});

function ColorsTab({
  typeData,
  presentTypes,
  enabled,
}: {
  typeData: TypeData;
  presentTypes: Set<number> | null;
  enabled: boolean;
}) {
  const killOpacity = useSystemSettingsStore((s) => s.killOpacity);
  const setKillOpacity = useSystemSettingsStore((s) => s.setKillOpacity);
  const clusterOpacity = useSystemSettingsStore((s) => s.clusterOpacity);
  const setClusterOpacity = useSystemSettingsStore((s) => s.setClusterOpacity);

  return (
    <div className="space-y-2">
      <div
        className="space-y-1.5"
        role="group"
        aria-labelledby="kill-colors-label"
      >
        <Label id="kill-colors-label" className="text-sm text-fg-secondary">
          Kill Colors
        </Label>
        <ColorSelect
          typeData={typeData}
          presentTypes={presentTypes}
          enabled={enabled}
        />
      </div>

      <div
        className="space-y-2"
        role="group"
        aria-labelledby="kill-opacity-label"
      >
        <div className="flex items-center justify-between">
          <Label id="kill-opacity-label" className="text-sm text-fg-secondary">
            Kill Opacity
          </Label>
          <span className="text-2xs text-fg-muted select-none">
            {Math.round(killOpacity * 100)}%
          </span>
        </div>
        <Slider
          min={0}
          max={1}
          step={0.01}
          value={[killOpacity]}
          onValueChange={([v]) => setKillOpacity(v)}
          className="cursor-pointer"
        />
      </div>

      <div
        className="space-y-2"
        role="group"
        aria-labelledby="cluster-opacity-label"
      >
        <div className="flex items-center justify-between">
          <Label
            id="cluster-opacity-label"
            className="text-sm text-fg-secondary"
          >
            Cluster Opacity
          </Label>
          <span className="text-2xs text-fg-muted select-none">
            {Math.round(clusterOpacity * 100)}%
          </span>
        </div>
        <Slider
          min={0}
          max={1}
          step={0.01}
          value={[clusterOpacity]}
          onValueChange={([v]) => setClusterOpacity(v)}
          className="cursor-pointer"
        />
      </div>
    </div>
  );
}

function OtherTab() {
  const enableKillFeed = useSystemSettingsStore((s) => s.enableKillFeed);
  const showCapsulesInFeed = useSystemSettingsStore(
    (s) => s.showCapsulesInFeed,
  );
  const showKillFlash = useSystemSettingsStore((s) => s.showKillFlash);

  const setEnableKillFeed = useSystemSettingsStore((s) => s.setEnableKillFeed);
  const setShowCapsulesInFeed = useSystemSettingsStore(
    (s) => s.setShowCapsulesInFeed,
  );
  const setShowKillFlash = useSystemSettingsStore((s) => s.setShowKillFlash);
  const showDebugStats = useGlobalSettingsStore((s) => s.showDebugStats);
  const setShowDebugStats = useGlobalSettingsStore((s) => s.setShowDebugStats);

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label className="text-sm text-fg-secondary">Object Visibility</Label>
        <VisibilityToggle />
      </div>

      <div className="space-y-1">
        <Label className="text-sm text-fg-secondary">Rendering Settings</Label>
        <RenderSettings />
      </div>

      <div className="space-y-1">
        <Label className="text-sm text-fg-secondary">Live Kill Feed</Label>
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
        <Label className="text-sm text-fg-secondary">Debug</Label>
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
