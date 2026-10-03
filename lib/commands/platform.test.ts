import { describe, it, expect } from "vitest";
import { shortcutLabel } from "./platform";

describe("shortcutLabel", () => {
  it.each(["MacIntel", "iPhone", "iPad", "Macintosh"])(
    "uses the command glyph on %s",
    (p) => expect(shortcutLabel(p)).toBe("⌘ K"),
  );
  it.each(["Win32", "Linux x86_64", ""])("uses Ctrl on %s", (p) =>
    expect(shortcutLabel(p)).toBe("Ctrl K"),
  );
});
