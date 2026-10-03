import {
  getSystemSettingsState,
  DEFAULT_KILL_COLOR,
  DEFAULT_KILL_OPACITY,
  DEFAULT_CLUSTER_COLOR,
  DEFAULT_CLUSTER_OPACITY,
} from "@/stores/system/system-settings-store";
import { useTimeRangeStore } from "@/stores/time-range-store";
import { cameraMetrics } from "@/stores/system/camera-metrics-store";
import { useFloatingOriginStore } from "@/stores/system/floating-origin-store";
import { usePlaybackStore } from "@/stores/system/playback-store";
import { playbackTimeState } from "@/lib/system/playback-time-state";
import {
  diffShareableSettings,
  type SharedSettings,
  type SharedCamera,
  type SharedPlayback,
} from "./system-share";

export function captureSettings(): SharedSettings {
  const s = getSystemSettingsState();
  return diffShareableSettings(
    {
      defaultColor: s.defaultColor,
      killOpacity: s.killOpacity,
      clusterColor: s.clusterColor,
      clusterOpacity: s.clusterOpacity,
      persistedTimeRange: useTimeRangeStore.getState().range,
      deselectedTypeIds: s.deselectedTypeIds,
      showExcludedTypeIds: s.showExcludedTypeIds,
      rangeSelected: s.rangeSelected,
      range: s.range,
    },
    {
      defaultColor: DEFAULT_KILL_COLOR,
      killOpacity: DEFAULT_KILL_OPACITY,
      clusterColor: DEFAULT_CLUSTER_COLOR,
      clusterOpacity: DEFAULT_CLUSTER_OPACITY,
    },
  );
}

export function captureCamera(): SharedCamera {
  const [ox, oy, oz] = useFloatingOriginStore.getState().origin;
  const p = cameraMetrics.cameraPos;
  const t = cameraMetrics.controlsTarget;
  return {
    position: [p.x + ox, p.y + oy, p.z + oz],
    target: [t.x + ox, t.y + oy, t.z + oz],
  };
}

export function capturePlayback(): SharedPlayback | null {
  const pb = usePlaybackStore.getState();
  if (!pb.isActive) return null;
  return {
    startTime: playbackTimeState.currentTime,
    window: pb.windowSeconds,
    speed: pb.speed,
    fade: pb.fadeMode,
    range: [pb.rangeStart, pb.rangeEnd],
  };
}
