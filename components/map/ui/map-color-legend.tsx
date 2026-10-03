import { useMemo } from "react";
import { useMapStore } from "@/stores/map/map-store";
import { useTimeRangeStore } from "@/stores/time-range-store";
import { formatActivityRangeLabel } from "@/lib/map/system-kills-query";
import { useActivityData } from "@/hooks/map/use-activity-data";
import { useJumpsData } from "@/hooks/map/use-jumps-data";
import { useLiveKillStore, hotCounts } from "@/stores/live-kill-store";
import { useMapSystemsStore } from "@/stores/map/map-systems-store";
import { useSovStore } from "@/stores/map/sov-store";
import { HOT_MAX_FLOOR } from "@/components/map/hot/hot-sources";
import {
  SECURITY_HEX,
  ACTIVITY_HEX,
  JUMPS_HEX,
  HOT_HEX,
} from "@/lib/map/system-colors";
import {
  WORMHOLE_CLASS_LEGEND,
  WORMHOLE_EFFECT_LEGEND,
} from "@/lib/map/legend-entries";

const SECURITY_GRADIENT = `linear-gradient(to right, ${SECURITY_HEX.join(", ")})`;
const ACTIVITY_GRADIENT = `linear-gradient(to right, ${ACTIVITY_HEX.join(", ")})`;
const JUMPS_GRADIENT = `linear-gradient(to right, ${JUMPS_HEX.join(", ")})`;
const HOT_GRADIENT = `linear-gradient(to right, ${HOT_HEX.join(", ")})`;

const EMPTY_IDS: ReadonlySet<number> = new Set();

function HotLegend() {
  const entries = useLiveKillStore((s) => s.entries);
  const connected = useLiveKillStore((s) => s.connected);
  const mapSystemIDs = useMapSystemsStore((s) => s.systemIDs);
  const idSet = mapSystemIDs ?? EMPTY_IDS;
  const { max, tracked } = useMemo(
    () => hotCounts(entries, Date.now(), idSet),
    [entries, idSet],
  );
  return (
    <div className="space-y-1">
      <div className="text-fg-secondary">Hot areas, kills in the last hour</div>
      <div className="h-2 w-full" style={{ background: HOT_GRADIENT }} />
      <div className="flex justify-between font-mono">
        <span>0</span>
        <span>{Math.max(max, HOT_MAX_FLOOR).toLocaleString()}</span>
      </div>
      <p className="text-fg-faint italic">
        {connected
          ? `since you opened the map, ${tracked.toLocaleString()} kills tracked`
          : "reconnecting"}
      </p>
    </div>
  );
}

function OverlayLegend({ first }: { first: boolean }) {
  const overlay = useMapStore((s) => s.overlay);
  const sovData = useSovStore((s) => s.data);
  if (overlay === "none") return null;
  return (
    <div className={first ? "" : "mt-2 pt-2 border-t border-border/60"}>
      {overlay === "sovereignty" && (
        <div className="space-y-1">
          <div className="text-fg-secondary">Sovereignty overlay</div>
          {sovData && !sovData.admAvailable && (
            <p className="text-fg-faint italic">
              ADM data unavailable, so territory sizes reflect system count
              only.
            </p>
          )}
        </div>
      )}
      {overlay === "hot" && <HotLegend />}
    </div>
  );
}

export function MapColorLegend() {
  const colorMode = useMapStore((s) => s.colorMode);
  const overlay = useMapStore((s) => s.overlay);
  const activityRange = useTimeRangeStore((s) => s.range);
  const { lookup, filterActive, error } = useActivityData(
    colorMode === "activity",
  );
  const effectiveMode = filterActive ? "activity" : colorMode;
  const { lookup: jumpsLookup, error: jumpsError } = useJumpsData(
    effectiveMode === "jumps",
  );
  if (effectiveMode === "none" && overlay === "none") return null;

  const max = lookup?.max ?? 0;

  return (
    <div className="border border-border bg-panel px-3 py-2 text-2xs text-fg-muted select-none w-50">
      {effectiveMode === "security" && (
        <div className="space-y-1">
          <div className="text-fg-secondary">Security status</div>
          <div
            className="h-2 w-full"
            style={{ background: SECURITY_GRADIENT }}
          />
          <div className="flex justify-between font-mono">
            <span>-1.0</span>
            <span>1.0</span>
          </div>
        </div>
      )}

      {effectiveMode === "region" && (
        <div className="text-fg-secondary">Colored by region</div>
      )}

      {effectiveMode === "sovereignty" && (
        <div className="text-fg-secondary">Colored by sovereignty</div>
      )}

      {effectiveMode === "activity" && (
        <div className="space-y-1">
          <div className="text-fg-secondary">
            {filterActive ? "Kills matching filter" : "Kills"} (
            {formatActivityRangeLabel(activityRange)})
          </div>
          <div
            className="h-2 w-full"
            style={{ background: ACTIVITY_GRADIENT }}
          />
          <div className="flex justify-between font-mono">
            <span>0</span>
            <span>{lookup ? max.toLocaleString() : error ? "-" : "…"}</span>
          </div>
        </div>
      )}

      {effectiveMode === "jumps" && (
        <div className="space-y-1">
          <div className="text-fg-secondary">Ship jumps (past hour)</div>
          <div className="h-2 w-full" style={{ background: JUMPS_GRADIENT }} />
          <div className="flex justify-between font-mono">
            <span>0</span>
            <span>
              {jumpsLookup
                ? jumpsLookup.max.toLocaleString()
                : jumpsError
                  ? "-"
                  : "…"}
            </span>
          </div>
        </div>
      )}

      {effectiveMode === "wormhole-class" && (
        <div className="space-y-1">
          <div className="text-fg-secondary">Wormhole class</div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
            {WORMHOLE_CLASS_LEGEND.map(({ label, hex }) => (
              <div key={label} className="flex items-center gap-1">
                <span
                  className="inline-block size-2 rounded-xs border border-border/60"
                  style={{ background: hex }}
                />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {effectiveMode === "wormhole-effect" && (
        <div className="space-y-1">
          <div className="text-fg-secondary">Wormhole effect</div>
          <div className="space-y-0.5">
            {WORMHOLE_EFFECT_LEGEND.map(({ label, hex }) => (
              <div key={label} className="flex items-center gap-1">
                <span
                  className="inline-block size-2 rounded-xs border border-border/60"
                  style={{ background: hex }}
                />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <OverlayLegend first={effectiveMode === "none"} />
    </div>
  );
}
