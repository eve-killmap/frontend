import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { mapMorphState } from "@/lib/map/map-morph-state";
import { auPerIu } from "@/lib/sov/kernel";
import { FieldRenderer, FieldSource } from "./field-renderer";
import {
  FieldRegion,
  FieldTarget,
  CameraView,
  ZOOMED_IN_ZOOM,
  regionForCamera,
} from "./field-region";

export interface UseFieldOverlayOptions {
  renderer: FieldRenderer | null;
  region: FieldRegion | null;
  target: FieldTarget;
  positions2D: Float32Array;
  sources: FieldSource[] | null;
  groupCount: number;
  dataKey: string;
  material: THREE.ShaderMaterial;
  onRebuild?: (region: FieldRegion, uPerIu: number, full: boolean) => void;
}

const SETTLE_SECONDS = 0.2;

const view: CameraView = {
  x: 0,
  y: 0,
  zoom: 1,
  left: -1,
  right: 1,
  top: 1,
  bottom: -1,
};

function readView(camera: THREE.Camera): CameraView {
  const cam = camera as THREE.OrthographicCamera;
  view.x = cam.position.x;
  view.y = cam.position.y;
  view.zoom = cam.zoom;
  view.left = cam.left;
  view.right = cam.right;
  view.top = cam.top;
  view.bottom = cam.bottom;
  return view;
}

export function useFieldOverlay(opts: UseFieldOverlayOptions): {
  meshRef: RefObject<THREE.Mesh | null>;
} {
  const {
    renderer,
    region,
    target,
    positions2D,
    sources,
    groupCount,
    dataKey,
    material,
    onRebuild,
  } = opts;
  const camera = useThree((s) => s.camera);

  const meshRef = useRef<THREE.Mesh | null>(null);
  const hasData = useRef(false);
  const lastKey = useRef("");
  const lastRenderer = useRef<FieldRenderer | null>(null);
  const wasMorphing = useRef(false);
  const wasZoomedIn = useRef(false);
  const settleTimer = useRef(0);
  const lastCam = useRef({ x: 0, y: 0, zoom: 0 });
  const basePlaneW = useRef(1);
  const basePlaneH = useRef(1);
  const onRebuildRef = useRef(onRebuild);
  onRebuildRef.current = onRebuild;

  const rebuild = (moving = false) => {
    const mesh = meshRef.current;
    if (!renderer || !region || !mesh || !hasData.current) return;
    const v = readView(camera);
    const {
      region: rgn,
      w,
      h,
    } = regionForCamera(
      v,
      mapMorphState.t,
      mapMorphState.morphing,
      region,
      target,
      moving,
    );
    const uPerIu = auPerIu(mapMorphState.t);
    const full = !mapMorphState.morphing && v.zoom <= ZOOMED_IN_ZOOM;
    renderer.render(rgn, uPerIu, w, h);
    material.uniforms.uBest.value = renderer.getBestTexture();
    material.uniforms.uTexel.value.set(1 / w, 1 / h);
    mesh.position.set((rgn.minX + rgn.maxX) / 2, (rgn.minY + rgn.maxY) / 2, -1);
    mesh.scale.set(
      (rgn.maxX - rgn.minX) / basePlaneW.current,
      (rgn.maxY - rgn.minY) / basePlaneH.current,
      1,
    );
    onRebuildRef.current?.(rgn, uPerIu, full);
  };

  useEffect(() => {
    if (!region) return;
    basePlaneW.current = region.maxX - region.minX;
    basePlaneH.current = region.maxY - region.minY;
    const mesh = meshRef.current;
    if (mesh) {
      mesh.position.set(
        (region.minX + region.maxX) / 2,
        (region.minY + region.maxY) / 2,
        -1,
      );
      mesh.scale.set(1, 1, 1);
    }
  }, [region]);

  useEffect(() => {
    if (!renderer || !sources) {
      hasData.current = false;
      return;
    }
    const key = `${dataKey}:${target.w}x${target.h}`;
    if (key !== lastKey.current || renderer !== lastRenderer.current) {
      lastKey.current = key;
      lastRenderer.current = renderer;
      renderer.setData(sources, positions2D, groupCount);
      hasData.current = true;
      rebuild();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderer, sources, groupCount, dataKey, region, target, positions2D]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    if (!hasData.current) {
      mesh.visible = false;
      return;
    }
    mesh.visible = true;

    const v = readView(camera);
    const zoomedIn = v.zoom > ZOOMED_IN_ZOOM;
    if (mapMorphState.morphing) {
      renderer?.updateCentersFrom(positions2D);
      rebuild();
      wasMorphing.current = true;
      wasZoomedIn.current = zoomedIn;
      return;
    }
    if (wasMorphing.current) {
      wasMorphing.current = false;
      renderer?.updateCentersFrom(positions2D);
      rebuild();
      wasZoomedIn.current = zoomedIn;
      return;
    }

    if (zoomedIn) {
      const posEps = ((v.top - v.bottom) / v.zoom) * 1e-3;
      const lc = lastCam.current;
      const moved =
        Math.abs(v.x - lc.x) > posEps ||
        Math.abs(v.y - lc.y) > posEps ||
        Math.abs(v.zoom - lc.zoom) > lc.zoom * 1e-3;
      lc.x = v.x;
      lc.y = v.y;
      lc.zoom = v.zoom;
      if (moved) {
        settleTimer.current = SETTLE_SECONDS;
        rebuild(true);
      } else if (settleTimer.current > 0) {
        settleTimer.current = 0;
        rebuild();
      }
    } else if (wasZoomedIn.current) {
      rebuild();
    }
    wasZoomedIn.current = zoomedIn;
  });

  return { meshRef };
}
