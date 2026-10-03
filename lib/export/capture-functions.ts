export type CaptureFrameFn = (scale: number) => Promise<Blob>;

export let captureFrameFn: CaptureFrameFn | null = null;

export function setCaptureFrameFn(fn: CaptureFrameFn | null): void {
  captureFrameFn = fn;
}
