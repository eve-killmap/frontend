import { describe, it, expect } from "vitest";
import {
  fullFieldRegion,
  fieldTargetSize,
  regionForCamera,
  ZOOMED_IN_ZOOM,
  type CameraView,
} from "./field-region";
import {
  auPerIu,
  FIELD_PAD_IU,
  FIELD_TARGET_MAX,
  MIN_FIELD_AXIS_IU,
  R_IU,
} from "@/lib/sov/kernel";

const bbox2D = { minX: -100, minY: -50, maxX: 100, maxY: 50 };
const bbox3D = { minX: -120, minY: -40, maxX: 90, maxY: 60 };

describe("fullFieldRegion", () => {
  it("unions the bboxes and pads by FIELD_PAD_IU at 3D scale", () => {
    const pad = FIELD_PAD_IU * auPerIu(1);
    const r = fullFieldRegion([bbox2D, bbox3D]);
    expect(r).toEqual({
      minX: -120 - pad,
      minY: -50 - pad,
      maxX: 100 + pad,
      maxY: 60 + pad,
    });
  });
});

describe("fieldTargetSize", () => {
  it("caps the long axis at FIELD_TARGET_MAX and scales the short one", () => {
    expect(fieldTargetSize({ minX: 0, minY: 0, maxX: 200, maxY: 100 })).toEqual(
      { w: FIELD_TARGET_MAX, h: FIELD_TARGET_MAX / 2 },
    );
    expect(fieldTargetSize({ minX: 0, minY: 0, maxX: 100, maxY: 400 })).toEqual(
      { w: FIELD_TARGET_MAX / 4, h: FIELD_TARGET_MAX },
    );
  });
});

describe("regionForCamera", () => {
  const full = { minX: -1000, minY: -1000, maxX: 1000, maxY: 1000 };
  const target = { w: 2048, h: 2048 };
  const view = (zoom: number): CameraView => ({
    x: 10,
    y: 20,
    zoom,
    left: -500,
    right: 500,
    top: 300,
    bottom: -300,
  });

  it("uses the full region at full resolution when zoomed out", () => {
    const r = regionForCamera(
      view(ZOOMED_IN_ZOOM),
      0,
      false,
      full,
      target,
      false,
    );
    expect(r).toEqual({ region: full, w: 2048, h: 2048, half: false });
  });

  it("uses the full region at half resolution while morphing", () => {
    const r = regionForCamera(view(10), 0.5, true, full, target, false);
    expect(r).toEqual({ region: full, w: 1024, h: 1024, half: true });
  });

  it("centres a padded viewport region on the camera when zoomed in", () => {
    const uPerIu = auPerIu(0);
    const zoom = 10;
    const halfW = 1000 / (2 * zoom);
    const halfH = 600 / (2 * zoom);
    const pad = R_IU * uPerIu;
    const minAxis = MIN_FIELD_AXIS_IU * uPerIu;
    const rw = Math.max(2 * halfW + 2 * pad, minAxis);
    const rh = Math.max(2 * halfH + 2 * pad, minAxis);
    const r = regionForCamera(view(zoom), 0, false, full, target, false);
    expect(r.region.minX).toBeCloseTo(10 - rw / 2, 6);
    expect(r.region.maxX).toBeCloseTo(10 + rw / 2, 6);
    expect(r.region.minY).toBeCloseTo(20 - rh / 2, 6);
    expect(r.region.maxY).toBeCloseTo(20 + rh / 2, 6);
    expect(r.half).toBe(false);
    expect(Math.max(r.w, r.h)).toBe(FIELD_TARGET_MAX);
  });

  it("halves the target while the camera is moving", () => {
    const r = regionForCamera(view(10), 0, false, full, target, true);
    expect(r.half).toBe(true);
    expect(Math.max(r.w, r.h)).toBe(FIELD_TARGET_MAX / 2);
  });
});
