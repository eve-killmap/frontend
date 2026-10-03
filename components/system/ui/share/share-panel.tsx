import React, { useEffect, useMemo, useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { usePlaybackStore } from "@/stores/system/playback-store";
import {
  encodeSystemShare,
  type SystemShare,
} from "@/lib/system/share/system-share";
import {
  captureSettings,
  captureCamera,
  capturePlayback,
} from "@/lib/system/share/capture";
import { appendFilterTokens } from "@/lib/filter/serialize";
import { useFilterConditions } from "@/stores/filter-store";
import { ShareLinkField } from "@/components/common/share-link-field";
import { ExportBlock } from "@/components/common/export-block";
import { useDismissablePanel } from "@/hooks/use-dismissable-panel";
import { useSystemExport } from "@/hooks/use-export";
import { slugify } from "@/lib/formatting/slugify";
import type { SystemData, TypeData } from "@/lib/schema/system-schema";

interface SharePanelProps {
  open: boolean;
  onToggle: () => void;
  presetPlayback: boolean;
  systemData: SystemData;
  typeData: TypeData;
}

export const SharePanel = React.memo(function SharePanel({
  open,
  onToggle,
  presetPlayback,
  systemData,
  typeData,
}: SharePanelProps) {
  const playbackActive = usePlaybackStore((s) => s.isActive);
  const conditions = useFilterConditions();
  const ref = useDismissablePanel(open, onToggle);
  const slug = useMemo(() => slugify(systemData.name), [systemData.name]);
  const sysExport = useSystemExport(systemData, typeData.typeRadii, slug);

  const [includeSettings, setIncludeSettings] = useState(false);
  const [includeCamera, setIncludeCamera] = useState(true);
  const [includePlayback, setIncludePlayback] = useState(false);
  const [includeFilter, setIncludeFilter] = useState(true);

  useEffect(() => {
    if (!open) return;
    setIncludeSettings(false);
    setIncludeCamera(true);
    setIncludePlayback(presetPlayback && playbackActive);
    setIncludeFilter(true);
  }, [open, presetPlayback, playbackActive]);

  const link = useMemo(() => {
    if (!open) return "";
    const share: SystemShare = {};
    if (includeSettings) {
      const settings = captureSettings();
      if (Object.keys(settings).length > 0) share.settings = settings;
    }
    if (includeCamera) share.camera = captureCamera();
    if (includePlayback && playbackActive) {
      const pb = capturePlayback();
      if (pb) share.playback = pb;
    }
    const shareQuery = encodeSystemShare(share);
    const filterQuery = appendFilterTokens(
      shareQuery,
      includeFilter ? conditions : [],
    );
    return `${window.location.origin}${window.location.pathname}${shareQuery}${filterQuery}`;
  }, [
    open,
    includeSettings,
    includeCamera,
    includePlayback,
    playbackActive,
    includeFilter,
    conditions,
  ]);

  return (
    <div ref={ref} className="relative pointer-events-auto">
      <Button
        variant="outline"
        size="lg"
        onClick={onToggle}
        aria-expanded={open}
        className="btn-glass"
        title="Share"
      >
        <Share2 />
        <span className="btn-label">Share</span>
      </Button>
      <Card
        className={`absolute top-full right-0 w-84 mt-2 max-w-[calc(100vw-2rem)] panel-glass ${open ? "" : "hidden"}`}
      >
        <CardContent className="px-3">
          <div className="space-y-1.5">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-fg-secondary leading-tight">
                Share Link
              </p>
              <p className="text-xs text-fg-muted leading-tight">
                Create a shareable link that reopens this system, with the
                options you choose.
              </p>
            </div>
            <CheckRow
              id="share-camera"
              checked={includeCamera}
              onChange={setIncludeCamera}
              label="Current view"
              hint="Camera position and focused object"
            />
            <CheckRow
              id="share-settings"
              checked={includeSettings}
              onChange={setIncludeSettings}
              label="Current settings"
              hint="Colors, opacity, time range, ship & range filters"
            />
            {conditions.length > 0 && (
              <CheckRow
                id="share-filter"
                checked={includeFilter}
                onChange={setIncludeFilter}
                label="Current filter"
                hint="The active kill filter conditions"
              />
            )}
            {playbackActive && (
              <CheckRow
                id="share-playback"
                checked={includePlayback}
                onChange={setIncludePlayback}
                label="Start at current playback time"
                hint="Opens paused at this moment, with playback settings"
              />
            )}
            <ShareLinkField link={link} />
            <ExportBlock
              actions={[
                { key: "png", label: "Download PNG", run: sysExport.exportPng },
                {
                  key: "csv",
                  label: `Download CSV (${sysExport.csvRowCount.toLocaleString()} rows${sysExport.csvCapped ? ", capped" : ""})`,
                  run: sysExport.exportCsv,
                },
              ]}
              busy={sysExport.busy}
              error={sysExport.error}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

function CheckRow({
  id,
  checked,
  onChange,
  label,
  hint,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <div className="flex gap-2.5">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
        className="mt-0.5"
      />
      <div className="space-y-0.5">
        <Label htmlFor={id} className="text-sm text-foreground cursor-pointer">
          {label}
        </Label>
        <p className="text-2xs text-fg-subtle leading-tight">{hint}</p>
      </div>
    </div>
  );
}
