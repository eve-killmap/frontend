export let navigateTo: ((path: string) => void) | null = null;

export function setNavigateTo(fn: ((path: string) => void) | null) {
  navigateTo = fn;
}
