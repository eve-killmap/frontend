import { useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useObjectLodStore } from "@/stores/system/object-lod-store";
import { useFloatingOriginStore } from "@/stores/system/floating-origin-store";
import { cameraMetrics } from "@/stores/system/camera-metrics-store";

type ObjectLodState = { visible: boolean };

export function ObjectLODManager() {
  const { camera, size } = useThree();
  const metas = useObjectLodStore((s) => s.metas);
  const prevState = useObjectLodStore((s) => s.state);
  const setNext = useObjectLodStore((s) => s.setNext);

  const origin = useFloatingOriginStore((s) => s.origin);

  const tmpWorld = useRef(new THREE.Vector3());
  const camWorld = useRef(new THREE.Vector3());

  const lastCameraVersion = useRef(-1);
  const cameraLast = useRef({ ox: NaN, oy: NaN, oz: NaN });
  const lastMetas = useRef<typeof metas | null>(null);

  const nextBuf = useRef(new Map<number, ObjectLodState>());

  useFrame(() => {
    if (metas.size === 0) return;

    const metasChanged = metas !== lastMetas.current;
    const camLast = cameraLast.current;
    const moved =
      cameraMetrics.cameraVersion !== lastCameraVersion.current ||
      camLast.ox !== origin[0] ||
      camLast.oy !== origin[1] ||
      camLast.oz !== origin[2];

    if (!moved && !metasChanged) return;

    lastCameraVersion.current = cameraMetrics.cameraVersion;
    camLast.ox = origin[0];
    camLast.oy = origin[1];
    camLast.oz = origin[2];
    lastMetas.current = metas;

    camWorld.current.set(
      camera.position.x + origin[0],
      camera.position.y + origin[1],
      camera.position.z + origin[2],
    );

    const perspectiveCam = camera as THREE.PerspectiveCamera;
    const fovRad = (perspectiveCam.fov * Math.PI) / 180;
    const tanHalfFov = Math.tan(fovRad / 2);

    const next = nextBuf.current;
    next.clear();

    for (const it of metas.values()) {
      const wpos = it.getWorldPos(tmpWorld.current);
      const dist = wpos.distanceTo(camWorld.current);
      const pxPerWorld = size.height / (2 * dist * tanHalfFov);
      const pxR = it.worldRadius * pxPerWorld;

      const prev = prevState.get(it.id)?.visible ?? true;
      const h = it.hysteresisPx ?? 0;
      const showThresh = it.minPixelRadius + h;
      const hideThresh = it.minPixelRadius - h;

      const visible = prev ? pxR >= hideThresh : pxR >= showThresh;
      next.set(it.id, { visible });
    }

    setNext(next);
  }, -1);

  return null;
}
