import { MetaData } from "@/lib/schema/map-schema";
import { getMapCameraState } from "@/stores/map/map-camera-state-store";
import { fitHalfExtents } from "@/lib/map/map-camera";
import { useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

interface FitCameraProps {
  mapMeta: MetaData;
  spanX: number;
  spanY: number;
  margin: number;
  z: number;
}

export function FitCamera({
  mapMeta,
  spanX,
  spanY,
  margin,
  z,
}: FitCameraProps) {
  const { camera, size } = useThree();

  const { initialCameraPosition, initialZoom } = useMemo(() => {
    const cached = getMapCameraState();

    if (cached)
      return {
        initialCameraPosition: cached.cameraPosition,
        initialZoom: cached.zoom,
      };
    else return { initialCameraPosition: null, initialZoom: null };
  }, []);

  useLayoutEffect(() => {
    const cam = camera as THREE.OrthographicCamera;
    cam.zoom = initialZoom ?? 1;
    cam.near = -1000;
    cam.far = 10_000_000;
    cam.position.set(
      initialCameraPosition?.[0] ?? 0,
      initialCameraPosition?.[1] ?? 0,
      z,
    );
    cam.updateProjectionMatrix();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapMeta]);

  const prevSpan = useRef<{ x: number; y: number } | null>(null);

  useLayoutEffect(() => {
    const cam = camera as THREE.OrthographicCamera;
    const aspect = size.width / size.height;
    const { halfW, halfH } = fitHalfExtents(spanX, spanY, margin, aspect);

    const prev = prevSpan.current;
    if (prev && (prev.x !== spanX || prev.y !== spanY)) {
      const before = fitHalfExtents(prev.x, prev.y, margin, aspect);
      if (before.halfW > 0) cam.zoom *= halfW / before.halfW;
    }
    prevSpan.current = { x: spanX, y: spanY };

    cam.left = -halfW;
    cam.right = halfW;
    cam.top = halfH;
    cam.bottom = -halfH;
    cam.updateProjectionMatrix();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, spanX, spanY, margin]);

  return null;
}
