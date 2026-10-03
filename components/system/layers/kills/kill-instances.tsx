import { useMemo, useRef, useCallback, useContext } from "react";
import * as THREE from "three";
import { useFrame, ThreeEvent } from "@react-three/fiber";
import { useKillStore } from "@/stores/kill-store";
import { useKillHoverStore } from "@/stores/system/kill-hover-store";
import { useFloatingOriginStore } from "@/stores/system/floating-origin-store";
import { getSystemSettingsState } from "@/stores/system/system-settings-store";
import { cameraMetrics } from "@/stores/system/camera-metrics-store";
import { killTraversalState } from "@/lib/kill/kill-traversal-state";
import { usePlaybackStore } from "@/stores/system/playback-store";
import { ControlsContext } from "../../camera-context";
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

const MAX_INDIVIDUALS = 200_000;

const getOrigin = () => useFloatingOriginStore.getState().origin;

const billboardVertexShader = `
    attribute vec3 instanceColor;
    attribute float instanceOpacity;
    varying vec2 vUv;
    varying vec3 vColor;
    varying float vInstanceOpacity;

    void main() {
        vUv = uv;
        vColor = instanceColor;
        vInstanceOpacity = instanceOpacity;
        ${billboardPositionGLSL}
    }
`;
const billboardFragmentShader = `
    precision highp float;
    varying vec2 vUv;
    varying vec3 vColor;
    varying float vInstanceOpacity;
    uniform float uOpacity;
    uniform bool uUseInstanceOpacity;

    void main() {
        ${discAlphaGLSL}
        float killOpacity = uUseInstanceOpacity ? vInstanceOpacity : 1.0;
        gl_FragColor = vec4(vColor, alpha * uOpacity * killOpacity);
    }
`;

const _col = new THREE.Color();
const _hexRgbCache = new Map<string, [number, number, number]>();
function hexToRgb(hex: string): [number, number, number] {
  let rgb = _hexRgbCache.get(hex);
  if (rgb === undefined) {
    _col.set(hex);
    rgb = [_col.r, _col.g, _col.b];
    _hexRgbCache.set(hex, rgb);
  }
  return rgb;
}

export function KillInstances() {
  const octree = useKillStore((s) => s.octree);

  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const lastVersion = useRef(-1);
  const lastColorVersion = useRef(-1);
  const lastOrigin = useRef([NaN, NaN, NaN]);
  const initializedMesh = useRef<THREE.InstancedMesh | null>(null);
  const colorCache = useRef(new Map<number, [number, number, number]>());

  const { geometry, colorAttribute, opacityAttribute } = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(2, 2);
    const colorAttribute = new THREE.InstancedBufferAttribute(
      new Float32Array(MAX_INDIVIDUALS * 3),
      3,
    );
    const opacityAttribute = new THREE.InstancedBufferAttribute(
      new Float32Array(MAX_INDIVIDUALS).fill(1),
      1,
    );
    geometry.setAttribute("instanceColor", colorAttribute);
    geometry.setAttribute("instanceOpacity", opacityAttribute);
    return { geometry, colorAttribute, opacityAttribute };
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uOpacity: { value: 0.5 },
          uUseInstanceOpacity: { value: false },
        },
        vertexShader: billboardVertexShader,
        fragmentShader: billboardFragmentShader,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  );

  const lastPlaybackActive = useRef(false);

  useFrame(() => {
    if (!meshRef.current || !octree) return;

    material.uniforms.uOpacity.value = getSystemSettingsState().killOpacity;

    const isPlaybackActive = usePlaybackStore.getState().isActive;
    material.uniforms.uUseInstanceOpacity.value = isPlaybackActive;
    const playbackJustChanged = isPlaybackActive !== lastPlaybackActive.current;
    lastPlaybackActive.current = isPlaybackActive;

    if (meshRef.current !== initializedMesh.current) {
      const arr = meshRef.current.instanceMatrix.array as Float32Array;
      for (let i = 0; i < MAX_INDIVIDUALS; i++) {
        arr[i * 16 + 15] = 1;
      }

      installSphereRaycast(meshRef.current);

      initializedMesh.current = meshRef.current;
    }

    const state = killTraversalState;
    const origin = getOrigin();
    const oc = originChanged(origin, lastOrigin.current);

    const {
      colorVersion,
      typeColors,
      groupColors,
      typeGroupMap,
      defaultColor,
    } = getSystemSettingsState();
    const colorChanged = colorVersion !== lastColorVersion.current;

    if (state.version === lastVersion.current && !oc && !colorChanged) return;

    lastVersion.current = state.version;
    copyOrigin(origin, lastOrigin.current);

    if (colorChanged) {
      lastColorVersion.current = colorVersion;
      colorCache.current.clear();
    }

    const count = state.individualCount;
    meshRef.current.count = count;

    if (count === 0) return;

    const { halfTanFov, viewportHeight, cameraPos, worldDir } = cameraMetrics;
    const killPixels = getSystemSettingsState().killPixels;
    const arr = meshRef.current.instanceMatrix.array as Float32Array;
    const colorArr = colorAttribute.array as Float32Array;
    const defaultRgb = hexToRgb(defaultColor);

    for (let i = 0; i < count; i++) {
      const killIdx = state.individualKillIndices[i];
      const localX = octree.srcX[killIdx] - origin[0];
      const localY = octree.srcY[killIdx] - origin[1];
      const localZ = octree.srcZ[killIdx] - origin[2];

      const toX = localX - cameraPos.x;
      const toY = localY - cameraPos.y;
      const toZ = localZ - cameraPos.z;
      const depth = toX * worldDir.x + toY * worldDir.y + toZ * worldDir.z;

      let scale = 0;
      if (depth > 0) {
        scale = (killPixels * (2 * depth * halfTanFov)) / viewportHeight;
      }

      const base = i * 16;
      arr[base] = scale;
      arr[base + 5] = scale;
      arr[base + 10] = scale;
      arr[base + 12] = localX;
      arr[base + 13] = localY;
      arr[base + 14] = localZ;

      const shipTypeId = octree.srcShipTypes[killIdx];
      let rgb = colorCache.current.get(shipTypeId);
      if (rgb === undefined) {
        const tc = typeColors[shipTypeId];
        if (tc) {
          rgb = hexToRgb(tc);
        } else {
          const gid = typeGroupMap[shipTypeId];
          const gc = gid !== undefined ? groupColors[gid] : undefined;
          rgb = gc ? hexToRgb(gc) : defaultRgb;
        }
        colorCache.current.set(shipTypeId, rgb);
      }

      const cb = i * 3;
      colorArr[cb] = rgb[0];
      colorArr[cb + 1] = rgb[1];
      colorArr[cb + 2] = rgb[2];
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    colorAttribute.needsUpdate = true;

    if (isPlaybackActive) {
      const opacityArr = opacityAttribute.array as Float32Array;
      for (let i = 0; i < count; i++)
        opacityArr[i] = state.individualOpacities[i];
      opacityAttribute.needsUpdate = true;
    } else if (playbackJustChanged) {
      const opacityArr = opacityAttribute.array as Float32Array;
      opacityArr.fill(1);
      opacityAttribute.needsUpdate = true;
    }
  });

  const controlsRef = useContext(ControlsContext);
  const pointerDown = useRef<{ x: number; y: number } | null>(null);
  const lastHoveredInstance = useRef<number | null>(null);
  const pendingClickKillId = useRef<number | null>(null);
  const pendingClickKillLocation = useRef<[number, number, number] | null>(
    null,
  );

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      pointerDown.current = {
        x: e.nativeEvent.clientX,
        y: e.nativeEvent.clientY,
      };

      const hasIcon = e.intersections.some(
        (int) => !(int.object instanceof THREE.InstancedMesh),
      );
      if (hasIcon) {
        pendingClickKillId.current = null;
        return;
      }

      const hovered = useKillHoverStore.getState().killId;
      if (hovered) {
        pendingClickKillId.current = hovered;
        pendingClickKillLocation.current =
          useKillHoverStore.getState().killPosition;
      } else if (e.instanceId !== undefined && octree) {
        const killIdx = killTraversalState.individualKillIndices[e.instanceId];
        pendingClickKillId.current = octree.srcKillmailIds[killIdx] ?? null;
        pendingClickKillLocation.current = [
          octree.srcX[killIdx],
          octree.srcY[killIdx],
          octree.srcZ[killIdx],
        ];
      } else {
        pendingClickKillId.current = null;
        pendingClickKillLocation.current = null;
      }
    },
    [octree],
  );

  const handlePointerUp = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      const pd = pointerDown.current;
      pointerDown.current = null;
      const killId = pendingClickKillId.current;
      pendingClickKillId.current = null;
      const killLoc = pendingClickKillLocation.current;
      pendingClickKillLocation.current = null;

      if (!pd || !killId || !killLoc) return;

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
      if (e.button == 0) {
        controlsRef?.animateTo(killLoc);
      } else if (e.button == 2) {
        window.open(
          `https://zkillboard.com/kill/${killId}/`,
          "_blank",
          "noopener,noreferrer",
        );
      }
    },
    [controlsRef],
  );

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (pointerDown.current) {
        if (
          exceededDragThreshold(
            e.nativeEvent.clientX,
            e.nativeEvent.clientY,
            pointerDown.current.x,
            pointerDown.current.y,
          )
        ) {
          if (lastHoveredInstance.current !== null) {
            lastHoveredInstance.current = null;
            useKillHoverStore.getState().clearHovered();
          }
        }
        return;
      }

      const hasIcon = e.intersections.some(
        (int) => !(int.object instanceof THREE.InstancedMesh),
      );
      if (hasIcon || e.instanceId === undefined || !octree) {
        if (lastHoveredInstance.current !== null) {
          lastHoveredInstance.current = null;
          useKillHoverStore.getState().clearHovered();
        }
        return;
      }

      useKillHoverStore
        .getState()
        .setMousePos(e.nativeEvent.clientX, e.nativeEvent.clientY);

      if (e.instanceId === lastHoveredInstance.current) return;
      lastHoveredInstance.current = e.instanceId;

      const killIdx = killTraversalState.individualKillIndices[e.instanceId];
      const killId = octree.srcKillmailIds[killIdx];
      if (!killId) return;

      const shipTypeId = octree.srcShipTypes[killIdx] ?? 0;
      const killTime = octree.srcKillmailTimes[killIdx] ?? 0;
      const killPosition: [number, number, number] = [
        octree.srcX[killIdx],
        octree.srcY[killIdx],
        octree.srcZ[killIdx],
      ];
      useKillHoverStore
        .getState()
        .setHovered(killId, shipTypeId, killTime, killPosition);
    },
    [octree],
  );

  const handlePointerLeave = useCallback(() => {
    lastHoveredInstance.current = null;
    pointerDown.current = null;
    pendingClickKillId.current = null;
    pendingClickKillLocation.current = null;
    useKillHoverStore.getState().clearHovered();
  }, []);

  if (!octree) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, MAX_INDIVIDUALS]}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      frustumCulled={false}
      renderOrder={8}
    />
  );
}
