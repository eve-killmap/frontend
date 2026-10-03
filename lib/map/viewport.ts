import * as THREE from "three";

export const VIEWPORT_BUFFER = 1.05;

export interface ViewportBox {
  left: number;
  right: number;
  bottom: number;
  top: number;
}

export function viewportBox(
  camera: THREE.OrthographicCamera,
  buffer = VIEWPORT_BUFFER,
): ViewportBox {
  const halfWidth = ((camera.right - camera.left) / (2 * camera.zoom)) * buffer;
  const halfHeight =
    ((camera.top - camera.bottom) / (2 * camera.zoom)) * buffer;
  const { x, y } = camera.position;
  return {
    left: x - halfWidth,
    right: x + halfWidth,
    bottom: y - halfHeight,
    top: y + halfHeight,
  };
}

export function inViewport(box: ViewportBox, x: number, y: number): boolean {
  return x >= box.left && x <= box.right && y >= box.bottom && y <= box.top;
}
