import {
  ConstellationData,
  MapData,
  RegionData,
  isNewEdenMapData,
} from "@/lib/schema/map-schema";
import { MapControls } from "@react-three/drei";
import type { MapControls as MapControlsImpl } from "three-stdlib";
import React, { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { MapLabels } from "./labels/map-labels";
import { MapLines } from "./map-lines";
import { MapPoints } from "./map-points";
import { KillFlash } from "./kill-flash";
import { SystemHighlightRing } from "./system-highlight-ring";
import { SovOverlay } from "./sov/sov-overlay";
import { SovLabels } from "./sov/sov-labels";
import { HotOverlay } from "./hot/hot-overlay";
import { MapMorphDriver, MorphBuffer } from "./map-morph-driver";
import {
  getMapCameraState,
  setMapCameraState,
  clearMapCameraState,
} from "@/stores/map/map-camera-state-store";
import { useThree } from "@react-three/fiber";
import { useMapStore } from "@/stores/map/map-store";
import { useSystemColors } from "@/hooks/map/use-system-colors";
import { useLoadSovData } from "@/hooks/map/use-sovereignty";
import * as THREE from "three";
import { setResetCameraFn } from "@/lib/camera-functions";

interface MapSceneProps {
  mapData: MapData;
  constellationData: ConstellationData;
  regionData: RegionData;
  cameraZ: number;
  spanX: number;
  spanY: number;
}

export const MapScene = React.memo(function MapScene({
  mapData,
  constellationData,
  regionData,
  cameraZ,
  spanX,
  spanY,
}: MapSceneProps) {
  const positions2D = useMemo(
    () => new Float32Array(mapData.positions),
    [mapData],
  );
  const positions3D = useMemo(
    () =>
      isNewEdenMapData(mapData) ? new Float32Array(mapData.positions3D) : null,
    [mapData],
  );

  const systemsCurrent = useMemo(() => {
    const start =
      positions3D && useMapStore.getState().show3D ? positions3D : positions2D;
    return new Float32Array(start);
  }, [positions2D, positions3D]);

  const morphBuffers = useMemo<MorphBuffer[] | null>(() => {
    if (!positions3D) return null;
    return [{ a: positions2D, b: positions3D, out: systemsCurrent }];
  }, [positions2D, positions3D, systemsCurrent]);

  useLoadSovData(mapData);

  const { colors, sovOwnerFor } = useSystemColors(mapData, constellationData);
  const pointScale = useMapStore((s) => s.pointScale);

  const { camera } = useThree();

  const controlsRef = useRef<MapControlsImpl>(null!);

  const initialTarget = useMemo(() => {
    const cached = getMapCameraState();
    if (cached)
      return [cached.cameraPosition[0], cached.cameraPosition[1], 0] as [
        number,
        number,
        number,
      ];
  }, []);

  const resetCamera = useCallback(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    controls.target.set(0, 0, 0);
    camera.position.set(0, 0, cameraZ);
    camera.zoom = 1;
    camera.updateProjectionMatrix();
    controls.update();

    clearMapCameraState();
  }, [camera, cameraZ]);

  useLayoutEffect(() => {
    setResetCameraFn(resetCamera);
    return () => setResetCameraFn(null);
  }, [resetCamera]);

  const handleEndInteraction = useCallback(
    (_: THREE.Event<string, unknown> | undefined) => {
      setMapCameraState({
        cameraPosition: [camera.position.x, camera.position.y],
        zoom: camera.zoom,
      });
    },
    [camera],
  );

  return (
    <>
      <MapControls
        ref={controlsRef}
        makeDefault
        enableRotate={false}
        minZoom={1}
        maxZoom={150}
        enablePan
        enableZoom
        enableDamping
        dampingFactor={0.03}
        zoomToCursor
        target={initialTarget}
        onEnd={handleEndInteraction}
      />
      {morphBuffers && <MapMorphDriver buffers={morphBuffers} />}
      {isNewEdenMapData(mapData) && (
        <SovOverlay mapData={mapData} positions2D={systemsCurrent} />
      )}
      <HotOverlay mapData={mapData} positions2D={systemsCurrent} />
      {mapData.edges && mapData.edgeTypes && (
        <MapLines
          edgesData={mapData.edges}
          edgeTypesData={mapData.edgeTypes}
          positions2D={systemsCurrent}
        />
      )}
      <MapPoints
        positions2D={systemsCurrent}
        systemIDs={mapData.systemIDs}
        names={mapData.names}
        colors={colors}
        pointScale={pointScale}
      />
      <MapLabels
        mapData={mapData}
        constellationData={constellationData}
        regionData={regionData}
        positions2D={systemsCurrent}
        spanX={spanX}
        spanY={spanY}
        pointScale={pointScale}
        sovOwnerFor={sovOwnerFor}
      />
      {isNewEdenMapData(mapData) && <SovLabels spanX={spanX} spanY={spanY} />}
      <KillFlash positions2D={systemsCurrent} systemIDs={mapData.systemIDs} />
      <SystemHighlightRing
        positions2D={systemsCurrent}
        systemIDs={mapData.systemIDs}
      />
    </>
  );
});
