import { useMemo, useRef, useCallback, useContext } from "react";
import * as THREE from "three";
import { useFrame, ThreeEvent } from "@react-three/fiber";
import { pixelToWorld } from "@/lib/system/pixel-scale";
import { useFloatingOriginStore } from "@/stores/system/floating-origin-store";
import { cameraMetrics } from "@/stores/system/camera-metrics-store";
import { killTraversalState } from "@/lib/kill/kill-traversal-state";
import { ControlsContext } from "../../camera-context";
import {
  getSystemSettingsState,
  DEFAULT_CLUSTER_COLOR,
  DEFAULT_CLUSTER_OPACITY,
} from "@/stores/system/system-settings-store";
import {
  billboardPositionGLSL,
  discAlphaGLSL,
} from "./billboard/billboard-shaders";
import { installSphereRaycast } from "./billboard/sphere-raycast";
import {
  exceededDragThreshold,
  originChanged,
  copyOrigin,
} from "./billboard/billboard-interaction";

const MIN_PIXELS = 2;
const qualifyingBuf = new Int32Array(10_000);
const MAX_CLUSTERS = 10_000;

const getOrigin = () => useFloatingOriginStore.getState().origin;

const billboardVertexShader = `
    varying vec2 vUv;

    void main() {
        vUv = uv;
        ${billboardPositionGLSL}
    }
`;
const billboardFragmentShader = `
    precision highp float;
    varying vec2 vUv;
    uniform vec3 uColor;
    uniform float uOpacity;

    void main() {
        ${discAlphaGLSL}
        gl_FragColor = vec4(uColor, alpha * uOpacity);
    }
`;

export function ClusterInstances() {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const lastVersion = useRef(-1);
  const lastClusterColorVersion = useRef(-1);
  const lastOrigin = useRef([NaN, NaN, NaN]);
  const bufferInitialized = useRef(false);
  const raycastInitialized = useRef(false);

  const controlsRef = useContext(ControlsContext);
  const pointerDown = useRef<{ x: number; y: number } | null>(null);
  const pendingClickLocation = useRef<[number, number, number] | null>(null);
  const lastRayWorldPos = useRef<[number, number, number]>([0, 0, 0]);

  const geometry = useMemo(() => new THREE.PlaneGeometry(2, 2), []);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(DEFAULT_CLUSTER_COLOR) },
          uOpacity: { value: DEFAULT_CLUSTER_OPACITY },
        },
        vertexShader: billboardVertexShader,
        fragmentShader: billboardFragmentShader,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  );

  useFrame(() => {
    if (!meshRef.current) return;

    if (!bufferInitialized.current) {
      const arr = meshRef.current.instanceMatrix.array as Float32Array;
      for (let i = 0; i < MAX_CLUSTERS; i++) {
        arr[i * 16 + 15] = 1;
      }
      bufferInitialized.current = true;
    }

    if (!raycastInitialized.current) {
      installSphereRaycast(meshRef.current, getOrigin, (wx, wy, wz) => {
        lastRayWorldPos.current[0] = wx;
        lastRayWorldPos.current[1] = wy;
        lastRayWorldPos.current[2] = wz;
      });
      raycastInitialized.current = true;
    }

    const {
      clusterColor,
      clusterColorVersion,
      clusterOpacity,
      minClusterCount,
      maxClusterPixels,
    } = getSystemSettingsState();
    if (clusterColorVersion !== lastClusterColorVersion.current) {
      material.uniforms.uColor.value.set(clusterColor);
      lastClusterColorVersion.current = clusterColorVersion;
    }
    material.uniforms.uOpacity.value = clusterOpacity;

    const state = killTraversalState;
    const origin = getOrigin();
    const oc = originChanged(origin, lastOrigin.current);

    if (state.version === lastVersion.current && !oc) return;
    lastVersion.current = state.version;
    copyOrigin(origin, lastOrigin.current);

    const count = state.clusterCount;

    if (count === 0) {
      meshRef.current.count = 0;
      return;
    }
    const { halfTanFov, viewportHeight, cameraPos, worldDir } = cameraMetrics;
    const arr = meshRef.current.instanceMatrix.array as Float32Array;

    let maxCount = 1;
    let qualifyingCount = 0;
    const qualifying = qualifyingBuf;
    for (let i = 0; i < count; i++) {
      const killCount = state.clusterKillCount[i];
      if (killCount < minClusterCount) continue;
      qualifying[qualifyingCount++] = i;
      if (killCount > maxCount) maxCount = killCount;
    }
    const logMax = Math.log10(maxCount + 1);

    let renderedCount = 0;
    for (let qi = 0; qi < qualifyingCount; qi++) {
      const i = qualifying[qi];

      const localX = state.clusterX[i] - origin[0];
      const localY = state.clusterY[i] - origin[1];
      const localZ = state.clusterZ[i] - origin[2];

      const toX = localX - cameraPos.x;
      const toY = localY - cameraPos.y;
      const toZ = localZ - cameraPos.z;
      const depth = toX * worldDir.x + toY * worldDir.y + toZ * worldDir.z;

      const normalized = Math.log10(state.clusterKillCount[i] + 1) / logMax;
      const pixels = MIN_PIXELS + normalized * (maxClusterPixels - MIN_PIXELS);

      let scale = 0;
      if (depth > 0) {
        scale = pixelToWorld(pixels, depth, halfTanFov, viewportHeight);
      }

      const base = renderedCount * 16;
      arr[base] = scale;
      arr[base + 5] = scale;
      arr[base + 10] = scale;
      arr[base + 12] = localX;
      arr[base + 13] = localY;
      arr[base + 14] = localZ;
      renderedCount++;
    }

    meshRef.current.count = renderedCount;
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    pointerDown.current = {
      x: e.nativeEvent.clientX,
      y: e.nativeEvent.clientY,
    };

    const hasIcon = e.intersections.some(
      (int) => !(int.object instanceof THREE.InstancedMesh),
    );
    if (hasIcon) {
      pendingClickLocation.current = null;
      return;
    }

    if (e.instanceId !== undefined) {
      const [wx, wy, wz] = lastRayWorldPos.current;
      pendingClickLocation.current = [wx, wy, wz];
    } else {
      pendingClickLocation.current = null;
    }
  }, []);

  const handlePointerUp = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      const pd = pointerDown.current;
      pointerDown.current = null;
      const loc = pendingClickLocation.current;
      pendingClickLocation.current = null;

      if (!pd || !loc || e.button !== 0) return;

      if (
        exceededDragThreshold(
          e.nativeEvent.clientX,
          e.nativeEvent.clientY,
          pd.x,
          pd.y,
        )
      )
        return;

      const hasIcon = e.intersections.some(
        (int) => !(int.object instanceof THREE.InstancedMesh),
      );
      if (hasIcon) return;

      e.stopPropagation();
      controlsRef?.animateTo(loc);
    },
    [controlsRef],
  );

  const handlePointerLeave = useCallback(() => {
    pointerDown.current = null;
    pendingClickLocation.current = null;
  }, []);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, MAX_CLUSTERS]}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      frustumCulled={false}
      renderOrder={8}
    />
  );
}
