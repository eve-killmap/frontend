import { describe, it, expect, vi } from "vitest";
import { createDwellScheduler } from "@/lib/ui/dwell";

function fakeTimers() {
  let now = 0;
  const pending: { at: number; fn: () => void; id: number }[] = [];
  let next = 1;
  const timers = {
    setTimeout: (fn: () => void, ms: number) => {
      const id = next++;
      pending.push({ at: now + ms, fn, id });
      return id;
    },
    clearTimeout: (handle: unknown) => {
      const i = pending.findIndex((p) => p.id === handle);
      if (i >= 0) pending.splice(i, 1);
    },
  };
  const advance = (ms: number) => {
    now += ms;
    pending
      .filter((p) => p.at <= now)
      .sort((a, b) => a.at - b.at)
      .forEach((p) => {
        pending.splice(pending.indexOf(p), 1);
        p.fn();
      });
  };
  return { timers, advance };
}

describe("createDwellScheduler", () => {
  it("fires the run only after the dwell elapses", () => {
    const { timers, advance } = fakeTimers();
    const s = createDwellScheduler(150, timers);
    const run = vi.fn();
    s.set(1, run);
    advance(149);
    expect(run).not.toHaveBeenCalled();
    advance(1);
    expect(run).toHaveBeenCalledTimes(1);
    expect(run.mock.calls[0][0]).toBe(1);
    expect(run.mock.calls[0][1]).toBeInstanceOf(AbortSignal);
  });

  it("fires only the last id when the target changes before the dwell", () => {
    const { timers, advance } = fakeTimers();
    const s = createDwellScheduler(150, timers);
    const run = vi.fn();
    s.set(1, run);
    advance(100);
    s.set(2, run);
    advance(150);
    expect(run).toHaveBeenCalledTimes(1);
    expect(run.mock.calls[0][0]).toBe(2);
  });

  it("fires nothing when the target clears before the dwell", () => {
    const { timers, advance } = fakeTimers();
    const s = createDwellScheduler(150, timers);
    const run = vi.fn();
    s.set(1, run);
    s.set(null, run);
    advance(500);
    expect(run).not.toHaveBeenCalled();
  });

  it("aborts a fired run's signal when the target changes", () => {
    const { timers, advance } = fakeTimers();
    const s = createDwellScheduler(150, timers);
    const signals: AbortSignal[] = [];
    const run = vi.fn((_id: number, signal: AbortSignal) => {
      signals.push(signal);
    });
    s.set(1, run);
    advance(150);
    expect(signals[0].aborted).toBe(false);
    s.set(2, run);
    expect(signals[0].aborted).toBe(true);
    advance(150);
    expect(signals[1].aborted).toBe(false);
  });

  it("aborts a fired run's signal when the target clears", () => {
    const { timers, advance } = fakeTimers();
    const s = createDwellScheduler(150, timers);
    const signals: AbortSignal[] = [];
    s.set(1, (_id, signal) => signals.push(signal));
    advance(150);
    s.set(null, () => undefined);
    expect(signals[0].aborted).toBe(true);
  });

  it("ignores a set for the id that is already the target", () => {
    const { timers, advance } = fakeTimers();
    const s = createDwellScheduler(150, timers);
    const run = vi.fn();
    s.set(1, run);
    advance(150);
    s.set(1, run);
    advance(150);
    expect(run).toHaveBeenCalledTimes(1);
    expect(run.mock.calls[0][1].aborted).toBe(false);
  });

  it("dispose clears the pending timer and aborts the fired run", () => {
    const { timers, advance } = fakeTimers();
    const s = createDwellScheduler(150, timers);
    const signals: AbortSignal[] = [];
    s.set(1, (_id, signal) => signals.push(signal));
    advance(150);
    s.set(2, (_id, signal) => signals.push(signal));
    s.dispose();
    advance(150);
    expect(signals).toHaveLength(1);
    expect(signals[0].aborted).toBe(true);
  });
});
