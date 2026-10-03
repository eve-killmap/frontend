import { describe, it, expect, vi } from "vitest";
import { executeCommand } from "./execute";
import type { Command } from "./types";

describe("executeCommand", () => {
  it("closes before running and reports true", () => {
    const calls: string[] = [];
    const cmd: Command = {
      id: "x",
      label: "x",
      group: "map",
      run: () => calls.push("run"),
    };
    expect(executeCommand(cmd, () => calls.push("close"))).toBe(true);
    expect(calls).toEqual(["close", "run"]);
  });

  it("does nothing for a disabled command", () => {
    const run = vi.fn();
    const close = vi.fn();
    const cmd: Command = {
      id: "x",
      label: "x",
      group: "system",
      disabled: () => true,
      run,
    };
    expect(executeCommand(cmd, close)).toBe(false);
    expect(run).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
  });
});
