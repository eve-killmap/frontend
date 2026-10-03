import { systemSettingsActions } from "@/stores/system/system-settings-store";
import { useTimeRangeStore } from "@/stores/time-range-store";
import { usePlaybackStore } from "@/stores/system/playback-store";
import { playbackTimeState } from "@/lib/system/playback-time-state";
import { nowSeconds } from "@/lib/formatting/time";
import {
  clampStartTime,
  type SharedSettings,
  type SharedPlayback,
} from "./system-share";

export function applySharedSettings(s: SharedSettings): void {
  const a = systemSettingsActions;
  if (s.defaultColor !== undefined) a.setDefaultColor(s.defaultColor);
  if (s.killOpacity !== undefined) a.setKillOpacity(s.killOpacity);
  if (s.clusterColor !== undefined) a.setClusterColor(s.clusterColor);
  if (s.clusterOpacity !== undefined) a.setClusterOpacity(s.clusterOpacity);
  if (s.persistedTimeRange !== undefined) {
    useTimeRangeStore.getState().setRange(s.persistedTimeRange);
  }
  if (s.deselectedTypeIds !== undefined)
    a.setDeselectedTypeIds(s.deselectedTypeIds);
  if (s.showExcludedTypeIds !== undefined)
    a.setShowExcludedTypeIds(s.showExcludedTypeIds);
  if (s.rangeSelected !== undefined) a.setRangeSelected(s.rangeSelected);
  if (s.range !== undefined) a.setRange(s.range);
}

export function applySharedPlayback(p: SharedPlayback): void {
  const store = usePlaybackStore.getState();
  store.setWindowSeconds(p.window);
  store.setSpeed(p.speed);
  store.setFadeMode(p.fade);
  store.setRange(p.range);

  playbackTimeState.currentTime = clampStartTime(p.startTime, nowSeconds());
  playbackTimeState.version++;

  store.startPlayback();
  store.setPlaying(false);
}
