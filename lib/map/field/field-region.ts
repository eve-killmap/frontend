import {
  auPerIu,
  FIELD_PAD_IU,
  FIELD_TARGET_MAX,
  MIN_FIELD_AXIS_IU,
  R_IU,
} from "@/lib/sov/kernel";

export interface FieldRegion {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface FieldTarget {
  w: number;
  h: number;
}

export interface CameraView {
  x: number;
  y: number;
  zoom: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export const ZOOMED_IN_ZOOM = 2;

export function fullFieldRegion(bboxes: FieldRegion[]): FieldRegion {
  const padWorld = FIELD_PAD_IU * auPerIu(1);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const b of bboxes) {
    if (b.minX < minX) minX = b.minX;
    if (b.minY < minY) minY = b.minY;
    if (b.maxX > maxX) maxX = b.maxX;
    if (b.maxY > maxY) maxY = b.maxY;
  }
  return {
    minX: minX - padWorld,
    minY: minY - padWorld,
    maxX: maxX + padWorld,
    maxY: maxY + padWorld,
  };
}

export function fieldTargetSize(
  region: FieldRegion,
  targetMax: number = FIELD_TARGET_MAX,
): FieldTarget {
  const w = region.maxX - region.minX;
  const h = region.maxY - region.minY;
  if (w >= h)
    return { w: targetMax, h: Math.max(1, Math.round((targetMax * h) / w)) };
  return { w: Math.max(1, Math.round((targetMax * w) / h)), h: targetMax };
}

export function regionForCamera(
  view: CameraView,
  morphT: number,
  morphing: boolean,
  full: FieldRegion,
  target: FieldTarget,
  moving: boolean,
): { region: FieldRegion; w: number; h: number; half: boolean } {
  const uPerIu = auPerIu(morphT);
  if (morphing || view.zoom <= ZOOMED_IN_ZOOM) {
    const halfRes = morphing;
    const tw = halfRes ? Math.max(1, Math.round(target.w / 2)) : target.w;
    const th = halfRes ? Math.max(1, Math.round(target.h / 2)) : target.h;
    return { region: full, w: tw, h: th, half: halfRes };
  }
  const halfW = (view.right - view.left) / (2 * view.zoom);
  const halfH = (view.top - view.bottom) / (2 * view.zoom);
  const padWorld = R_IU * uPerIu;
  const minAxisWorld = MIN_FIELD_AXIS_IU * uPerIu;
  const rw = Math.max(2 * halfW + 2 * padWorld, minAxisWorld);
  const rh = Math.max(2 * halfH + 2 * padWorld, minAxisWorld);
  const region: FieldRegion = {
    minX: view.x - rw / 2,
    minY: view.y - rh / 2,
    maxX: view.x + rw / 2,
    maxY: view.y + rh / 2,
  };
  const targetMax = moving
    ? Math.max(1, Math.round(FIELD_TARGET_MAX / 2))
    : FIELD_TARGET_MAX;
  const w =
    rw >= rh ? targetMax : Math.max(1, Math.round((targetMax * rw) / rh));
  const h =
    rh >= rw ? targetMax : Math.max(1, Math.round((targetMax * rh) / rw));
  return { region, w, h, half: moving };
}
