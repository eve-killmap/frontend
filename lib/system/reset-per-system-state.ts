import { usePlaybackStore } from "@/stores/system/playback-store";
import { useFloatingOriginStore } from "@/stores/system/floating-origin-store";
import { useSystemKillFeedStore } from "@/stores/system/system-kill-feed-store";
import { useKillHoverStore } from "@/stores/system/kill-hover-store";
import { playbackTimeState } from "@/lib/system/playback-time-state";
import { clearIcons } from "@/stores/system/icon-store";

export function resetPerSystemState(): void {
  usePlaybackStore.getState().reset();
  playbackTimeState.currentTime = 0;
  playbackTimeState.version = 0;
  useFloatingOriginStore.getState().setOrigin([0, 0, 0]);
  useSystemKillFeedStore.getState().reset();
  useKillHoverStore.getState().clearHovered();
  clearIcons();
}
