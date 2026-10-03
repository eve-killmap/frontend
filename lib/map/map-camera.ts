export const CAMERA_MARGIN = 1.1;

export function fitHalfExtents(
  spanX: number,
  spanY: number,
  margin: number,
  aspect: number,
): { halfW: number; halfH: number } {
  let halfW = (spanX * margin) / 2;
  let halfH = (spanY * margin) / 2;

  if (halfW / halfH > aspect) halfH = halfW / aspect;
  else halfW = halfH * aspect;

  return { halfW, halfH };
}
