import { describe, it, expect, vi } from "vitest";
import { createFrameCoalescer } from "@/lib/ui/frame-coalesce";

function fakeFrames() {
  let next = 1;
  const pending = new Map<number, () => void>();
  return {
    schedule: vi.fn((cb: () => void) => {
      const id = next++;
      pending.set(id, cb);
      return id;
    }),
    unschedule: vi.fn((id: number) => {
      pending.delete(id);
    }),
    tick() {
      const cbs = [...pending.values()];
      pending.clear();
      for (const cb of cbs) cb();
    },
    get size() {
      return pending.size;
    },
  };
}

describe("createFrameCoalescer", () => {
  it("applies only the latest value once per frame", () => {
    const frames = fakeFrames();
    const apply = vi.fn();
    const c = createFrameCoalescer(apply, frames.schedule, frames.unschedule);
    c.push("a");
    c.push("b");
    c.push("c");
    expect(apply).not.toHaveBeenCalled();
    expect(frames.schedule).toHaveBeenCalledTimes(1);
    frames.tick();
    expect(apply).toHaveBeenCalledTimes(1);
    expect(apply).toHaveBeenCalledWith("c");
  });

  it("schedules again after a frame has run", () => {
    const frames = fakeFrames();
    const apply = vi.fn();
    const c = createFrameCoalescer(apply, frames.schedule, frames.unschedule);
    c.push(1);
    frames.tick();
    c.push(2);
    frames.tick();
    expect(apply.mock.calls).toEqual([[1], [2]]);
  });

  it("flush applies a pending value immediately and cancels the frame", () => {
    const frames = fakeFrames();
    const apply = vi.fn();
    const c = createFrameCoalescer(apply, frames.schedule, frames.unschedule);
    c.push("x");
    c.flush();
    expect(apply).toHaveBeenCalledWith("x");
    expect(frames.size).toBe(0);
    frames.tick();
    expect(apply).toHaveBeenCalledTimes(1);
  });

  it("flush with nothing pending is a no-op", () => {
    const frames = fakeFrames();
    const apply = vi.fn();
    const c = createFrameCoalescer(apply, frames.schedule, frames.unschedule);
    c.flush();
    expect(apply).not.toHaveBeenCalled();
  });

  it("cancel drops the pending value", () => {
    const frames = fakeFrames();
    const apply = vi.fn();
    const c = createFrameCoalescer(apply, frames.schedule, frames.unschedule);
    c.push("x");
    c.cancel();
    frames.tick();
    c.flush();
    expect(apply).not.toHaveBeenCalled();
  });

  it("accepts falsy values such as 0 and empty string", () => {
    const frames = fakeFrames();
    const apply = vi.fn();
    const c = createFrameCoalescer<number | string>(
      apply,
      frames.schedule,
      frames.unschedule,
    );
    c.push(0);
    frames.tick();
    c.push("");
    c.flush();
    expect(apply.mock.calls).toEqual([[0], [""]]);
  });
});
