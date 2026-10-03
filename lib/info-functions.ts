export let openInfoFn: (() => void) | null = null;

export function setOpenInfoFn(fn: (() => void) | null) {
  openInfoFn = fn;
}
