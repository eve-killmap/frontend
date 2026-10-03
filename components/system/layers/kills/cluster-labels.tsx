import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import { useFloatingOriginStore } from "@/stores/system/floating-origin-store";
import { cameraMetrics } from "@/stores/system/camera-metrics-store";
import { killTraversalState } from "@/lib/kill/kill-traversal-state";
import { getSystemSettingsState } from "@/stores/system/system-settings-store";
import { SCENE } from "@/lib/scene-colors";
import { pixelToWorld } from "@/lib/system/pixel-scale";

const LABEL_COLOR = SCENE.CLUSTER_LABEL;
const LABEL_PIXELS = 14;
const POOL_SIZE = 500;
const LABEL_PADDING = 2;

const getOrigin = () => useFloatingOriginStore.getState().origin;

function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
}

type Candidate = {
  clusterIdx: number;
  depth: number;
  screenX: number;
  screenY: number;
};
type Rect = { l: number; t: number; r: number; b: number };

function rectsOverlap(a: Rect, b: Rect) {
  return !(a.r < b.l || a.l > b.r || a.b < b.t || a.t > b.b);
}

const CELL = 64;
const gridKey = (cx: number, cy: number) => (cx << 16) ^ cy;

function gridQuery(gridMap: Map<number, Rect[]>, rect: Rect): boolean {
  const minX = Math.floor(rect.l / CELL);
  const maxX = Math.floor(rect.r / CELL);
  const minY = Math.floor(rect.t / CELL);
  const maxY = Math.floor(rect.b / CELL);
  for (let cy = minY; cy <= maxY; cy++) {
    for (let cx = minX; cx <= maxX; cx++) {
      const cell = gridMap.get(gridKey(cx, cy));
      if (!cell) continue;
      for (const p of cell) if (rectsOverlap(rect, p)) return true;
    }
  }
  return false;
}

function gridInsert(gridMap: Map<number, Rect[]>, rect: Rect): void {
  const minX = Math.floor(rect.l / CELL);
  const maxX = Math.floor(rect.r / CELL);
  const minY = Math.floor(rect.t / CELL);
  const maxY = Math.floor(rect.b / CELL);
  for (let cy = minY; cy <= maxY; cy++) {
    for (let cx = minX; cx <= maxX; cx++) {
      const k = gridKey(cx, cy);
      const cell = gridMap.get(k);
      if (cell) cell.push(rect);
      else gridMap.set(k, [rect]);
    }
  }
}

export const ClusterLabels = React.memo(function ClusterLabels() {
  const { camera, size } = useThree();
  const billboardRefs = useRef<(THREE.Group | null)[]>([]);
  type TextInstance = THREE.Mesh & { text: string };
  const textRefs = useRef<(TextInstance | null)[]>([]);
  const lastTexts = useRef<string[]>(new Array(POOL_SIZE).fill(""));
  const lastVersion = useRef(-1);
  const lastOrigin = useRef([NaN, NaN, NaN]);
  const tmpProject = useRef(new THREE.Vector3());
  const gridMapRef = useRef(new Map<number, Rect[]>());

  const billboardRefSetters = useMemo(
    () =>
      Array.from(
        { length: POOL_SIZE },
        (_, index) => (el: THREE.Group | null) => {
          billboardRefs.current[index] = el;
        },
      ),
    [],
  );

  const textRefSetters = useMemo(
    () =>
      Array.from(
        { length: POOL_SIZE },
        (_, index) => (el: TextInstance | null) => {
          textRefs.current[index] = el;
        },
      ),
    [],
  );

  useFrame(() => {
    const state = killTraversalState;
    const origin = getOrigin();
    const originChanged =
      origin[0] !== lastOrigin.current[0] ||
      origin[1] !== lastOrigin.current[1] ||
      origin[2] !== lastOrigin.current[2];

    if (state.version === lastVersion.current && !originChanged) return;
    lastVersion.current = state.version;
    lastOrigin.current[0] = origin[0];
    lastOrigin.current[1] = origin[1];
    lastOrigin.current[2] = origin[2];
    const { cameraPos, worldDir, halfTanFov, viewportHeight } = cameraMetrics;

    const candidates: Candidate[] = [];
    for (let i = 0; i < state.clusterCount; i++) {
      if (state.clusterKillCount[i] < getSystemSettingsState().minClusterCount)
        continue;

      const localX = state.clusterX[i] - origin[0];
      const localY = state.clusterY[i] - origin[1];
      const localZ = state.clusterZ[i] - origin[2];

      const toX = localX - cameraPos.x;
      const toY = localY - cameraPos.y;
      const toZ = localZ - cameraPos.z;
      const depth = toX * worldDir.x + toY * worldDir.y + toZ * worldDir.z;
      if (depth <= 0) continue;

      tmpProject.current.set(localX, localY, localZ).project(camera);
      const screenX = (tmpProject.current.x * 0.5 + 0.5) * size.width;
      const screenY = (-tmpProject.current.y * 0.5 + 0.5) * size.height;

      candidates.push({ clusterIdx: i, depth, screenX, screenY });
    }

    candidates.sort(
      (a, b) =>
        state.clusterKillCount[b.clusterIdx] -
        state.clusterKillCount[a.clusterIdx],
    );

    const gridMap = gridMapRef.current;
    gridMap.clear();

    const visible: Candidate[] = [];

    for (const c of candidates) {
      const text = formatCount(state.clusterKillCount[c.clusterIdx]);
      const halfW = (text.length * LABEL_PIXELS * 0.5 + LABEL_PADDING) / 2;
      const halfH = (LABEL_PIXELS + LABEL_PADDING) / 2;
      const rect: Rect = {
        l: c.screenX - halfW,
        t: c.screenY - halfH,
        r: c.screenX + halfW,
        b: c.screenY + halfH,
      };

      if (!gridQuery(gridMap, rect)) {
        gridInsert(gridMap, rect);
        visible.push(c);
        if (visible.length >= POOL_SIZE) break;
      }
    }

    for (let slot = 0; slot < visible.length; slot++) {
      const c = visible[slot];
      const bb = billboardRefs.current[slot];
      if (!bb) continue;

      const localX = state.clusterX[c.clusterIdx] - origin[0];
      const localY = state.clusterY[c.clusterIdx] - origin[1];
      const localZ = state.clusterZ[c.clusterIdx] - origin[2];

      bb.position.set(localX, localY, localZ);

      bb.scale.setScalar(
        pixelToWorld(LABEL_PIXELS, c.depth, halfTanFov, viewportHeight),
      );
      bb.visible = true;

      const text = formatCount(state.clusterKillCount[c.clusterIdx]);
      if (text !== lastTexts.current[slot]) {
        const textObj = textRefs.current[slot];
        if (textObj) textObj.text = text;
        lastTexts.current[slot] = text;
      }
    }

    for (let j = visible.length; j < POOL_SIZE; j++) {
      const bb = billboardRefs.current[j];
      if (bb) bb.visible = false;
    }
  });

  const items = [];
  for (let i = 0; i < POOL_SIZE; i++) {
    items.push(
      <Billboard key={i} ref={billboardRefSetters[i]} visible={false}>
        <Text
          ref={textRefSetters[i]}
          position={[0, -1.2, 0.001]}
          fontSize={0.8}
          color={LABEL_COLOR}
          font="/fonts/SpaceMono-Regular.ttf"
          outlineWidth={0.05}
          outlineColor="black"
          anchorX="center"
          anchorY="middle"
          raycast={() => null}
          renderOrder={9}
        >
          {" "}
        </Text>
      </Billboard>,
    );
  }

  return <group>{items}</group>;
});
