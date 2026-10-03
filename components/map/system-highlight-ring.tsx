import { useFrame } from "@react-three/fiber";
import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useHighlightedSystemStore } from "@/stores/map/highlighted-system-store";
import { useMapStore } from "@/stores/map/map-store";
import { pointWorldRadius } from "@/lib/map/point-size";

const RING_GAP = 5;

interface SystemHighlightRingProps {
  positions2D: Float32Array;
  systemIDs: number[];
}

export const SystemHighlightRing = React.memo(function SystemHighlightRing({
  positions2D,
  systemIDs,
}: SystemHighlightRingProps) {
  const highlightedId = useHighlightedSystemStore((s) => s.highlightedSystemId);
  const pointScale = useMapStore((s) => s.pointScale);
  const meshRef = useRef<THREE.Mesh>(null!);

  const systemIdToIndex = useMemo(() => {
    const m = new Map<number, number>();
    systemIDs.forEach((id, i) => m.set(id, i));
    return m;
  }, [systemIDs]);

  const idx =
    highlightedId != null ? systemIdToIndex.get(highlightedId) : undefined;

  useFrame(({ camera }) => {
    const mesh = meshRef.current;
    if (!mesh || idx == null) return;
    mesh.position.set(positions2D[idx * 2], positions2D[idx * 2 + 1], 1);
    const zoom = (camera as THREE.OrthographicCamera).zoom;
    mesh.scale.setScalar(pointWorldRadius(zoom, pointScale) * RING_GAP);
  });

  return (
    <mesh
      ref={meshRef}
      frustumCulled={false}
      visible={idx != null}
      renderOrder={20}
    >
      <ringGeometry args={[1, 1.3, 64]} />
      <meshBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.9}
        depthWrite={false}
        depthTest={false}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
});
