import { describe, it, expect } from "vitest";
import { commandMatches } from "./command-matches";
import type { Command } from "./types";

const cmd: Command = {
  id: "map.color.security",
  label: "Colour by Security",
  group: "map",
  keywords: ["color", "mode"],
  run: () => {},
};

describe("commandMatches", () => {
  it("matches an empty query", () => {
    expect(commandMatches(cmd, "")).toBe(true);
  });
  it("matches label and keywords case-insensitively, every token", () => {
    expect(commandMatches(cmd, "sec")).toBe(true);
    expect(commandMatches(cmd, "COLOR sec")).toBe(true);
    expect(commandMatches(cmd, "colour mode")).toBe(true);
    expect(commandMatches(cmd, "overlay")).toBe(false);
    expect(commandMatches(cmd, "sec overlay")).toBe(false);
  });
});
