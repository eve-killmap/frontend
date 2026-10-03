import { useContext } from "react";
import { cameraMetrics } from "@/stores/system/camera-metrics-store";
import { ControlsContext } from "@/components/system/camera-context";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

export function CameraMetricsUpdater() {
  const { camera, size } = useThree();
  const controls = useContext(ControlsContext);
  const prev = useRef({
    px: NaN,
    py: NaN,
    pz: NaN,
    dx: NaN,
    dy: NaN,
    dz: NaN,
    fov: NaN,
    h: 0,
    w: 0,
    zoom: NaN,
  });

  useFrame(() => {
    camera.getWorldDirection(cameraMetrics.worldDir);
    cameraMetrics.cameraPos.copy(camera.position);

    const controlsRef = controls?.controlsRef.current;
    if (controlsRef) cameraMetrics.controlsTarget.copy(controlsRef.target);

    const cam = camera as THREE.PerspectiveCamera;
    cameraMetrics.fovRadians = (cam.fov * Math.PI) / 180;
    cameraMetrics.halfTanFov = Math.tan(cameraMetrics.fovRadians / 2);
    cameraMetrics.viewportHeight = size.height;
    cameraMetrics.viewportWidth = size.width;
    cameraMetrics.zoom = camera.zoom;

    const p = prev.current;
    const { x: px, y: py, z: pz } = camera.position;
    const { x: dx, y: dy, z: dz } = cameraMetrics.worldDir;
    const { fovRadians: fov } = cameraMetrics;
    const { width: w, height: h } = size;
    const zoom = camera.zoom;

    if (
      Math.abs(px - p.px) > 1e-6 ||
      Math.abs(py - p.py) > 1e-6 ||
      Math.abs(pz - p.pz) > 1e-6 ||
      Math.abs(dx - p.dx) > 1e-6 ||
      Math.abs(dy - p.dy) > 1e-6 ||
      Math.abs(dz - p.dz) > 1e-6 ||
      fov !== p.fov ||
      w !== p.w ||
      h !== p.h ||
      zoom !== p.zoom
    ) {
      cameraMetrics.cameraVersion++;
      p.px = px;
      p.py = py;
      p.pz = pz;
      p.dx = dx;
      p.dy = dy;
      p.dz = dz;
      p.fov = fov;
      p.w = w;
      p.h = h;
      p.zoom = zoom;
    }
  }, -10);

  return null;
}
