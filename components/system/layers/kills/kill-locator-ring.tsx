import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useLocatedKillStore } from "@/stores/system/located-kill-store";
import { useFloatingOriginStore } from "@/stores/system/floating-origin-store";
import { cameraMetrics } from "@/stores/system/camera-metrics-store";

const RING_PX = 12;

export function KillLocatorRing() {
  const position = useLocatedKillStore((s) => s.position);
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame(({ camera }) => {
    const mesh = meshRef.current;
    if (!mesh || !position) return;

    const origin = useFloatingOriginStore.getState().origin;
    const localX = position[0] - origin[0];
    const localY = position[1] - origin[1];
    const localZ = position[2] - origin[2];
    mesh.position.set(localX, localY, localZ);

    const { cameraPos, worldDir, halfTanFov, viewportHeight } = cameraMetrics;
    const toX = localX - cameraPos.x;
    const toY = localY - cameraPos.y;
    const toZ = localZ - cameraPos.z;
    const depth = Math.max(
      toX * worldDir.x + toY * worldDir.y + toZ * worldDir.z,
      1,
    );
    const worldPerPx = (2 * depth * halfTanFov) / viewportHeight;
    mesh.scale.setScalar(RING_PX * worldPerPx);
    mesh.quaternion.copy(camera.quaternion);
  });

  return (
    <mesh
      ref={meshRef}
      frustumCulled={false}
      visible={position !== null}
      renderOrder={20}
    >
      <ringGeometry args={[1, 1.25, 64]} />
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
}
