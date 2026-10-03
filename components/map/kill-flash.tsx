import { useFrame } from "@react-three/fiber";
import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  KillFlash as KillFlashEntry,
  useKillFeedStore,
} from "@/stores/map/kill-feed-store";
import { useMapStore } from "@/stores/map/map-store";
import { CAPSULE_IDS } from "@/lib/eve/capsule-ids";
import { SCENE } from "@/lib/scene-colors";

const RING_DURATION_MS = 3000;
const RING_BASE_INNER = 8500;
const RING_BASE_OUTER = 11500;
const RING_MAX_SCALE = 20;
const RING_COLOR = new THREE.Color(SCENE.KILL_FLASH_RING);

interface FlashRingProps {
  flash: KillFlashEntry;
  x: number;
  y: number;
  visible: boolean;
}

const FlashRing = React.memo(function FlashRing({
  flash,
  x,
  y,
  visible,
}: FlashRingProps) {
  const removeFlash = useKillFeedStore((s) => s.removeFlash);
  const meshRef = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.MeshBasicMaterial>(null!);
  const startTime = useRef(Date.now());
  const done = useRef(false);

  useFrame(({ camera }) => {
    if (done.current) return;
    const t = Math.min((Date.now() - startTime.current) / RING_DURATION_MS, 1);
    const zoom = (camera as THREE.OrthographicCamera).zoom;

    if (meshRef.current) {
      const scale = (1 + (RING_MAX_SCALE - 1) * t) / zoom;
      meshRef.current.scale.set(scale, scale, 1);
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
    <mesh ref={meshRef} position={[x, y, 1]} visible={visible}>
      <ringGeometry args={[RING_BASE_INNER, RING_BASE_OUTER, 64]} />
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
});

interface KillFlashProps {
  positions2D: Float32Array;
  systemIDs: number[];
}

export const KillFlash = React.memo(function KillFlash({
  positions2D,
  systemIDs,
}: KillFlashProps) {
  const showKillFlash = useMapStore((s) => s.showKillFlash);
  const showCapsulesInFeed = useMapStore((s) => s.showCapsulesInFeed);
  const morphActive = useMapStore((s) => s.morphActive);
  const flashes = useKillFeedStore((s) => s.flashes);
  const removeFlash = useKillFeedStore((s) => s.removeFlash);

  const systemIdToIndex = useMemo(() => {
    const map = new Map<number, number>();
    systemIDs.forEach((id, i) => map.set(id, i));
    return map;
  }, [systemIDs]);

  useEffect(() => {
    for (const flash of flashes) {
      if (!systemIdToIndex.has(flash.systemId)) removeFlash(flash.id);
    }
  }, [flashes, systemIdToIndex, removeFlash]);

  return (
    <>
      {flashes.map((flash) => {
        const idx = systemIdToIndex.get(flash.systemId);
        if (idx == null) return null;
        const x = positions2D[idx * 2];
        const y = positions2D[idx * 2 + 1];
        return (
          <FlashRing
            key={flash.id}
            flash={flash}
            x={x}
            y={y}
            visible={
              !morphActive &&
              showKillFlash &&
              (showCapsulesInFeed || !CAPSULE_IDS.includes(flash.shipTypeId))
            }
          />
        );
      })}
    </>
  );
});
