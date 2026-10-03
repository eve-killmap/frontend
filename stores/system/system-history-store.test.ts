import { describe, it, expect } from "vitest";
import { addRecent, togglePinned } from "@/stores/system/system-history-store";

describe("addRecent", () => {
  it("prepends a new slug", () => {
    expect(addRecent(["a"], "b")).toEqual(["b", "a"]);
  });
  it("dedups and moves an existing slug to the front", () => {
    expect(addRecent(["a", "b", "c"], "c")).toEqual(["c", "a", "b"]);
  });
  it("caps the list length, dropping the oldest", () => {
    expect(addRecent(["1", "2", "3"], "x", 3)).toEqual(["x", "1", "2"]);
  });
});

describe("togglePinned", () => {
  it("adds a slug when absent", () => {
    expect(togglePinned([], "a")).toEqual(["a"]);
  });
  it("removes a slug when present", () => {
    expect(togglePinned(["a", "b"], "a")).toEqual(["b"]);
  });
});
