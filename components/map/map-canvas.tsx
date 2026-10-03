import {
  ConstellationData,
  MapData,
  RegionData,
  isNewEdenMapData,
} from "@/lib/schema/map-schema";
import { Canvas } from "@react-three/fiber";
import { MapScene } from "./map-scene";
import { FitCamera } from "./fit-camera";
import { FrameStatsUpdater } from "@/components/common/frame-stats-updater";
import { Suspense, useEffect, useMemo } from "react";
import { CAMERA_MARGIN } from "@/lib/map/map-camera";
import { setCurrentMapType } from "@/stores/map/map-camera-state-store";
import { preload } from "suspend-react";
import { preloadFont } from "troika-three-text";
import { MapMetricsUpdater } from "./map-metrics-updater";
import { CaptureBridge } from "@/components/common/capture-bridge";

const FONTS = [
  "/fonts/Barlow-Medium.ttf",
  "/fonts/BarlowCondensed-Bold.ttf",
  "/fonts/Triglavian-Completed.otf",
];
for (const font of FONTS) {
  preload(() => new Promise<void>((res) => preloadFont({ font }, res)), [
    "troika-text",
    font,
    undefined,
  ] as unknown as [string, string, undefined]);
}

const CAMERA_Z = 10;

interface MapCanvasProps {
  mapType: string;
  mapData: MapData;
  constellationData: ConstellationData;
  regionData: RegionData;
}

export function MapCanvas({
  mapType,
  mapData,
  constellationData,
  regionData,
}: MapCanvasProps) {
  useEffect(() => {
    return () => setCurrentMapType(null);
  }, []);

  const { spanX, spanY } = useMemo(() => {
    if (isNewEdenMapData(mapData)) {
      const p = mapData.meta.span;
      const s3 = mapData.meta3D.span;
      return { spanX: Math.max(p.x, s3.x), spanY: Math.max(p.y, s3.y) };
    }
    const p = mapData.meta.span;
    return { spanX: p.x, spanY: p.y };
  }, [mapData]);

  setCurrentMapType(mapType);

  return (
    <Suspense fallback={null}>
      <Canvas orthographic camera={{ up: [0, 0, 1] }}>
        <FitCamera
          mapMeta={mapData.meta}
          spanX={spanX}
          spanY={spanY}
          margin={CAMERA_MARGIN}
          z={CAMERA_Z}
        />
        <FrameStatsUpdater />
        <MapMetricsUpdater mapData={mapData} />
        <CaptureBridge />
        <MapScene
          mapData={mapData}
          constellationData={constellationData}
          regionData={regionData}
          cameraZ={CAMERA_Z}
          spanX={spanX}
          spanY={spanY}
        />
      </Canvas>
    </Suspense>
  );
}
