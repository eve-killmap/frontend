import { describe, it, expect, beforeEach } from "vitest";
import type { Command } from "@/lib/commands/types";
import { useCommandStore, flattenCommands, GROUP_ORDER } from "./command-store";

const noop = () => {};
const cmd = (id: string, group: Command["group"]): Command => ({
  id,
  label: id,
  group,
  run: noop,
});

beforeEach(() => {
  useCommandStore.setState({ providers: new Map(), version: 0 });
});

describe("flattenCommands", () => {
  it("orders groups by GROUP_ORDER and keeps registration order inside a group", () => {
    const providers = new Map<string, Command[]>([
      ["page", [cmd("p1", "panels"), cmd("m1", "map"), cmd("m2", "map")]],
      ["global", [cmd("n1", "navigation"), cmd("h1", "help")]],
    ]);
    expect(flattenCommands(providers).map((c) => c.id)).toEqual([
      "n1",
      "m1",
      "m2",
      "p1",
      "h1",
    ]);
    expect(GROUP_ORDER).toEqual([
      "navigation",
      "map",
      "system",
      "panels",
      "help",
    ]);
  });

  it("returns an empty list with no providers", () => {
    expect(flattenCommands(new Map())).toEqual([]);
  });
});

describe("useCommandStore", () => {
  it("registers, replaces on re-register, and bumps version", () => {
    const s = useCommandStore.getState();
    s.register("map", [cmd("a", "map")]);
    s.register("map", [cmd("b", "map")]);
    const { providers, version } = useCommandStore.getState();
    expect(flattenCommands(providers).map((c) => c.id)).toEqual(["b"]);
    expect(version).toBe(2);
  });

  it("unregister removes only that provider", () => {
    const s = useCommandStore.getState();
    s.register("global", [cmd("g", "navigation")]);
    s.register("map", [cmd("m", "map")]);
    useCommandStore.getState().unregister("map");
    expect(
      flattenCommands(useCommandStore.getState().providers).map((c) => c.id),
    ).toEqual(["g"]);
  });

  it("unregistering an unknown provider does not bump version", () => {
    const before = useCommandStore.getState().version;
    useCommandStore.getState().unregister("nope");
    expect(useCommandStore.getState().version).toBe(before);
  });
});
