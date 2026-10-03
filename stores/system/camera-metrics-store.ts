import * as THREE from "three";

export const cameraMetrics = {
  worldDir: new THREE.Vector3(),
  cameraPos: new THREE.Vector3(),
  controlsTarget: new THREE.Vector3(),
  fovRadians: 0,
  halfTanFov: 0,
  viewportHeight: 0,
  viewportWidth: 0,
  zoom: 0,
  cameraVersion: 0,
};
