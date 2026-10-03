import { describe, it, expect } from "vitest";
import { isModifiedClick } from "./is-modified-click";

describe("isModifiedClick", () => {
  it("treats a plain primary click as unmodified", () => {
    expect(isModifiedClick({ button: 0 })).toBe(false);
    expect(isModifiedClick({})).toBe(false);
  });

  it.each([
    ["middle button", { button: 1 }],
    ["secondary button", { button: 2 }],
    ["ctrl", { ctrlKey: true }],
    ["meta", { metaKey: true }],
    ["shift", { shiftKey: true }],
    ["alt", { altKey: true }],
  ])("treats %s as modified", (_label, e) => {
    expect(isModifiedClick(e)).toBe(true);
  });
});
