import React, { useEffect, useState } from "react";
import { useGlobalSettingsStore } from "@/stores/global-settings-store";
import { useMapStore } from "@/stores/map/map-store";
import { useKillFeedStore } from "@/stores/map/kill-feed-store";
import { useLiveKillStore } from "@/stores/live-kill-store";
import { useUniverseStatusStore } from "@/stores/map/universe-status-store";
import { useSovStore } from "@/stores/map/sov-store";
import { useHighlightedSystemStore } from "@/stores/map/highlighted-system-store";
import { useFilterConditions } from "@/stores/filter-store";
import { useTimeRangeStore, resolveTimeRange } from "@/stores/time-range-store";
import { useActivityData } from "@/hooks/map/use-activity-data";
import { peekSystemJumps } from "@/hooks/map/use-system-jumps";
import { frameStats } from "@/lib/frame-stats";
import { mapMetrics } from "@/lib/map/map-metrics";
import { formatAbsoluteUTC } from "@/lib/formatting/time";
import {
  POLL_MS,
  Row,
  SectionHeader,
} from "@/components/common/debug-stats/debug-row";
import { DebugOverlay } from "@/components/common/debug-stats/debug-overlay";
import { fmtDuration } from "@/components/common/debug-stats/format";
import {
  FrameSection,
  FrameSnapshot,
  MemorySection,
  RendererSection,
} from "@/components/common/debug-stats/frame-sections";

interface Polled {
  frame: FrameSnapshot;
  metrics: typeof mapMetrics;
  wsConnected: boolean;
  feedKillCount: number;
  activeFlashes: number;
  ringSize: number;
}

function readPolled(): Polled {
  const feed = useKillFeedStore.getState();
  const live = useLiveKillStore.getState();
  return {
    frame: { ...frameStats },
    metrics: { ...mapMetrics },
    wsConnected: live.connected,
    feedKillCount: feed.kills.length,
    activeFlashes: feed.flashes.length,
    ringSize: live.entries.length,
  };
}

export const MapDebugStats = React.memo(function MapDebugStats({
  mapType,
}: {
  mapType: string;
}) {
  const show = useGlobalSettingsStore((s) => s.showDebugStats);
  if (!show) return null;
  return <MapDebugStatsWindow mapType={mapType} />;
});

function MapDebugStatsWindow({ mapType }: { mapType: string }) {
  const [polled, setPolled] = useState<Polled>(readPolled);

  useEffect(() => {
    const id = setInterval(() => setPolled(readPolled()), POLL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <DebugOverlay>
      <SectionHeader title="Frame" />
      <FrameSection frame={polled.frame} />

      <SectionHeader title="Renderer" />
      <RendererSection frame={polled.frame} />

      <SectionHeader title="Memory" />
      <MemorySection frame={polled.frame} />

      <SectionHeader title="Map" />
      <MapSection mapType={mapType} metrics={polled.metrics} />

      <SectionHeader title="Camera" />
      <CameraSection metrics={polled.metrics} />

      <SectionHeader title="Data" />
      <DataSection />

      <SectionHeader title="Live Kills" />
      <div className="space-y-0.5 mt-0.5 ml-2">
        <Row
          label="WS Status"
          value={polled.wsConnected ? "connected" : "disconnected"}
          warn={!polled.wsConnected}
        />
        <Row label="Feed Buffer" value={`${polled.feedKillCount} / 50`} />
        <Row
          label="Session Ring"
          value={`${polled.ringSize.toLocaleString()} / 5,000`}
        />
        <Row
          label="Active Flashes"
          value={polled.activeFlashes.toLocaleString()}
        />
      </div>

      <SectionHeader title="Cluster" />
      <ClusterSection />

      <SectionHeader title="Hover" />
      <HoverSection />
    </DebugOverlay>
  );
}

function MapSection({
  mapType,
  metrics,
}: {
  mapType: string;
  metrics: typeof mapMetrics;
}) {
  const show3D = useMapStore((s) => s.show3D);
  const morphActive = useMapStore((s) => s.morphActive);
  const colorMode = useMapStore((s) => s.colorMode);
  const pointScale = useMapStore((s) => s.pointScale);
  const overlay = useMapStore((s) => s.overlay);
  const overlayOpacity = useMapStore((s) => s.overlayOpacity);

  return (
    <div className="space-y-0.5 mt-0.5 ml-2">
      <Row label="Type" value={mapType} />
      <Row label="Systems" value={metrics.systems.toLocaleString()} />
      <Row label="Edges" value={metrics.edges.toLocaleString()} />
      <Row
        label="Layout"
        value={`${show3D ? "3D" : "2D"}${morphActive ? " (morphing)" : ""}`}
      />
      <Row label="Color Mode" value={colorMode} />
      <Row label="Point Scale" value={`${pointScale.toFixed(1)}×`} />
      <Row
        label="Labels Visible"
        value={metrics.visibleLabels.toLocaleString()}
      />
      <Row
        label="Overlay"
        value={
          overlay === "none"
            ? "none"
            : `${overlay} (${Math.round(overlayOpacity * 100)}%)`
        }
      />
    </div>
  );
}

function CameraSection({ metrics }: { metrics: typeof mapMetrics }) {
  return (
    <div className="space-y-0.5 mt-0.5 ml-2">
      <Row
        label="Position"
        value={`(${metrics.x.toFixed(2)}, ${metrics.y.toFixed(2)})`}
      />
      <Row label="Zoom" value={metrics.zoom.toFixed(2)} />
      <Row
        label="Viewport"
        value={`${metrics.viewportWidth}×${metrics.viewportHeight}`}
      />
    </div>
  );
}

function DataSection() {
  const colorMode = useMapStore((s) => s.colorMode);
  const { lookup, loading } = useActivityData(colorMode === "activity");
  const conditions = useFilterConditions();
  const range = useTimeRangeStore((s) => s.range);
  const resolved = resolveTimeRange(range);
  const sov = useSovStore((s) => s.data);

  return (
    <div className="space-y-0.5 mt-0.5 ml-2">
      <Row
        label="Activity"
        value={
          lookup
            ? `${lookup.total.toLocaleString()} kills · max ${lookup.max.toLocaleString()}`
            : loading
              ? "loading"
              : "–"
        }
      />
      <Row label="Filter Conditions" value={String(conditions.length)} />
      <Row
        label="Time Range"
        value={resolved ? fmtDuration(resolved[1] - resolved[0]) : "all-time"}
      />
      <Row label="Jumps Cache" value={peekSystemJumps() ? "warm" : "cold"} />
      <Row
        label="Sovereignty"
        value={
          sov
            ? `${sov.owners.length.toLocaleString()} owners · ADM ${sov.admAvailable ? "yes" : "no"} · as of ${formatAbsoluteUTC(sov.updatedAt)} UTC`
            : "–"
        }
      />
    </div>
  );
}

function ClusterSection() {
  const status = useUniverseStatusStore((s) => s.status);
  const stale = useUniverseStatusStore((s) => s.stale);
  const value = status
    ? status.online
      ? `online · ${(status.players ?? 0).toLocaleString()} players`
      : "offline"
    : "unknown";

  return (
    <div className="space-y-0.5 mt-0.5 ml-2">
      <Row label="Status" value={`${value}${stale ? " (stale)" : ""}`} />
    </div>
  );
}

function HoverSection() {
  const hoveredIndex = useMapStore((s) => s.hoveredSystemIndex);
  const highlighted = useHighlightedSystemStore((s) => s.highlightedSystemId);

  return (
    <div className="space-y-0.5 mt-0.5 ml-2">
      <Row
        label="Hovered Index"
        value={hoveredIndex == null ? "–" : String(hoveredIndex)}
      />
      <Row
        label="Highlighted System"
        value={highlighted == null ? "–" : String(highlighted)}
      />
    </div>
  );
}
