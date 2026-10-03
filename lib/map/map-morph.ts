export function smoothstep(e: number): number {
  if (e <= 0) return 0;
  if (e >= 1) return 1;
  return e * e * (3 - 2 * e);
}

export function stepToward(
  current: number,
  target: number,
  dtSeconds: number,
  durationSeconds: number,
): number {
  if (durationSeconds <= 0) return target;
  const step = dtSeconds / durationSeconds;
  if (current < target) return Math.min(target, current + step);
  if (current > target) return Math.max(target, current - step);
  return target;
}

export function lerpPositionsInto(
  a: Float32Array,
  b: Float32Array,
  e: number,
  out: Float32Array,
): void {
  for (let i = 0; i < a.length; i++) {
    out[i] = a[i] + (b[i] - a[i]) * e;
  }
}
