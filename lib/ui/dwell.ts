export interface DwellTimers {
  setTimeout: (fn: () => void, ms: number) => unknown;
  clearTimeout: (handle: unknown) => void;
}

export interface DwellScheduler {
  set(id: number | null, run: (id: number, signal: AbortSignal) => void): void;
  dispose(): void;
}

const realTimers: DwellTimers = {
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
};

export function createDwellScheduler(
  dwellMs: number,
  timers: DwellTimers = realTimers,
): DwellScheduler {
  let target: number | null = null;
  let timer: unknown = null;
  let controller: AbortController | null = null;

  const cancel = () => {
    if (timer !== null) {
      timers.clearTimeout(timer);
      timer = null;
    }
    if (controller) {
      controller.abort();
      controller = null;
    }
  };

  return {
    set(id, run) {
      if (id === target) return;
      cancel();
      target = id;
      if (id === null) return;
      timer = timers.setTimeout(() => {
        timer = null;
        controller = new AbortController();
        run(id, controller.signal);
      }, dwellMs);
    },
    dispose() {
      cancel();
      target = null;
    },
  };
}
