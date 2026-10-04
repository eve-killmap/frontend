import { describe, it, expect, vi } from "vitest";
import { createClickGate } from "@/lib/ui/click-gate";

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

describe("createClickGate", () => {
  it("runs the single action immediately when there is no double action", () => {
    const { timers } = fakeTimers();
    const single = vi.fn();
    const gate = createClickGate(single, undefined, 300, timers);
    gate.click(1);
    expect(single).toHaveBeenCalledTimes(1);
    gate.doubleClick();
    expect(single).toHaveBeenCalledTimes(1);
  });

  it("defers the single action by the delay when a double action exists", () => {
    const { timers, advance } = fakeTimers();
    const single = vi.fn();
    const double = vi.fn();
    const gate = createClickGate(single, double, 300, timers);
    gate.click(1);
    advance(299);
    expect(single).not.toHaveBeenCalled();
    advance(1);
    expect(single).toHaveBeenCalledTimes(1);
    expect(double).not.toHaveBeenCalled();
  });

  it("a double click cancels the pending single action and runs the double action", () => {
    const { timers, advance } = fakeTimers();
    const single = vi.fn();
    const double = vi.fn();
    const gate = createClickGate(single, double, 300, timers);
    gate.click(1);
    gate.click(2);
    gate.doubleClick();
    advance(1000);
    expect(single).not.toHaveBeenCalled();
    expect(double).toHaveBeenCalledTimes(1);
  });

  it("ignores the second click of a pair so it cannot re-arm the timer", () => {
    const { timers, advance } = fakeTimers();
    const single = vi.fn();
    const gate = createClickGate(single, vi.fn(), 300, timers);
    gate.click(1);
    advance(200);
    gate.click(2);
    advance(100);
    expect(single).toHaveBeenCalledTimes(1);
  });

  it("dispose drops a pending single action", () => {
    const { timers, advance } = fakeTimers();
    const single = vi.fn();
    const gate = createClickGate(single, vi.fn(), 300, timers);
    gate.click(1);
    gate.dispose();
    advance(1000);
    expect(single).not.toHaveBeenCalled();
  });
});
