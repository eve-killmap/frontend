import type { DwellTimers } from "@/lib/ui/dwell";

export const DOUBLE_CLICK_MS = 250;

export interface ClickGate {
  click(detail: number): void;
  doubleClick(): void;
  dispose(): void;
}

const realTimers: DwellTimers = {
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
};

export function createClickGate(
  onSingle: () => void,
  onDouble: (() => void) | undefined,
  delayMs: number = DOUBLE_CLICK_MS,
  timers: DwellTimers = realTimers,
): ClickGate {
  let pending: unknown = null;

  const cancel = () => {
    if (pending !== null) {
      timers.clearTimeout(pending);
      pending = null;
    }
  };

  return {
    click(detail) {
      if (!onDouble) {
        onSingle();
        return;
      }
      if (detail >= 2) return;
      cancel();
      pending = timers.setTimeout(() => {
        pending = null;
        onSingle();
      }, delayMs);
    },
    doubleClick() {
      if (!onDouble) return;
      cancel();
      onDouble();
    },
    dispose: cancel,
  };
}
