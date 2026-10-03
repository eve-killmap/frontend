import { describe, it, expect } from "vitest";
import { isPaletteHotkey } from "./hotkey";

describe("isPaletteHotkey", () => {
  it("matches ctrl+k and meta+k in either case", () => {
    expect(isPaletteHotkey({ key: "k", ctrlKey: true })).toBe(true);
    expect(isPaletteHotkey({ key: "K", metaKey: true })).toBe(true);
  });
  it("ignores plain k, alt+k, and other keys", () => {
    expect(isPaletteHotkey({ key: "k" })).toBe(false);
    expect(isPaletteHotkey({ key: "k", ctrlKey: true, altKey: true })).toBe(
      false,
    );
    expect(isPaletteHotkey({ key: "j", ctrlKey: true })).toBe(false);
  });
});
