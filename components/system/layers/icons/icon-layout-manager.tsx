import { useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useIconLayoutStore } from "@/stores/system/icon-layout-store";
import { useHiddenStore } from "@/stores/system/hidden-store";
import { useFloatingOriginStore } from "@/stores/system/floating-origin-store";
import { cameraMetrics } from "@/stores/system/camera-metrics-store";

const ICON_PIXELS = 16;
const PADDING = 0;

interface Rect {
  l: number;
  t: number;
  r: number;
  b: number;
}

function rectsOverlap(a: Rect, b: Rect) {
  return !(a.r < b.l || a.l > b.r || a.b < b.t || a.t > b.b);
}

interface Cand {
  id: number;
  priority: number;
  dist: number;
  rect: Rect;
  depth: number;
}

const candPool: Cand[] = [];
function getCand(i: number): Cand {
  let c = candPool[i];
  if (c === undefined) {
    c = {
      id: 0,
      priority: 0,
      dist: 0,
      rect: { l: 0, t: 0, r: 0, b: 0 },
      depth: 0,
    };
    candPool[i] = c;
  }
  return c;
}

const liveCands: Cand[] = [];
const grid = new Map<number, Cand[]>();
const gridBucketPool: Cand[][] = [];
const nextBuf = new Map<number, { visible: boolean }>();
const hiddenBuf = new Map<number, number[]>();

const CELL_SIZE = 64;
const keyOf = (cx: number, cy: number) => (cx << 16) ^ cy;
let bucketPoolTop = 0;

const candCompare = (a: Cand, b: Cand) =>
  b.priority - a.priority || a.dist - b.dist;

function queryGrid(c: Cand): number | null {
  const minX = Math.floor(c.rect.l / CELL_SIZE);
  const maxX = Math.floor(c.rect.r / CELL_SIZE);
  const minY = Math.floor(c.rect.t / CELL_SIZE);
  const maxY = Math.floor(c.rect.b / CELL_SIZE);
  for (let cy = minY; cy <= maxY; cy++) {
    for (let cx = minX; cx <= maxX; cx++) {
      const arr = grid.get(keyOf(cx, cy));
      if (!arr) continue;
      for (const o of arr) if (rectsOverlap(c.rect, o.rect)) return o.id;
    }
  }
  return null;
}

function insertGrid(c: Cand) {
  const minX = Math.floor(c.rect.l / CELL_SIZE);
  const maxX = Math.floor(c.rect.r / CELL_SIZE);
  const minY = Math.floor(c.rect.t / CELL_SIZE);
  const maxY = Math.floor(c.rect.b / CELL_SIZE);
  for (let cy = minY; cy <= maxY; cy++) {
    for (let cx = minX; cx <= maxX; cx++) {
      const k = keyOf(cx, cy);
      let arr = grid.get(k);
      if (!arr) {
        arr = gridBucketPool[bucketPoolTop];
        if (arr === undefined) {
          arr = [];
          gridBucketPool[bucketPoolTop] = arr;
        }
        bucketPoolTop++;
        grid.set(k, arr);
      }
      arr.push(c);
    }
  }
}

export function IconLayoutManager() {
  const { camera, size } = useThree();
  const metas = useIconLayoutStore((s) => s.metas);
  const setLayoutNext = useIconLayoutStore((s) => s.setLayoutNext);
  const setHiddenNext = useHiddenStore((s) => s.setHiddenNext);

  const origin = useFloatingOriginStore((s) => s.origin);

  const lastCameraVersion = useRef(-1);
  const cameraLast = useRef({ ox: 0, oy: 0, oz: 0 });

  const tmpWorld = useRef(new THREE.Vector3());
  const camDir = useRef(new THREE.Vector3());
  const toObj = useRef(new THREE.Vector3());
  const tmpNdc = useRef(new THREE.Vector3());
  const tmpRender = useRef(new THREE.Vector3());

  useFrame(() => {
    const camLast = cameraLast.current;

    const moved =
      cameraMetrics.cameraVersion !== lastCameraVersion.current ||
      camLast.ox !== origin[0] ||
      camLast.oy !== origin[1] ||
      camLast.oz !== origin[2];

    if (!moved) return;
    if (metas.size === 0) return;

    lastCameraVersion.current = cameraMetrics.cameraVersion;
    camLast.ox = origin[0];
    camLast.oy = origin[1];
    camLast.oz = origin[2];

    camera.getWorldDirection(camDir.current);

    liveCands.length = 0;
    let candCount = 0;
    for (const it of metas.values()) {
      const wpos = it.getWorldPos(tmpWorld.current);

      const rpos = tmpRender.current.set(
        wpos.x - origin[0],
        wpos.y - origin[1],
        wpos.z - origin[2],
      );

      const dist = rpos.distanceTo(camera.position);

      toObj.current.subVectors(rpos, camera.position);
      const depth = toObj.current.dot(camDir.current);
      if (depth <= 0.0001) continue;

      const ndc = tmpNdc.current.copy(rpos).project(camera);
      const xPx = (ndc.x * 0.5 + 0.5) * size.width;
      const yPx = (-ndc.y * 0.5 + 0.5) * size.height;
      const half = (ICON_PIXELS + PADDING) / 2;

      const c = getCand(candCount++);
      c.id = it.id;
      c.priority = it.priority;
      c.dist = dist;
      c.depth = depth;
      c.rect.l = xPx - half;
      c.rect.t = yPx - half;
      c.rect.r = xPx + half;
      c.rect.b = yPx + half;
      liveCands.push(c);
    }

    liveCands.sort(candCompare);

    grid.clear();
    for (let i = 0; i < gridBucketPool.length; i++)
      gridBucketPool[i].length = 0;
    bucketPoolTop = 0;

    nextBuf.clear();
    hiddenBuf.clear();

    for (const c of liveCands) {
      const hidden = queryGrid(c);
      if (hidden !== null) {
        nextBuf.set(c.id, { visible: false });
        const arr = hiddenBuf.get(hidden);
        if (arr) arr.push(c.id);
        else hiddenBuf.set(hidden, [c.id]);
      } else {
        nextBuf.set(c.id, { visible: true });
        insertGrid(c);
      }
    }

    setLayoutNext(nextBuf);
    setHiddenNext(hiddenBuf);
  }, -1);

  return null;
}
