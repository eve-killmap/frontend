export let resetCameraFn: (() => void) | null = null;

export function setResetCameraFn(fn: (() => void) | null) {
  resetCameraFn = fn;
}

export let horizCameraFn: (() => void) | null = null;

export function setHorizCameraFn(fn: (() => void) | null) {
  horizCameraFn = fn;
}

export let vertCameraFn: (() => void) | null = null;

export function setVertCameraFn(fn: (() => void) | null) {
  vertCameraFn = fn;
}

export let animateToPosFn: ((pos: [number, number, number]) => void) | null =
  null;

export function setAnimateToPosFn(
  fn: ((pos: [number, number, number]) => void) | null,
) {
  animateToPosFn = fn;
}

export let navigateToKillFn: ((pos: [number, number, number]) => void) | null =
  null;

export function setNavigateToKillFn(
  fn: ((pos: [number, number, number]) => void) | null,
) {
  navigateToKillFn = fn;
}
