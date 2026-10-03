export const DRAG_THRESHOLD = 5;

export function exceededDragThreshold(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  threshold = DRAG_THRESHOLD,
): boolean {
  const dx = ax - bx,
    dy = ay - by;
  return dx * dx + dy * dy > threshold * threshold;
}

export function originChanged(
  origin: readonly number[] | number[],
  last: number[],
): boolean {
  return (
    origin[0] !== last[0] || origin[1] !== last[1] || origin[2] !== last[2]
  );
}

export function copyOrigin(
  origin: readonly number[] | number[],
  last: number[],
): void {
  last[0] = origin[0];
  last[1] = origin[1];
  last[2] = origin[2];
}
