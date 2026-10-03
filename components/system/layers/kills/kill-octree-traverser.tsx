import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useKillStore } from "@/stores/kill-store";
import { useFloatingOriginStore } from "@/stores/system/floating-origin-store";
import { cameraMetrics } from "@/stores/system/camera-metrics-store";
import { traverseOctree, traverseOctreeWindowed } from "@/lib/kill/kill-octree";
import { killTraversalState } from "@/lib/kill/kill-traversal-state";
import { usePlaybackStore } from "@/stores/system/playback-store";
import { playbackTimeState } from "@/lib/system/playback-time-state";
import { getSystemSettingsState } from "@/stores/system/system-settings-store";

export function KillOctreeTraverser() {
  const octree = useKillStore((s) => s.octree);

  const lastCameraVersion = useRef(-1);
  const lastOx = useRef(NaN);
  const lastOy = useRef(NaN);
  const lastOz = useRef(NaN);
  const lastOctree = useRef(octree);
  const lastPlaybackTime = useRef(NaN);
  const lastPlaybackActive = useRef(false);
  const lastMergePixels = useRef(-1);
  const lastOctreeVersion = useRef(-1);

  if (octree !== lastOctree.current) {
    lastOctree.current = octree;
    lastCameraVersion.current = -1;
  }

  useFrame((_, delta) => {
    const playback = usePlaybackStore.getState();

    if (playback.isActive && playback.isPlaying) {
      const newTime = playbackTimeState.currentTime + delta * playback.speed;
      if (newTime >= playback.rangeEnd) {
        playbackTimeState.currentTime = playback.rangeEnd;
        playbackTimeState.version++;
        usePlaybackStore.getState().autoStopAtCap();
      } else {
        playbackTimeState.currentTime = newTime;
        playbackTimeState.version++;
      }
    }

    if (!octree || octree.nodeCount === 0) {
      if (
        killTraversalState.individualCount > 0 ||
        killTraversalState.clusterCount > 0
      ) {
        killTraversalState.individualCount = 0;
        killTraversalState.clusterCount = 0;
        killTraversalState.version++;
      }
      return;
    }

    const octreeVersionChanged = octree.version !== lastOctreeVersion.current;

    const origin = useFloatingOriginStore.getState().origin;
    const { cameraPos, worldDir, halfTanFov, viewportHeight, cameraVersion } =
      cameraMetrics;

    const camX = cameraPos.x,
      camY = cameraPos.y,
      camZ = cameraPos.z;
    const dirX = worldDir.x,
      dirY = worldDir.y,
      dirZ = worldDir.z;
    const ox = origin[0],
      oy = origin[1],
      oz = origin[2];

    const mergePixels = getSystemSettingsState().mergePixels;

    const cameraMoved =
      cameraVersion !== lastCameraVersion.current ||
      lastOx.current !== ox ||
      lastOy.current !== oy ||
      lastOz.current !== oz;

    const playbackActiveChanged =
      playback.isActive !== lastPlaybackActive.current;
    const playbackTimeMoved =
      playback.isActive &&
      playbackTimeState.currentTime !== lastPlaybackTime.current;
    const mergePixelsChanged = mergePixels !== lastMergePixels.current;

    if (
      !cameraMoved &&
      !playbackActiveChanged &&
      !playbackTimeMoved &&
      !mergePixelsChanged &&
      !octreeVersionChanged
    )
      return;

    lastCameraVersion.current = cameraVersion;
    lastOx.current = ox;
    lastOy.current = oy;
    lastOz.current = oz;
    lastPlaybackTime.current = playbackTimeState.currentTime;
    lastPlaybackActive.current = playback.isActive;
    lastMergePixels.current = mergePixels;
    lastOctreeVersion.current = octree.version;

    if (playback.isActive) {
      const windowEnd = playbackTimeState.currentTime;
      const windowStart =
        playback.fadeMode === "cap-triggered"
          ? playback.rangeStart
          : windowEnd - playback.windowSeconds;
      const windowDuration =
        playback.fadeMode === "cap-triggered"
          ? Math.max(windowEnd - playback.rangeStart, 1)
          : playback.windowSeconds;
      traverseOctreeWindowed(
        octree,
        camX,
        camY,
        camZ,
        dirX,
        dirY,
        dirZ,
        halfTanFov,
        viewportHeight,
        ox,
        oy,
        oz,
        windowStart,
        windowEnd,
        windowDuration,
        playback.fadeMode,
        mergePixels,
      );
    } else {
      traverseOctree(
        octree,
        camX,
        camY,
        camZ,
        dirX,
        dirY,
        dirZ,
        halfTanFov,
        viewportHeight,
        ox,
        oy,
        oz,
        mergePixels,
      );
    }
  }, -2);

  return null;
}
