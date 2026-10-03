import React, { useEffect, useMemo, useState } from "react";
import { Panel, PanelHeader, PanelTitle } from "@/components/common/panel";
import { SystemData, TypeData } from "@/lib/schema/system-schema";
import { useKillStore } from "@/stores/kill-store";
import { useLocatedKillStore } from "@/stores/system/located-kill-store";
import { useSystemSettingsStore } from "@/stores/system/system-settings-store";
import { loadShipTypeNames } from "@/lib/eve/ship-types";
import { ShipIcon } from "@/components/common/ship-icon";
import { findNearestObject } from "@/lib/system/find-nearest-object";
import { formatDistance } from "@/lib/formatting/format-distance";
import { formatRelativeTime } from "@/lib/formatting/time";
import { animateToPosFn } from "@/lib/camera-functions";
import { ChevronDown } from "lucide-react";

const PAGE = 50;

export const SystemKillList = React.memo(function SystemKillList({
  systemData,
  typeData,
  minimized,
  onToggleMinimize,
  className = "",
}: {
  systemData: SystemData;
  typeData: TypeData;
  minimized: boolean;
  onToggleMinimize: () => void;
  className?: string;
}) {
  const filtered = useKillStore((s) => s.filteredKills);
  const setLocated = useLocatedKillStore((s) => s.setLocated);
  const clearLocated = useLocatedKillStore((s) => s.clearLocated);
  const maxKills = useSystemSettingsStore((s) => s.maxKills);

  const [names, setNames] = useState<Map<number, string> | null>(null);
  useEffect(() => {
    let alive = true;
    loadShipTypeNames()
      .then((m) => {
        if (alive) setNames(m);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  const total = filtered?.count ?? 0;
  const isCapped = total >= maxKills;

  const filterKey = filtered
    ? `${filtered.count}:${filtered.killmailIds[0] ?? 0}:${filtered.killmailIds[filtered.count - 1] ?? 0}`
    : "";

  const [visible, setVisible] = useState(PAGE);
  useEffect(() => {
    setVisible(PAGE);
    clearLocated();
  }, [filterKey, clearLocated]);
  const shown = Math.min(visible, total);

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 200 && shown < total)
      setVisible((v) => v + PAGE);
  };

  const rows = useMemo(() => {
    if (!filtered) return [];
    const out: {
      id: number;
      ship: number;
      time: number;
      pos: [number, number, number];
    }[] = [];
    for (let i = 0; i < Math.min(visible, filtered.count); i++) {
      out.push({
        id: filtered.killmailIds[i],
        ship: filtered.shipTypes[i],
        time: filtered.killmailTimes[i],
        pos: [filtered.x[i], filtered.y[i], filtered.z[i]],
      });
    }
    return out;
  }, [filtered, visible]);

  useEffect(() => {
    if (minimized) clearLocated();
    return () => clearLocated();
  }, [minimized, clearLocated]);

  return (
    <Panel className={className}>
      <PanelHeader>
        <div className="flex items-center gap-2">
          <PanelTitle>System Kill List</PanelTitle>
          <span
            className={`text-2xs tabular-nums ${isCapped ? "text-red-400" : "text-fg-muted"}`}
          >
            {total.toLocaleString()}
            {isCapped && " (Capped)"}
          </span>
        </div>
        <button
          onClick={onToggleMinimize}
          aria-label={
            minimized ? "Expand system kill list" : "Minimize system kill list"
          }
          className="text-fg-subtle hover:text-fg-secondary cursor-pointer"
        >
          <ChevronDown
            size={12}
            className={`size-3.5 transition-transform ${minimized ? "" : "rotate-180"}`}
          />
        </button>
      </PanelHeader>
      {!minimized && (
        <div className="flex-1 min-h-0 overflow-y-auto" onScroll={onScroll}>
          {total === 0 ? (
            <p className="text-2xs text-fg-subtle italic px-3 py-3">
              No kills match.
            </p>
          ) : (
            rows.map((r) => {
              const nearest = findNearestObject(
                r.pos,
                systemData,
                typeData.typeRadii,
              );
              return (
                <button
                  key={r.id}
                  onMouseEnter={() => setLocated(r.pos)}
                  onMouseLeave={clearLocated}
                  onClick={() => animateToPosFn?.(r.pos)}
                  className="w-full flex items-center gap-2 px-2 py-1 border-b border-border/60 last:border-0 text-left hover:bg-panel-elevated cursor-pointer"
                >
                  <ShipIcon typeId={r.ship} className="w-6 h-6 rounded-xs" />
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs text-fg-secondary truncate">
                      {names?.get(r.ship) ?? `#${r.ship}`}
                    </span>
                    <span className="block text-3xs text-fg-subtle truncate">
                      {formatRelativeTime(r.time, now)}
                      {nearest &&
                        ` · ${formatDistance(nearest.distance)} from ${nearest.name}`}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </Panel>
  );
});
