import React, { useState, useEffect, useMemo } from "react";
import { useKillStore } from "@/stores/kill-store";
import { useSystemSettingsStore } from "@/stores/system/system-settings-store";
import { useGlobalSettingsStore } from "@/stores/global-settings-store";
import {
  usePlaybackStore,
  PLAYBACK_SPEEDS,
  WINDOW_PRESETS,
} from "@/stores/system/playback-store";
import { useFloatingOriginStore } from "@/stores/system/floating-origin-store";
import { useSystemKillFeedStore } from "@/stores/system/system-kill-feed-store";
import { useLiveKillStore } from "@/stores/live-kill-store";
import { useObjectLodStore } from "@/stores/system/object-lod-store";
import { useIconLayoutStore } from "@/stores/system/icon-layout-store";
import { useHoverListStore } from "@/stores/system/hover-list-store";
import { killTraversalState } from "@/lib/kill/kill-traversal-state";
import { cameraMetrics } from "@/stores/system/camera-metrics-store";
import { frameStats } from "@/lib/frame-stats";
import { playbackTimeState } from "@/lib/system/playback-time-state";
import { getLabel } from "@/stores/system/system-object-name-store";
import { formatDistance } from "@/lib/formatting/format-distance";
import { worldPerPixel } from "@/lib/system/pixel-scale";
import { useResolvedTimeRange } from "@/hooks/use-time-range";
import {
  POLL_MS,
  Row,
  SectionHeader,
} from "@/components/common/debug-stats/debug-row";
import { DebugOverlay } from "@/components/common/debug-stats/debug-overlay";
import {
  fmtDuration,
  fmtPct,
  fmtTime,
} from "@/components/common/debug-stats/format";
import {
  FrameSection,
  FrameSnapshot,
  MemorySection,
  RendererSection,
} from "@/components/common/debug-stats/frame-sections";

const AU = 1.496e11;

function fmtDist(m: number): string {
  const au = Math.abs(m) / AU;
  if (au >= 0.01) return `${(m / AU).toFixed(3)} AU`;
  if (Math.abs(m) >= 1000) return `${(m / 1000).toFixed(1)} km`;
  return `${m.toFixed(0)} m`;
}

function fmtWorldPos(wx: number, wy: number, wz: number): string {
  return `(${(wx / AU).toFixed(2)}, ${(wy / AU).toFixed(2)}, ${(wz / AU).toFixed(2)}) AU`;
}

function fmtWorldPerPx(wpp: number): string {
  if (wpp <= 0) return "–";
  if (wpp >= AU) return `${(wpp / AU).toFixed(3)} AU/px`;
  if (wpp >= 1000) return `${(wpp / 1000).toFixed(1)} km/px`;
  return `${wpp.toFixed(1)} m/px`;
}

function fmtSpeedLabel(speed: number): string {
  const preset = PLAYBACK_SPEEDS.find((p) => p.value === speed);
  return preset ? preset.label : fmtDuration(speed) + "/s";
}

function fmtWindowLabel(seconds: number): string {
  const preset = WINDOW_PRESETS.find((p) => p.value === seconds);
  return preset ? preset.label : fmtDuration(seconds);
}

interface Polled {
  frame: FrameSnapshot;
  individualCount: number;
  clusterCount: number;
  clusterKillTotal: number;
  maxClusterKillCount: number;
  nodesVisited: number;
  nodesCulled: number;
  maxDepthReached: number;
  traversalTimeMs: number;
  wsConnected: boolean;
  feedKillCount: number;
  activeFlashes: number;
  liveKillIndices: number;
  camX: number;
  camY: number;
  camZ: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  halfTanFov: number;
  viewportWidth: number;
  viewportHeight: number;
  zoom: number;
  fovRadians: number;
  playbackCurrentTime: number;
}

function readPolled(): Polled {
  const ts = killTraversalState;
  const cm = cameraMetrics;
  const feed = useSystemKillFeedStore.getState();
  return {
    frame: { ...frameStats },
    individualCount: ts.individualCount,
    clusterCount: ts.clusterCount,
    clusterKillTotal: ts.clusterKillTotal,
    maxClusterKillCount: ts.maxClusterKillCount,
    nodesVisited: ts.nodesVisited,
    nodesCulled: ts.nodesCulled,
    maxDepthReached: ts.maxDepthReached,
    traversalTimeMs: ts.traversalTimeMs,
    wsConnected: useLiveKillStore.getState().connected,
    feedKillCount: feed.kills.length,
    activeFlashes: feed.flashes.length,
    liveKillIndices:
      useKillStore.getState().octree?.liveKillIndices.length ?? 0,
    camX: cm.cameraPos.x,
    camY: cm.cameraPos.y,
    camZ: cm.cameraPos.z,
    targetX: cm.controlsTarget.x,
    targetY: cm.controlsTarget.y,
    targetZ: cm.controlsTarget.z,
    halfTanFov: cm.halfTanFov,
    viewportWidth: cm.viewportWidth,
    viewportHeight: cm.viewportHeight,
    zoom: cm.zoom,
    fovRadians: cm.fovRadians,
    playbackCurrentTime: playbackTimeState.currentTime,
  };
}

export const DebugStats = React.memo(function DebugStats({
  jumps,
}: {
  jumps: number | null;
}) {
  const show = useGlobalSettingsStore((s) => s.showDebugStats);
  if (!show) return null;
  return <DebugStatsWindow jumps={jumps} />;
});

function DebugStatsWindow({ jumps }: { jumps: number | null }) {
  const [polled, setPolled] = useState<Polled>(readPolled);
  const origin = useFloatingOriginStore((s) => s.origin);
  const isPlaybackActive = usePlaybackStore((s) => s.isActive);
  const totalVisible = polled.individualCount + polled.clusterKillTotal;

  useEffect(() => {
    const id = setInterval(() => setPolled(readPolled()), POLL_MS);
    return () => clearInterval(id);
  }, []);

  const distToTarget = Math.sqrt(
    (polled.camX - polled.targetX) ** 2 +
      (polled.camY - polled.targetY) ** 2 +
      (polled.camZ - polled.targetZ) ** 2,
  );

  return (
    <DebugOverlay>
      <SectionHeader title="Frame" />
      <FrameSection frame={polled.frame} />

      <SectionHeader title="Renderer" />
      <RendererSection frame={polled.frame} />

      <SectionHeader title="Memory" />
      <MemorySection frame={polled.frame} />

      <SectionHeader title="Base Stats" />
      <BaseSection polled={polled} />

      <SectionHeader title="Shown Kills" />
      <KillDatesSection polled={polled} />

      <SectionHeader title="Camera / Viewport" />
      <CameraSection
        polled={polled}
        origin={origin}
        distToTarget={distToTarget}
      />

      <SectionHeader title="Scene" />
      <SceneSection jumps={jumps} />

      <SectionHeader title="Octree / Performance" />
      <OctreeSection polled={polled} />

      {isPlaybackActive && (
        <>
          <SectionHeader title="Playback" />
          <PlaybackSection polled={polled} totalVisible={totalVisible} />
        </>
      )}

      <SectionHeader title="Live Kills" />
      <LiveKillsSection polled={polled} />

      <SectionHeader title="Filter State" />
      <FilterSection />
    </DebugOverlay>
  );
}

function BaseSection({ polled }: { polled: Polled }) {
  const filteredCount = useKillStore((s) => s.filteredCount);
  const sourceCount = useKillStore((s) => s.data?.count ?? 0);
  const totalVisible = polled.individualCount + polled.clusterKillTotal;
  const clusterRatio =
    totalVisible > 0 ? polled.clusterKillTotal / totalVisible : 0;
  const maxIndividuals = killTraversalState.individualKillIndices.length;
  const isCapped = polled.individualCount >= maxIndividuals;

  return (
    <div className="space-y-0.5 mt-0.5 ml-2">
      <Row label="Source Kill Count" value={sourceCount.toLocaleString()} />
      <Row label="Filtered Kill Count" value={filteredCount.toLocaleString()} />
      <Row
        label="Individual Kills Shown"
        value={`${polled.individualCount.toLocaleString()}${isCapped ? " (capped)" : ""}`}
        warn={isCapped}
      />
      <Row
        label="Kill Clusters Shown"
        value={polled.clusterCount.toLocaleString()}
      />
      <Row
        label="Kills in Clusters"
        value={`${polled.clusterKillTotal.toLocaleString()} / ${totalVisible.toLocaleString()} (${fmtPct(clusterRatio)})`}
      />
      <Row
        label="Densest Cluster"
        value={
          polled.maxClusterKillCount > 0
            ? polled.maxClusterKillCount.toLocaleString()
            : "–"
        }
      />
    </div>
  );
}

function KillDatesSection({ polled }: { polled: Polled }) {
  const filteredTimeRange = useKillStore((s) => s.filteredTimeRange);
  const isPlaybackActive = usePlaybackStore((s) => s.isActive);
  const windowSeconds = usePlaybackStore((s) => s.windowSeconds);

  const range: [number, number] | null =
    isPlaybackActive && polled.playbackCurrentTime > 0
      ? [polled.playbackCurrentTime - windowSeconds, polled.playbackCurrentTime]
      : filteredTimeRange;

  if (!range) return null;
  return (
    <div className="space-y-0.5 mt-0.5 ml-2">
      <Row label="Earliest Shown Kill" value={fmtTime(range[0])} />
      <Row label="Latest Shown Kill" value={fmtTime(range[1])} />
    </div>
  );
}

function CameraSection({
  polled,
  origin,
  distToTarget,
}: {
  polled: Polled;
  origin: [number, number, number];
  distToTarget: number;
}) {
  const worldPerPx =
    polled.halfTanFov > 0 && polled.viewportHeight > 0
      ? worldPerPixel(distToTarget, polled.halfTanFov, polled.viewportHeight)
      : 0;
  const distToOrigin = Math.sqrt(
    polled.camX ** 2 + polled.camY ** 2 + polled.camZ ** 2,
  );
  const originMag = Math.sqrt(origin[0] ** 2 + origin[1] ** 2 + origin[2] ** 2);
  const fovDeg = (polled.fovRadians * 180) / Math.PI;

  return (
    <div className="space-y-0.5 mt-0.5 ml-2">
      <Row
        label="Camera Pos"
        value={fmtWorldPos(
          polled.camX + origin[0],
          polled.camY + origin[1],
          polled.camZ + origin[2],
        )}
      />
      <Row
        label="Camera Target"
        value={fmtWorldPos(
          polled.targetX + origin[0],
          polled.targetY + origin[1],
          polled.targetZ + origin[2],
        )}
      />
      <Row label="Dist to Target" value={fmtDist(distToTarget)} />
      <Row label="Dist to Origin" value={fmtDist(distToOrigin)} />
      <Row label="FOV" value={`${fovDeg.toFixed(1)}°`} />
      <Row label="Zoom" value={polled.zoom.toFixed(2)} />
      <Row
        label="Viewport"
        value={`${polled.viewportWidth}×${polled.viewportHeight}`}
      />
      <Row label="worldPerPx" value={fmtWorldPerPx(worldPerPx)} />
      <Row label="Floating Origin" value={fmtDist(originMag)} />
    </div>
  );
}

function SceneSection({ jumps }: { jumps: number | null }) {
  const lodMetas = useObjectLodStore((s) => s.metas);
  const lodState = useObjectLodStore((s) => s.state);
  const iconMetas = useIconLayoutStore((s) => s.metas);
  const iconLayout = useIconLayoutStore((s) => s.layout);
  const hoverId = useHoverListStore((s) => s.activeId);

  const objectsVisible = useMemo(
    () => [...lodState.values()].filter((v) => v.visible).length,
    [lodState],
  );
  const iconsVisible = useMemo(
    () => [...iconLayout.values()].filter((v) => v.visible).length,
    [iconLayout],
  );

  return (
    <div className="space-y-0.5 mt-0.5 ml-2">
      <Row
        label="Objects Visible"
        value={`${objectsVisible.toLocaleString()} / ${lodMetas.size.toLocaleString()}`}
      />
      <Row
        label="Icons Laid Out"
        value={`${iconsVisible.toLocaleString()} / ${iconMetas.size.toLocaleString()}`}
      />
      <Row
        label="Hover Target"
        value={hoverId == null ? "–" : getLabel(hoverId)}
      />
      <Row
        label="Jumps (1h)"
        value={jumps == null ? "–" : jumps.toLocaleString()}
      />
    </div>
  );
}

function OctreeSection({ polled }: { polled: Polled }) {
  const cullRatio =
    polled.nodesVisited > 0 ? polled.nodesCulled / polled.nodesVisited : 0;
  const missingPositionCount = useKillStore((s) => s.missingPositionCount);

  return (
    <div className="space-y-0.5 mt-0.5 ml-2">
      <Row
        label="Nodes Visited / Culled"
        value={`${polled.nodesVisited.toLocaleString()} / ${polled.nodesCulled.toLocaleString()} (${fmtPct(cullRatio)})`}
      />
      <Row label="Max Depth Reached" value={String(polled.maxDepthReached)} />
      <Row
        label="Traversal Time"
        value={`${polled.traversalTimeMs.toFixed(2)} ms`}
      />
      <Row
        label="Kills w/o Position"
        value={missingPositionCount.toLocaleString()}
      />
    </div>
  );
}

function PlaybackSection({
  polled,
  totalVisible,
}: {
  polled: Polled;
  totalVisible: number;
}) {
  const speed = usePlaybackStore((s) => s.speed);
  const windowSeconds = usePlaybackStore((s) => s.windowSeconds);

  return (
    <div className="space-y-0.5 mt-0.5 ml-2">
      <Row label="Current Time" value={fmtTime(polled.playbackCurrentTime)} />
      <Row label="Kills Alive" value={totalVisible.toLocaleString()} />
      <Row label="Speed" value={fmtSpeedLabel(speed)} />
      <Row label="Window" value={fmtWindowLabel(windowSeconds)} />
    </div>
  );
}

function LiveKillsSection({ polled }: { polled: Polled }) {
  return (
    <div className="space-y-0.5 mt-0.5 ml-2">
      <Row
        label="WS Status"
        value={polled.wsConnected ? "connected" : "disconnected"}
        warn={!polled.wsConnected}
      />
      <Row label="Feed Buffer" value={`${polled.feedKillCount} / 50`} />
      <Row
        label="Active Flashes"
        value={polled.activeFlashes.toLocaleString()}
      />
      <Row
        label="Live Octree Indices"
        value={polled.liveKillIndices.toLocaleString()}
      />
    </div>
  );
}

const FilterSection = React.memo(function FilterSection() {
  const timeRange = useResolvedTimeRange();
  const shipTypes = useSystemSettingsStore((s) => s.shipTypes);
  const rangeSelect = useSystemSettingsStore((s) => s.rangeSelected);
  const range = useSystemSettingsStore((s) => s.range);
  const maxKills = useSystemSettingsStore((s) => s.maxKills);
  const filteredCount = useKillStore((s) => s.filteredCount);
  const allowedIds = useKillStore((s) => s.allowedIds);
  const maskLoading = useKillStore((s) => s.filterMaskLoading);
  const maskError = useKillStore((s) => s.filterMaskError);

  const isMaxKillsActive = filteredCount >= maxKills;
  const timeRangeSpan = timeRange ? timeRange[1] - timeRange[0] : null;
  const maskValue = allowedIds
    ? `${allowedIds.size.toLocaleString()} ids`
    : "none";
  const maskSuffix = maskError ? " (error)" : maskLoading ? " (loading)" : "";

  return (
    <div className="space-y-0.5 mt-0.5 ml-2">
      <Row
        label="Time Range"
        value={timeRangeSpan != null ? fmtDuration(timeRangeSpan) : "none"}
      />
      <Row
        label="Ship Types"
        value={
          shipTypes == null
            ? "all"
            : `${shipTypes.size.toLocaleString()} selected`
        }
      />
      <Row
        label="Range Filter Object"
        value={rangeSelect == null ? "None" : `${getLabel(rangeSelect)}`}
      />
      {rangeSelect != null && (
        <Row
          label="Range"
          value={range == null ? "-" : `${formatDistance(range)}`}
        />
      )}
      <Row
        label="Filter Mask"
        value={maskValue + maskSuffix}
        warn={maskError}
      />
      <Row
        label="Max Kills Cap"
        value={`${maxKills.toLocaleString()}${isMaxKillsActive ? " (active)" : ""}`}
        warn={isMaxKillsActive}
      />
    </div>
  );
});
