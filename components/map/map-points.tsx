import { ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import * as THREE from "three";
import { slugify } from "@/lib/formatting/slugify";
import { useMapStore } from "@/stores/map/map-store";
import { navigateTo } from "@/lib/navigation-functions";
import { mapMorphState } from "@/lib/map/map-morph-state";
import {
  POINT_GEOMETRY_RADIUS,
  ZOOM_SIZE_COMPENSATION,
} from "@/lib/map/point-size";

const tempM = new THREE.Matrix4();
const tempP = new THREE.Vector3();
const tempQ = new THREE.Quaternion();
const tempS = new THREE.Vector3();

interface MapPointsProps {
  positions2D: Float32Array;
  systemIDs: number[];
  names: string[];
  colors: Float32Array;
  pointScale: number;
}

const HIT_PADDING = 1.4;

export const MapPoints = React.memo(function MapPoints({
  positions2D,
  systemIDs,
  names,
  colors,
  pointScale,
}: MapPointsProps) {
  const colorBuffer = useMemo(
    () => new Float32Array((positions2D.length / 2) * 3),
    [positions2D.length],
  );
  const colorAttr = useRef<THREE.InstancedBufferAttribute>(null!);

  useLayoutEffect(() => {
    colorBuffer.set(colors);
    if (colorAttr.current) colorAttr.current.needsUpdate = true;
  }, [colors, colorBuffer]);

  const { camera } = useThree();
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const hitboxRef = useRef<THREE.InstancedMesh>(null!);
  const prevZoom = useRef<number | null>(null);
  const prevMorphT = useRef<number>(mapMorphState.t);
  const pointScaleRef = useRef(pointScale);
  pointScaleRef.current = pointScale;

  const setHoveredSystemIndex = useMapStore((s) => s.setHoveredSystemIndex);

  useEffect(() => {
    return () => setHoveredSystemIndex(null);
  }, [setHoveredSystemIndex]);

  const getSystemLabel = useCallback(
    (i: number) => {
      const id = systemIDs[i];
      const name = names[i];

      return { id, name };
    },
    [systemIDs, names],
  );

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    const hitbox = hitboxRef.current;
    if (!mesh || !hitbox) return;

    updateMatrices(positions2D, mesh, hitbox, camera.zoom, pointScale);
    prevZoom.current = camera.zoom;
  }, [positions2D, camera, pointScale]);

  useFrame(() => {
    const mesh = meshRef.current;
    const hitbox = hitboxRef.current;
    if (!mesh || !hitbox) return;

    const zoom = camera.zoom;
    const morphT = mapMorphState.t;
    if (zoom === prevZoom.current && morphT === prevMorphT.current) return;

    prevZoom.current = zoom;
    prevMorphT.current = morphT;
    updateMatrices(positions2D, mesh, hitbox, zoom, pointScaleRef.current);
  });

  const onPointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      setHoveredSystemIndex(e.instanceId ?? null);
    },
    [setHoveredSystemIndex],
  );

  const onPointerOut = useCallback(() => {
    setHoveredSystemIndex(null);
  }, [setHoveredSystemIndex]);

  const onClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (e.instanceId != null) {
        const clicked = getSystemLabel(e.instanceId);
        const slug = slugify(clicked.name);
        navigateTo?.(`/${slug}`);
      }
    },
    [getSystemLabel],
  );

  return (
    <group>
      <instancedMesh
        ref={hitboxRef}
        args={[undefined, undefined, positions2D.length / 2]}
        frustumCulled={false}
        onPointerMove={onPointerMove}
        onPointerOut={onPointerOut}
        onClick={onClick}
      >
        <circleGeometry args={[POINT_GEOMETRY_RADIUS, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </instancedMesh>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, positions2D.length / 2]}
        frustumCulled={false}
        raycast={() => null}
        renderOrder={1}
      >
        <circleGeometry args={[POINT_GEOMETRY_RADIUS, 64]}>
          <instancedBufferAttribute
            ref={colorAttr}
            attach="attributes-color"
            args={[colorBuffer, 3]}
          />
        </circleGeometry>
        <meshBasicMaterial vertexColors />
      </instancedMesh>
    </group>
  );
});

function updateMatrices(
  positions2D: Float32Array,
  mesh: THREE.InstancedMesh,
  hitbox: THREE.InstancedMesh,
  zoom: number,
  pointScale: number,
) {
  const n = positions2D.length / 2;
  const baseScale = 1 / Math.pow(zoom, ZOOM_SIZE_COMPENSATION);
  const pointS = baseScale * pointScale;

  for (let i = 0; i < n; i++) {
    tempP.set(positions2D[i * 2], positions2D[i * 2 + 1], 0);

    tempS.set(pointS, pointS, 1);
    tempM.compose(tempP, tempQ, tempS);
    mesh.setMatrixAt(i, tempM);

    const hitS = pointS * HIT_PADDING;
    tempS.set(hitS, hitS, 1);
    tempM.compose(tempP, tempQ, tempS);
    hitbox.setMatrixAt(i, tempM);
  }

  mesh.instanceMatrix.needsUpdate = true;
  hitbox.instanceMatrix.needsUpdate = true;

  mesh.boundingSphere = null;
  hitbox.boundingSphere = null;
}
