export interface FrameCoalescer<T> {
  push(value: T): void;
  flush(): void;
  cancel(): void;
}

export function createFrameCoalescer<T>(
  apply: (value: T) => void,
  schedule: (cb: () => void) => number = (cb) => requestAnimationFrame(cb),
  unschedule: (id: number) => void = (id) => cancelAnimationFrame(id),
): FrameCoalescer<T> {
  let pending: { value: T } | null = null;
  let frame: number | null = null;

  const run = () => {
    frame = null;
    const p = pending;
    pending = null;
    if (p) apply(p.value);
  };

  return {
    push(value) {
      pending = { value };
      if (frame === null) frame = schedule(run);
    },
    flush() {
      if (frame !== null) {
        unschedule(frame);
        frame = null;
      }
      run();
    },
    cancel() {
      if (frame !== null) {
        unschedule(frame);
        frame = null;
      }
      pending = null;
    },
  };
}
