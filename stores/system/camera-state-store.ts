import { createPerSystemStore } from "../create-per-system-store";

export interface CameraState {
  cameraPosition: [number, number, number];
  controlsTarget: [number, number, number];
}

const per = createPerSystemStore<CameraState>({
  name: "camera-state",
  maxSystems: 50,
});

export const setCurrentCameraSlug = per.setCurrentSlug;

export function getCameraState(): CameraState | undefined {
  return per.getCurrent();
}

export function setCameraState(state: CameraState): void {
  per.setCurrent(state);
}

export function clearCameraState(): void {
  per.clearCurrent();
}
