import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import {
  SystemKillFlash,
  useSystemKillFeedStore,
} from "@/stores/system/system-kill-feed-store";
import { useFloatingOriginStore } from "@/stores/system/floating-origin-store";
import { cameraMetrics } from "@/stores/system/camera-metrics-store";
import { useSystemSettingsStore } from "@/stores/system/system-settings-store";
import { CAPSULE_IDS } from "@/lib/eve/capsule-ids";
import { SCENE } from "@/lib/scene-colors";

const RING_DURATION_MS = 3000;
const RING_PX_START = 1;
const RING_PX_END = 50;
const RING_COLOR = new THREE.Color(SCENE.KILL_FLASH_RING);

function FlashRing3D({
  flash,
  visible,
}: {
  flash: SystemKillFlash;
  visible: boolean;
}) {
  const removeFlash = useSystemKillFeedStore((s) => s.removeFlash);
  const meshRef = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.MeshBasicMaterial>(null!);
  const startTime = useRef(Date.now());
  const done = useRef(false);

  useFrame(({ camera }) => {
    if (done.current) return;

    const t = Math.min((Date.now() - startTime.current) / RING_DURATION_MS, 1);

    const origin = useFloatingOriginStore.getState().origin;
    if (meshRef.current) {
      const localX = flash.x - origin[0];
      const localY = flash.y - origin[1];
      const localZ = flash.z - origin[2];
      meshRef.current.position.set(localX, localY, localZ);

      const { cameraPos, worldDir, halfTanFov, viewportHeight } = cameraMetrics;
      const toX = localX - cameraPos.x;
      const toY = localY - cameraPos.y;
      const toZ = localZ - cameraPos.z;
      const depth = Math.max(
        toX * worldDir.x + toY * worldDir.y + toZ * worldDir.z,
        1,
      );
      const worldPerPx = (2 * depth * halfTanFov) / viewportHeight;
      const px = RING_PX_START + (RING_PX_END - RING_PX_START) * t;
      meshRef.current.scale.setScalar(px * worldPerPx);
      meshRef.current.quaternion.copy(camera.quaternion);
    }

    if (matRef.current) {
      matRef.current.opacity = 1 - t;
    }

    if (t >= 1) {
      done.current = true;
      removeFlash(flash.id);
    }
  });

  return (
    <mesh ref={meshRef} frustumCulled={false} visible={visible}>
      <ringGeometry args={[1, 1.1, 64]} />
      <meshBasicMaterial
        ref={matRef}
        color={RING_COLOR}
        transparent
        opacity={1}
        depthWrite={false}
        depthTest={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export function KillFlash3D() {
  const showKillFlash = useSystemSettingsStore((s) => s.showKillFlash);
  const showCapsulesInFeed = useSystemSettingsStore(
    (s) => s.showCapsulesInFeed,
  );
  const flashes = useSystemKillFeedStore((s) => s.flashes);

  return (
    <>
      {flashes.map((flash) => (
        <FlashRing3D
          key={flash.id}
          flash={flash}
          visible={
            showKillFlash &&
            (showCapsulesInFeed || !CAPSULE_IDS.includes(flash.shipTypeId))
          }
        />
      ))}
    </>
  );
}
