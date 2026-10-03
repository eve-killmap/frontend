import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { viewportBox, inViewport, VIEWPORT_BUFFER } from "@/lib/map/viewport";

function makeCamera(
  cx: number,
  cy: number,
  zoom: number,
): THREE.OrthographicCamera {
  const cam = new THREE.OrthographicCamera(-100, 100, 50, -50, 0.1, 1000);
  cam.position.set(cx, cy, 10);
  cam.zoom = zoom;
  return cam;
}

describe("viewportBox", () => {
  it("centers the box on the camera position", () => {
    const box = viewportBox(makeCamera(1000, 2000, 1), 1);
    expect((box.left + box.right) / 2).toBeCloseTo(1000, 5);
    expect((box.bottom + box.top) / 2).toBeCloseTo(2000, 5);
  });

  it("uses the frustum half-extents (buffer 1) at zoom 1", () => {
    const box = viewportBox(makeCamera(0, 0, 1), 1);
    expect(box.right - box.left).toBeCloseTo(200, 5);
    expect(box.top - box.bottom).toBeCloseTo(100, 5);
  });

  it("shrinks the box as zoom increases", () => {
    const box = viewportBox(makeCamera(0, 0, 4), 1);
    expect(box.right - box.left).toBeCloseTo(50, 5);
    expect(box.top - box.bottom).toBeCloseTo(25, 5);
  });

  it("pads by the buffer factor", () => {
    const box = viewportBox(makeCamera(0, 0, 1), 1.05);
    expect(box.right - box.left).toBeCloseTo(210, 5);
    expect(box.top - box.bottom).toBeCloseTo(105, 5);
  });

  it("defaults to VIEWPORT_BUFFER", () => {
    const box = viewportBox(makeCamera(0, 0, 1));
    expect(box.right - box.left).toBeCloseTo(200 * VIEWPORT_BUFFER, 5);
  });
});

describe("inViewport", () => {
  const box = viewportBox(makeCamera(0, 0, 1), 1);

  it("includes points inside the box", () => {
    expect(inViewport(box, 0, 0)).toBe(true);
    expect(inViewport(box, 99, 49)).toBe(true);
  });

  it("includes points exactly on the edge", () => {
    expect(inViewport(box, 100, 50)).toBe(true);
    expect(inViewport(box, -100, -50)).toBe(true);
  });

  it("excludes points outside the box", () => {
    expect(inViewport(box, 101, 0)).toBe(false);
    expect(inViewport(box, 0, 51)).toBe(false);
    expect(inViewport(box, -101, -51)).toBe(false);
  });
});
