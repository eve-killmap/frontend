import { create } from "zustand";
import { persist } from "zustand/middleware";

interface MapCameraState {
  cameraPosition: [number, number];
  zoom: number;
}

const _store = create<{ maps: Record<string, MapCameraState> }>()(
  persist(() => ({ maps: {} }), { name: "map-camera-state" }),
);

let _currentMapType: string | null = null;

export function setCurrentMapType(mapType: string | null) {
  _currentMapType = mapType;
}

export function getMapCameraState(): MapCameraState | undefined {
  return _store.getState().maps[_currentMapType!];
}

export function setMapCameraState(state: MapCameraState): void {
  const mapType = _currentMapType!;
  _store.setState((prev) => ({
    maps: { ...prev.maps, [mapType]: state },
  }));
}

export function clearMapCameraState(): void {
  const mapType = _currentMapType!;
  _store.setState((prev) => {
    const { [mapType]: _, ...rest } = prev.maps;
    return { maps: rest };
  });
}
